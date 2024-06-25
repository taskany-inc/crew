import { TRPCError } from '@trpc/server';
import { Attach } from '@prisma/client';
import { ICalCalendarMethod } from 'ical-generator';
import fs from 'fs';
import { Readable } from 'stream';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { scheduledDeactivationEmailHtml } from '../utils/emailTemplates';

import {
    CreateScheduledDeactivation,
    EditScheduledDeactivation,
    CancelScheduledDeactivation,
} from './scheduledDeactivationSchemas';
import { calendarEvents, createIcalEventData, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import { userMethods } from './userMethods';
import { getObject } from './s3Methods';

const TEMP_DIR = '/tmp/';

const nodemailerAttachments = async (attaches: Attach[]) =>
    // eslint-disable-next-line no-return-await
    await Promise.all(
        attaches.map(async (attach) => {
            const tempFilePath = TEMP_DIR + attach.filename;
            const { Body } = await getObject(attach.link);
            Body instanceof Readable && Body.pipe(fs.createWriteStream(tempFilePath));

            return { path: tempFilePath, filename: attach.filename };
        }),
    );

export const scheduledDeactivationMethods = {
    create: async (data: CreateScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, attachIds, ...restData } = data;

        const user = await userMethods.getByIdOrThrow(userId);
        const scheduledDeactivation = await prisma.scheduledDeactivation.create({
            data: {
                userId,
                creatorId: sessionUserId,
                type,
                ...(attachIds && { attaches: { connect: attachIds.map((id) => ({ id })) } }),
                ...(devices && devices.length && { devices: JSON.stringify(devices) }),
                ...(testingDevices && testingDevices.length && { testingDevices: JSON.stringify(testingDevices) }),
                ...restData,
            },
            include: { user: true, creator: true, organizationUnit: true, newOrganizationUnit: true, attaches: true },
        });

        const users = [
            ...(config.nodemailer.scheduledDeactivationEmails?.split(' ').map((email) => ({ email })) || []),
            { email: scheduledDeactivation.creator.email, name: scheduledDeactivation.creator.name! },
        ];

        const attachments = await nodemailerAttachments(scheduledDeactivation.attaches);

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
            html: scheduledDeactivationEmailHtml(scheduledDeactivation),
            subject,
            attachments,
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
            include: {
                creator: true,
                user: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: { where: { deletedAt: null } },
            },
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
        await userMethods.getByIdOrThrow(userId);

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
            include: {
                user: true,
                creator: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: { where: { deletedAt: null } },
            },
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

        const attachments = await nodemailerAttachments(scheduledDeactivation.attaches);

        await sendMail({
            to,
            html: scheduledDeactivationEmailHtml(scheduledDeactivation),
            subject,
            attachments,
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
