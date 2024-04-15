import { BonusAction, User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { config } from '../config';

import { ChangeBonusPoints, GetAchievements } from './bonusPointsSchemas';
import { BonusPointsAchievement } from './bonusPointsTypes';

export const bonusPointsMethods = {
    change: async (data: ChangeBonusPoints, sessionUserId: string): Promise<User> => {
        const bonusPoints = data.action === BonusAction.ADD ? { increment: data.amount } : { decrement: data.amount };
        const [user] = await prisma.$transaction([
            prisma.user.update({ where: { id: data.userId }, data: { bonusPoints } }),
            prisma.bonusHistory.create({
                data: {
                    action: data.action,
                    amount: data.amount,
                    targetUserId: data.userId,
                    actingUserId: sessionUserId,
                    description: data.description,
                },
            }),
        ]);
        return user;
    },

    getHistory: (id: string) => {
        return prisma.bonusHistory.findMany({
            where: { targetUserId: id },
            orderBy: { createdAt: 'desc' },
        });
    },

    getAchievements: async (data: GetAchievements): Promise<BonusPointsAchievement[]> => {
        const params = new URLSearchParams({
            'pagination[page]': '1',
            'pagination[pageSize]': '5',
            'filters[$or][0][title][$containsi]': data.search,
            'filters[$or][1][description][$containsi]': data.search,
        });
        const response = await fetch(`${config.bonusPoints.apiUrl}/api/achievments?${params}`, {
            method: 'GET',
            headers: {
                authorization: `Bearer ${config.bonusPoints.apiToken}`,
            },
        });
        const json = await response.json();
        const items: BonusPointsAchievement[] = json.data;
        return items;
    },
};
