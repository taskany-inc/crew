import { z } from 'zod';
import { VacancyStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

import { prisma } from '../../utils/prisma';
import { restProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import { getUserByFieldSchema, userRestApiDataSchema } from '../../modules/userSchemas';
import { changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { groupMethods } from '../../modules/groupMethods';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { getVacancyListSchema } from '../../modules/vacancySchemas';
import { getAchievementListSchema, giveAchievementSchema } from '../../modules/achievementSchemas';
import { achievementMethods } from '../../modules/achievementMethods';
import { organizationUnitSearchTypes } from '../../modules/organizationUnitSchemas';
import { organizationUnitMethods } from '../../modules/organizationUnitMethods';
import { getServiceListSchema } from '../../modules/serviceSchemas';
import { serviceMethods } from '../../modules/serviceMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { searchMethods } from '../../modules/searchMethods';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { config } from '../../config';
import { ExternalServiceName } from '../../utils/externalServices';
import { db } from '../../utils/db';
import { createUserRequestDraftSchema } from '../../modules/userCreationRequestSchemas';
import { userCreationRequestsMethods } from '../../modules/userCreationRequestMethods';
import { PositionStatus, UserCreationRequestStatus } from '../../generated/kyselyTypes';
import { createJob } from '../../worker/create';
import { jobDelete } from '../../worker/jobOperations';

import { tr } from './router.i18n';

const userSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    login: z.string().nullable(),
    email: z.string(),
    active: z.boolean(),
    supervisorId: z.string().nullable(),
    bonusPoints: z.number(),
});

export const restRouter = router({
    getUserByField: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users/get-by-field',
                protect: true,
                summary: 'Get user by chosen field',
            },
        })
        .input(getUserByFieldSchema)
        .output(userRestApiDataSchema)
        .query(({ input }) => {
            return userMethods.getUserDataForRestApi(input);
        }),

    editUserByLogin: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/user/{login}',
                protect: true,
                summary: 'Update user by login',
            },
        })
        .input(
            z.object({
                login: z.string(),
                data: z.object({
                    name: z.string().optional(),
                    savePreviousName: z.boolean().optional(),
                    registrationEmail: z.string().optional(),
                    phone: z.string().optional(),
                    login: z.string().optional(),
                    workEmail: z.string().optional(),
                    position: z.string().optional(),
                    supervisorEmail: z.string().optional(),
                    externalGroupId: z.string().optional(),
                    location: z.string().optional(),
                }),
            }),
        )
        .output(userRestApiDataSchema)
        .query(async ({ input, ctx }) => {
            const user = await userMethods.getByLogin(input.login);

            let newSupervisor: Awaited<ReturnType<typeof userMethods.getUserByField>> | null = null;

            if (input.data.supervisorEmail && user.supervisor?.email !== input.data.supervisorEmail) {
                newSupervisor = await userMethods.getUserByField({ email: input.data.supervisorEmail });
            }

            const userSupplementalPositionsBeforeUpdate = user.supplementalPositions.filter(
                (position) => position.status === PositionStatus.ACTIVE,
            );

            const isPositionChanged = userSupplementalPositionsBeforeUpdate[0]?.role !== input.data.position;

            if (input.data.position && isPositionChanged) {
                await prisma.supplementalPosition.updateMany({
                    where: {
                        userId: user.id,
                        status: PositionStatus.ACTIVE,
                    },
                    data: {
                        role: input.data.position,
                    },
                });
            }

            const updatedUser = await userMethods.edit({
                id: user.id,
                email: input.data.workEmail,
                name: input.data.name,
                location: input.data.location,
                login: input.data.login,
                supervisorId: newSupervisor?.id,
                savePreviousName: input.data.savePreviousName,
            });

            const userServicesBeforeUpdate = await serviceMethods.getUserServices(user.id);

            const phoneBefore = userServicesBeforeUpdate.find(
                (service) => service.serviceName === ExternalServiceName.Phone,
            )?.serviceId;

            const personalEmailBefore = userServicesBeforeUpdate.find(
                (service) => service.serviceName === ExternalServiceName.PersonalEmail,
            )?.serviceId;

            const workEmailBefore = userServicesBeforeUpdate.find(
                (service) => service.serviceName === ExternalServiceName.WorkEmail,
            )?.serviceId;

            if (input.data.registrationEmail) {
                await serviceMethods.editUserService({
                    userId: user.id,
                    serviceName: ExternalServiceName.PersonalEmail,
                    serviceId: input.data.registrationEmail,
                });
            }

            if (input.data.phone) {
                await serviceMethods.editUserService({
                    userId: user.id,
                    serviceName: ExternalServiceName.Phone,
                    serviceId: input.data.phone,
                });
            }

            if (input.data.workEmail) {
                await serviceMethods.editUserService({
                    userId: user.id,
                    serviceName: ExternalServiceName.WorkEmail,
                    serviceId: input.data.workEmail,
                });
            }

            const { before, after } = dropUnchangedValuesFromEvent(
                {
                    name: user.name,
                    email: user.email,
                    login: user.login,
                    supervisorId: user.supervisorId,
                    supplementalPositions: isPositionChanged ? userSupplementalPositionsBeforeUpdate : null,
                    phone: phoneBefore,
                    personalEmail: personalEmailBefore,
                    workEmail: workEmailBefore,
                    location: user.location?.name,
                },
                {
                    name: updatedUser.name,
                    email: updatedUser.email,
                    login: updatedUser.login,
                    supervisorId: updatedUser.supervisorId,
                    supplementalPositions: isPositionChanged
                        ? updatedUser.supplementalPositions.filter(
                              (position) => position.status === PositionStatus.ACTIVE,
                          )
                        : null,
                    phone: input.data.phone ?? phoneBefore,
                    personalEmail: input.data.registrationEmail ?? personalEmailBefore,
                    workEmail: input.data.workEmail ?? workEmailBefore,
                    location: updatedUser.location?.name,
                },
            );

            if (Object.keys(before).length > 0 || Object.keys(after).length > 0) {
                await historyEventMethods.create({ token: ctx.apiTokenId }, 'editUser', {
                    groupId: undefined,
                    userId: user.id,
                    before,
                    after,
                });
            }

            return userMethods.getUserDataForRestApi({ id: user.id });
        }),

    getUserByLogin: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/user/{login}',
                protect: true,
                summary: 'Get user by login',
            },
        })
        .input(z.object({ login: z.string() }))
        .output(userRestApiDataSchema)
        .query(async ({ input }) => {
            return userMethods.getUserDataForRestApi(input);
        }),

    editActiveByLogin: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/user/{login}/edit-active',
                protect: true,
                summary: 'Activate/deactivate user by login',
            },
        })
        .input(z.object({ login: z.string(), data: z.object({ active: z.boolean() }) }))
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                login: z.string().nullable(),
                registrationEmail: z.string(),
                corporateEmail: z.string(),
                active: z.boolean(),
                supervisorLogin: z.string().nullish(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const user = await userMethods.getByLogin(input.login);

            let updatedUser: Awaited<ReturnType<typeof userMethods.editActiveState>> = user;
            if (user.active !== input.data.active) {
                updatedUser = await userMethods.editActiveState({
                    id: user.id,
                    active: input.data.active,
                    method: 'cloud-move',
                });

                await historyEventMethods.create({ token: ctx.apiTokenId }, 'editUserActiveState', {
                    groupId: undefined,
                    userId: user.id,
                    before: user.active,
                    after: input.data.active,
                });
            }

            return {
                id: updatedUser.id,
                name: updatedUser.name,
                login: updatedUser.login,
                registrationEmail: updatedUser.email,
                corporateEmail: getCorporateEmail(updatedUser.login),
                active: updatedUser.active,
                supervisorLogin: user.supervisor?.login,
            };
        }),

    globalSearchUsers: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/search/users',
                protect: true,
                summary: 'Global search users',
            },
        })
        .input(z.object({ query: z.string() }))
        .output(z.array(userSchema))
        .query(({ input }) => {
            const { query } = input;
            return searchMethods.globalUsers(query);
        }),

    editUserActiveState: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit-active',
                protect: true,
                summary: 'Activate/deactivate user by email',
                deprecated: true,
            },
        })
        .input(
            z.object({
                email: z.string(),
                active: z.boolean(),
            }),
        )
        .output(userSchema)
        .mutation(async ({ input, ctx }) => {
            const userBefore = await userMethods.getUserByField({ email: input.email });
            const result = await userMethods.editActiveState({
                id: userBefore.id,
                active: input.active,
                method: 'cloud-move',
            });
            if (userBefore.active !== result.active) {
                await historyEventMethods.create({ token: ctx.apiTokenId }, 'editUserActiveState', {
                    userId: result.id,
                    groupId: undefined,
                    before: userBefore.active,
                    after: result.active,
                });
            }
            return result;
        }),

    changeUserBonusPoints: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/bonus',
                protect: true,
                summary: 'Add/subtract bonus points from user',
            },
        })
        .input(
            changeBonusPointsSchema.omit({ userId: true }).extend({
                targetUserEmail: z.string(),
                actingUserEmail: z.string(),
            }),
        )
        .output(userSchema)
        .mutation(async ({ input, ctx }) => {
            const { actingUserEmail, targetUserEmail, ...restInput } = input;
            const targetUser = await userMethods.getUserByField({ email: targetUserEmail });
            const actingUser = await userMethods.getUserByField({ email: actingUserEmail });
            const result = await bonusPointsMethods.change({ userId: targetUser.id, ...restInput }, actingUser.id);
            await historyEventMethods.create({ token: ctx.apiTokenId }, 'editUserBonuses', {
                groupId: undefined,
                userId: result.id,
                before: { amount: targetUser.bonusPoints },
                after: { amount: result.bonusPoints, description: input.description },
            });
            return result;
        }),

    getGroupById: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/groups/info',
                protect: true,
                summary: 'Get groups by ids',
            },
        })
        .input(
            z.object({
                ids: z.array(z.string()),
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string().nullable(),
                    supervisor: z
                        .object({
                            id: z.string(),
                            name: z.string().nullable(),
                            email: z.string(),
                        })
                        .nullish(),
                    memberships: z.array(
                        z.object({
                            user: z.object({
                                id: z.string(),
                                name: z.string().nullable(),
                                email: z.string(),
                                image: z.string().nullable(),
                            }),
                            roles: z.array(
                                z.object({
                                    name: z.string(),
                                }),
                            ),
                            percentage: z.number().nullable(),
                        }),
                    ),
                }),
            ),
        )
        .mutation(async ({ input }) => {
            return groupMethods.getByIds(input.ids);
        }),

    getGroupList: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/groups/list',
                protect: true,
                summary: 'Get list of groups with filtering',
            },
        })
        .input(
            z.object({
                search: z.string().optional(),
                hasVacancies: z.boolean().optional(),
                filter: z.array(z.string()).optional(),
                take: z
                    .number()
                    .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
                    .optional(),
                skip: z.number().optional(),
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return groupMethods.getList(input);
        }),

    getVacancyById: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/vacancy/{id}',
                protect: true,
                summary: 'Get vacancy by id',
            },
        })
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string(),
                hireStreamId: z.string(),
                archived: z.boolean(),
                group: z.object({ name: z.string(), id: z.string() }),
                hr: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                hiringManager: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                status: z.nativeEnum(VacancyStatus),
                unit: z.number().nullable(),
                grade: z.number().nullable(),
            }),
        )
        .query(({ input }) => vacancyMethods.getById(input.id)),

    getVacancyList: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/vacancies/list',
                protect: true,
                summary: 'Get list of vacancies with filtering',
            },
        })
        .input(getVacancyListSchema)
        .output(
            z.object({
                vacancies: z.array(
                    z.object({
                        id: z.string(),
                        name: z.string(),
                        hireStreamId: z.string(),
                        archived: z.boolean(),
                        group: z.object({ name: z.string(), id: z.string() }),
                        hr: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                        hiringManager: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                        status: z.nativeEnum(VacancyStatus),
                        unit: z.number().nullable(),
                        grade: z.number().nullable(),
                        activeSince: z.date().nullable(),
                        closedAt: z.date().nullable(),
                        timeAtWork: z.number(),
                    }),
                ),
                count: z.number(),
                total: z.number(),
            }),
        )
        .query(({ input }) => vacancyMethods.getList(input)),

    updateVacancy: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/vacancy',
                protect: true,
                summary: 'Update vacancy by id',
            },
        })
        .input(
            z.object({
                id: z.string(),
                unit: z.number().optional(),
                status: z.nativeEnum(VacancyStatus).optional(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string(),
                hireStreamId: z.string(),
                archived: z.boolean(),
                group: z.object({ name: z.string(), id: z.string() }),
                hr: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                hiringManager: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                status: z.nativeEnum(VacancyStatus),
                unit: z.number().nullable(),
                grade: z.number().nullable(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const vacancyBefore = await vacancyMethods.getByIdOrThrow(input.id);
            const result = await vacancyMethods.edit(input);
            const { before, after } = dropUnchangedValuesFromEvent(
                {
                    status: vacancyBefore.status,
                    hiringManagerId: vacancyBefore.hiringManagerId,
                    hrId: vacancyBefore.hrId,
                    grade: vacancyBefore.grade,
                    unit: vacancyBefore.unit,
                },
                {
                    status: result.status,
                    hiringManagerId: result.hiringManagerId,
                    hrId: result.hrId,
                    grade: result.grade,
                    unit: result.unit,
                },
            );
            await historyEventMethods.create({ token: ctx.apiTokenId }, 'editVacancy', {
                groupId: result.groupId,
                userId: undefined,
                before: { id: result.id, name: vacancyBefore.name, ...before },
                after: { id: result.id, name: result.name, ...after },
            });
            return result;
        }),

    getAchievementList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/achievements/list',
                protect: true,
                summary: 'Get list of achievements with filtering',
            },
        })
        .input(getAchievementListSchema)
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    title: z.string(),
                    icon: z.string(),
                    description: z.string(),
                }),
            ),
        )
        .query(({ input }) => achievementMethods.getList(input)),

    giveAchievementForHireSections: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/achievements/sections',
                protect: true,
                summary: 'Give user crew achievement for hire sections',
            },
        })
        .input(
            giveAchievementSchema
                .omit({ userId: true, achievementTitle: true, achievementId: true, amount: true })
                .extend({
                    targetUserEmail: z.string(),
                    actingUserEmail: z.string(),
                    sectionsNumber: z.number(),
                }),
        )
        .output(z.string())
        .query(async ({ input, ctx }) => {
            const { actingUserEmail, targetUserEmail, sectionsNumber } = input;

            if (!config.sectionAchiementId || !config.sectionAmountForAchievement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No sectionAchiementId or sectionAmountForAchievement in crew config',
                });
            }

            const [targetUser, actingUser, achievement] = await Promise.all([
                userMethods.getUserByField({ email: targetUserEmail }),
                userMethods.getUserByField({ email: actingUserEmail }),
                achievementMethods.getById(config.sectionAchiementId),
            ]);

            if (sectionsNumber % Number(config.sectionAmountForAchievement) !== 0) {
                return 'Amount of completed sections is not evenly divisible by sectionAmountForAchievement';
            }

            const userAchievement = await prisma.userAchievement.findFirst({
                where: { userId: targetUser.id, achievementId: achievement.id },
            });

            const achievementCount = userAchievement ? userAchievement.count : 0;

            const amount = sectionsNumber / Number(config.sectionAmountForAchievement) - achievementCount;

            if (amount <= 0) return 'Not enough sections for achievement';

            await achievementMethods.give(
                {
                    achievementId: config.sectionAchiementId,
                    amount,
                    userId: targetUser.id,
                },
                actingUser.id,
            );
            await historyEventMethods.create({ token: ctx.apiTokenId }, 'giveAchievementToUser', {
                groupId: undefined,
                userId: targetUser.id,
                before: undefined,
                after: { id: achievement.id, title: achievement.title, amount },
            });
            return 'Achievement successfully given';
        }),

    giveCrewAchievement: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/achievements/give',
                protect: true,
                summary: 'Give user crew achievement',
            },
        })
        .input(
            giveAchievementSchema.omit({ userId: true, achievementTitle: true }).extend({
                targetUserEmail: z.string(),
                actingUserEmail: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { actingUserEmail, targetUserEmail, achievementId, amount } = input;
            const [targetUser, actingUser, achievement] = await Promise.all([
                userMethods.getUserByField({ email: targetUserEmail }),
                userMethods.getUserByField({ email: actingUserEmail }),
                achievementMethods.getById(achievementId),
            ]);
            const result = await achievementMethods.give(
                { achievementId, amount, userId: targetUser.id },
                actingUser.id,
            );
            await historyEventMethods.create({ token: ctx.apiTokenId }, 'giveAchievementToUser', {
                groupId: undefined,
                userId: targetUser.id,
                before: undefined,
                after: { id: achievement.id, title: achievement.title, amount: input.amount },
            });
            return result;
        }),

    getServiceList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/service/list',
                protect: true,
                summary: 'Get list of services with filtering',
            },
        })
        .input(getServiceListSchema)
        .output(
            z.array(
                z.object({
                    name: z.string(),
                    displayName: z.string().nullable(),
                    linkPrefix: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return serviceMethods.getList(input);
        }),

    getOrganizationUnitList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/org-unit/list',
                protect: true,
                summary: 'Get list of organizational units with filtering',
            },
        })
        .input(
            z.object({
                search: z.string().optional(),
                searchType: z.enum(organizationUnitSearchTypes).optional(),
                take: z
                    .number()
                    .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
                    .optional(),
                skip: z.number().optional(),
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    country: z.string(),
                    description: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return organizationUnitMethods.getList(input);
        }),

    getUserEmploymentInfo: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users/employment-info',
                protect: true,
                summary: 'Get employment info for active users',
            },
        })
        .input(z.void())
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    login: z.string().nullable(),
                    supervisor: z
                        .object({
                            id: z.string(),
                            name: z.string().nullable(),
                            login: z.string().nullable(),
                        })
                        .nullable(),
                    employment: z
                        .object({
                            groupId: z.string(),
                            groupName: z.string().nullable(),
                            roles: z.array(z.string()).nullable(),
                        })
                        .nullable(),
                }),
            ),
        )
        .query(async () => {
            const users = await db
                .selectFrom('User')
                .where('User.active', '=', true)
                .select((eb) => [
                    'User.id',
                    'User.name',
                    'User.login',
                    jsonObjectFrom(
                        eb
                            .selectFrom('User as s')
                            .whereRef('s.id', '=', 'User.supervisorId')
                            .select(['s.id', 's.name', 's.login']),
                    ).as('supervisor'),
                    jsonObjectFrom(
                        eb
                            .selectFrom('Membership as m')
                            .leftJoin('Group as g', 'm.groupId', 'g.id')
                            .leftJoin('_MembershipToRole as mtr', 'm.id', 'A')
                            .leftJoin('Role as r', 'mtr.B', 'r.id')
                            .where('g.organizational', '=', true)
                            .whereRef('m.userId', '=', 'User.id')
                            .select((eb) => [
                                'm.groupId',
                                'g.name as groupName',
                                eb.fn
                                    .agg<string[]>('array_agg', ['r.name'])
                                    .filterWhere('r.name', 'is not', null)
                                    .as('roles'),
                            ])
                            .groupBy(['m.groupId', 'g.name']),
                    ).as('employment'),
                ])
                .execute();
            return users;
        }),

    createUserRequest: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/user-requests/create',
                protect: true,
                summary: 'Create a new user creation request',
                description: 'Creates a new user creation request with the provided data',
            },
        })
        .input(createUserRequestDraftSchema)
        .output(
            z.object({
                id: z.string(),
                status: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const { organizations, ...rest } = input;
                const request = await userCreationRequestsMethods.createUserRequestDraft({
                    ...rest,
                    organizations: [
                        {
                            ...organizations[0],
                            main: true,
                        },
                    ],
                });

                await historyEventMethods.create({ token: ctx.apiTokenId }, 'createUserCreationRequest', {
                    groupId: undefined,
                    userId: undefined,
                    before: undefined,
                    after: {
                        id: request.id,
                        type: request.type || undefined,
                        status: UserCreationRequestStatus.Draft,
                        login: request.login,
                        email: request.email,
                        workEmail: request.workEmail || undefined,
                        name: request.name,
                        organizationUnitId: request.organizationUnitId,
                        supervisorId: request.supervisorId || undefined,
                        supervisorLogin: request.supervisorLogin || undefined,
                        title: request.title || undefined,
                        location: request.location || undefined,
                        date: request.date?.toISOString(),
                        creationCause: request.creationCause || undefined,
                        unitId: request.unitId || undefined,
                        groupId: request.groupId || undefined,
                        personalEmail: request.personalEmail || undefined,
                        createExternalAccount: request.createExternalAccount,
                        accessToInternalSystems: request.accessToInternalSystems || undefined,
                        services: request.services
                            ? (request.services as Record<'serviceName' | 'serviceId', string>[])
                            : undefined,
                        coordinatorLogins: request.coordinators?.map((c) => c.login).join(', ') || undefined,
                        lineManagerLogins: request.lineManagers?.map((lm) => lm.login).join(', ') || undefined,
                    },
                });

                return {
                    id: request.id,
                    status: 'success',
                };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to create user request',
                });
            }
        }),

    resolveUserRequestByPersonId: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/user-requests/resolve-by-person-id/{personId}',
                protect: true,
                summary: 'Handle employee status (employment or cancellation)',
            },
        })
        .input(
            z.object({
                status: z.enum(['EMPLOYMENT', 'CANCELLATION']),
                startDate: z.string().optional(),
                personId: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                status: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const { personId, status, startDate: startDateStr } = input;

                const request = await db
                    .selectFrom('UserCreationRequest')
                    .where('UserCreationRequest.externalPersonId', '=', personId)
                    .where('UserCreationRequest.status', '=', UserCreationRequestStatus.Approved)
                    .orderBy('UserCreationRequest.createdAt', 'desc')
                    .selectAll()
                    .executeTakeFirst();

                if (!request) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `No approved creation request found for externalPersonId: ${personId}`,
                    });
                }

                const user = await db.selectFrom('User').where('User.login', '=', request.login).executeTakeFirst();

                if (user) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `User with login ${request.login} already exists`,
                    });
                }

                if (status === 'EMPLOYMENT') {
                    if (!startDateStr) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Start date is required for employment',
                        });
                    }

                    const startDate = new Date(startDateStr);

                    if (request.jobId) {
                        await jobDelete(request.jobId);
                    }

                    await createJob('createProfile', {
                        data: { userCreationRequestId: request.id },
                        date: startDate,
                    });

                    await historyEventMethods.create({ token: ctx.apiTokenId }, 'changeEmployeeStatus', {
                        groupId: undefined,
                        userId: undefined,
                        before: undefined,
                        after: {
                            id: request.id,
                            status: 'EMPLOYMENT',
                            name: request.name,
                            email: request.email,
                            personId,
                            startDate: startDate.toISOString(),
                        },
                    });

                    return {
                        id: request.id,
                        status: 'success',
                    };
                }
                if (status === 'CANCELLATION') {
                    await userCreationRequestsMethods.cancel(
                        { id: request.id, comment: 'Cancelled via API' },
                        ctx.apiTokenId,
                    );

                    await historyEventMethods.create({ token: ctx.apiTokenId }, 'changeEmployeeStatus', {
                        groupId: undefined,
                        userId: undefined,
                        before: undefined,
                        after: {
                            id: request.id,
                            status: 'CANCELLATION',
                            name: request.name,
                            email: request.email,
                            personId,
                        },
                    });

                    return {
                        id: request.id,
                        status: 'success',
                    };
                }

                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: 'Invalid status provided',
                });
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'An unexpected error occurred',
                });
            }
        }),

    editUserRequest: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/user-requests/edit-by-person-id/{externalPersonId}',
                protect: true,
                summary: 'Edit an existing user creation request',
                description: 'Updates an existing user creation request (only internalEmployee type)',
            },
        })
        .input(createUserRequestDraftSchema)
        .output(
            z.object({
                id: z.string(),
                status: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const existingRequest = await userCreationRequestsMethods.getByExternalPersonId(input.externalPersonId);
                const updatedRequest = await userCreationRequestsMethods.editUserRequestDraft(input, ctx.apiTokenId);

                await historyEventMethods.create({ token: ctx.apiTokenId }, 'editUserCreationRequest', {
                    groupId: undefined,
                    userId: undefined,
                    before: {
                        id: existingRequest.id,
                        type: existingRequest.type || undefined,
                        name: existingRequest.name,
                        login: existingRequest.login,
                        email: existingRequest.email,
                        workEmail: existingRequest.workEmail || undefined,
                        personalEmail: existingRequest.personalEmail || undefined,
                        organizationUnitId: existingRequest.organizationUnitId,
                        supervisorId: existingRequest.supervisorId || undefined,
                        supervisorLogin: existingRequest.supervisorLogin || undefined,
                        title: existingRequest.title || undefined,
                        location: existingRequest.location || undefined,
                        date: existingRequest.date?.toISOString(),
                        creationCause: existingRequest.creationCause || undefined,
                        unitId: existingRequest.unitId || undefined,
                        groupId: existingRequest.groupId || undefined,
                        createExternalAccount: existingRequest.createExternalAccount,
                        accessToInternalSystems: existingRequest.accessToInternalSystems || undefined,
                        coordinatorLogins: existingRequest.coordinators?.map((c) => c.login).join(', ') || undefined,
                        lineManagerLogins: existingRequest.lineManagers?.map((lm) => lm.login).join(', ') || undefined,
                        equipment: existingRequest.equipment || undefined,
                        extraEquipment: existingRequest.extraEquipment || undefined,
                    },
                    after: {
                        id: updatedRequest.id,
                        type: updatedRequest.type || undefined,
                        name: updatedRequest.name,
                        login: updatedRequest.login,
                        email: updatedRequest.email,
                        workEmail: updatedRequest.workEmail || undefined,
                        personalEmail: updatedRequest.personalEmail || undefined,
                        organizationUnitId: updatedRequest.organizationUnitId,
                        supervisorId: updatedRequest.supervisorId || undefined,
                        supervisorLogin: updatedRequest.supervisorLogin || undefined,
                        title: updatedRequest.title || undefined,
                        location: updatedRequest.location || undefined,
                        date: updatedRequest.date?.toISOString(),
                        creationCause: updatedRequest.creationCause || undefined,
                        unitId: updatedRequest.unitId || undefined,
                        groupId: updatedRequest.groupId || undefined,
                        createExternalAccount: updatedRequest.createExternalAccount,
                        accessToInternalSystems: updatedRequest.accessToInternalSystems || undefined,
                        coordinatorLogins: updatedRequest.coordinators?.map((c) => c.login).join(', ') || undefined,
                        lineManagerLogins: updatedRequest.lineManagers?.map((lm) => lm.login).join(', ') || undefined,
                        equipment: updatedRequest.equipment || undefined,
                        extraEquipment: updatedRequest.extraEquipment || undefined,
                    },
                });

                return {
                    id: updatedRequest.id,
                    status: 'success',
                };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to update user request',
                });
            }
        }),
});
