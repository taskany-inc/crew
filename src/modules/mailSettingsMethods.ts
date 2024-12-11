import { prisma } from '../utils/prisma';

import { EditAdditionEmails, GetAdditionEmails } from './mailingSettingsSchemas';

export const mailSettingsMethods = {
    getAdditionEmails: async (data: GetAdditionEmails) => {
        const mailingSettings = await prisma.mailingSettings.findFirst({
            where: {
                organizationUnitId: { in: data.organizationUnitIds },
                [data.mailingType]: true,
                plainEmails: true,
            },
        });
        return mailingSettings?.additionalEmails || [];
    },

    editAdditionEmails: async (data: EditAdditionEmails) => {
        const { additionalEmails } = data;

        const where = { organizationUnitId: data.organizationUnitId, [data.mailingType]: true, plainEmails: true };

        const mailingSettings = await prisma.mailingSettings.findFirst({ where });

        if (!mailingSettings) {
            return prisma.mailingSettings.create({ data: { ...where, additionalEmails } });
        }
        return prisma.mailingSettings.update({
            where: { id: mailingSettings.id },
            data: { additionalEmails },
        });
    },
};
