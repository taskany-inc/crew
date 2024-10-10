import { TRPCError } from '@trpc/server';
import { Prisma } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { suggestionsTake } from '../utils/suggestions';

import { GetRoleList, RemoveRoleFromMembership, GetRoleSuggestions, AddRoleToMembership } from './roleSchemas';
import { tr } from './modules.i18n';

export const groupRoleMethods = {
    getByIdOrThrow: async (id: string) => {
        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) throw new TRPCError({ code: 'NOT_FOUND', message: `No role with id ${id}` });
        return role;
    },

    addToMembership: async (data: AddRoleToMembership) => {
        const membership = await prisma.membership.findUnique({ where: { id: data.membershipId } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }

        if (data.type === 'existing') {
            return prisma.membership.update({
                where: { id: data.membershipId, archived: false },
                data: { roles: { connect: { id: data.id } } },
            });
        }
        return prisma.membership.update({
            where: { id: data.membershipId, archived: false },
            data: { roles: { create: { name: data.name } } },
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
            orderBy: { name: 'asc' },
        });
    },

    suggestions: async ({ query, include, includeName, take = suggestionsTake }: GetRoleSuggestions) => {
        const where: Prisma.RoleWhereInput = { name: { contains: query, mode: 'insensitive' } };

        if (include) {
            where.id = { notIn: include };
        }

        if (includeName) {
            where.AND = { name: { notIn: includeName } };
        }

        const suggestions = await prisma.role.findMany({ where, take });

        if (include) {
            const includes = await prisma.role.findMany({ where: { id: { in: include } } });
            suggestions.push(...includes);
        }

        if (includeName) {
            const includes = await prisma.role.findMany({ where: { name: { in: includeName } } });
            suggestions.push(...includes);
        }

        return suggestions;
    },
};
