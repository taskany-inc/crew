import { TRPCError } from '@trpc/server';
import { ScheduledDeactivation } from '@prisma/client';
import { ICalCalendarMethod } from 'ical-generator';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { formatDate } from '../utils/dateTime';
import { defaultLocale } from '../utils/getLang';
import { getOrgUnitTitle } from '../utils/organizationUnit';

import {
    CreateScheduledDeactivation,
    EditScheduledDeactivation,
    CancelScheduledDeactivation,
} from './scheduledDeactivationSchemas';
import { calendarEvents, createIcalEventData, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import {
    AdditionalDevice,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationUser,
} from './scheduledDeactivationTypes';

const html = (data: ScheduledDeactivation & ScheduledDeactivationUser & ScheduledDeactivationNewOrganizationUnit) => `
<head>
  <style>
    table { border-collapse: collapse; }
    th { text-align: left; }
  </style>
</head>        
<body>
    ${tr('Hello colleagues!')}<br/>
    ${
        data.type === 'retirement'
            ? tr('Planning retirement of worker.')
            : tr('Planning transfer of worker to {newOrganization} {unitId}', {
                  newOrganization: data?.newOrganizationUnit ? getOrgUnitTitle(data?.newOrganizationUnit) : '',
                  unitId: data.unitId!,
              })
    }<br/>
    ${tr('Details below.')}<br/>
    ${tr('The meeting is for informational purposes only.')}<br/>
    <table border='1' cellpadding='8'>
        <tr>
            <th>${tr('Date')}</th>
            <td>${formatDate(data.deactivateDate, defaultLocale)}</td>
        </tr>
        <tr>
            <th>${tr('Full name')}</th>
            <td>${data.user.name}</td>
        </tr>
        <tr>
            <th>${tr('Working hours,<br/>workplace (if any)')}</th>
            <td>
                ${data.workMode}${data.workModeComment ? `, ${data.workModeComment}` : ''}
            </td>
        </tr>
    ${
        data.type === 'transfer'
            ? `
        <tr>
            <th>${tr('Transfer from, role')}</th>
            <td>${data.organizationalGroup}, ${data.organizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Transfer to, role')}</th>
            <td>${data.newOrganizationalGroup}, ${data.newOrganizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Unit')}</th>
            <td>${data.unitId}</td>
        </tr>
    `
            : ''
    }
        <tr>
            <th>${tr('Location')}</th>
            <td>${data.location}</td>
        </tr>
        <tr>
            <th>${tr('Email')}</th>
            <td>${data.email}</td>
        </tr>
        <tr>
            <th>${tr('Teamlead')}</th>
            <td>${data.teamLead}</td>
        </tr>
        <tr>
            <th>${tr('Devices')}</th>
            <td></td>
        </tr>
    ${
        JSON.parse(data.devices as string)
            ?.map(
                (d: AdditionalDevice) =>
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device name')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.name}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device id')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.id}</td>` +
                    '</tr>',
            )
            .join('') || ''
    }
        <tr>
            <th>${tr('Testing devices')}</th>
            <td></td>
        </tr>
    ${
        JSON.parse(data.testingDevices as string)
            ?.map(
                (d: AdditionalDevice) =>
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device name')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.name}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device id')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.id}</td>` +
                    '</tr>',
            )
            .join('') || ''
    }
        <tr>
            <th>${tr('Comments')}</th>
            <td>${data.comments}</td>
        </tr>
    </table>
${tr('Sincerely,<br/>HR-team!')}
</body>
`;

export const scheduledDeactivationMethods = {
    create: async (data: CreateScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, ...restData } = data;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${userId}` });
        const scheduledDeactivation = await prisma.scheduledDeactivation.create({
            data: {
                userId,
                creatorId: sessionUserId,
                type,
                ...(devices && devices.length && { devices: JSON.stringify(devices) }),
                ...(testingDevices && testingDevices.length && { testingDevices: JSON.stringify(testingDevices) }),
                ...restData,
            },
            include: { user: true, creator: true, organizationUnit: true, newOrganizationUnit: true },
        });

        const users = [
            ...(config.nodemailer.scheduledDeactivationEmails?.split(' ').map((email) => ({ email })) || []),
            { email: scheduledDeactivation.creator.email, name: scheduledDeactivation.creator.name! },
        ];

        const subject =
            type === 'retirement'
                ? `${tr('Retirement')} ${user.name} (${restData.phone})`
                : `${tr('Transfer from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  } ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${user.name} (${restData.phone})`;

        const to = `${config.nodemailer.scheduledDeactivationEmails} ${scheduledDeactivation.creator.email}`.split(' ');
        const icalEvent = createIcalEventData({
            id: scheduledDeactivation.id + config.nodemailer.authUser,
            start: data.deactivateDate,
            allDay: true,
            duration: 0,
            users,
            summary: subject,
            description: subject,
        });

        await sendMail({
            to,
            html: html(scheduledDeactivation),
            subject,
            icalEvent: calendarEvents({
                method: ICalCalendarMethod.REQUEST,
                events: [icalEvent],
            }),
        });
        return scheduledDeactivation;
    },

    getList: async (creatorId?: string) => {
        return prisma.scheduledDeactivation.findMany({
            where: { creatorId, canceled: false },
            include: { creator: true, user: true, organizationUnit: true, newOrganizationUnit: true },
            orderBy: { deactivateDate: 'asc' },
        });
    },

    cancel: async (data: CancelScheduledDeactivation) => {
        const { id, comment } = data;
        const scheduledDeactivation = await prisma.scheduledDeactivation.findUnique({
            where: { id },
            include: { user: true, creator: true },
        });

        if (!scheduledDeactivation) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No scheduled deactivation with id ${id}`,
            });
        }
        const subject =
            scheduledDeactivation.type === 'retirement'
                ? tr('Cancel retirement of {userName}', { userName: scheduledDeactivation.user.name! })
                : tr('Cancel transfer of {userName}', { userName: scheduledDeactivation.user.name! });

        const users = [
            ...(config.nodemailer.scheduledDeactivationEmails?.split(' ').map((email) => ({ email })) || []),
            { email: scheduledDeactivation.creator.email, name: scheduledDeactivation.creator.name! },
        ];
        const icalEvent = createIcalEventData({
            id: scheduledDeactivation.id + config.nodemailer.authUser,
            start: scheduledDeactivation.deactivateDate,
            allDay: true,
            duration: 0,
            users,
            summary: subject,
            description: subject,
        });

        const to = `${config.nodemailer.scheduledDeactivationEmails} ${scheduledDeactivation.creator.email}`.split(' ');

        await sendMail({
            to,
            subject,
            text: comment,
            icalEvent: calendarEvents({
                method: ICalCalendarMethod.CANCEL,
                events: [icalEvent],
            }),
        });

        return prisma.scheduledDeactivation.update({
            where: { id },
            data: { canceled: true, canceledAt: new Date(), cancelComment: comment },
        });
    },

    edit: async (data: EditScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, id, ...restData } = data;
        const scheduledDеactivationBeforeUpdate = await prisma.scheduledDeactivation.findUnique({ where: { id } });

        if (!scheduledDеactivationBeforeUpdate) {
            throw new TRPCError({ message: `No scheduled deactivation with id ${id}`, code: 'NOT_FOUND' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${userId}` });

        const scheduledDeactivation = await prisma.scheduledDeactivation.update({
            where: { id },
            data: {
                userId,
                creatorId: sessionUserId,
                type,
                ...(devices && devices.length && { devices: JSON.stringify(devices) }),
                ...(testingDevices && testingDevices.length && { testingDevices: JSON.stringify(testingDevices) }),
                ...restData,
            },
            include: { user: true, creator: true, organizationUnit: true, newOrganizationUnit: true },
        });

        const subject =
            type === 'retirement'
                ? `${tr('Update on retirement of')} ${scheduledDeactivation.user.name} (${restData.phone})`
                : `${tr('Update on transfer from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  } ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${scheduledDeactivation.user.name} (${restData.phone})`;

        const to = `${config.nodemailer.scheduledDeactivationEmails} ${scheduledDeactivation.creator.email}`.split(' ');

        const users = [
            ...(config.nodemailer.scheduledDeactivationEmails?.split(' ').map((email) => ({ email })) || []),
            { email: scheduledDeactivation.creator.email, name: scheduledDeactivation.creator.name! },
        ];
        const icalEvent = createIcalEventData({
            id: scheduledDeactivation.id + config.nodemailer.authUser,
            start: data.deactivateDate,
            allDay: true,
            duration: 0,
            users,
            summary: subject,
            description: subject,
        });

        await sendMail({
            to,
            html: html(scheduledDeactivation),
            subject,
            icalEvent: calendarEvents({
                method: ICalCalendarMethod.REQUEST,
                events: [icalEvent],
            }),
        });
        return scheduledDeactivation;
    },
    getById: async (id: string) => {
        const result = await prisma.scheduledDeactivation.findUnique({
            where: { id },
            include: { user: true, creator: true, organizationUnit: true, newOrganizationUnit: true },
        });

        if (!result) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No scheduled deactivation with id ${id}`,
            });
        }

        return result;
    },
};
