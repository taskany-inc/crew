import { historyEventMethods } from '../../modules/historyEventMethods';
import { userCreationRequestsMethods } from '../../modules/userCreationRequestMethods';
import {
    createUserCreationRequestSchema,
    getUserCreationRequestListSchema,
    handleUserCreationRequest,
} from '../../modules/userCreationRequestSchemas';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
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
            },
        });

        return creationRequest;
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
