import { TRPCError } from '@trpc/server';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { OrganizationUnit, SupplementalPosition } from 'prisma/prisma-client';
import { InsertExpression } from 'kysely/dist/cjs/parser/insert-values-parser';

import { prisma } from '../utils/prisma';
import { percentageMultiply } from '../utils/suplementPosition';
import { db } from '../utils/db';
import { createJob, JobKind } from '../worker/create';
import { jobDelete } from '../worker/jobOperations';
import { config } from '../config';
import { trimAndJoin } from '../utils/trimAndJoin';
import { DB } from '../generated/kyselyTypes';

import {
    AddSupplementalPositionToUser,
    CreateSupplementalPosition,
    CreateSupplementalPositionRequest,
    RemoveSupplementalPositionFromUser,
    UpdateSupplementalPosition,
} from './supplementalPositionSchema';
import { userMethods } from './userMethods';
import { tr } from './modules.i18n';
import { serviceMethods } from './serviceMethods';

export const supplementalPositionMethods = {
    addToUser: async (data: AddSupplementalPositionToUser) => {
        const { percentage, ...restData } = data;
        const supplementalPosition = await prisma.supplementalPosition.findFirst({
            where: { userId: data.userId, organizationUnitId: data.organizationUnitId },
        });
        if (supplementalPosition) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('User already has supplemental position in this organization'),
            });
        }
        return prisma.supplementalPosition.create({
            data: { ...restData, percentage: percentage * percentageMultiply },
        });
    },

    removeFromUser: async ({ id, userId }: RemoveSupplementalPositionFromUser) => {
        const result = await prisma.supplementalPosition.findUnique({ where: { id } });

        if (result?.userId !== userId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('User does not have supplemental position in this organization'),
            });
        }
        return prisma.supplementalPosition.delete({
            where: { id },
        });
    },

    create: async (data: CreateSupplementalPosition, base = db) => {
        const position = await base
            .insertInto('SupplementalPosition')
            .values(data)
            .returningAll()
            .returning((eb) => [
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit as o')
                        .select(['o.country', 'o.description', 'o.external', 'o.id', 'o.main', 'o.name'])
                        .whereRef('o.id', '=', 'SupplementalPosition.organizationUnitId')
                        .where('o.id', 'is not', null),
                ).as('organizationUnit'),
            ])
            .$narrowType<{ organizationUnit: OrganizationUnit }>()
            .executeTakeFirst();

        if (!position) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error on creation supplemental position with data ${JSON.stringify(data)}`,
            });
        }

        return position;
    },

    update: async (data: UpdateSupplementalPosition) => {
        const { id, ...updateValues } = data;

        const position = await db
            .updateTable('SupplementalPosition')
            .where('id', '=', id)
            .set(updateValues)
            .returningAll()
            .returning((eb) => [
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit as o')
                        .select(['o.country', 'o.description', 'o.external', 'o.id', 'o.main', 'o.name'])
                        .whereRef('o.id', '=', 'SupplementalPosition.organizationUnitId')
                        .where('o.id', 'is not', null),
                ).as('organizationUnit'),
            ])
            .$narrowType<{ organizationUnit: OrganizationUnit }>()
            .executeTakeFirst();

        if (!position) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error on update supplemental position with id ${id}`,
            });
        }

        return position;
    },

    updateRequestPosition: async (data: {
        date: Date;
        jobKind: JobKind;
        userId: string;
        position?: SupplementalPosition;
        updateValues?: { organizationUnitId: string; percentage?: number; unitId?: string };
        main: boolean;
        requestId: string;
        connectToUser?: boolean;
    }) => {
        const { date, jobKind, userId, position, updateValues, main, requestId, connectToUser } = data;
        const dateKey = jobKind === 'scheduledFiringFromSupplementalPosition' ? 'workEndDate' : 'workStartDate';
        const userCreationRequestKey =
            jobKind === 'scheduledFiringFromSupplementalPosition' ? 'userCreationRequestId' : 'userTransferToRequestId';

        if (!position && updateValues) {
            const newPosition = await supplementalPositionMethods.create({
                organizationUnitId: updateValues.organizationUnitId,
                userId: connectToUser ? userId : undefined,
                percentage: (updateValues?.percentage || 1) * percentageMultiply,
                unitId: updateValues.unitId,
                main,
                [dateKey]: date,
                [userCreationRequestKey]: requestId,
            });

            const job = await createJob(jobKind, { date, data: { supplementalPositionId: newPosition.id, userId } });

            await db
                .updateTable('SupplementalPosition')
                .where('id', '=', newPosition.id)
                .set({ jobId: job.id })
                .execute();

            return newPosition;
        }

        if (position && updateValues) {
            const updatedPosition = await supplementalPositionMethods.update({
                id: position.id,
                organizationUnitId: updateValues.organizationUnitId,
                userId: connectToUser ? userId : undefined,
                percentage: (updateValues?.percentage || 1) * percentageMultiply,
                unitId: updateValues.unitId,
                main,
                [dateKey]: date,
                [userCreationRequestKey]: requestId,
            });

            if (!position.jobId) {
                const job = await createJob(jobKind, {
                    date,
                    data: { supplementalPositionId: updatedPosition.id, userId },
                });

                await db
                    .updateTable('SupplementalPosition')
                    .where('id', '=', updatedPosition.id)
                    .set({ jobId: job.id })
                    .execute();
            } else if (position.workStartDate !== date) {
                await db.updateTable('Job').where('id', '=', position.jobId).set({ date }).execute();
            }

            return updatedPosition;
        }

        if (position && !updateValues && !main) {
            await db.deleteFrom('SupplementalPosition').where('id', '=', position.id).execute();

            position.jobId && (await jobDelete(position.jobId));
        }
    },

    createRequest: async (data: CreateSupplementalPositionRequest, sessionUserId: string) => {
        const startSupplementalPositionDate = data.supplementalPositions[0].workStartDate;
        if (!startSupplementalPositionDate) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `No workStartDate in creation request for supplemental position for user with id ${data.userTargetId}`,
            });
        }

        startSupplementalPositionDate.setUTCHours(config.employmentUtcHour);

        const user = await userMethods.getById(data.userTargetId);

        if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${data.userTargetId} found` });
        }

        if (!user.login) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `User with id ${data.userTargetId} has no login` });
        }

        const name = trimAndJoin([data.surname, data.firstName, data.middleName]);

        await serviceMethods.updateUserServicesInRequest({
            userId: user.id,
            services: user.services,
            phone: data.phone,
            personalEmail: data.personalEmail,
            workEmail: data.workEmail,
        });

        const requestValues: InsertExpression<DB, 'UserCreationRequest'> = {
            type: data.type,
            userTargetId: data.userTargetId,
            supervisorId: data.supervisorId,
            organizationUnitId: data.organizationUnitId,
            email: user.email,
            login: user.login,
            createExternalAccount: false,
            name,
            creatorId: sessionUserId,
            groupId: data.groupId,
            title: data.title,
            comment: data.comment,
            workEmail: data.workEmail,
            personalEmail: data.personalEmail,
            services: [],
            workMode: data.workMode,
            equipment: data.equipment,
            extraEquipment: data.extraEquipment,
            workSpace: data.workSpace,
            location: data.location,
            unitId: data.unitId,
            percentage: data.percentage ? data.percentage * percentageMultiply : undefined,
        };

        if (data.buddyId) {
            await userMethods.getByIdOrThrow(data.buddyId);
            requestValues.buddyId = data.buddyId;
        }

        if (data.recruiterId) {
            await userMethods.getByIdOrThrow(data.recruiterId);
            requestValues.recruiterId = data.recruiterId;
        }

        const { request, supplementalPosition } = await db.transaction().execute(async (trx) => {
            const request = await trx
                .insertInto('UserCreationRequest')
                .values(requestValues)
                .returningAll()
                .executeTakeFirst();

            if (!request) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed creation request for supplemental position for user with id ${data.userTargetId}`,
                });
            }

            const supplementalPosition = await supplementalPositionMethods.create(
                {
                    ...data.supplementalPositions[0],
                    percentage: data.supplementalPositions[0].percentage * percentageMultiply,
                    workStartDate: startSupplementalPositionDate,
                    userCreationRequestId: request.id,
                },
                trx,
            );

            await Promise.all([
                data.coordinatorIds?.length &&
                    trx
                        .insertInto('_userCoordinators')
                        .values(data.coordinatorIds.map((id) => ({ A: id, B: request.id })))
                        .execute(),

                data.lineManagerIds?.length &&
                    trx
                        .insertInto('_userLineManagers')
                        .values(data.lineManagerIds.map((id) => ({ A: id, B: request.id })))
                        .execute(),
            ]);

            return { request, supplementalPosition };
        });

        await createJob('activateUserSupplementalPosition', {
            date: startSupplementalPositionDate,
            data: {
                userId: data.userTargetId,
                supplementalPositionId: supplementalPosition.id,
            },
        });

        await createJob('editUserOnTransfer', {
            date: startSupplementalPositionDate,
            data: { userCreationRequestId: request.id },
        });
    },
};
