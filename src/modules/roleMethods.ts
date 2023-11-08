import { TRPCError } from '@trpc/server';
import { Prisma } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { suggestionsTake } from '../utils/suggestions';

import {
    AddRoleToMembership,
    CreateRole,
    GetRoleList,
    RemoveRoleFromMembership,
    GetRoleSuggestions,
} from './roleSchemas';
import { tr } from './modules.i18n';

export const roleMethods = {
    add: (data: CreateRole) => {
        return prisma.role.create({ data });
    },

    addToMembership: async (data: AddRoleToMembership) => {
        const membership = await prisma.membership.findUnique({ where: { id: data.membershipId } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }
        return prisma.membership.update({
            where: { id: data.membershipId, archived: false },
            data: { roles: { connect: { id: data.roleId } } },
        });
    },

    removeFromMembership: async (data: RemoveRoleFromMembership) => {
        const membership = await prisma.membership.findUnique({ where: { id: data.membershipId } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }
        return prisma.membership.update({
            where: { id: data.membershipId, archived: false },
            data: { roles: { disconnect: { id: data.roleId } } },
        });
    },

    getList: (data: GetRoleList) => {
        return prisma.role.findMany({
            where: { name: { contains: data.search, mode: 'insensitive' } },
            take: data.take,
        });
    },

    suggestions: async ({ query, include, take = suggestionsTake }: GetRoleSuggestions) => {
        const where: Prisma.RoleWhereInput = { name: { contains: query, mode: 'insensitive' } };

        if (include) {
            where.id = { notIn: include };
        }
        const suggestions = await prisma.role.findMany({ where, take });

        if (include) {
            const includes = await prisma.role.findMany({ where: { id: { in: include } } });
            suggestions.push(...includes);
        }

        return suggestions;
    },
};
