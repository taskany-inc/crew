import { User, ScheduledDeactivation } from 'prisma/prisma-client';

export const scheduledDeactivationAllowed = (user: User & { scheduledDeactivations: ScheduledDeactivation[] }) =>
    (user.scheduledDeactivations.length === 0 ||
        (user.scheduledDeactivations[0] &&
            user.scheduledDeactivations[0].deactivateDate &&
            user.scheduledDeactivations[0].deactivateDate < new Date())) &&
    user.active;
