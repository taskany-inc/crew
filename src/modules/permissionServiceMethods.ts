import { Prisma } from 'prisma/prisma-client';

import { suggestionsTake } from '../utils/suggestions';
import { prisma } from '../utils/prisma';

import { GetPermissionServiceSuggestions } from './permissionServiceSchemas';

export const permissionServiceMethods = {
    suggestions: async ({ query, include, take = suggestionsTake }: GetPermissionServiceSuggestions) => {
        const where: Prisma.PermissionServiceWhereInput = { name: { contains: query, mode: 'insensitive' } };

        if (include) {
            where.id = { notIn: include };
        }

        const suggestions = await prisma.permissionService.findMany({ where, take });

        if (include) {
            const includes = await prisma.permissionService.findMany({ where: { id: { in: include } } });
            suggestions.push(...includes);
        }

        return suggestions;
    },
};
