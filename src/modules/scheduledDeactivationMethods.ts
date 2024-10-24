import { TRPCError } from '@trpc/server';
import { Attach } from '@prisma/client';
import { ICalCalendarMethod } from 'ical-generator';
import fs from 'fs';
import { Readable } from 'stream';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { createJob } from '../worker/create';
import { scheduledDeactivationEmailHtml } from '../utils/emailTemplates';
import { getActiveScheduledDeactivation } from '../utils/getActiveScheduledDeactivation';

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
        const { userId, type, devices, testingDevices, attachIds, deactivateDate, ...restData } = data;

        const deactivateJobDate = new Date(deactivateDate);
        deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);
        deactivateDate.setUTCHours(config.deactivateUtcHour);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { scheduledDeactivations: true },
        });

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user with id ${userId}`,
            });
        }

        if (getActiveScheduledDeactivation(user)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Not allowed to schedule deactivation for inactive or already scheduled for deactivation user',
            });
        }

        const job =
            data.disableAccount &&
            (await createJob('scheduledDeactivation', {
                date: deactivateJobDate,
                data: { userId },
            }));

        const scheduledDeactivation = await prisma.scheduledDeactivation.create({
            data: {
                userId,
                creatorId: sessionUserId,
                type,
                deactivateDate,
                ...(attachIds && { attaches: { connect: attachIds.map((id) => ({ id })) } }),
                ...(devices && devices.length && { devices: JSON.stringify(devices) }),
                ...(testingDevices && testingDevices.length && { testingDevices: JSON.stringify(testingDevices) }),
                ...(job && job.id && { jobId: job.id }),
                ...restData,
            },
            include: { user: true, creator: true, organizationUnit: true, newOrganizationUnit: true, attaches: true },
        });

        const { to, users } = await userMethods.getMailingList('scheduledDeactivation', data.organizationUnitId, [
            sessionUserId,
            ...(restData.teamLeadId ? [restData.teamLeadId] : []),
        ]);

        const attachments = await nodemailerAttachments(scheduledDeactivation.attaches);

        const subject =
            type === 'retirement'
                ? `${tr('Retirement of')} ${user.name} (${restData.phone}) ${tr('from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  }`
                : `${tr('Transfer from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  } ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${user.name} (${restData.phone})`;

        const icalEvent = createIcalEventData({
            id: scheduledDeactivation.id + config.nodemailer.authUser,
            start: deactivateDate,
            duration: 30,
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
            orderBy: { deactivateDate: 'desc' },
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
                ? tr('Cancel retirement of {userName}', {
                      userName: scheduledDeactivation.user.name || scheduledDeactivation.user.email,
                  })
                : tr('Cancel transfer of {userName}', {
                      userName: scheduledDeactivation.user.name || scheduledDeactivation.user.email,
                  });

        if (scheduledDeactivation.organizationUnitId) {
            const { to, users } = await userMethods.getMailingList(
                'scheduledDeactivation',
                scheduledDeactivation.organizationUnitId,
                scheduledDeactivation.teamLeadId
                    ? [scheduledDeactivation.creatorId, scheduledDeactivation.teamLeadId]
                    : [scheduledDeactivation.creatorId],
            );

            const icalEvent = createIcalEventData({
                id: scheduledDeactivation.id + config.nodemailer.authUser,
                start: scheduledDeactivation.deactivateDate,
                duration: 30,
                users,
                summary: subject,
                description: subject,
            });

            await sendMail({
                to,
                subject,
                text: comment,
                icalEvent: calendarEvents({
                    method: ICalCalendarMethod.CANCEL,
                    events: [icalEvent],
                }),
            });
        }

        scheduledDeactivation.jobId && (await prisma.job.delete({ where: { id: scheduledDeactivation.jobId } }));

        return prisma.scheduledDeactivation.update({
            where: { id },
            data: { canceled: true, canceledAt: new Date(), cancelComment: comment },
        });
    },

    edit: async (data: EditScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, id, deactivateDate, ...restData } = data;

        deactivateDate.setUTCHours(config.deactivateUtcHour);

        const scheduledDeactivationBeforeUpdate = await prisma.scheduledDeactivation.findUnique({ where: { id } });

        if (!scheduledDeactivationBeforeUpdate) {
            throw new TRPCError({
                message: `No scheduled deactivation with id ${id}`,
                code: 'NOT_FOUND',
            });
        }
        await userMethods.getByIdOrThrow(userId);

        const scheduledDeactivation = await prisma.scheduledDeactivation.update({
            where: { id },
            data: {
                userId,
                creatorId: sessionUserId,
                type,
                deactivateDate,
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

        if (scheduledDeactivationBeforeUpdate.deactivateDate && scheduledDeactivationBeforeUpdate.jobId) {
            if (!scheduledDeactivation.disableAccount) {
                await prisma.job.delete({ where: { id: scheduledDeactivationBeforeUpdate.jobId } });
            }

            if (scheduledDeactivationBeforeUpdate.deactivateDate !== scheduledDeactivation.deactivateDate) {
                await prisma.job.update({
                    where: { id: scheduledDeactivationBeforeUpdate.jobId },
                    data: { date: scheduledDeactivation.deactivateDate },
                });
            }
        }

        const subject =
            type === 'retirement'
                ? `${tr('Update on retirement of')} ${scheduledDeactivation.user.name} (${restData.phone}) ${tr(
                      'from',
                  )} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  }`
                : `${tr('Update on transfer from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  } ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${scheduledDeactivation.user.name} (${restData.phone})`;

        if (scheduledDeactivation.organizationUnitId) {
            const { to, users } = await userMethods.getMailingList(
                'scheduledDeactivation',
                scheduledDeactivation.organizationUnitId,
                scheduledDeactivation.teamLeadId
                    ? [scheduledDeactivation.creatorId, scheduledDeactivation.teamLeadId]
                    : [scheduledDeactivation.creatorId],
            );

            const icalEvent = createIcalEventData({
                id: scheduledDeactivation.id + config.nodemailer.authUser,
                start: data.deactivateDate,
                duration: 30,
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
        }

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
