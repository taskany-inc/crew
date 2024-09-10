import { NextApiRequest, NextApiResponse } from 'next';

import { config } from '../../config';

const replaceUndefinedWithNull = (obj: unknown) =>
    JSON.parse(
        JSON.stringify(obj, (_k, v) => {
            return v === undefined ? null : v;
        }),
    );

export default async (_req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json(
        replaceUndefinedWithNull({
            config: {
                bonusPoints: {
                    storeLink: config.bonusPoints.storeLink,
                },
                externalUserService: {
                    enabled: config.externalUserService.enabled,
                    apiUrlCreate: config.externalUserService.apiUrlCreate,
                    apiUrlUpdate: config.externalUserService.apiUrlUpdate,
                },
                hireIntergration: {
                    url: config.hireIntegration.url,
                },
                nodemailer: {
                    enabled: config.nodemailer.enabled,
                },
                worker: {
                    queueInterval: config.worker.queueInterval,
                    retryLimit: config.worker.retryLimit,
                    defaultJobDelay: config.worker.defaultJobDelay,
                },
                techAdminId: config.techAdminId,
                corporateEmailDomain: config.corporateEmailDomain,
                sectionAchievementId: config.sectionAchiementId,
                sectionAmountForAchievement: config.sectionAmountForAchievement,
                deactivateUtcHour: config.deactivateUtcHour,
                employmentUtcHour: config.employmentUtcHour,
            },
        }),
    );
};
