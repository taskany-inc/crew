import { defaultTake } from '../utils';
import { prisma } from '../utils/prisma';

import { GetUserActivity } from './historyEventSchemas';
import { CreateHistoryEventData, HistoryAction } from './historyEventTypes';

export const historyEventMethods = {
    create: <A extends HistoryAction>(
        actor: { user: string } | { token: string },
        action: A,
        data: CreateHistoryEventData<A>,
    ) => {
        return prisma.historyEvent.create({
            data: {
                actingUserId: 'user' in actor ? actor.user : undefined,
                actingTokenId: 'token' in actor ? actor.token : undefined,
                userId: data.userId,
                groupId: data.groupId,
                action,
                before: data.before,
                after: data.after,
            },
        });
    },

    getUserActivity: async ({ userId, cursor }: GetUserActivity) => {
        const events = await prisma.historyEvent.findMany({
            where: { actingUserId: userId },
            include: {
                group: { select: { id: true, name: true } },
                user: { select: { id: true, name: true, email: true, active: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: defaultTake + 1,
            cursor: cursor ? { id: cursor } : undefined,
        });

        let nextCursor: string | undefined;
        if (events.length > defaultTake) {
            const nextEvent = events.pop();
            nextCursor = nextEvent?.id;
        }

        return { events, nextCursor };
    },
};
