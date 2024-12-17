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
    unitId: scheduleDeactivation.unitId || undefined,
    unitIdString: scheduleDeactivation.unitIdString || undefined,
    teamLeadId: scheduleDeactivation.user.supervisorId || undefined,
    newTeamLead: scheduleDeactivation.newTeamLead || undefined,
    organizationalGroup: scheduleDeactivation.organizationalGroup || undefined,
    newOrganizationalGroup: scheduleDeactivation.newOrganizationalGroup || undefined,
    organizationRole: scheduleDeactivation.user.title || undefined,
    transferPercentage: scheduleDeactivation.transferPercentage || undefined,
    workMode: scheduleDeactivation.workMode || undefined,
    workPlace: scheduleDeactivation.workPlace || undefined,
    comments: scheduleDeactivation.comments || undefined,
    newOrganizationRole: scheduleDeactivation.newOrganizationRole || undefined,
    lineManagerIds: scheduleDeactivation.lineManagerIds.join(', '),
    applicationForReturnOfEquipment: scheduleDeactivation.applicationForReturnOfEquipment || undefined,
    newOrganization: scheduleDeactivation.newOrganizationUnit
        ? getOrgUnitTitle(scheduleDeactivation.newOrganizationUnit)
        : undefined,
    disableAccount: String(scheduleDeactivation.disableAccount),
    devices: scheduleDeactivation.devices as Record<'name' | 'id', string>[],
    testingDevices: scheduleDeactivation.testingDevices as Record<'name' | 'id', string>[],
});

export const devicesToString = (devices?: Record<'name' | 'id', string>[] | null) =>
    devices?.map((device) => `${device.name} ${device.id}`).join(', ');
