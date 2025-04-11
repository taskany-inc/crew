import { TRPCError } from '@trpc/server';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { OrganizationUnit, SupplementalPosition } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { percentageMultiply } from '../utils/suplementPosition';
import { db } from '../utils/db';
import { createJob, JobKind } from '../worker/create';
import { jobDelete } from '../worker/jobOperations';

import {
    AddSupplementalPositionToUser,
    CreateSupplementalPosition,
    RemoveSupplementalPositionFromUser,
    UpdateSupplementalPosition,
} from './supplementalPositionSchema';
import { tr } from './modules.i18n';

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

    create: async (data: CreateSupplementalPosition) => {
        const position = await db
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
};
