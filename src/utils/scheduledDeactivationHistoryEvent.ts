import { ScheduledDeactivation } from '@prisma/client';

import { ScheduledDeactivationNewOrganizationUnit } from '../modules/scheduledDeactivationTypes';

import { getOrgUnitTitle } from './organizationUnit';

export const scheduledDeactivationHistoryEvent = (
    scheduleDeactivation: ScheduledDeactivation & {
        user: { name: string | null; supervisorId: string | null } | null;
    } & ScheduledDeactivationNewOrganizationUnit,
) => ({
    type: scheduleDeactivation.type,
    id: scheduleDeactivation.id,
    phone: scheduleDeactivation.phone,
    deactivateDate: scheduleDeactivation.deactivateDate,
    email: scheduleDeactivation.email,
    teamLeadId: scheduleDeactivation.user?.supervisorId || undefined,
    newTeamLead: scheduleDeactivation.newTeamLead || undefined,
    organizationalGroup: scheduleDeactivation.organizationalGroup || undefined,
    newOrganizationalGroup: scheduleDeactivation.newOrganizationalGroup || undefined,
    organizationRole: scheduleDeactivation.organizationRole || undefined,
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
    coordinatorIds: scheduleDeactivation.coordinatorIds.join(', ') || undefined,
});

export const devicesToString = (devices?: Record<'name' | 'id', string>[] | null) =>
    devices?.map((device) => `${device.name} ${device.id}`).join(', ');
