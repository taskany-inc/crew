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

interface TransferInsideHistoryEvent {
    id: string;
    supervisorId?: string | null;
    groupId?: string | null;
    date?: Date | null;
    comment?: string | null;
    location?: string | null;
    workSpace?: string | null;
    workMode?: string | null;
    lineManagerIds?: string[] | null;
    supplementalPositions?: {
        organizationUnitId: string;
        percentage: number;
        unitId?: string | null;
        main?: boolean;
        workEndDate?: Date | null;
    }[];
    transferToSupplementalPositions?: {
        organizationUnitId: string;
        percentage: number;
        unitId?: string | null;
        main?: boolean;
        workStartDate?: Date | null;
    }[];
    attachIds?: string[] | null;
    transferToSupervisorId?: string | null;
    transferToGroupId?: string | null;
    equipment?: string | null;
    extraEquipment?: string | null;
    coordinatorIds?: string[] | null;
    transferToTitle?: string | null;
    title?: string | null;
    disableAccount?: boolean | null;
}

export const transferInsideHistoryEvent = (request: TransferInsideHistoryEvent) => ({
    id: request.id,
    groupId: request.groupId || undefined,
    supplementalPositions: request.supplementalPositions?.length
        ? request.supplementalPositions.map(({ organizationUnitId, percentage, unitId, main, workEndDate }) => ({
              organizationUnitId,
              percentage,
              unitId: unitId || '',
              main,
              workEndDate: (workEndDate && new Date(workEndDate).toISOString()) || undefined,
          }))
        : undefined,
    transferToSupplementalPositions: request.transferToSupplementalPositions?.length
        ? request.transferToSupplementalPositions.map(
              ({ organizationUnitId, percentage, unitId, main, workStartDate }) => ({
                  organizationUnitId,
                  percentage,
                  unitId: unitId || '',
                  main,
                  workStartDate: (workStartDate && new Date(workStartDate).toISOString()) || undefined,
              }),
          )
        : undefined,
    date: (request.date && new Date(request.date).toISOString()) || undefined,
    attachIds: request.attachIds || undefined,
    supervisorId: request.supervisorId || undefined,
    comment: request.comment || undefined,
    workMode: request.workMode || undefined,
    workSpace: request.workSpace || undefined,
    location: request.location || undefined,
    transferToSupervisorId: request.transferToSupervisorId || undefined,
    transferToGroupId: request.transferToGroupId || undefined,
    equipment: request.equipment || undefined,
    extraEquipment: request.extraEquipment || undefined,
    coordinatorIds: request.coordinatorIds?.join(', ') || undefined,
    lineManagerIds: request.lineManagerIds?.join(', ') || undefined,
    transferToTitle: request.transferToTitle || undefined,
    title: request.title || undefined,
    disableAccount: !!request.disableAccount,
});

interface SupplementalPositionRequest {
    id: string;
    supervisorId?: string | null;
    groupId?: string | null;
    comment?: string | null;
    location?: string | null;
    workSpace?: string | null;
    workMode?: string | null;
    lineManagerIds?: string[] | null;
    supplementalPositions: {
        organizationUnitId: string;
        percentage: number;
        unitId?: string | null;
        workStartDate?: Date | null;
    }[];
    equipment?: string | null;
    extraEquipment?: string | null;
    title?: string | null;
}

export const newSupplementalPositionHistoryEvent = (request: SupplementalPositionRequest) => {
    const { supplementalPositions } = request;
    const position = supplementalPositions[0];

    return {
        id: request.id,
        groupId: request.groupId || undefined,
        supervisorId: request.supervisorId || undefined,
        comment: request.comment || undefined,
        workMode: request.workMode || undefined,
        workSpace: request.workSpace || undefined,
        location: request.location || undefined,
        equipment: request.equipment || undefined,
        extraEquipment: request.extraEquipment || undefined,
        title: request.title || undefined,
        lineManagerIds: request.lineManagerIds?.join(', ') || undefined,
        supplementalPositionWorkStartDate:
            (position?.workStartDate && new Date(position?.workStartDate).toISOString()) || undefined,
        supplementalPositionOrganizationUnitId: position?.organizationUnitId,
        supplementalPositionPercentage: position?.percentage,
        supplementalPositionUnitId: position?.unitId || undefined,
    };
};
