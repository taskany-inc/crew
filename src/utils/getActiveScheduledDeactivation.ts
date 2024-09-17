import { User, ScheduledDeactivation } from 'prisma/prisma-client';

export const getActiveScheduledDeactivation = (
    user: User & { scheduledDeactivations: ScheduledDeactivation[] },
): ScheduledDeactivation | undefined => {
    if (!user.active) return undefined;
    if (user.scheduledDeactivations.length === 0) return undefined;
    const today = new Date();
    return user.scheduledDeactivations.find((d) => !d.canceled && d.deactivateDate < today);
};
