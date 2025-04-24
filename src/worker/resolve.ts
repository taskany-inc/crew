import { TRPCError } from '@trpc/server';
import { UpdateObjectExpression } from 'kysely/dist/cjs/parser/update-set-parser';

import { historyEventMethods } from '../modules/historyEventMethods';
import { userMethods } from '../modules/userMethods';
import { userCreationRequestsMethods } from '../modules/userCreationRequestMethods';
import { prisma } from '../utils/prisma';
import { ExternalServiceName, findService } from '../utils/externalServices';
import { db } from '../utils/db';
import { locationMethods } from '../modules/locationMethods';
import { Location } from '../modules/locationTypes';
import { DB } from '../generated/kyselyTypes';
import { groupRoleMethods } from '../modules/groupRoleMethods';
import { dropUnchangedValuesFromEvent } from '../utils/dropUnchangedValuesFromEvents';
import { percentageMultiply } from '../utils/suplementPosition';
import { UserCreationRequestType } from '../modules/userCreationRequestTypes';
import { HistoryEventsData } from '../modules/historyEventTypes';

import { JobDataMap } from './create';

export const scheduledDeactivation = async ({ userId, method }: JobDataMap['scheduledDeactivation']) => {
    await userMethods.editActiveState({ id: userId, active: false, method });
    await historyEventMethods.create({ subsystem: 'Scheduled profile deactivate' }, 'editUserActiveState', {
        userId,
        groupId: undefined,
        before: true,
        after: false,
    });
};

export const createProfile = async ({ userCreationRequestId }: JobDataMap['createProfile']) => {
    const user = await userMethods.createUserFromRequest(userCreationRequestId);

    const phone = findService(ExternalServiceName.Phone, user.services);

    await historyEventMethods.create({ subsystem: 'Scheduled profile creation' }, 'createUser', {
        userId: user.id,
        groupId: undefined,
        before: undefined,
        after: {
            name: user.name || undefined,
            email: user.email,
            phone,
            login: user.login || undefined,
            supervisorId: user.supervisorId || undefined,
        },
    });
};

export const resolveDecree = async ({ userCreationRequestId }: JobDataMap['createProfile']) => {
    const requestBefore = await userCreationRequestsMethods.getDecreeRequestById(userCreationRequestId);

    const user = await userMethods.resolveDecreeRequest(userCreationRequestId);

    const phone = findService(ExternalServiceName.Phone, user.services);

    await historyEventMethods.create({ subsystem: 'Scheduled profile management' }, 'resolveUserDecreeRequest', {
        userId: user.id,
        groupId: undefined,
        before: undefined,
        after: {
            type: requestBefore.type,
            name: user.name || undefined,
            email: user.email,
            phone,
            login: user.login || undefined,
            supervisorId: user.supervisorId || undefined,
        },
    });

    return user;
};

export const scheduledFiringFromSupplementalPosition = async ({
    supplementalPositionId,
    userId,
}: JobDataMap['scheduledFiringFromSupplementalPosition']) => {
    const s = await prisma.supplementalPosition.update({
        where: { id: supplementalPositionId },
        data: { status: 'FIRED' },
    });

    await historyEventMethods.create(
        { subsystem: 'Scheduled firing from supplemental position' },
        'scheduledFiringFromSupplementalPosition',
        {
            userId,
            groupId: undefined,
            before: undefined,
            after: {
                organizationUnitId: s.organizationUnitId,
                workEndDate: s.workEndDate?.toLocaleDateString() || new Date().toLocaleDateString(),
            },
        },
    );
};

export const editUserOnScheduledRequest = async ({
    userCreationRequestId,
}: JobDataMap['editUserOnScheduledRequest']) => {
    const userCreationRequest = await userCreationRequestsMethods.getById(userCreationRequestId);

    if (!userCreationRequest.userTargetId) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No user with id ${userCreationRequest.userTargetId} in transferInternToStaff with id ${userCreationRequest.id}`,
        });
    }

    const userBefore = await userMethods.getById(userCreationRequest.userTargetId);
    if (!userBefore) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No user with id ${userCreationRequest.userTargetId}`,
        });
    }
    const userUpdateValues: UpdateObjectExpression<DB, 'User'> = {};

    let location: Location | undefined;

    if (userCreationRequest.location && userBefore.location?.name !== userCreationRequest.location) {
        location = await locationMethods.findOrCreate(userCreationRequest.location);
        userUpdateValues.locationId = location.id;
    }

    const newSupervisorId =
        userCreationRequest.type === UserCreationRequestType.transferInside
            ? userCreationRequest.transferToSupervisorId
            : userCreationRequest.supervisorId;

    if (newSupervisorId && userBefore.supervisorId !== newSupervisorId) {
        userUpdateValues.supervisorId = newSupervisorId;
    }

    if (Object.values(userUpdateValues).length) {
        await db.updateTable('User').set(userUpdateValues).execute();
    }

    const newGroupId =
        userCreationRequest.type === UserCreationRequestType.transferInside
            ? userCreationRequest.transferToGroupId
            : userCreationRequest.groupId;

    const memberships = await userMethods.getMemberships(userBefore.id);
    const orgMembership = memberships.find((m) => m.group.organizational);
    if (newGroupId && newGroupId !== orgMembership?.groupId) {
        orgMembership?.groupId &&
            (await userMethods.removeFromGroup({ userId: userBefore.id, groupId: orgMembership.groupId }));

        const newMembership = await userMethods.addToGroup({
            userId: userBefore.id,
            groupId: newGroupId,
            percentage: orgMembership?.percentage || undefined,
        });

        if (userCreationRequest.title) {
            const role = await groupRoleMethods.getByName(userCreationRequest.title);

            role &&
                (await groupRoleMethods.addToMembership({
                    membershipId: newMembership.id,
                    type: 'existing',
                    id: role.id,
                }));

            !role &&
                (await groupRoleMethods.addToMembership({
                    membershipId: newMembership.id,
                    type: 'new',
                    name: userCreationRequest.title,
                }));
        }
    }

    await db
        .updateTable('SupplementalPosition')
        .where(
            'id',
            'in',
            userCreationRequest.supplementalPositions.map(({ id }) => id),
        )
        .set({ userId: userCreationRequest.userTargetId, status: 'ACTIVE' })
        .execute();

    const valuesEventBefore: Omit<HistoryEventsData['editUserOnScheduledRequest']['data'], 'id'> = {
        requestType: userCreationRequest.type || undefined,
        groupId: orgMembership?.groupId || undefined,
        role: orgMembership?.roles.map(({ name }) => name).join(', '),
        location: location?.name || undefined,
        supervisorId: userBefore.supervisorId || undefined,
    };

    const valuesEventAfter: Omit<HistoryEventsData['editUserOnScheduledRequest']['data'], 'id'> = {
        groupId: newGroupId || undefined,
        role: userCreationRequest.title || undefined,
        location: userCreationRequest.location || undefined,
        supervisorId: newSupervisorId || undefined,
    };

    if (userCreationRequest.type === UserCreationRequestType.transferInternToStaff) {
        valuesEventBefore.supplementalPositions = userBefore.supplementalPositions.map(
            ({ organizationUnitId, percentage, unitId, main }) => ({
                organizationUnitId,
                percentage: percentage / percentageMultiply,
                unitId: unitId || undefined,
                main,
            }),
        );
        valuesEventAfter.supplementalPositions = userCreationRequest.supplementalPositions.map(
            ({ organizationUnitId, percentage, unitId, main }) => ({
                organizationUnitId,
                percentage: percentage / percentageMultiply,
                unitId: unitId || undefined,
                main,
            }),
        );
    }
    const { before, after } = dropUnchangedValuesFromEvent(valuesEventBefore, valuesEventAfter);

    await historyEventMethods.create(
        { subsystem: 'Scheduled transfer edit user on request' },
        'editUserOnScheduledRequest',
        {
            userId: userBefore.id,
            groupId: undefined,
            before: { ...before, id: userCreationRequest.id },
            after: { ...after, id: userCreationRequest.id },
        },
    );
};

export const activateUserSupplementalPosition = async ({
    supplementalPositionId,
    userId,
}: JobDataMap['activateUserSupplementalPosition']) => {
    const position = await db
        .updateTable('SupplementalPosition')
        .where('id', '=', supplementalPositionId)
        .set({ userId, status: 'ACTIVE' })
        .returningAll()
        .executeTakeFirst();

    await historyEventMethods.create(
        { subsystem: 'Scheduled activating supplemental position' },
        'scheduledActivatingUserSupplementalPosition',
        {
            userId,
            groupId: undefined,
            before: undefined,
            after: {
                organizationUnitId: position?.organizationUnitId,
                supplementalPositionId,
            },
        },
    );
};
