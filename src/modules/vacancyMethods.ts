import { Vacancy } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';

import { CreateVacancy, GetVacancyList, EditVacancy } from './vacancySchemas';

export const vacancyMethods = {
    create: (data: CreateVacancy) => {
        return prisma.vacancy.create({ data });
    },

    getList: (data: GetVacancyList) => {
        return prisma.vacancy.findMany({ where: data, include: { group: true } });
    },

    getById: (id: string) => prisma.vacancy.findFirstOrThrow({ where: { id }, include: { group: true, user: true } }),

    edit: (data: EditVacancy): Promise<Vacancy> => {
        const { id, ...restData } = data;
        return prisma.vacancy.update({ where: { id }, data: restData });
    },

    archive: (id: string): Promise<Vacancy> => {
        return prisma.vacancy.update({ where: { id }, data: { archived: true } });
    },

    unarchive: (id: string): Promise<Vacancy> => {
        return prisma.vacancy.update({ where: { id }, data: { archived: false } });
    },

    delete: (id: string) => prisma.vacancy.delete({ where: { id } }),
};
