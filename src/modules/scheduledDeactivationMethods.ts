import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { formatDate } from '../utils/dateTime';
import { defaultLocale } from '../utils/getLang';

import { CreateScheduledDeactivation } from './scheduledDeactivationSchemas';
import { calendarEvents, createIcalEventData, sendMail } from './nodemailer';
import { tr } from './modules.i18n';

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
            include: { user: true, creator: true },
        });

        const users = [
            ...(config.nodemailer.scheduledDeactivationEmails?.split(' ').map((email) => ({ email })) || []),
            { email: scheduledDeactivation.creator.email, name: scheduledDeactivation.creator.name! },
        ];

        const subject =
            type === 'retirement'
                ? `${tr('Retirement')} ${user.name} (${restData.phone})`
                : `${tr('Transfer from')} ${restData.organization} ${tr('to')} ${restData.newOrganization} ${
                      user.name
                  } (${restData.phone})`;

        const html = `
<head>
  <style>
    table { border-collapse: collapse; }
    th { text-align: left; }
  </style>
</head>        
<body>
    ${tr('Hello colleagues!')}<br/>
    ${
        type === 'retirement'
            ? tr('Planning retirement of worker.')
            : tr('Planning transfer of worker to {newOrganization} {unitId}', {
                  newOrganization: restData.newOrganization!,
                  unitId: restData.unitId!,
              })
    }<br/>
    ${tr('Details below.')}<br/>
    ${tr('The meeting is for informational purposes only.')}<br/>
    <table border='1' cellpadding='8'>
        <tr>
            <th>${tr('Date')}</th>
            <td>${formatDate(restData.deactivateDate, defaultLocale)}</td>
        </tr>
        <tr>
            <th>${tr('Full name')}</th>
            <td>${user.name}</td>
        </tr>
        <tr>
            <th>${tr('Working hours,<br/>workplace (if any)')}</th>
            <td>
                ${restData.workMode}${restData.workModeComment ? `, ${restData.workModeComment}` : ''}
            </td>
        </tr>
    ${
        type === 'transfer'
            ? `
        <tr>
            <th>${tr('Transfer from, role')}</th>
            <td>${restData.organizationalGroup}, ${restData.organizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Transfer to, role')}</th>
            <td>${restData.newOrganizationalGroup}, ${restData.newOrganizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Unit')}</th>
            <td>${restData.unitId}</td>
        </tr>
    `
            : ''
    }
        <tr>
            <th>${tr('Location')}</th>
            <td>${restData.location}</td>
        </tr>
        <tr>
            <th>${tr('Email')}</th>
            <td>${restData.email}</td>
        </tr>
        <tr>
            <th>${tr('Teamlead')}</th>
            <td>${restData.teamLead}</td>
        </tr>
        <tr>
            <th>${tr('Devices')}</th>
            <td></td>
        </tr>
    ${
        devices
            ?.map(
                (d) =>
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
        testingDevices
            ?.map(
                (d) =>
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
            <td>${restData.comments}</td>
        </tr>
    </table>
${tr('Sincerely,<br/>HR-team!')}
</body>
`;
        const to = `${config.nodemailer.scheduledDeactivationEmails} ${scheduledDeactivation.creator.email}`.split(' ');
        const icalEvent = createIcalEventData({
            id: scheduledDeactivation.id,
            start: data.deactivateDate,
            allDay: true,
            duration: 0,
            users,
            summary: subject,
            description: subject,
        });

        await sendMail({
            to,
            html,
            subject,
            icalEvent: calendarEvents({
                method: ICalCalendarMethod.REQUEST,
                events: [icalEvent],
            }),
        });
        return scheduledDeactivation;
    },

    getList: async (creatorId?: string) => {
        return prisma.scheduledDeactivation.findMany({ where: { creatorId }, include: { creator: true, user: true } });
    },
};
