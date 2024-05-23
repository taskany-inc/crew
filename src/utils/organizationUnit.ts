import { OrganizationUnit } from '@prisma/client';

export const getOrgUnitTitle = (orgUnit: OrganizationUnit) => {
    return `${orgUnit.name} / ${orgUnit.country}`;
};
