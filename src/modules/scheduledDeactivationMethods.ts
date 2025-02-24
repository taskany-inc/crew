import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';
import { Attach, OrganizationUnit, Prisma, ScheduledDeactivation, UserDevice } from 'prisma/prisma-client';
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
import { SupplementalPositionWithUnit } from './userCreationRequestTypes';

interface UserDissmissMailing {
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL;
    supplementalPositions: SupplementalPositionWithUnit[];
    request:
        | ScheduledDeactivation & { user: { name: string | null; supervisor: { id: string } | null } | null } & {
              newOrganizationUnit: OrganizationUnit | null;
          };
    teamlead: string;
    role: string;
    sessionUserId: string;
    attaches?: Attach[];
    phone: string;
    workEmail?: string;
    newOrganizationIds?: string[];
}

const sendDismissalEmails = async ({
    method,
    supplementalPositions,
    request,
    teamlead,
    role,
    attaches,
    sessionUserId,
    phone,
    workEmail,
    newOrganizationIds,
}: UserDissmissMailing) => {
    const attachments = attaches && (await nodemailerAttachments(attaches));

    const lineManagers = request.lineManagerIds.length
        ? await db.selectFrom('User').select(['name', 'email']).where('id', 'in', request.lineManagerIds).execute()
        : [];

    const coordinators = request.coordinatorIds.length
        ? await db.selectFrom('User').select(['name', 'email']).where('id', 'in', request.coordinatorIds).execute()
        : [];

    const orgUnit = supplementalPositions
        .sort((a, b) => Number(b.main) - Number(a.main))
        .filter((s) => s.workEndDate && s.status !== 'FIRED')
        .map(({ organizationUnit }) => organizationUnit && getOrgUnitTitle(organizationUnit))
        .join(', ');

    const subject =
        request.type === 'retirement'
            ? `${tr('Retirement')} ${request.user?.name} ${orgUnit} (${phone})`
            : `${tr('Transfer from')} ${orgUnit} ${tr('to')} ${
                  request?.newOrganizationUnit && getOrgUnitTitle(request.newOrganizationUnit)
              } ${request.user?.name} (${phone})`;

    const html =
        request.type === 'retirement'
            ? scheduledDeactivationEmailHtml({
                  data: request,
                  teamlead,
                  unitId: supplementalPositions.map(({ unitId }) => unitId).join(', '),
                  role,
                  workEmail,
              })
            : scheduledTransferEmailHtml({
                  data: request,
                  transferFrom: orgUnit,
                  transferTo: (request?.newOrganizationUnit && getOrgUnitTitle(request.newOrganizationUnit)) || '',
                  unitId: supplementalPositions.map(({ unitId }) => unitId).join(', '),
                  teamlead,
                  coordinators: coordinators.map(({ name, email }) => name || email).join(', '),
                  lineManagers: lineManagers.map(({ name, email }) => name || email).join(', '),
                  applicationForReturnOfEquipment: request.applicationForReturnOfEquipment || '',
                  role,
                  workEmail,
              });

    return Promise.all(
        supplementalPositions.map(async ({ workEndDate, organizationUnitId, main }) => {
            if (!workEndDate) return;

            if (
                method === ICalCalendarMethod.CANCEL &&
                newOrganizationIds &&
                newOrganizationIds.includes(organizationUnitId)
            ) {
                return;
            }

            const additionalEmails = [sessionUserId];

            if (request.creatorId) additionalEmails.push(request.creatorId);

            if (request.user?.supervisor?.id) additionalEmails.push(request.user?.supervisor?.id);

            if (main) additionalEmails.push(...request.lineManagerIds);

            if (main && request.coordinatorIds) additionalEmails.push(request.coordinatorIds.join(', '));

            const { to, users } = await userMethods.getMailingList(
                'scheduledDeactivation',
                [organizationUnitId],
                additionalEmails,
                !!request.workPlace,
            );
            const icalEvent = createIcalEventData({
                id: request.id + config.nodemailer.authUser + organizationUnitId,
                start: workEndDate,
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
                    method,
                    events: [icalEvent],
                }),
            });
        }),
    );
};

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

        await Promise.all(
            data.supplementalPositions.map(async (s) => {
                if (!s.workEndDate && type === 'retirement') return;
                const date = s.workEndDate || deactivateDate;

                const deactivateJobDate = new Date(date);
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
            coordinatorIds: restData.coordinatorIds,
            organizationalGroup: restData.groupId,
            newOrganizationUnitId: restData.newOrganizationUnitId,
            newOrganizationalGroup: restData.newOrganizationalGroup,
            newOrganizationRole: restData.newOrganizationRole,
            newTeamLead: restData.newTeamLead,
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
            .where('organizationUnitId', 'is not', null)
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
            .$castTo<SupplementalPositionWithUnit>()
            .execute();

        user.devices.length &&
            (await deleteUserDevices({
                userDevices: user.devices,
                requestDevices: testingDevices,
                userId,
                sessionUserId,
            }));

        await sendDismissalEmails({
            request: scheduledDeactivation,
            method: ICalCalendarMethod.REQUEST,
            teamlead: scheduledDeactivation.user.supervisor?.name || '',
            supplementalPositions,
            role: restData.title,
            attaches,
            sessionUserId,
            phone: restData.phone,
            workEmail: restData.workEmail,
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

    cancel: async (data: CancelScheduledDeactivation, sessionUserId: string) => {
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

        const supplementalPositions = scheduledDeactivation.user.supplementalPositions.filter(
            ({ workEndDate, status }) => workEndDate && status === 'ACTIVE',
        );

        await prisma.supplementalPosition.updateMany({
            where: { id: { in: supplementalPositions.map(({ id }) => id) } },
            data: { workEndDate: null },
        });

        const jobIds = supplementalPositions.map(({ jobId }) => jobId).filter((jobId) => jobId !== null) as string[];

        await prisma.job.deleteMany({ where: { id: { in: jobIds } } });

        const workEmail = scheduledDeactivation.user.services.find((s) => s.serviceName === 'WorkEmail')?.serviceId;

        const phone =
            findService(
                ExternalServiceName.Phone,
                scheduledDeactivation.user.services as Record<'serviceName' | 'serviceId', string>[],
            ) || '';

        await sendDismissalEmails({
            request: scheduledDeactivation,
            method: ICalCalendarMethod.CANCEL,
            teamlead: scheduledDeactivation.user.supervisor?.name || '',
            supplementalPositions,
            role: scheduledDeactivation.organizationRole || '',
            sessionUserId,
            workEmail,
            phone,
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

        const scheduledDeactivationBeforeUpdate = await scheduledDeactivationMethods.getById(id);

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
                coordinatorIds: restData.coordinatorIds,
                ...(supplementalPositionConnect.length && {
                    supplementalPositions: { connect: supplementalPositionConnect },
                }),
            },
            include: {
                user: {
                    include: {
                        supplementalPositions: { include: { organizationUnit: true } },
                        supervisor: true,
                        memberships: { include: { group: true } },
                        devices: true,
                        services: true,
                    },
                },
                creator: true,
                organizationUnit: true,
                newOrganizationUnit: true,
                attaches: { where: { deletedAt: null } },
            },
        });

        if (!findService(ExternalServiceName.WorkEmail, scheduledDeactivation.user.services) && data.workEmail) {
            await serviceMethods.addToUser({
                userId,
                serviceId: data.workEmail,
                serviceName: ExternalServiceName.WorkEmail,
            });
        }

        if (
            !findService(ExternalServiceName.PersonalEmail, scheduledDeactivation.user.services) &&
            data.personalEmail
        ) {
            await serviceMethods.addToUser({
                userId,
                serviceId: data.personalEmail,
                serviceName: ExternalServiceName.PersonalEmail,
            });
        }

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

        await sendDismissalEmails({
            request: scheduledDeactivation,
            method: ICalCalendarMethod.REQUEST,
            teamlead: scheduledDeactivation.user.supervisor?.name || '',
            supplementalPositions,
            role: restData.title,
            attaches: scheduledDeactivation.attaches,
            sessionUserId,
            phone: restData.phone,
            workEmail: data.workEmail,
        });

        await sendDismissalEmails({
            request: scheduledDeactivationBeforeUpdate,
            method: ICalCalendarMethod.CANCEL,
            teamlead: scheduledDeactivationBeforeUpdate.user.supervisor?.name || '',
            supplementalPositions: scheduledDeactivationBeforeUpdate.supplementalPositions,
            role: restData.title,
            attaches: scheduledDeactivationBeforeUpdate.attaches,
            sessionUserId,
            phone: restData.phone,
            newOrganizationIds: supplementalPositions.map(({ organizationUnitId }) => organizationUnitId),
            workEmail: data.workEmail,
        });

        return scheduledDeactivation;
    },

    getById: async (id: string) => {
        const result = await prisma.scheduledDeactivation.findUnique({
            where: { id },
            include: {
                user: { include: { supervisor: true } },
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
