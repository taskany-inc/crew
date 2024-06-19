import { TRPCError } from '@trpc/server';
import * as Sentry from '@sentry/nextjs';

import { defaultTake } from '../utils';
import { prisma } from '../utils/prisma';
import { config } from '../config';

import { CreateAndGiveAchievement, GetAchievementList, GiveAchievement } from './achievementSchemas';
import { tr } from './modules.i18n';
import { sendMail } from './nodemailer';

export const achievementMethods = {
    createAndGive: async (data: CreateAndGiveAchievement, sessionUserId: string) => {
        const { icon, title, description, hidden, userId, nomination } = data;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${userId}` });

        const newAchievement = await prisma.achievement.create({
            data: { icon, creatorId: sessionUserId, title, description, hidden, nomination },
        });

        return achievementMethods.give({ achievementId: newAchievement.id, userId }, sessionUserId);
    },

    give: async (data: GiveAchievement, sessionUserId: string) => {
        const { amount = 1, ...restData } = data;
        const user = await prisma.user.findUnique({ where: { id: restData.userId }, include: { achievements: true } });

        const achievement = await prisma.achievement.findUnique({
            where: { id: restData.achievementId },
            include: { bonusForAchievementRule: true },
        });

        if (!achievement) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `No achievement with id ${restData.achievementId}` });
        }

        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${restData.userId}` });

        const existingAchievement = user.achievements.find(
            ({ achievementId }) => achievementId === restData.achievementId,
        );

        if (existingAchievement) {
            await prisma.userAchievement.update({
                where: { id: existingAchievement.id },
                data: { count: { increment: amount } },
            });
        } else {
            await prisma.userAchievement.create({ data: { ...restData, awarderId: sessionUserId, count: amount } });
        }

        if (achievement.bonusForAchievementRule && config.techAdminId) {
            const techAdmin = await prisma.user.findUnique({ where: { id: config.techAdminId } });

            if (!techAdmin) {
                Sentry.captureException(`No tech admin with id ${config.techAdminId} from config`);
                return achievement;
            }
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: data.userId },
                    data: { bonusPoints: { increment: achievement.bonusForAchievementRule.bonusesPerCrewAchievement } },
                }),
                prisma.bonusHistory.create({
                    data: {
                        action: 'ADD',
                        amount: achievement.bonusForAchievementRule.bonusesPerCrewAchievement,
                        targetUserId: data.userId,
                        actingUserId: techAdmin.id,
                        description: achievement.bonusForAchievementRule.description,
                        externalAchievementId: achievement.bonusForAchievementRule.externalAchievementId,
                        externalAchievementCategoryId:
                            achievement.bonusForAchievementRule.externalAchievementCategoryId,
                    },
                }),
            ]);
        }

        if (!achievement.hidden) {
            await sendMail({
                to: user.email,
                subject: tr('New achievement!'),
                text: `${tr('Congratulations! You have new achievement: {achievement}', {
                    achievement: achievement.title,
                })}\n${tr('Nomination:')} ${achievement.nomination}`,
            });
        }

        return achievement;
    },

    getList: (data: GetAchievementList) => {
        return prisma.achievement.findMany({
            where: {
                title: {
                    contains: data.search,
                    mode: 'insensitive',
                },
            },
            take: data.take || defaultTake,
        });
    },

    getById: async (id: string) => {
        const achievement = await prisma.achievement.findUnique({ where: { id } });

        if (!achievement) throw new TRPCError({ code: 'NOT_FOUND', message: `No achievement with id ${id}` });

        return achievement;
    },
};
