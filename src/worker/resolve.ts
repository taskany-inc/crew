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

export const transferInternToStaff = async ({ userCreationRequestId }: JobDataMap['transferInternToStaff']) => {
    const userCreationRequest = await userCreationRequestsMethods.getById(userCreationRequestId);

    if (!userCreationRequest.userTargetId) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No user with id ${userCreationRequest.userTargetId} in transferInternToStaff with id ${userCreationRequest.id}`,
        });
    }

    const user = await userMethods.getById(userCreationRequest.userTargetId);
    if (!user) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No user with id ${userCreationRequest.userTargetId}`,
        });
    }
    const userUpdateValues: UpdateObjectExpression<DB, 'User'> = {};

    let location: Location | undefined;

    if (userCreationRequest.location && user.location?.name !== userCreationRequest.location) {
        location = await locationMethods.findOrCreate(userCreationRequest.location);
        userUpdateValues.locationId = location.id;
    }

    if (userCreationRequest.supervisorId && user.supervisorId !== userCreationRequest.supervisorId) {
        userUpdateValues.supervisorId = userCreationRequest.supervisorId;
    }

    if (Object.values(userUpdateValues).length) {
        await db.updateTable('User').set(userUpdateValues).execute();
    }

    const memberships = await userMethods.getMemberships(user.id);
    const orgMembership = memberships.find((m) => m.group.organizational);
    if (userCreationRequest.groupId && userCreationRequest.groupId !== orgMembership?.groupId) {
        orgMembership?.groupId &&
            (await userMethods.removeFromGroup({ userId: user.id, groupId: orgMembership.groupId }));

        const newMembership = await userMethods.addToGroup({
            userId: user.id,
            groupId: userCreationRequest.groupId,
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

    const { before, after } = dropUnchangedValuesFromEvent(
        {
            groupId: orgMembership?.groupId,
            role: orgMembership?.roles.map(({ name }) => name).join(', '),
            location: location?.name,
            supervisorId: user.supervisorId,
            supplementalPositions: user.supplementalPositions.map(
                ({ organizationUnitId, percentage, unitId, main }) => ({
                    organizationUnitId,
                    percentage: percentage / percentageMultiply,
                    unitId: unitId || undefined,
                    main,
                }),
            ),
        },
        {
            groupId: userCreationRequest.groupId || undefined,
            role: userCreationRequest.title || undefined,
            location: userCreationRequest.location || undefined,
            supervisorId: userCreationRequest.supervisorId || undefined,
            supplementalPositions: userCreationRequest.supplementalPositions.map(
                ({ organizationUnitId, percentage, unitId, main }) => ({
                    organizationUnitId,
                    percentage: percentage / percentageMultiply,
                    unitId: unitId || undefined,
                    main,
                }),
            ),
        },
    );

    await historyEventMethods.create(
        { subsystem: 'Scheduled transfer intern to staff' },
        'scheduledTransferInternToStaff',
        {
            userId: user.id,
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

export const editUserOnTransfer = async ({ userCreationRequestId }: JobDataMap['editUserOnTransfer']) => {
    const userCreationRequest = await userCreationRequestsMethods.getById(userCreationRequestId);

    if (!userCreationRequest.userTargetId) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No user with id ${userCreationRequest.userTargetId} in transferInternToStaff with id ${userCreationRequest.id}`,
        });
    }

    const user = await userMethods.getById(userCreationRequest.userTargetId);
    if (!user) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No user with id ${userCreationRequest.userTargetId}`,
        });
    }

    if (!user.active) {
        await userMethods.editActiveState({ active: true, id: user.id });
    }

    const userUpdateValues: UpdateObjectExpression<DB, 'User'> = {};

    let location: Location | undefined;

    if (userCreationRequest.location && user.location?.name !== userCreationRequest.location) {
        location = await locationMethods.findOrCreate(userCreationRequest.location);
        userUpdateValues.locationId = location.id;
    }

    if (
        userCreationRequest.transferToSupervisorId &&
        user.supervisorId !== userCreationRequest.transferToSupervisorId
    ) {
        userUpdateValues.supervisorId = userCreationRequest.transferToSupervisorId;
    }

    if (Object.values(userUpdateValues).length) {
        await db.updateTable('User').set(userUpdateValues).execute();
    }

    const memberships = await userMethods.getMemberships(user.id);
    const orgMembership = memberships.find((m) => m.group.organizational);
    if (userCreationRequest.transferToGroupId && userCreationRequest.transferToGroupId !== orgMembership?.groupId) {
        orgMembership?.groupId &&
            (await userMethods.removeFromGroup({ userId: user.id, groupId: orgMembership.groupId }));

        const newMembership = await userMethods.addToGroup({
            userId: user.id,
            groupId: userCreationRequest.transferToGroupId,
            percentage: orgMembership?.percentage || undefined,
        });

        if (userCreationRequest.transferToTitle) {
            const role = await groupRoleMethods.getByName(userCreationRequest.transferToTitle);

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
                    name: userCreationRequest.transferToTitle,
                }));
        }
    }

    const { before, after } = dropUnchangedValuesFromEvent(
        {
            groupId: orgMembership?.groupId,
            role: orgMembership?.roles.map(({ name }) => name).join(', '),
            location: location?.name,
            supervisorId: user.supervisorId,
        },
        {
            groupId: userCreationRequest.groupId || undefined,
            role: userCreationRequest.title || undefined,
            location: userCreationRequest.location || undefined,
            supervisorId: userCreationRequest.supervisorId || undefined,
        },
    );

    await historyEventMethods.create({ subsystem: 'Scheduled transfer inside' }, 'scheduledTransferInside', {
        userId: user.id,
        groupId: undefined,
        before: { ...before, id: userCreationRequest.id },
        after: { ...after, id: userCreationRequest.id },
    });
};
