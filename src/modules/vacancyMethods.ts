import { Vacancy, Prisma, VacancyStatus } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { prisma } from '../utils/prisma';

import { CreateVacancy, GetVacancyList, EditVacancy } from './vacancySchemas';
import { tr } from './modules.i18n';

const defaultTake = 20;

export const vacancyMethods = {
    create: (input: CreateVacancy) => {
        const { hiringManagerId, hrId, groupId, ...restInput } = input;
        const data: Prisma.VacancyCreateInput = {
            ...restInput,
            group: { connect: { id: groupId } },
            hr: { connect: { id: hrId } },
            hiringManager: { connect: { id: hiringManagerId } },
        };

        if (input.status === VacancyStatus.ACTIVE) data.activeSince = new Date();

        return prisma.vacancy.create({ data });
    },

    getList: async (data: GetVacancyList) => {
        const {
            hiringManagerEmails,
            hrEmails,
            teamIds,
            closedAt,
            searchByTeam,
            search,
            hireStreamIds,
            take,
            skip,
            statuses,
            ...restData
        } = data;

        const where: Prisma.VacancyWhereInput = { ...restData };

        if (searchByTeam) {
            where.group = {
                name: {
                    contains: searchByTeam,
                    mode: 'insensitive',
                },
            };
        }

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        if (hireStreamIds && hireStreamIds.length) {
            where.hireStreamId = { in: hireStreamIds };
        }

        if (statuses && statuses.length) {
            where.status = { in: statuses };
        }

        if (hiringManagerEmails && hiringManagerEmails.length) {
            where.hiringManager = {
                OR: [
                    { email: { in: hiringManagerEmails } },
                    { services: { some: { serviceName: 'Email', serviceId: { in: hiringManagerEmails } } } },
                ],
            };
        }

        if (hrEmails && hrEmails.length) {
            where.hiringManager = {
                OR: [
                    { email: { in: hrEmails } },
                    { services: { some: { serviceName: 'Email', serviceId: { in: hrEmails } } } },
                ],
            };
        }

        if (teamIds && teamIds.length) {
            where.groupId = { in: teamIds };
        }

        if (closedAt) {
            const datetime = z.string().datetime();

            where.closedAt = { gte: datetime.parse(closedAt.startDate), lte: datetime.parse(closedAt.endDate) };
        }

        const vacancies = await prisma.vacancy.findMany({
            where,
            include: { group: { include: { supervisor: true } }, hr: true, hiringManager: true },
            take: take || defaultTake,
            skip: skip || 0,
        });

        const count = await prisma.vacancy.count({ where });
        const total = await prisma.vacancy.count();

        return { vacancies, count, total };
    },

    getById: async (id: string) => {
        const vacancy = await prisma.vacancy.findFirst({
            where: { id },
            include: { group: true, user: true, hr: true, hiringManager: true },
        });

        if (!vacancy) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: tr('No vacancy with id {vacancyId}', { vacancyId: id }),
            });
        }

        return vacancy;
    },

    edit: async (input: EditVacancy) => {
        const { id, ...restInput } = input;
        const data: Prisma.VacancyUpdateInput = restInput;

        if (restInput.status) {
            const previousVacancy = await prisma.vacancy.findFirstOrThrow({
                where: { id },
            });

            if (previousVacancy.status === VacancyStatus.ACTIVE && restInput.status !== VacancyStatus.ACTIVE) {
                const today = new Date();
                const activeSince = previousVacancy.activeSince || new Date();
                data.timeAtWork = previousVacancy.timeAtWork || 0 + today.getTime() - activeSince.getTime();
                data.activeSince = null;
            }

            if (previousVacancy.status !== VacancyStatus.ACTIVE && restInput.status === VacancyStatus.ACTIVE) {
                data.activeSince = new Date();
            }

            if (previousVacancy.status !== VacancyStatus.CLOSED && restInput.status === VacancyStatus.CLOSED) {
                data.closedAt = new Date();
            }

            if (previousVacancy.status === VacancyStatus.CLOSED && restInput.status !== VacancyStatus.CLOSED) {
                data.closedAt = null;
            }
        }

        return prisma.vacancy.update({
            where: { id },
            data,
            include: { group: true, user: true, hr: true, hiringManager: true },
        });
    },

    archive: (id: string) => {
        return prisma.vacancy.update({ where: { id }, data: { archived: true, archivedAt: new Date() } });
    },

    unarchive: (id: string): Promise<Vacancy> => {
        return prisma.vacancy.update({ where: { id }, data: { archived: false } });
    },

    delete: (id: string) => prisma.vacancy.delete({ where: { id } }),
};
