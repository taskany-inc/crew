import { prisma } from '../utils/prisma';

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
};
