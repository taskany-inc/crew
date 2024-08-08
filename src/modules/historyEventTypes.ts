interface HistoryEventsData {
    createUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: {
            name?: string;
            email: string;
            phone?: string;
            login?: string;
            organizationalUnitId?: string;
            accountingId?: string;
            supervisorId?: string;
            createExternalAccount?: boolean;
        };
    };
    editUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: true;
        data: {
            name?: string;
            supervisorId?: string;
            email?: string;
            phone?: string;
            login?: string;
            organizationalUnitId?: string;
        };
    };
    createUserCreationRequest: {
        requireGroupId: false;
        requireUserId: false;
        requireBefore: false;
        data: {
            id: string;
            type?: string;
            status: null;
            name: string;
            email: string;
            corporateEmail?: string;
            title?: string;
            osPreference?: string;
            login: string;
            supervisorLogin: string;
            organizationUnitId: string;
            groupId: string;
            date?: string;
            services?: { serviceName: string; serviceId: string }[] | null;
            createExternalAccount?: boolean;
            externalOrganizationSupervisorLogin?: string;
            accessToInternalSystems?: boolean;
            comment?: string;
            creationCause?: string;
            location?: string;
            workSpace?: string;
            equipment?: string;
            extraEquipment?: string;
            workMode?: string;
            workModeComment?: string;
            buddyLogin?: string;
            coordinatorLogin?: string;
            recruiterLogin?: string;
            supplementalPositions?: { organizationUnitId: string; percentage: number }[];
        };
    };
    acceptUserCreationRequest: {
        requireGroupId: false;
        requireUserId: false;
        requireBefore: false;
        data: {
            id: string;
            name?: string;
            email?: string;
            comment?: string;
        };
    };
    declineUserCreationRequest: {
        requireGroupId: false;
        requireUserId: false;
        requireBefore: false;
        data: {
            id: string;
            name: string;
            email: string;
            comment?: string;
        };
    };
    editUserCreationRequest: {
        requireGroupId: false;
        requireUserId: false;
        requireBefore: true;
        data: {
            id: string;
            name?: string;
            email?: string;
            date?: string;
            phone?: string;
        };
    };
    editUserActiveState: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: true;
        data: boolean;
    };
    editUserBonuses: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: true;
        data: { amount: number; description?: string };
    };
    editUserRole: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: true;
        data: { roleCode?: string };
    };
    editUserMailingSettings: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { type: string; value: boolean; organizationUnitId?: string };
    };
    addUserToGroup: {
        requireGroupId: true;
        requireUserId: true;
        requireBefore: false;
        data: { percentage?: number };
    };
    removeUserFromGroup: {
        requireGroupId: true;
        requireUserId: true;
        requireBefore: false;
        data: undefined;
    };
    createGroup: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: {
            name: string;
            parentId?: string;
            virtual?: boolean;
            organizational?: boolean;
            supervisorId?: string;
        };
    };
    editGroup: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: true;
        data: {
            name?: string;
            description?: string;
            organizational?: boolean;
            supervisorId?: string;
        };
    };
    archiveGroup: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: undefined;
    };
    deleteGroup: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: undefined;
    };
    moveGroup: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: true;
        data: string | undefined;
    };
    addUserToGroupAdmin: {
        requireGroupId: true;
        requireUserId: true;
        requireBefore: false;
        data: undefined;
    };
    removeUserFromGroupAdmin: {
        requireGroupId: true;
        requireUserId: true;
        requireBefore: false;
        data: undefined;
    };
    addRoleToMembership: {
        requireGroupId: true;
        requireUserId: true;
        requireBefore: false;
        data: string;
    };
    removeRoleFromMembership: {
        requireGroupId: true;
        requireUserId: true;
        requireBefore: false;
        data: string;
    };
    addServiceToUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { id: string; name: string };
    };
    removeServiceFromUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { id: string; name: string };
    };
    createAchievement: {
        requireGroupId: false;
        requireUserId: false;
        requireBefore: false;
        data: {
            id: string;
            title: string;
            description: string;
            hidden: boolean;
        };
    };
    giveAchievementToUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { id: string; title: string; amount?: number };
    };
    addDeviceToUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { id: string; name: string };
    };
    removeDeviceFromUser: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { id: string; name: string };
    };
    createVacancy: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: {
            id: string;
            name: string;
            status: string;
            hireStreamId: string;
            hiringManagerId: string;
            hrId: string;
            grade?: number;
            unit?: number;
        };
    };
    editVacancy: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: true;
        data: {
            id: string;
            name: string;
            status?: string;
            hiringManagerId?: string;
            hrId?: string;
            grade?: number;
            unit?: number;
        };
    };
    archiveVacancy: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: { id: string; name: string };
    };
    unarchiveVacancy: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: { id: string; name: string };
    };
    deleteVacancy: {
        requireGroupId: true;
        requireUserId: false;
        requireBefore: false;
        data: { id: string; name: string };
    };
    createScheduledDeactivation: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: {
            type: string;
            id: string;
            phone: string;
            deactivateDate: Date;
            email: string;
            unitId: number;
            teamLead: string;
            organizationalGroup?: string;
            organizationRole?: string;
            workMode?: string;
            organization?: string;
            comments?: string;
            newOrganizationRole?: string;
            newOrganization?: string;
            newOrganizationalGroup?: string;
            newTeamLead?: string;
        };
    };
    editScheduledDeactivation: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: true;
        data: {
            type?: string;
            id?: string;
            phone?: string;
            deactivateDate?: Date;
            email?: string;
            unitId?: number;
            teamLead?: string;
            organizationalGroup?: string;
            organizationRole?: string;
            workMode?: string;
            organization?: string;
            comments?: string;
            newOrganizationRole?: string;
            newOrganization?: string;
            newOrganizationalGroup?: string;
            newTeamLead?: string;
        };
    };
    cancelScheduledDeactivation: {
        requireGroupId: false;
        requireUserId: true;
        requireBefore: false;
        data: { type: string; comment: string };
    };
    changeUserRoleScope: {
        requireGroupId: false;
        requireUserId: false;
        requireBefore: false;
        data: {
            roleCode: string;
            scope: string;
            value: boolean;
        };
    };
}

export type HistoryAction = keyof HistoryEventsData;

export type CreateHistoryEventData<A extends HistoryAction, E extends HistoryEventsData[A] = HistoryEventsData[A]> = {
    groupId: E['requireGroupId'] extends true ? string : undefined;
    userId: E['requireUserId'] extends true ? string : undefined;
    before: E['requireBefore'] extends true ? E['data'] : undefined;
    after: E['data'];
};

export type HistoryEventData<
    A extends HistoryAction = HistoryAction,
    E extends HistoryEventsData[A] = HistoryEventsData[A],
> = {
    id: string;
    actingUser?: { id: string; name: string | null; email: string; active?: boolean } | null;
    actingToken?: { description: string } | null;
    actingSubsystem?: string | null;
    group: E['requireGroupId'] extends true ? { id: string; name: string } : null;
    user: E['requireUserId'] extends true ? { id: string; name: string | null; email: string; active: boolean } : null;
    action: A;
    before: E['requireBefore'] extends true ? E['data'] : null;
    after: E['data'];
    createdAt: Date;
};
