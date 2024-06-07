import { BonusAction, User } from 'prisma/prisma-client';
import * as Sentry from '@sentry/nextjs';

import { prisma } from '../utils/prisma';
import { config } from '../config';

import { ChangeBonusPoints, GetAchievements } from './bonusPointsSchemas';
import { BonusPointsAchievement } from './bonusPointsTypes';
import { achievementMethods } from './achievementMethods';

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
                    externalAchievementId: data.externalAchievementId,
                    externalAchievementCategoryId: data.externalAchievementCategoryId,
                },
            }),
        ]);
        if (data.externalAchievementId && config.techAdminId) {
            const techAdmin = await prisma.user.findUnique({ where: { id: config.techAdminId } });

            if (!techAdmin) {
                Sentry.captureException(`No tech admin with id ${config.techAdminId} from config`);
                return user;
            }

            const bonusRules = await prisma.bonusRule.findMany({
                where: {
                    OR: [
                        { categoryId: data.externalAchievementCategoryId },
                        { externalAchievmentIds: { has: data.externalAchievementId } },
                    ],
                },
            });
            const achievements = await prisma.achievement.findMany({
                where: { bonusRuleId: { in: bonusRules.map(({ id }) => id) } },
                include: { bonusRule: true },
            });

            Promise.all(
                achievements.map(async (achievement) => {
                    if (!achievement.bonusRule) return;

                    const bonusesInCategory = await prisma.$queryRaw<Array<{ sum: number }>>`
                        SELECT SUM(amount) FROM public."BonusHistory"
                        WHERE ("achievementId" = ${data.externalAchievementId} OR "achievementCategory" = ${data.externalAchievementCategoryId})
                        AND "targetUserId" = ${data.userId}
                    `;
                    const bonusesAmount = Number(bonusesInCategory[0].sum);

                    const userAchievement = await prisma.userAchievement.findFirst({
                        where: { userId: data.userId, achievementId: achievement.id },
                    });
                    const achievementAmount =
                        Math.floor(bonusesAmount / achievement.bonusRule.bonusAmountForAchievement) -
                        (userAchievement?.count || 0);

                    if (!achievementAmount) return;

                    return achievementMethods.give(
                        {
                            achievementId: achievement.id,
                            userId: data.userId,
                            amount: achievementAmount,
                        },
                        techAdmin.id,
                    );
                }),
            );
        }
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
            'populate[0]': 'achievment_category',
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
