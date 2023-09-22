import { prisma } from '../utils/prisma';

import { AddRoleToMembership, CreateRole, GetRoleList, RemoveRoleFromMembership } from './role.schemas';

export const roleMethods = {
    add: (data: CreateRole) => {
        return prisma.role.create({ data });
    },

    addToMembership: (data: AddRoleToMembership) => {
        return prisma.membership.update({
            where: { id: data.membershipId },
            data: { roles: { connect: { id: data.roleId } } },
        });
    },

    removeFromMembership: (data: RemoveRoleFromMembership) => {
        return prisma.membership.update({
            where: { id: data.membershipId },
            data: { roles: { disconnect: { id: data.roleId } } },
        });
    },

    getList: (data: GetRoleList) => {
        return prisma.role.findMany({
            where: { name: { contains: data.search, mode: 'insensitive' } },
            take: data.take,
        });
    },
};
