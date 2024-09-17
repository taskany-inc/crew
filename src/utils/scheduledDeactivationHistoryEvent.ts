import { ScheduledDeactivation } from '@prisma/client';

import {
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationOrganizationUnit,
    ScheduledDeactivationUser,
} from '../modules/scheduledDeactivationTypes';

import { getOrgUnitTitle } from './organizationUnit';

export const scheduledDeactivationHistoryEvent = (
    scheduleDeactivation: ScheduledDeactivation &
        ScheduledDeactivationUser &
        ScheduledDeactivationOrganizationUnit &
        ScheduledDeactivationNewOrganizationUnit,
) => ({
    type: scheduleDeactivation.type,
    id: scheduleDeactivation.id,
    phone: scheduleDeactivation.phone,
    deactivateDate: scheduleDeactivation.deactivateDate,
    email: scheduleDeactivation.email,
    organization: scheduleDeactivation.organizationUnit
        ? getOrgUnitTitle(scheduleDeactivation.organizationUnit)
        : undefined,
    unitId: scheduleDeactivation.unitId,
    teamLead: scheduleDeactivation.teamLead,
    newTeamLead: scheduleDeactivation.newTeamLead || undefined,
    organizationalGroup: scheduleDeactivation.organizationalGroup || undefined,
    newOrganizationalGroup: scheduleDeactivation.newOrganizationalGroup || undefined,
    organizationRole: scheduleDeactivation.organizationRole || undefined,
    transferPercentage: scheduleDeactivation.transferPercentage || undefined,
    workMode: scheduleDeactivation.workMode || undefined,
    workPlace: scheduleDeactivation.workPlace || undefined,
    comments: scheduleDeactivation.comments || undefined,
    newOrganizationRole: scheduleDeactivation.newOrganizationRole || undefined,
    newOrganization: scheduleDeactivation.newOrganizationUnit
        ? getOrgUnitTitle(scheduleDeactivation.newOrganizationUnit)
        : undefined,
});
