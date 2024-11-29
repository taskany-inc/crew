import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { historyEventMethods } from '../../modules/historyEventMethods';
import { userCreationRequestsMethods } from '../../modules/userCreationRequestMethods';
import {
    createUserCreationRequestSchema,
    editUserCreationRequestSchema,
    getUserCreationRequestListSchema,
    handleUserCreationRequest,
    userDecreeEditSchema,
    userDecreeSchema,
} from '../../modules/userCreationRequestSchemas';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { processEvent } from '../../utils/analyticsEvent';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { protectedProcedure, router } from '../trpcBackend';

import { tr } from './router.i18n';

const checkRequestTypeAccess = (types: Array<{ type: string; forbidden: boolean }>) =>
    types.forEach(({ type, forbidden }) => {
        if (forbidden) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: tr('No rights to edit {type} request', { type }),
            });
        }
    });

export const userCreationRequestRouter = router({
    create: protectedProcedure.input(createUserCreationRequestSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'createExternalFromMainUserRequest'),
            checkRoleForAccess(ctx.session.user.role, 'createExternalUserRequest'),
            checkRoleForAccess(ctx.session.user.role, 'createInternalUserRequest'),
        );

        checkRequestTypeAccess([
            {
                type: 'internalEmployee',
                forbidden: input.type === 'internalEmployee' && !ctx.session.user.role?.createInternalUserRequest,
            },
            {
                type: 'externalEmployee',
                forbidden: input.type === 'externalEmployee' && !ctx.session.user.role?.createExternalUserRequest,
            },
            {
                type: 'externalFromMainOrgEmployee',
                forbidden:
                    input.type === 'externalFromMainOrgEmployee' &&
                    !ctx.session.user.role?.createExternalFromMainUserRequest,
            },
        ]);

        const creationRequest = await userCreationRequestsMethods.create(input, ctx.session.user.id);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'createUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                ...creationRequest,
                groupId: creationRequest.groupId || undefined,
                supervisorLogin: creationRequest.supervisorLogin || undefined,
                supervisorId: creationRequest.supervisorId || undefined,
                buddyId: creationRequest.buddyId || undefined,
                coordinatorId: creationRequest.coordinatorId || undefined,
                coordinatorIds: creationRequest.coordinators.length
                    ? creationRequest.coordinators.map(({ id }) => id).join(', ')
                    : undefined,
                recruiterId: creationRequest.recruiterId || undefined,
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
                coordinatorLogins: creationRequest.coordinators.length
                    ? creationRequest.coordinators.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerLogins: creationRequest.lineManagers.length
                    ? creationRequest.lineManagers.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerIds: creationRequest.lineManagers.length
                    ? creationRequest.lineManagers.map(({ id }) => id).join(', ')
                    : undefined,
                supplementalPositions: creationRequest.supplementalPositions.length
                    ? creationRequest.supplementalPositions.map(({ organizationUnitId, percentage, unitId }) => ({
                          organizationUnitId,
                          percentage,
                          unitId: unitId || '',
                      }))
                    : undefined,
                unitId: creationRequest.unitId || undefined,
                workEmail: creationRequest.workEmail || undefined,
                personalEmail: creationRequest.personalEmail || undefined,
                reasonToGrantPermissionToServices: creationRequest.reasonToGrantPermissionToServices || undefined,
                curatorLogins: creationRequest.curators.length
                    ? creationRequest.curators.map(({ login }) => login).join(', ')
                    : undefined,
                curatorIds: creationRequest.curators.length
                    ? creationRequest.curators.map(({ id }) => id).join(', ')
                    : undefined,
                permissionServices: creationRequest.permissionServices.length
                    ? creationRequest.permissionServices.map(({ name }) => name).join(', ')
                    : undefined,
            },
        });

        processEvent({
            eventType: 'userRequestCreate',
            url: ctx.headers.referer || '',
            session: ctx.session,
            uaHeader: ctx.headers['user-agent'],
            additionalData: {
                id: creationRequest.id,
            },
        });

        return creationRequest;
    }),

    createDecreeRequest: protectedProcedure.input(userDecreeSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserActiveState'));

        const creationRequest = await userCreationRequestsMethods.createDecreeRequest(input, ctx.session.user.id);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'createUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                ...creationRequest,
                groupId: creationRequest.groupId || undefined,
                supervisorLogin: creationRequest.supervisorLogin || undefined,
                supervisorId: creationRequest.supervisorId || undefined,
                buddyId: creationRequest.buddyId || undefined,
                coordinatorId: creationRequest.coordinatorId || undefined,
                coordinatorIds: creationRequest.coordinators.length
                    ? creationRequest.coordinators.map(({ id }) => id).join(', ')
                    : undefined,
                recruiterId: creationRequest.recruiterId || undefined,
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
                coordinatorLogins: creationRequest.coordinators.length
                    ? creationRequest.coordinators.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerLogins: creationRequest.lineManagers.length
                    ? creationRequest.lineManagers.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerIds: creationRequest.lineManagers.length
                    ? creationRequest.lineManagers.map(({ id }) => id).join(', ')
                    : undefined,
                supplementalPositions: creationRequest.supplementalPositions.length
                    ? creationRequest.supplementalPositions.map(({ organizationUnitId, percentage, unitId }) => ({
                          organizationUnitId,
                          percentage,
                          unitId: unitId || '',
                      }))
                    : undefined,
                unitId: creationRequest.unitId || undefined,
                workEmail: creationRequest.workEmail || undefined,
                personalEmail: creationRequest.personalEmail || undefined,
                reasonToGrantPermissionToServices: creationRequest.reasonToGrantPermissionToServices || undefined,
                curatorLogins: creationRequest.curators.length
                    ? creationRequest.curators.map(({ login }) => login).join(', ')
                    : undefined,
                curatorIds: creationRequest.curators.length
                    ? creationRequest.curators.map(({ id }) => id).join(', ')
                    : undefined,
                permissionServices: creationRequest.permissionServices.length
                    ? creationRequest.permissionServices.map(({ name }) => name).join(', ')
                    : undefined,
            },
        });

        return creationRequest;
    }),

    edit: protectedProcedure.input(editUserCreationRequestSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editExternalFromMainUserRequest'),
            checkRoleForAccess(ctx.session.user.role, 'editExternalUserRequest'),
            checkRoleForAccess(ctx.session.user.role, 'editInternalUserRequest'),
        );

        checkRequestTypeAccess([
            {
                type: 'internalEmployee',
                forbidden: input.data.type === 'internalEmployee' && !ctx.session.user.role?.editInternalUserRequest,
            },
            {
                type: 'externalEmployee',
                forbidden: input.data.type === 'externalEmployee' && !ctx.session.user.role?.editExternalUserRequest,
            },
            {
                type: 'externalFromMainOrgEmployee',
                forbidden:
                    input.data.type === 'externalFromMainOrgEmployee' &&
                    !ctx.session.user.role?.editExternalFromMainUserRequest,
            },
        ]);

        const userCreationRequestBefore = await userCreationRequestsMethods.getById(input.id);

        const userCreationRequestAfter = await userCreationRequestsMethods.edit(
            input,
            userCreationRequestBefore,
            ctx.session.user.id,
        );

        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: userCreationRequestBefore.name,
                email: userCreationRequestBefore.email,
                login: userCreationRequestBefore.login,
                date: userCreationRequestBefore.date?.toISOString(),
                groupId: userCreationRequestBefore.groupId || undefined,
                supervisorLogin: userCreationRequestBefore.supervisorLogin || undefined,
                supervisorId: userCreationRequestBefore.supervisorId || undefined,
                buddyId: userCreationRequestBefore.buddyId || undefined,
                coordinatorId: userCreationRequestBefore.coordinatorId || undefined,
                coordinatorIds: userCreationRequestBefore.coordinators.length
                    ? userCreationRequestBefore.coordinators.map(({ id }) => id).join(', ')
                    : undefined,
                recruiterId: userCreationRequestBefore.recruiterId || undefined,
                type: userCreationRequestBefore.type || undefined,
                corporateEmail: userCreationRequestBefore.corporateEmail || undefined,
                title: userCreationRequestBefore.title || undefined,
                osPreference: userCreationRequestBefore.osPreference || undefined,
                status: null,
                services: userCreationRequestBefore.services as Record<'serviceName' | 'serviceId', string>[],
                createExternalAccount: userCreationRequestBefore.createExternalAccount,
                accessToInternalSystems: userCreationRequestBefore.accessToInternalSystems || undefined,
                comment: userCreationRequestBefore.comment || undefined,
                creationCause: userCreationRequestBefore.creationCause || undefined,
                location: userCreationRequestBefore.location || undefined,
                workMode: userCreationRequestBefore.workMode || undefined,
                workModeComment: userCreationRequestBefore.workModeComment || undefined,
                workSpace: userCreationRequestBefore.workSpace || undefined,
                equipment: userCreationRequestBefore.equipment || undefined,
                extraEquipment: userCreationRequestBefore.extraEquipment || undefined,
                buddyLogin: userCreationRequestBefore.buddyLogin || undefined,
                recruiterLogin: userCreationRequestBefore.recruiterLogin || undefined,
                coordinatorLogin: userCreationRequestBefore.coordinatorLogin || undefined,
                coordinatorLogins: userCreationRequestBefore.coordinators.length
                    ? userCreationRequestBefore.coordinators.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerLogins: userCreationRequestBefore.lineManagers.length
                    ? userCreationRequestBefore.lineManagers.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerIds: userCreationRequestBefore.lineManagers.length
                    ? userCreationRequestBefore.lineManagers.map(({ id }) => id).join(', ')
                    : undefined,
                supplementalPositions: userCreationRequestBefore.supplementalPositions.length
                    ? userCreationRequestBefore.supplementalPositions.map(
                          ({ organizationUnitId, percentage, unitId }) => ({
                              organizationUnitId,
                              percentage,
                              unitId: unitId || '',
                          }),
                      )
                    : undefined,
                unitId: userCreationRequestBefore.unitId || undefined,
                workEmail: userCreationRequestBefore.workEmail || undefined,
                personalEmail: userCreationRequestBefore.personalEmail || undefined,
                reasonToGrantPermissionToServices:
                    userCreationRequestBefore.reasonToGrantPermissionToServices || undefined,
                curatorLogins: userCreationRequestBefore.curators.length
                    ? userCreationRequestBefore.curators.map(({ login }) => login).join(', ')
                    : undefined,
                curatorIds: userCreationRequestBefore.curators.length
                    ? userCreationRequestBefore.curators.map(({ id }) => id).join(', ')
                    : undefined,
                permissionServices: userCreationRequestBefore.permissionServices.length
                    ? userCreationRequestBefore.permissionServices.map(({ name }) => name).join(', ')
                    : undefined,
                organizationUnitId: userCreationRequestBefore.organizationUnitId,
                attachFilenames: userCreationRequestBefore.attaches
                    .filter(({ deletedAt }) => !deletedAt)
                    .map(({ filename }) => filename)
                    .join(', '),
            },
            {
                name: userCreationRequestAfter.name,
                email: userCreationRequestAfter.email,
                login: userCreationRequestAfter.login,
                date: userCreationRequestAfter.date?.toISOString(),
                groupId: userCreationRequestAfter.groupId || undefined,
                supervisorLogin: userCreationRequestAfter.supervisorLogin || undefined,
                supervisorId: userCreationRequestAfter.supervisorId || undefined,
                buddyId: userCreationRequestAfter.buddyId || undefined,
                coordinatorId: userCreationRequestAfter.coordinatorId || undefined,
                coordinatorIds: userCreationRequestAfter.coordinators.length
                    ? userCreationRequestAfter.coordinators.map(({ id }) => id).join(', ')
                    : undefined,
                recruiterId: userCreationRequestAfter.recruiterId || undefined,
                type: userCreationRequestAfter.type || undefined,
                corporateEmail: userCreationRequestAfter.corporateEmail || undefined,
                title: userCreationRequestAfter.title || undefined,
                osPreference: userCreationRequestAfter.osPreference || undefined,
                status: null,
                services: userCreationRequestAfter.services as Record<'serviceName' | 'serviceId', string>[],
                createExternalAccount: userCreationRequestAfter.createExternalAccount,
                accessToInternalSystems: userCreationRequestAfter.accessToInternalSystems || undefined,
                comment: userCreationRequestAfter.comment || undefined,
                creationCause: userCreationRequestAfter.creationCause || undefined,
                location: userCreationRequestAfter.location || undefined,
                workMode: userCreationRequestAfter.workMode || undefined,
                workModeComment: userCreationRequestAfter.workModeComment || undefined,
                workSpace: userCreationRequestAfter.workSpace || undefined,
                equipment: userCreationRequestAfter.equipment || undefined,
                extraEquipment: userCreationRequestAfter.extraEquipment || undefined,
                buddyLogin: userCreationRequestAfter.buddyLogin || undefined,
                recruiterLogin: userCreationRequestAfter.recruiterLogin || undefined,
                coordinatorLogin: userCreationRequestAfter.coordinatorLogin || undefined,
                coordinatorLogins: userCreationRequestAfter.coordinators.length
                    ? userCreationRequestAfter.coordinators.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerLogins: userCreationRequestAfter.lineManagers.length
                    ? userCreationRequestAfter.lineManagers.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerIds: userCreationRequestAfter.lineManagers.length
                    ? userCreationRequestAfter.lineManagers.map(({ id }) => id).join(', ')
                    : undefined,
                supplementalPositions: userCreationRequestAfter.supplementalPositions.length
                    ? userCreationRequestAfter.supplementalPositions.map(
                          ({ organizationUnitId, percentage, unitId }) => ({
                              organizationUnitId,
                              percentage,
                              unitId: unitId || '',
                          }),
                      )
                    : undefined,
                unitId: userCreationRequestAfter.unitId || undefined,
                workEmail: userCreationRequestAfter.workEmail || undefined,
                personalEmail: userCreationRequestAfter.personalEmail || undefined,
                reasonToGrantPermissionToServices:
                    userCreationRequestAfter.reasonToGrantPermissionToServices || undefined,
                curatorLogins: userCreationRequestAfter.curators.length
                    ? userCreationRequestAfter.curators.map(({ login }) => login).join(', ')
                    : undefined,
                curatorIds: userCreationRequestAfter.curators.length
                    ? userCreationRequestAfter.curators.map(({ id }) => id).join(', ')
                    : undefined,
                permissionServices: userCreationRequestAfter.permissionServices.length
                    ? userCreationRequestAfter.permissionServices.map(({ name }) => name).join(', ')
                    : undefined,
                organizationUnitId: userCreationRequestAfter.organizationUnitId,
                attachFilenames: userCreationRequestAfter.attaches
                    .filter(({ deletedAt }) => !deletedAt)
                    .map(({ filename }) => filename)
                    .join(', '),
            },
        );

        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: { ...before, id: userCreationRequestBefore.id, type: userCreationRequestAfter.type ?? undefined },
            after: { ...after, id: userCreationRequestAfter.id, type: userCreationRequestAfter.type ?? undefined },
        });

        return userCreationRequestAfter;
    }),

    editDecree: protectedProcedure.input(userDecreeEditSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'createUser'));
        const userCreationRequestBefore = await userCreationRequestsMethods.getById(input.id);

        const userCreationRequestAfter = await userCreationRequestsMethods.editDecree(
            input,
            userCreationRequestBefore,
            ctx.session.user.id,
        );

        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: userCreationRequestBefore.name,
                email: userCreationRequestBefore.email,
                login: userCreationRequestBefore.login,
                date: userCreationRequestBefore.date?.toISOString(),
                groupId: userCreationRequestBefore.groupId || undefined,
                supervisorLogin: userCreationRequestBefore.supervisorLogin || undefined,
                supervisorId: userCreationRequestBefore.supervisorId || undefined,
                buddyId: userCreationRequestBefore.buddyId || undefined,
                coordinatorId: userCreationRequestBefore.coordinatorId || undefined,
                coordinatorIds: userCreationRequestBefore.coordinators.length
                    ? userCreationRequestBefore.coordinators.map(({ id }) => id).join(', ')
                    : undefined,
                recruiterId: userCreationRequestBefore.recruiterId || undefined,
                type: userCreationRequestBefore.type || undefined,
                corporateEmail: userCreationRequestBefore.corporateEmail || undefined,
                title: userCreationRequestBefore.title || undefined,
                osPreference: userCreationRequestBefore.osPreference || undefined,
                status: null,
                createExternalAccount: userCreationRequestBefore.createExternalAccount,
                accessToInternalSystems: userCreationRequestBefore.accessToInternalSystems || undefined,
                comment: userCreationRequestBefore.comment || undefined,
                creationCause: userCreationRequestBefore.creationCause || undefined,
                location: userCreationRequestBefore.location || undefined,
                workMode: userCreationRequestBefore.workMode || undefined,
                workModeComment: userCreationRequestBefore.workModeComment || undefined,
                workSpace: userCreationRequestBefore.workSpace || undefined,
                equipment: userCreationRequestBefore.equipment || undefined,
                extraEquipment: userCreationRequestBefore.extraEquipment || undefined,
                buddyLogin: userCreationRequestBefore.buddyLogin || undefined,
                recruiterLogin: userCreationRequestBefore.recruiterLogin || undefined,
                coordinatorLogin: userCreationRequestBefore.coordinatorLogin || undefined,
                coordinatorLogins: userCreationRequestBefore.coordinators.length
                    ? userCreationRequestBefore.coordinators.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerLogins: userCreationRequestBefore.lineManagers.length
                    ? userCreationRequestBefore.lineManagers.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerIds: userCreationRequestBefore.lineManagers.length
                    ? userCreationRequestBefore.lineManagers.map(({ id }) => id).join(', ')
                    : undefined,
                supplementalPositions: userCreationRequestBefore.supplementalPositions.length
                    ? userCreationRequestBefore.supplementalPositions.map(
                          ({ organizationUnitId, percentage, unitId }) => ({
                              organizationUnitId,
                              percentage,
                              unitId: unitId || '',
                          }),
                      )
                    : undefined,
                unitId: userCreationRequestBefore.unitId || undefined,
                workEmail: userCreationRequestBefore.workEmail || undefined,
                personalEmail: userCreationRequestBefore.personalEmail || undefined,
                reasonToGrantPermissionToServices:
                    userCreationRequestBefore.reasonToGrantPermissionToServices || undefined,
                curatorLogins: userCreationRequestBefore.curators.length
                    ? userCreationRequestBefore.curators.map(({ login }) => login).join(', ')
                    : undefined,
                curatorIds: userCreationRequestBefore.curators.length
                    ? userCreationRequestBefore.curators.map(({ id }) => id).join(', ')
                    : undefined,
                organizationUnitId: userCreationRequestBefore.organizationUnitId,
                attachFilenames: userCreationRequestBefore.attaches
                    .filter(({ deletedAt }) => !deletedAt)
                    .map(({ filename }) => filename)
                    .join(', '),
            },
            {
                name: userCreationRequestAfter.name,
                email: userCreationRequestAfter.email,
                login: userCreationRequestAfter.login,
                date: userCreationRequestAfter.date?.toISOString(),
                groupId: userCreationRequestAfter.groupId || undefined,
                supervisorLogin: userCreationRequestAfter.supervisorLogin || undefined,
                supervisorId: userCreationRequestAfter.supervisorId || undefined,
                buddyId: userCreationRequestAfter.buddyId || undefined,
                coordinatorId: userCreationRequestAfter.coordinatorId || undefined,
                coordinatorIds: userCreationRequestAfter.coordinators.length
                    ? userCreationRequestAfter.coordinators.map(({ id }) => id).join(', ')
                    : undefined,
                recruiterId: userCreationRequestAfter.recruiterId || undefined,
                type: userCreationRequestAfter.type || undefined,
                corporateEmail: userCreationRequestAfter.corporateEmail || undefined,
                title: userCreationRequestAfter.title || undefined,
                osPreference: userCreationRequestAfter.osPreference || undefined,
                status: null,
                createExternalAccount: userCreationRequestAfter.createExternalAccount,
                accessToInternalSystems: userCreationRequestAfter.accessToInternalSystems || undefined,
                comment: userCreationRequestAfter.comment || undefined,
                creationCause: userCreationRequestAfter.creationCause || undefined,
                location: userCreationRequestAfter.location || undefined,
                workMode: userCreationRequestAfter.workMode || undefined,
                workModeComment: userCreationRequestAfter.workModeComment || undefined,
                workSpace: userCreationRequestAfter.workSpace || undefined,
                equipment: userCreationRequestAfter.equipment || undefined,
                extraEquipment: userCreationRequestAfter.extraEquipment || undefined,
                buddyLogin: userCreationRequestAfter.buddyLogin || undefined,
                recruiterLogin: userCreationRequestAfter.recruiterLogin || undefined,
                coordinatorLogin: userCreationRequestAfter.coordinatorLogin || undefined,
                coordinatorLogins: userCreationRequestAfter.coordinators.length
                    ? userCreationRequestAfter.coordinators.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerLogins: userCreationRequestAfter.lineManagers.length
                    ? userCreationRequestAfter.lineManagers.map(({ login }) => login).join(', ')
                    : undefined,
                lineManagerIds: userCreationRequestAfter.lineManagers.length
                    ? userCreationRequestAfter.lineManagers.map(({ id }) => id).join(', ')
                    : undefined,
                supplementalPositions: userCreationRequestAfter.supplementalPositions.length
                    ? userCreationRequestAfter.supplementalPositions.map(
                          ({ organizationUnitId, percentage, unitId }) => ({
                              organizationUnitId,
                              percentage,
                              unitId: unitId || '',
                          }),
                      )
                    : undefined,
                unitId: userCreationRequestAfter.unitId || undefined,
                workEmail: userCreationRequestAfter.workEmail || undefined,
                personalEmail: userCreationRequestAfter.personalEmail || undefined,
                reasonToGrantPermissionToServices:
                    userCreationRequestAfter.reasonToGrantPermissionToServices || undefined,
                curatorLogins: userCreationRequestAfter.curators.length
                    ? userCreationRequestAfter.curators.map(({ login }) => login).join(', ')
                    : undefined,
                curatorIds: userCreationRequestAfter.curators.length
                    ? userCreationRequestAfter.curators.map(({ id }) => id).join(', ')
                    : undefined,
                organizationUnitId: userCreationRequestAfter.organizationUnitId,
                attachFilenames: userCreationRequestAfter.attaches
                    .filter(({ deletedAt }) => !deletedAt)
                    .map(({ filename }) => filename)
                    .join(', '),
            },
        );

        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: { ...before, id: userCreationRequestBefore.id, type: userCreationRequestAfter.type ?? undefined },
            after: { ...after, id: userCreationRequestAfter.id, type: userCreationRequestAfter.type ?? undefined },
        });

        return userCreationRequestAfter;
    }),

    decline: protectedProcedure.input(handleUserCreationRequest).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'decideOnUserCreationRequest'));

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
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'decideOnUserCreationRequest'));

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
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'readManyExternalFromMainUserRequests'),
            checkRoleForAccess(ctx.session.user.role, 'readManyExternalUserRequests'),
            checkRoleForAccess(ctx.session.user.role, 'readManyInternalUserRequests'),
        );
        {
            const allowedTypes: string[] = [];
            if (ctx.session.user.role?.readManyExternalFromMainUserRequests) {
                allowedTypes.push('externalFromMainOrgEmployee');
            }

            if (ctx.session.user.role?.readManyExternalUserRequests) {
                allowedTypes.push('externalEmployee');
            }

            if (ctx.session.user.role?.readManyInternalUserRequests) {
                allowedTypes.push('internalEmployee');
            }
            return userCreationRequestsMethods.getList({ ...input, type: allowedTypes });
        }
    }),

    getById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'readManyExternalFromMainUserRequests'),
            checkRoleForAccess(ctx.session.user.role, 'readManyExternalUserRequests'),
            checkRoleForAccess(ctx.session.user.role, 'readManyInternalUserRequests'),
        );
        return userCreationRequestsMethods.getById(input);
    }),

    cancel: protectedProcedure.input(handleUserCreationRequest).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editExternalFromMainUserRequest'),
            checkRoleForAccess(ctx.session.user.role, 'editExternalUserRequest'),
            checkRoleForAccess(ctx.session.user.role, 'editInternalUserRequest'),
        );

        const requestBeforeCancelling = await userCreationRequestsMethods.getById(input.id);
        checkRequestTypeAccess([
            {
                type: 'internalEmployee',
                forbidden:
                    requestBeforeCancelling.type === 'internalEmployee' &&
                    !ctx.session.user.role?.editInternalUserRequest,
            },
            {
                type: 'externalEmployee',
                forbidden:
                    requestBeforeCancelling.type === 'externalEmployee' &&
                    !ctx.session.user.role?.editExternalUserRequest,
            },
            {
                type: 'externalFromMainOrgEmployee',
                forbidden:
                    requestBeforeCancelling.type === 'externalFromMainOrgEmployee' &&
                    !ctx.session.user.role?.editExternalFromMainUserRequest,
            },
        ]);

        const cancelledUserRequest = await userCreationRequestsMethods.cancel(input, ctx.session.user.id);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'cancelUserCreationRequest', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                id: cancelledUserRequest.id,
                name: cancelledUserRequest.name,
                email: cancelledUserRequest.email,
                comment: input.comment,
                type: cancelledUserRequest.type ?? undefined,
            },
        });

        return cancelledUserRequest;
    }),

    getRequestForExternalEmployeeById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'readManyExternalUserRequests'));
        return userCreationRequestsMethods.getRequestForExternalEmployeeById(input);
    }),

    getRequestForExternalFromMainEmployeeById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'readManyExternalFromMainUserRequests'));
        return userCreationRequestsMethods.getRequestForExternalFromMainEmployeeById(input);
    }),
    getRequestForInternalEmployeeById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'readManyInternalUserRequests'));
        return userCreationRequestsMethods.getRequestForInternalEmployeeById(input);
    }),

    getDecreeRequestById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editUserCreationRequests'),
            checkRoleForAccess(ctx.session.user.role, 'createUser'),
        );
        return userCreationRequestsMethods.getDecreeRequestById(input);
    }),
});
