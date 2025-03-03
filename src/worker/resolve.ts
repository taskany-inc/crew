import { historyEventMethods } from '../modules/historyEventMethods';
import { userMethods } from '../modules/userMethods';
import { userCreationRequestsMethods } from '../modules/userCreationRequestMethods';
import { prisma } from '../utils/prisma';
import { ExternalServiceName, findService } from '../utils/externalServices';
import { db } from '../utils/db';

import { JobDataMap } from './create';

export const scheduledDeactivation = async ({ userId }: JobDataMap['scheduledDeactivation']) => {
    await userMethods.editActiveState({ id: userId, active: false });
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
            organizationalUnitId: user.organizationUnitId || undefined,
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
            organizationalUnitId: user.organizationUnitId || undefined,
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

export const activateSupplementalPositions = async ({
    userCreationRequestId,
}: JobDataMap['activateSupplementalPositions']) => {
    const userCreationRequest = await userCreationRequestsMethods.getById(userCreationRequestId);

    await db
        .updateTable('SupplementalPosition')
        .where(
            'id',
            'in',
            userCreationRequest.supplementalPositions.map(({ id }) => id),
        )
        .set({ userId: userCreationRequest.userTargetId, status: 'ACTIVE' })
        .execute();

    // TODO history record
};
