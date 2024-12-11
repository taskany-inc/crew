import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';
import { Prisma } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { createJob } from '../worker/create';
import { scheduledDeactivationEmailHtml } from '../utils/emailTemplates';
import { getActiveScheduledDeactivation } from '../utils/getActiveScheduledDeactivation';
import { percentageMultiply } from '../utils/suplementPosition';

import {
    CreateScheduledDeactivation,
    EditScheduledDeactivation,
    CancelScheduledDeactivation,
    GetScheduledDeactivationList,
} from './scheduledDeactivationSchemas';
import { calendarEvents, createIcalEventData, nodemailerAttachments, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import { userMethods } from './userMethods';

export const scheduledDeactivationMethods = {
    create: async (data: CreateScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, attachIds, ...restData } = data;

        const deactivateDate = data.supplementalPositions
            ? data.supplementalPositions.reduce((acc: Date | undefined | null, rec) => {
                  if (!acc) return rec.workEndDate;
                  if (!rec.workEndDate) return acc;
                  return acc > rec.workEndDate ? acc : rec.workEndDate;
              }, undefined)
            : restData.deactivateDate;

        if (!deactivateDate) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date specified' });

        const deactivateJobDate = new Date(deactivateDate);
        deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);
        deactivateDate.setUTCHours(config.deactivateUtcHour);

        data.supplementalPositions &&
            data.supplementalPositions.map(async (s) => {
                if (s.workEndDate) {
                    const deactivateJobDate = new Date(s.workEndDate);
                    deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);

                    const job = await createJob('scheduledFiringFromSupplementalPosition', {
                        date: deactivateJobDate,
                        data: { supplementalPositionId: s.id, userId },
                    });

                    await prisma.supplementalPosition.update({
                        where: { id: s.id },
                        data: {
                            workEndDate: deactivateJobDate,
                            organizationUnitId: s.organizationUnitId,
                            percentage: s.percentage * percentageMultiply,
                            unitId: s.unitId,
                            ...(job && job.id && { jobId: job.id }),
                        },
                    });
                }
            });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                scheduledDeactivations: true,
                memberships: { include: { group: true } },
            },
        });

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user with id ${userId}`,
            });
        }

        const orgGroup = user.memberships.find((m) => m.group.organizational)?.group;

        if (orgGroup?.id !== restData.groupId && restData.groupId) {
            orgGroup?.id && (await userMethods.removeFromGroup({ userId, groupId: orgGroup.id }));

            await userMethods.addToGroup({ userId, groupId: restData.groupId });
        }

        if (user.supervisorId !== restData.supervisorId && restData.supervisorId) {
            await userMethods.edit({ id: userId, supervisorId: restData.supervisorId });
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
                phone: restData.phone,
                email: user.email,
                disableAccount: restData.disableAccount,
                location: restData.location,
                applicationForReturnOfEquipment: restData.applicationForReturnOfEquipment,
                workPlace: restData.workSpace,
                workMode: restData.workMode,
                organizationRole: user.title,
                comments: restData.comment,
                lineManagerIds: restData.lineManagerIds,
                teamLead: restData.teamLead,
                organizationUnitId: restData.organizationUnitId,
                unitIdString: restData.unitIdString,
                transferPercentage: restData.transferPercentage,
                newTeamLead: restData.newTeamLead,
                newOrganizationUnitId: restData.newOrganizationUnitId,
                newOrganizationalGroup: restData.newOrganizationalGroup,
                newOrganizationRole: restData.newOrganizationRole,
                organizationalGroup: restData.organizationalGroup,
            },
            include: {
                user: {
                    include: {
                        supplementalPositions: { include: { organizationUnit: true } },
                        supervisor: true,
                    },
                },
                creator: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: true,
            },
        });

        const additionalEmails = [sessionUserId, ...restData.lineManagerIds];

        if (restData.supervisorId) additionalEmails.push(restData.supervisorId);

        const { to, users } = await userMethods.getMailingList(
            'scheduledDeactivation',
            data.supplementalPositions
                ? data.supplementalPositions
                      .filter(({ workEndDate }) => workEndDate)
                      .map(({ organizationUnitId }) => organizationUnitId)
                : [],
            additionalEmails,
        );

        const attachments = await nodemailerAttachments(scheduledDeactivation.attaches);

        const subject =
            type === 'retirement'
                ? `${tr('Retirement')} ${user.name} ${scheduledDeactivation.user.supplementalPositions
                      .filter((s) => s.workEndDate && s.status !== 'FIRED')
                      .map(({ organizationUnit }) => getOrgUnitTitle(organizationUnit))
                      .join(', ')} (${restData.phone})`
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
            html: scheduledDeactivationEmailHtml({
                data: scheduledDeactivation,
                teamlead: scheduledDeactivation.user.supervisor?.name || '',
                unitId: data.supplementalPositions
                    ? data.supplementalPositions
                          .filter(({ workEndDate }) => workEndDate)
                          .map(({ unitId }) => unitId)
                          .join(', ')
                    : restData.unitIdString || '',
                workEmail: restData.workEmail || '',
            }),
            subject,
            attachments,
            icalEvent: calendarEvents({
                method: ICalCalendarMethod.REQUEST,
                events: [icalEvent],
            }),
        });
        return scheduledDeactivation;
    },

    getList: async ({ creatorId, orderBy: order, search }: GetScheduledDeactivationList) => {
        let orderBy: Prisma.ScheduledDeactivationOrderByWithRelationAndSearchRelevanceInput[] = [];
        const where: Prisma.ScheduledDeactivationWhereInput = { creatorId, canceled: false };

        if (order?.name) {
            orderBy = [{ user: { name: order.name } }];
        }

        if (order?.deactivateDate) {
            orderBy = [{ deactivateDate: order.deactivateDate }];
        }

        if (search) {
            where.user = { name: { contains: search, mode: 'insensitive' } };
        }

        return prisma.scheduledDeactivation.findMany({
            where,
            include: {
                creator: true,
                user: {
                    include: {
                        supplementalPositions: {
                            where: { workEndDate: { not: null }, status: { not: 'FIRED' } },
                            include: { organizationUnit: true },
                        },
                        supervisor: true,
                        memberships: { where: { group: { organizational: true } }, include: { group: true } },
                    },
                },
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: { where: { deletedAt: null } },
            },
            orderBy,
        });
    },

    cancel: async (data: CancelScheduledDeactivation) => {
        const { id, comment } = data;
        const scheduledDeactivation = await prisma.scheduledDeactivation.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        supplementalPositions: { include: { organizationUnit: true } },
                    },
                },
                organizationUnit: true,
                newOrganizationUnit: true,
                creator: true,
            },
        });

        if (!scheduledDeactivation) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No scheduled deactivation with id ${id}`,
            });
        }

        const additionalEmails = [scheduledDeactivation.creatorId, ...scheduledDeactivation.lineManagerIds];

        if (scheduledDeactivation.teamLeadId) additionalEmails.push(scheduledDeactivation.teamLeadId);

        const subject =
            scheduledDeactivation.type === 'retirement'
                ? `${tr('Retirement')} ${
                      scheduledDeactivation.user.name
                  } ${scheduledDeactivation.user.supplementalPositions
                      .filter((s) => s.workEndDate && s.status !== 'FIRED')
                      .map(({ organizationUnit }) => getOrgUnitTitle(organizationUnit))
                      .join(', ')} (${scheduledDeactivation.phone})`
                : `${tr('Transfer from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  } ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${scheduledDeactivation.user.name} (${scheduledDeactivation.phone})`;

        const supplementalPositions = scheduledDeactivation.user.supplementalPositions.filter(
            ({ workEndDate, status }) => workEndDate && status === 'ACTIVE',
        );

        await prisma.supplementalPosition.updateMany({
            where: { id: { in: supplementalPositions.map(({ id }) => id) } },
            data: { workEndDate: null },
        });

        const jobIds = supplementalPositions.map(({ jobId }) => jobId).filter((jobId) => jobId !== null) as string[];

        await prisma.job.deleteMany({ where: { id: { in: jobIds } } });

        const { to, users } = await userMethods.getMailingList(
            'scheduledDeactivation',
            supplementalPositions.map(({ organizationUnitId }) => organizationUnitId),
            additionalEmails,
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
            text: comment || '',
            icalEvent: calendarEvents({
                method: ICalCalendarMethod.CANCEL,
                events: [icalEvent],
            }),
        });

        scheduledDeactivation.jobId && (await prisma.job.delete({ where: { id: scheduledDeactivation.jobId } }));

        return prisma.scheduledDeactivation.update({
            where: { id },
            data: { canceled: true, canceledAt: new Date(), cancelComment: comment },
        });
    },

    edit: async (data: EditScheduledDeactivation) => {
        const { userId, type, devices, testingDevices, id, ...restData } = data;

        const deactivateDate = data.supplementalPositions
            ? data.supplementalPositions.reduce((acc: Date | undefined | null, rec) => {
                  if (!acc) return rec.workEndDate;
                  if (!rec.workEndDate) return acc;
                  return acc > rec.workEndDate ? acc : rec.workEndDate;
              }, undefined)
            : restData.deactivateDate;

        if (!deactivateDate) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date specified' });

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
                type,
                deactivateDate,
                ...(devices && devices.length && { devices: JSON.stringify(devices) }),
                ...(testingDevices && testingDevices.length && { testingDevices: JSON.stringify(testingDevices) }),
                phone: restData.phone,
                disableAccount: restData.disableAccount,
                location: restData.location,
                applicationForReturnOfEquipment: restData.applicationForReturnOfEquipment,
                workPlace: restData.workSpace,
                workMode: restData.workMode,
                comments: restData.comment,
                lineManagerIds: restData.lineManagerIds,
                teamLead: restData.teamLead,
                organizationUnitId: restData.organizationUnitId,
                unitIdString: restData.unitIdString,
                transferPercentage: restData.transferPercentage,
                newTeamLead: restData.newTeamLead,
                newOrganizationUnitId: restData.newOrganizationUnitId,
                newOrganizationalGroup: restData.newOrganizationalGroup,
                newOrganizationRole: restData.newOrganizationRole,
                organizationalGroup: restData.organizationalGroup,
            },
            include: {
                user: {
                    include: {
                        supplementalPositions: true,
                        supervisor: true,
                        memberships: { include: { group: true } },
                    },
                },
                creator: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: { where: { deletedAt: null } },
            },
        });

        data.supplementalPositions &&
            data.supplementalPositions.map(async (s) => {
                if (data.disableAccount && s.workEndDate) {
                    const deactivateJobDate = new Date(s.workEndDate);
                    deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);

                    const updatedPosition = await prisma.supplementalPosition.update({
                        where: { id: s.id },
                        data: {
                            workEndDate: deactivateJobDate,
                            organizationUnitId: s.organizationUnitId,
                            percentage: s.percentage * percentageMultiply,
                            unitId: s.unitId,
                        },
                    });

                    if (updatedPosition.jobId) {
                        await prisma.job.update({
                            where: { id: updatedPosition.jobId },
                            data: { date: deactivateJobDate },
                        });
                    } else {
                        const newJob = await createJob('scheduledFiringFromSupplementalPosition', {
                            date: deactivateJobDate,
                            data: { supplementalPositionId: s.id, userId },
                        });
                        await prisma.supplementalPosition.update({
                            where: { id: s.id },
                            data: {
                                job: { connect: { id: newJob.id } },
                            },
                        });
                    }
                }
            });

        const supplementalPositions = scheduledDeactivation.user.supplementalPositions.filter(
            ({ workEndDate, status }) => workEndDate && status === 'ACTIVE',
        );

        if (scheduledDeactivationBeforeUpdate.deactivateDate && scheduledDeactivationBeforeUpdate.jobId) {
            if (!scheduledDeactivation.disableAccount) {
                await prisma.job.delete({ where: { id: scheduledDeactivationBeforeUpdate.jobId } });

                const jobIds = supplementalPositions
                    .map(({ jobId }) => jobId)
                    .filter((jobId) => jobId !== null) as string[];

                await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
            }

            if (scheduledDeactivationBeforeUpdate.deactivateDate !== scheduledDeactivation.deactivateDate) {
                await prisma.job.update({
                    where: { id: scheduledDeactivationBeforeUpdate.jobId },
                    data: { date: scheduledDeactivation.deactivateDate },
                });
            }
        }

        const orgGroup = scheduledDeactivation.user.memberships.find((m) => m.group.organizational)?.group;

        if (orgGroup?.id !== restData.groupId && restData.groupId) {
            orgGroup?.id && (await userMethods.removeFromGroup({ groupId: orgGroup.id, userId }));
            await userMethods.addToGroup({ groupId: restData.groupId, userId });
        }

        if (scheduledDeactivation.user.supervisorId !== restData.supervisorId && restData.supervisorId) {
            await userMethods.edit({ id: userId, supervisorId: restData.supervisorId });
        }

        const subject =
            scheduledDeactivation.type === 'retirement'
                ? `${tr('Retirement')} ${
                      scheduledDeactivation.organizationUnit
                          ? getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                          : ''
                  } ${scheduledDeactivation.user.name} (${scheduledDeactivation.phone}) `
                : `${tr('Transfer from')} ${
                      scheduledDeactivation.organizationUnit && getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                  } ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${scheduledDeactivation.user.name} (${scheduledDeactivation.phone})`;

        const additionalEmails = [scheduledDeactivation.creatorId, ...scheduledDeactivation.lineManagerIds];

        if (scheduledDeactivation.teamLeadId) additionalEmails.push(scheduledDeactivation.teamLeadId);

        if (scheduledDeactivation.organizationUnitId) {
            const { to, users } = await userMethods.getMailingList(
                'scheduledDeactivation',
                restData.supplementalPositions
                    ? restData.supplementalPositions
                          .filter(({ workEndDate }) => workEndDate)
                          .map(({ organizationUnitId }) => organizationUnitId)
                    : [],
                additionalEmails,
            );

            const icalEvent = createIcalEventData({
                id: scheduledDeactivation.id + config.nodemailer.authUser,
                start: deactivateDate,
                duration: 30,
                users,
                summary: subject,
                description: subject,
            });

            const attachments = await nodemailerAttachments(scheduledDeactivation.attaches);

            await sendMail({
                to,
                html: scheduledDeactivationEmailHtml({
                    data: scheduledDeactivation,
                    workEmail: data.workEmail || '',
                    teamlead: scheduledDeactivation.user.supervisor?.name || '',
                    unitId: restData.supplementalPositions
                        ? restData.supplementalPositions
                              .filter(({ workEndDate }) => workEndDate)
                              .map(({ unitId }) => unitId)
                              .join(', ')
                        : restData.unitIdString || '',
                }),
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
            include: { user: true, creator: true, organizationUnit: true, newOrganizationUnit: true, attaches: true },
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
