import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';
import { Prisma, UserDevice } from 'prisma/prisma-client';
import { InsertExpression } from 'kysely/dist/cjs/parser/insert-values-parser';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { createJob } from '../worker/create';
import { scheduledDeactivationEmailHtml, scheduledTransferEmailHtml } from '../utils/emailTemplates';
import { getActiveScheduledDeactivation } from '../utils/getActiveScheduledDeactivation';
import { percentageMultiply } from '../utils/suplementPosition';
import { ExternalServiceName, findService } from '../utils/externalServices';
import { db } from '../utils/db';
import { DB } from '../generated/kyselyTypes';
import { JsonValue } from '../utils/jsonValue';

import {
    CreateScheduledDeactivation,
    EditScheduledDeactivation,
    CancelScheduledDeactivation,
    GetScheduledDeactivationList,
} from './scheduledDeactivationSchemas';
import { calendarEvents, createIcalEventData, nodemailerAttachments, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import { userMethods } from './userMethods';
import { deviceMethods } from './deviceMethods';
import { historyEventMethods } from './historyEventMethods';
import { serviceMethods } from './serviceMethods';

const deleteUserDevices = async ({
    userDevices,
    requestDevices,
    sessionUserId,
    userId,
}: {
    userDevices: UserDevice[];
    requestDevices?: { id: string; name: string }[];
    sessionUserId: string;
    userId: string;
}) => {
    const devicesToDelete = userDevices.filter(
        (d) => !requestDevices?.find(({ id, name }) => d.deviceId === id && d.deviceName === name),
    );

    await Promise.all(
        devicesToDelete.map(({ userId, deviceId, deviceName }) =>
            deviceMethods.deleteUserDevice({ userId, deviceId, deviceName }),
        ),
    );

    await historyEventMethods.create({ user: sessionUserId }, 'removeDevicesFromUserInDeactivation', {
        userId,
        groupId: undefined,
        before: undefined,
        after: {
            deletedDevices: devicesToDelete.map(({ deviceId, deviceName }) => `${deviceName} ${deviceId}`).join(', '),
        },
    });
};

export const scheduledDeactivationMethods = {
    create: async (data: CreateScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, attachIds, ...restData } = data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                scheduledDeactivations: true,
                memberships: { include: { group: true } },
                devices: true,
                services: true,
            },
        });

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user with id ${userId}`,
            });
        }

        if (!user.active || !!getActiveScheduledDeactivation(user)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `User ${userId} already inactive or has deactivation scheduled`,
            });
        }

        const deactivateDate = data.supplementalPositions.reduce((acc: Date | undefined | null, rec) => {
            if (!acc) return rec.workEndDate;
            if (!rec.workEndDate) return acc;
            return acc > rec.workEndDate ? acc : rec.workEndDate;
        }, undefined);

        if (!deactivateDate) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date specified' });

        const deactivateJobDate = new Date(deactivateDate);
        deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);
        deactivateDate.setUTCHours(config.deactivateUtcHour);

        const supplementalPositionConnect: string[] = [];

        if (type === 'transfer') {
            data.supplementalPositions.map((s) => {
                if (s.workEndDate) return s;
                return { ...s, workEndDate: deactivateDate };
            });
        }

        await Promise.all(
            data.supplementalPositions.map(async (s) => {
                if (!s.workEndDate) return;

                const deactivateJobDate = new Date(s.workEndDate);
                deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);

                if (s.id) {
                    const job =
                        data.disableAccount &&
                        (await createJob('scheduledFiringFromSupplementalPosition', {
                            date: deactivateJobDate,
                            data: { supplementalPositionId: s.id, userId },
                        }));
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

                    supplementalPositionConnect.push(s.id);
                } else {
                    const newPosition = await prisma.supplementalPosition.create({
                        data: {
                            workEndDate: deactivateJobDate,
                            organizationUnitId: s.organizationUnitId,
                            percentage: s.percentage * percentageMultiply,
                            unitId: s.unitId,
                            userId: data.userId,
                        },
                    });

                    const job =
                        data.disableAccount &&
                        (await createJob('scheduledFiringFromSupplementalPosition', {
                            date: deactivateJobDate,
                            data: { supplementalPositionId: s.id, userId },
                        }));

                    await prisma.supplementalPosition.update({
                        where: { id: newPosition.id },
                        data: { ...(job && job.id && { jobId: job.id }) },
                    });
                    supplementalPositionConnect.push(newPosition.id);
                }
            }),
        );

        if (!findService(ExternalServiceName.Phone, user.services) && data.phone) {
            await serviceMethods.addToUser({ userId, serviceId: data.phone, serviceName: ExternalServiceName.Phone });
        }

        if (!findService(ExternalServiceName.WorkEmail, user.services) && data.workEmail) {
            await serviceMethods.addToUser({
                userId,
                serviceId: data.workEmail,
                serviceName: ExternalServiceName.WorkEmail,
            });
        }

        if (!findService(ExternalServiceName.PersonalEmail, user.services) && data.personalEmail) {
            await serviceMethods.addToUser({
                userId,
                serviceId: data.personalEmail,
                serviceName: ExternalServiceName.PersonalEmail,
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

        const job =
            data.disableAccount &&
            (await createJob('scheduledDeactivation', {
                date: deactivateJobDate,
                data: { userId },
            }));

        const createScheduledDeactivationData: InsertExpression<DB, 'ScheduledDeactivation'> = {
            userId,
            creatorId: sessionUserId,
            type,
            deactivateDate,
            ...(devices && devices.length && { devices: { toJSON: () => devices } }),
            ...(testingDevices && { testingDevices: { toJSON: () => testingDevices } }),
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
            organizationalGroup: restData.groupId,
            newOrganizationUnitId: restData.newOrganizationUnitId,
            newOrganizationalGroup: restData.newOrganizationalGroup,
            newOrganizationRole: restData.newOrganizationRole,
            newTeamLead: restData.newTeamLead,
            coordinatorId: restData.coordinatorId,
        };

        const scheduledDeactivation = await db
            .insertInto('ScheduledDeactivation')
            .values(createScheduledDeactivationData)
            .returningAll()
            .returning((eb) => [
                'ScheduledDeactivation.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('User')
                        .select(['User.email as email', 'User.id as id', 'User.name as name'])
                        .whereRef('User.id', '=', 'ScheduledDeactivation.creatorId'),
                ).as('creator'),
            ])
            .returning((eb) => [
                'ScheduledDeactivation.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('User')
                        .select(['User.email as email', 'User.id as id', 'User.name as name'])
                        .whereRef('User.id', '=', 'ScheduledDeactivation.coordinatorId'),
                ).as('coordinator'),
            ])
            .returning((eb) => [
                'ScheduledDeactivation.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('User')
                        .select(['User.id as id', 'User.name as name', 'User.email as email', 'supervisorId', 'title'])
                        .select((eb) => [
                            'User.id',
                            jsonObjectFrom(
                                eb
                                    .selectFrom('User as supervisor')
                                    .select([
                                        'supervisor.id as id',
                                        'supervisor.email as email',
                                        'supervisor.name as name',
                                    ])
                                    .whereRef('supervisor.id', '=', 'User.supervisorId'),
                            ).as('supervisor'),
                        ])
                        .whereRef('User.id', '=', 'ScheduledDeactivation.userId'),
                ).as('user'),
            ])
            .returning((eb) => [
                'ScheduledDeactivation.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit')
                        .select([
                            'OrganizationUnit.country as country',
                            'OrganizationUnit.description as description',
                            'OrganizationUnit.external as external',
                            'OrganizationUnit.id as id',
                            'OrganizationUnit.name as name',
                        ])
                        .whereRef('ScheduledDeactivation.newOrganizationUnitId', '=', 'OrganizationUnit.id'),
                ).as('newOrganizationUnit'),
            ])
            .$narrowType<{
                testingDevices: JsonValue;
                devices: JsonValue;
            }>()
            .executeTakeFirstOrThrow();

        if (!scheduledDeactivation.user) {
            throw new TRPCError({
                message: `User ${userId} did not connect to scheduled deactivation ${scheduledDeactivation.id}`,
                code: 'INTERNAL_SERVER_ERROR',
            });
        }

        const attaches = attachIds?.length
            ? await db
                  .updateTable('Attach')
                  .where('id', 'in', attachIds)
                  .set({ scheduledDeactivationId: scheduledDeactivation.id })
                  .returningAll()
                  .execute()
            : [];

        const supplementalPositions = await db
            .updateTable('SupplementalPosition')
            .where('id', 'in', supplementalPositionConnect)
            .set({ scheduledDeactivationId: scheduledDeactivation.id })
            .returningAll()
            .returning((eb) => [
                'SupplementalPosition.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit')
                        .select([
                            'OrganizationUnit.country as country',
                            'OrganizationUnit.description as description',
                            'OrganizationUnit.external as external',
                            'OrganizationUnit.id as id',
                            'OrganizationUnit.name as name',
                        ])
                        .whereRef('OrganizationUnit.id', '=', 'SupplementalPosition.organizationUnitId'),
                ).as('organizationUnit'),
            ])
            .execute();

        user.devices.length &&
            (await deleteUserDevices({
                userDevices: user.devices,
                requestDevices: testingDevices,
                userId,
                sessionUserId,
            }));

        const attachments = await nodemailerAttachments(attaches);

        const orgUnit = supplementalPositions.find(({ main }) => main)?.organizationUnit;

        const subject =
            type === 'retirement'
                ? `${tr('Retirement')} ${user.name} ${supplementalPositions
                      .filter((s) => s.workEndDate && s.status !== 'FIRED')
                      .map(({ organizationUnit }) => organizationUnit && getOrgUnitTitle(organizationUnit))
                      .join(', ')} (${restData.phone})`
                : `${tr('Transfer from')} ${orgUnit && getOrgUnitTitle(orgUnit)} ${tr('to')} ${
                      scheduledDeactivation?.newOrganizationUnit &&
                      getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                  } ${user.name} (${restData.phone})`;

        const html =
            type === 'retirement'
                ? scheduledDeactivationEmailHtml({
                      data: scheduledDeactivation,
                      teamlead: scheduledDeactivation.user.supervisor?.name || '',
                      unitId: supplementalPositions.map(({ unitId }) => unitId).join(', '),
                      role: restData.title || '',
                      workEmail: restData.workEmail || '',
                  })
                : scheduledTransferEmailHtml({
                      data: scheduledDeactivation,
                      transferFrom: (orgUnit && getOrgUnitTitle(orgUnit)) || '',
                      transferTo:
                          (scheduledDeactivation?.newOrganizationUnit &&
                              getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)) ||
                          '',
                      unitId: supplementalPositions.map(({ unitId }) => unitId).join(', '),
                      teamlead: scheduledDeactivation.user.supervisor?.name || '',
                      coordinator: scheduledDeactivation.coordinator?.name || '',
                      role: restData.title || '',
                      workEmail: restData.workEmail || '',
                  });

        supplementalPositions.map(async (s) => {
            const additionalEmails = [sessionUserId];

            if (restData.supervisorId) additionalEmails.push(restData.supervisorId);

            if (s.main) additionalEmails.push(...restData.lineManagerIds);

            if (s.main && restData.coordinatorId) additionalEmails.push(restData.coordinatorId);

            const { to, users } = await userMethods.getMailingList(
                'scheduledDeactivation',
                data.supplementalPositions
                    ? data.supplementalPositions
                          .filter(({ workEndDate }) => workEndDate)
                          .map(({ organizationUnitId }) => organizationUnitId)
                    : [],
                additionalEmails,
                !!data.workSpace,
            );
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
                html,
                subject,
                attachments,
                icalEvent: calendarEvents({
                    method: ICalCalendarMethod.REQUEST,
                    events: [icalEvent],
                }),
            });
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
                        services: true,
                        supervisor: true,
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

        const workEmail = scheduledDeactivation.user.services.find((s) => s.serviceName === 'WorkEmail')?.serviceId;

        await sendMail({
            to,
            subject,
            html: scheduledDeactivationEmailHtml({
                data: scheduledDeactivation,
                workEmail: workEmail || '',
                teamlead: scheduledDeactivation.user.supervisor?.name || '',
                unitId: scheduledDeactivation.user.supplementalPositions
                    .filter(({ workEndDate }) => workEndDate)
                    .map(({ unitId }) => unitId)
                    .join(', '),
                role:
                    scheduledDeactivation.user.supplementalPositions
                        .filter(({ workEndDate }) => workEndDate)
                        .map(({ role }) => role)
                        .join(', ') ||
                    scheduledDeactivation.user.title ||
                    '',
            }),
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

    edit: async (data: EditScheduledDeactivation, sessionUserId: string) => {
        const { userId, type, devices, testingDevices, id, ...restData } = data;

        const deactivateDate = data.supplementalPositions.reduce((acc: Date | undefined | null, rec) => {
            if (!acc) return rec.workEndDate;
            if (!rec.workEndDate) return acc;
            return acc > rec.workEndDate ? acc : rec.workEndDate;
        }, undefined);

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

        const supplementalPositionConnect: { id: string }[] = [];
        data.supplementalPositions.map(async (s) => {
            if (data.disableAccount && s.workEndDate) {
                const deactivateJobDate = new Date(s.workEndDate);
                deactivateJobDate.setUTCHours(config.deactivateJobUtcHour);

                if (!s.id) {
                    const newPosition = await prisma.supplementalPosition.create({
                        data: {
                            workEndDate: deactivateJobDate,
                            organizationUnitId: s.organizationUnitId,
                            percentage: s.percentage * percentageMultiply,
                            unitId: s.unitId,
                            userId: data.userId,
                        },
                    });

                    const job = await createJob('scheduledFiringFromSupplementalPosition', {
                        date: deactivateJobDate,
                        data: { supplementalPositionId: s.id, userId },
                    });

                    await prisma.supplementalPosition.update({
                        where: { id: newPosition.id },
                        data: { jobId: job.id },
                    });
                    supplementalPositionConnect.push({ id: newPosition.id });
                }
                const updatedPosition = await prisma.supplementalPosition.update({
                    where: { id: s.id },
                    data: {
                        workEndDate: deactivateJobDate,
                        organizationUnitId: s.organizationUnitId,
                        percentage: s.percentage * percentageMultiply,
                        unitId: s.unitId,
                    },
                });

                supplementalPositionConnect.push({ id: updatedPosition.id });

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

        const scheduledDeactivation = await prisma.scheduledDeactivation.update({
            where: { id },
            data: {
                type,
                deactivateDate,
                devices: { toJSON: () => devices },
                testingDevices: { toJSON: () => testingDevices },
                phone: restData.phone,
                disableAccount: restData.disableAccount,
                location: restData.location,
                applicationForReturnOfEquipment: restData.applicationForReturnOfEquipment,
                workPlace: restData.workSpace,
                workMode: restData.workMode,
                comments: restData.comment,
                lineManagerIds: restData.lineManagerIds,
                newTeamLead: restData.newTeamLead,
                newOrganizationUnitId: restData.newOrganizationUnitId,
                newOrganizationalGroup: restData.newOrganizationalGroup,
                newOrganizationRole: restData.newOrganizationRole,
                organizationalGroup: restData.groupId,
                ...(supplementalPositionConnect.length && {
                    supplementalPositions: { connect: supplementalPositionConnect },
                }),
            },
            include: {
                user: {
                    include: {
                        supplementalPositions: true,
                        supervisor: true,
                        memberships: { include: { group: true } },
                        devices: true,
                    },
                },
                creator: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: { where: { deletedAt: null } },
            },
        });

        scheduledDeactivation.user.devices.length &&
            (await deleteUserDevices({
                userDevices: scheduledDeactivation.user.devices,
                requestDevices: testingDevices,
                userId,
                sessionUserId,
            }));

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

            if (
                scheduledDeactivationBeforeUpdate.deactivateDate.getTime() !==
                scheduledDeactivation.deactivateDate.getTime()
            ) {
                scheduledDeactivation.deactivateDate.setUTCHours(config.deactivateJobUtcHour);
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
                !!restData.workSpace,
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
                        .filter(({ workEndDate }) => workEndDate)
                        .map(({ unitId }) => unitId)
                        .join(', '),
                    role: restData.title || '',
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
            include: {
                user: true,
                creator: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: true,
                supplementalPositions: { include: { organizationUnit: true } },
            },
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
