import { historyEventMethods } from '../../modules/historyEventMethods';
import { userCreationRequestsMethods } from '../../modules/userCreationRequestMethods';
import {
    createUserCreationRequestSchema,
    editUserCreationRequestSchema,
    getUserCreationRequestListSchema,
    handleUserCreationRequest,
} from '../../modules/userCreationRequestSchemas';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { protectedProcedure, router } from '../trpcBackend';

export const userCreationRequestRouter = router({
    create: protectedProcedure.input(createUserCreationRequestSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'createUser'));

        const creationRequest = await userCreationRequestsMethods.create(input, ctx.session.user.id);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'createUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                ...creationRequest,
                type: creationRequest.type || undefined,
                corporateEmail: creationRequest.corporateEmail || undefined,
                title: creationRequest.title || undefined,
                osPreference: creationRequest.osPreference || undefined,
                status: null,
                services: creationRequest.services as Record<'serviceName' | 'serviceId', string>[],
                date: creationRequest.date?.toISOString(),
                createExternalAccount: creationRequest.createExternalAccount,
                externalOrganizationSupervisorLogin: creationRequest.externalOrganizationSupervisorLogin || undefined,
                accessToInternalSystems: creationRequest.accessToInternalSystems || undefined,
                comment: creationRequest.comment || undefined,
                creationCause: creationRequest.creationCause || undefined,
                location: creationRequest.location || undefined,
                workMode: creationRequest.workMode || undefined,
                workModeComment: creationRequest.workModeComment || undefined,
                workSpace: creationRequest.workSpace || undefined,
                equipment: creationRequest.equipment || undefined,
                extraEquipment: creationRequest.extraEquipment || undefined,
                buddyLogin: creationRequest.buddyLogin || undefined,
                recruiterLogin: creationRequest.recruiterLogin || undefined,
                coordinatorLogin: creationRequest.coordinatorLogin || undefined,
                supplementalPositions: creationRequest.supplementalPositions.length
                    ? creationRequest.supplementalPositions.map(({ organizationUnitId, percentage }) => ({
                          organizationUnitId,
                          percentage,
                      }))
                    : undefined,
            },
        });

        return creationRequest;
    }),

    edit: protectedProcedure.input(editUserCreationRequestSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserCreationRequests'));
        const userCreationRequestBefore = await userCreationRequestsMethods.getById(input.id);

        const userCreationRequestAfter = await userCreationRequestsMethods.edit(
            input,
            userCreationRequestBefore,
            ctx.session.user.id,
        );
        const servicesBefore = userCreationRequestBefore.services as { serviceId: string; serviceName: string }[];

        const phoneBefore = servicesBefore.find((service) => service.serviceName === 'Phone')?.serviceId;

        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: userCreationRequestBefore.name,
                email: userCreationRequestBefore.email,
                phone: phoneBefore,
                date: userCreationRequestBefore.date?.toISOString(),
            },
            {
                name: userCreationRequestAfter.name,
                email: userCreationRequestAfter.email,
                phone: input.phone,
                date: userCreationRequestAfter.date?.toISOString(),
            },
        );

        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: { ...before, id: userCreationRequestBefore.id },
            after: { ...after, id: userCreationRequestAfter.id },
        });

        return userCreationRequestAfter;
    }),

    decline: protectedProcedure.input(handleUserCreationRequest).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserCreationRequests'));

        const declinedUserRequest = await userCreationRequestsMethods.decline(input);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'declineUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                id: declinedUserRequest.id,
                name: declinedUserRequest.name,
                email: declinedUserRequest.email,
                comment: input.comment,
            },
        });

        return declinedUserRequest;
    }),

    accept: protectedProcedure.input(handleUserCreationRequest).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserCreationRequests'));

        const acceptedRequest = await userCreationRequestsMethods.accept(input);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'acceptUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                id: acceptedRequest.id,
                name: acceptedRequest.name,
                email: acceptedRequest.email,
                comment: input.comment,
            },
        });

        return acceptedRequest;
    }),

    getList: protectedProcedure.input(getUserCreationRequestListSchema).query(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserCreationRequests'));
        return userCreationRequestsMethods.getList(input);
    }),
});
