interface TransferInternToStaffHistoryEvent {
    id: string;
    supervisorId?: string;
    groupId?: string;
    date?: string;
    comment?: string;
    location?: string;
    workSpace?: string;
    workMode?: string;
    workModeComment?: string;
    lineManagerIds?: string[];
    supplementalPositions?: {
        organizationUnitId: string;
        percentage: number;
        unitId?: string;
        main?: boolean;
    }[];
    attachIds?: string[];
    internshipOrganizationId?: string;
    internshipOrganizationGroup?: string;
    internshipRole?: string;
    internshipSupervisor?: string;
    applicationForReturnOfEquipment?: string;
    devices?: { name: string; id: string }[];
    testingDevices?: { name: string; id: string }[];
}

export const transferInternToStaffHistoryEvent = (request: TransferInternToStaffHistoryEvent) => ({
    id: request.id,
    groupId: request.groupId || undefined,
    supplementalPositions: request.supplementalPositions?.length
        ? request.supplementalPositions.map(({ organizationUnitId, percentage, unitId, main }) => ({
              organizationUnitId,
              percentage,
              unitId: unitId || '',
              main,
          }))
        : undefined,
    date: request.date || undefined,
    attachIds: request.attachIds,
    supervisorId: request.supervisorId || undefined,
    comment: request.comment || undefined,
    lineManagerIds: request.lineManagerIds,
    workMode: request.workMode || undefined,
    workModeComment: request.workModeComment || undefined,
    workSpace: request.workSpace || undefined,
    location: request.location || undefined,
    internshipOrganizationId: request.internshipOrganizationId || undefined,
    internshipOrganizationGroup: request.internshipOrganizationGroup || undefined,
    internshipRole: request.internshipRole || undefined,
    internshipSupervisor: request.internshipSupervisor || undefined,
    applicationForReturnOfEquipment: request.applicationForReturnOfEquipment || undefined,
    testingDevices: request.testingDevices as Record<'name' | 'id', string>[],
    devices: request.devices as Record<'name' | 'id', string>[],
});
