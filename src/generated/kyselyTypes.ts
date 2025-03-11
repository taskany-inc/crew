import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const UserCreationRequestStatus = {
    Approved: 'Approved',
    Denied: 'Denied',
    Canceled: 'Canceled',
} as const;
export type UserCreationRequestStatus = (typeof UserCreationRequestStatus)[keyof typeof UserCreationRequestStatus];
export const UserRoleDeprecated = {
    ADMIN: 'ADMIN',
    USER: 'USER',
} as const;
export type UserRoleDeprecated = (typeof UserRoleDeprecated)[keyof typeof UserRoleDeprecated];
export const BonusAction = {
    ADD: 'ADD',
    SUBTRACT: 'SUBTRACT',
} as const;
export type BonusAction = (typeof BonusAction)[keyof typeof BonusAction];
export const VacancyStatus = {
    ACTIVE: 'ACTIVE',
    ON_HOLD: 'ON_HOLD',
    CLOSED: 'CLOSED',
    ON_CONFIRMATION: 'ON_CONFIRMATION',
} as const;
export type VacancyStatus = (typeof VacancyStatus)[keyof typeof VacancyStatus];
export const PositionStatus = {
    ACTIVE: 'ACTIVE',
    DECREE: 'DECREE',
    FIRED: 'FIRED',
} as const;
export type PositionStatus = (typeof PositionStatus)[keyof typeof PositionStatus];
export type Account = {
    id: Generated<string>;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string | null;
    refresh_token_expires_in: number | null;
    access_token: string | null;
    expires_at: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
    oauth_token_secret: string | null;
    oauth_token: string | null;
    password: string | null;
    userId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Achievement = {
    id: Generated<string>;
    description: string;
    title: string;
    icon: string;
    hidden: Generated<boolean>;
    nomination: string | null;
    creatorId: string | null;
    bonusRuleId: string | null;
    createdAt: Generated<Timestamp>;
};
export type ApiToken = {
    id: Generated<string>;
    value: Generated<string>;
    description: string;
    roleCode: string | null;
    organizationUnitId: string | null;
};
export type AppConfig = {
    id: string;
    favicon: string | null;
    logo: string | null;
    orgGroupId: string | null;
    orgGroupUpdatedAt: Timestamp | null;
    supportLink: string | null;
    documentLink: string | null;
    corporateAppName: string | null;
};
export type Attach = {
    id: string;
    link: string;
    filename: string;
    deletedAt: Timestamp | null;
    userCreationRequestId: string | null;
    scheduledDeactivationId: string | null;
    createdAt: Generated<Timestamp>;
};
export type BonusForAchievementRule = {
    id: Generated<string>;
    bonusesPerCrewAchievement: number;
    description: string;
    achievementId: string;
    externalAchievementId: string | null;
    externalAchievementCategoryId: string | null;
};
export type BonusHistory = {
    id: Generated<string>;
    action: BonusAction;
    amount: number;
    description: string;
    targetUserId: string;
    actingUserId: string;
    achievementId: string | null;
    achievementCategory: string | null;
    ruleId: string | null;
    createdAt: Generated<Timestamp>;
};
export type BonusRule = {
    id: Generated<string>;
    bonusAmountForAchievement: number;
    categoryId: string;
    externalAchievmentIds: string[];
};
export type Device = {
    name: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type ExternalService = {
    name: string;
    displayName: string | null;
    icon: string;
    linkPrefix: string | null;
    type: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Group = {
    id: Generated<string>;
    name: string;
    description: string | null;
    archived: Generated<boolean>;
    virtual: Generated<boolean>;
    organizational: Generated<boolean>;
    businessUnit: Generated<boolean>;
    parentId: string | null;
    supervisorId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type GroupAdmin = {
    userId: string;
    groupId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type HistoryEvent = {
    id: Generated<string>;
    actingUserId: string | null;
    actingTokenId: string | null;
    actingSubsystem: string | null;
    userId: string | null;
    groupId: string | null;
    action: string;
    before: unknown | null;
    after: unknown | null;
    createdAt: Generated<Timestamp>;
};
export type Job = {
    id: Generated<string>;
    state: string;
    priority: Generated<number>;
    kind: string;
    data: unknown;
    delay: number | null;
    retry: number | null;
    runs: Generated<number>;
    force: Generated<boolean>;
    cron: string | null;
    error: string | null;
    date: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Link = {
    id: Generated<string>;
    url: string;
    name: string;
};
export type Location = {
    id: Generated<string>;
    name: string;
};
export type MailingSettings = {
    id: Generated<string>;
    userId: string | null;
    organizationUnitId: string | null;
    additionalEmails: string[];
    plainEmails: boolean | null;
    email: string | null;
    workSpaceNotify: Generated<boolean>;
    createUserRequest: Generated<boolean>;
    createScheduledUserRequest: Generated<boolean>;
    scheduledDeactivation: Generated<boolean>;
};
export type Membership = {
    id: Generated<string>;
    archived: Generated<boolean>;
    userId: string;
    groupId: string;
    percentage: number | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type MembershipToRole = {
    A: string;
    B: string;
};
export type OrganizationDomain = {
    id: Generated<string>;
    domain: string;
    type: string | null;
};
export type OrganizationDomainToOrganizationUnit = {
    A: string;
    B: string;
};
export type OrganizationUnit = {
    id: Generated<string>;
    name: string;
    country: string;
    description: string | null;
    external: Generated<boolean>;
    main: boolean | null;
};
export type PermissionService = {
    id: Generated<string>;
    name: string;
};
export type PermissionServiceToUserCreationRequest = {
    A: string;
    B: string;
};
export type Role = {
    id: Generated<string>;
    name: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type ScheduledDeactivation = {
    id: Generated<string>;
    userId: string;
    creatorId: string;
    phone: string;
    email: string;
    lineManagerIds: string[];
    coordinatorIds: string[];
    deactivateDate: Timestamp;
    type: string;
    disableAccount: boolean;
    location: string;
    organization: string | null;
    newOrganization: string | null;
    organizationUnitId: string | null;
    newOrganizationUnitId: string | null;
    teamLead: string | null;
    newTeamLead: string | null;
    teamLeadId: string | null;
    newTeamLeadId: string | null;
    organizationRole: string | null;
    newOrganizationRole: string | null;
    organizationalGroup: string | null;
    newOrganizationalGroup: string | null;
    workMode: string | null;
    workModeComment: string | null;
    workPlace: string | null;
    testingDevices: unknown | null;
    devices: unknown | null;
    applicationForReturnOfEquipment: string | null;
    comments: string | null;
    unitId: number | null;
    unitIdString: string | null;
    transferPercentage: number | null;
    canceled: Generated<boolean>;
    canceledAt: Timestamp | null;
    cancelComment: string | null;
    jobId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Session = {
    id: Generated<string>;
    accessToken: string;
    sessionToken: string;
    expires: Timestamp;
    userId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type SupplementalPosition = {
    id: Generated<string>;
    organizationUnitId: string;
    unitId: string | null;
    personnelNumber: string | null;
    userId: string | null;
    percentage: number;
    workStartDate: Timestamp | null;
    workEndDate: Timestamp | null;
    status: Generated<PositionStatus>;
    role: string | null;
    main: Generated<boolean>;
    intern: Generated<boolean>;
    jobId: string | null;
    userCreationRequestId: string | null;
    scheduledDeactivationId: string | null;
};
export type User = {
    id: Generated<string>;
    active: Generated<boolean>;
    name: string | null;
    email: string;
    emailVerified: Timestamp | null;
    login: string | null;
    image: string | null;
    organizationUnitId: string | null;
    supervisorId: string | null;
    title: string | null;
    bonusPoints: Generated<number>;
    role: Generated<UserRoleDeprecated>;
    roleCode: string | null;
    deactivatedAt: Timestamp | null;
    workStartDate: Timestamp | null;
    locationId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type UserAchievement = {
    id: Generated<string>;
    count: Generated<number>;
    userId: string;
    awarderId: string;
    achievementId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type userCoordinators = {
    A: string;
    B: string;
};
export type UserCreationRequest = {
    id: Generated<string>;
    type: string | null;
    creatorId: string | null;
    name: string;
    email: string;
    personalEmail: string | null;
    workEmail: string | null;
    corporateEmail: string | null;
    login: string;
    title: string | null;
    supervisorLogin: string | null;
    supervisorId: string | null;
    organizationUnitId: string;
    groupId: string | null;
    osPreference: string | null;
    createExternalAccount: boolean;
    status: UserCreationRequestStatus | null;
    comment: string | null;
    services: unknown;
    date: Timestamp | null;
    percentage: number | null;
    cancelComment: string | null;
    externalOrganizationSupervisorLogin: string | null;
    accessToInternalSystems: boolean | null;
    disableAccount: boolean | null;
    workMode: string | null;
    workModeComment: string | null;
    equipment: string | null;
    extraEquipment: string | null;
    workSpace: string | null;
    location: string | null;
    creationCause: string | null;
    newUser: boolean | null;
    unitId: string | null;
    buddyLogin: string | null;
    buddyId: string | null;
    recruiterLogin: string | null;
    recruiterId: string | null;
    coordinatorLogin: string | null;
    coordinatorId: string | null;
    userTargetId: string | null;
    jobId: string | null;
    reasonToGrantPermissionToServices: string | null;
    transferFromGroup: string | null;
    internshipOrganizationId: string | null;
    internshipOrganizationGroup: string | null;
    internshipRole: string | null;
    internshipSupervisor: string | null;
    applicationForReturnOfEquipment: string | null;
    testingDevices: unknown | null;
    devices: unknown | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type userCurator = {
    A: string;
    B: string;
};
export type userCurators = {
    A: string;
    B: string;
};
export type UserDevice = {
    userId: string;
    deviceName: string;
    deviceId: string;
    active: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type userLineManagers = {
    A: string;
    B: string;
};
export type UserNames = {
    id: Generated<string>;
    userId: string;
    name: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type UserRole = {
    code: string;
    name: string;
    createUser: Generated<boolean>;
    editRoleScopes: Generated<boolean>;
    editUserRole: Generated<boolean>;
    editUserCreationRequests: Generated<boolean>;
    editUser: Generated<boolean>;
    editUserActiveState: Generated<boolean>;
    editUserAchievements: Generated<boolean>;
    editUserBonuses: Generated<boolean>;
    viewUserBonuses: Generated<boolean>;
    viewUserExtendedInfo: Generated<boolean>;
    editScheduledDeactivation: Generated<boolean>;
    viewScheduledDeactivation: Generated<boolean>;
    decideOnUserCreationRequest: Generated<boolean>;
    createExistingUserRequest: Generated<boolean>;
    createInternalUserRequest: Generated<boolean>;
    readManyInternalUserRequests: Generated<boolean>;
    editInternalUserRequest: Generated<boolean>;
    createExternalUserRequest: Generated<boolean>;
    readManyExternalUserRequests: Generated<boolean>;
    editExternalUserRequest: Generated<boolean>;
    createExternalFromMainUserRequest: Generated<boolean>;
    readManyExternalFromMainUserRequests: Generated<boolean>;
    editExternalFromMainUserRequest: Generated<boolean>;
    editFullGroupTree: Generated<boolean>;
    viewHistoryEvents: Generated<boolean>;
    importData: Generated<boolean>;
};
export type UserService = {
    userId: string;
    serviceName: string;
    organizationUnitId: string | null;
    serviceId: string;
    active: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type UserSettings = {
    id: Generated<string>;
    userId: string;
    theme: Generated<string>;
    locale: Generated<string>;
    beta: Generated<boolean>;
    showAchievements: Generated<boolean>;
};
export type Vacancy = {
    id: Generated<string>;
    name: string;
    hireStreamId: string;
    userId: string | null;
    groupId: string;
    archived: Generated<boolean>;
    archivedAt: Timestamp | null;
    status: VacancyStatus;
    unit: number | null;
    grade: number | null;
    hiringManagerId: string;
    hrId: string;
    closedAt: Timestamp | null;
    activeSince: Timestamp | null;
    timeAtWork: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type VerificationToken = {
    id: Generated<string>;
    identifier: string;
    token: string;
    expires: Timestamp;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type DB = {
    _MembershipToRole: MembershipToRole;
    _OrganizationDomainToOrganizationUnit: OrganizationDomainToOrganizationUnit;
    _PermissionServiceToUserCreationRequest: PermissionServiceToUserCreationRequest;
    _userCoordinators: userCoordinators;
    _userCurator: userCurator;
    _userCurators: userCurators;
    _userLineManagers: userLineManagers;
    Account: Account;
    Achievement: Achievement;
    ApiToken: ApiToken;
    AppConfig: AppConfig;
    Attach: Attach;
    BonusForAchievementRule: BonusForAchievementRule;
    BonusHistory: BonusHistory;
    BonusRule: BonusRule;
    Device: Device;
    ExternalService: ExternalService;
    Group: Group;
    GroupAdmin: GroupAdmin;
    HistoryEvent: HistoryEvent;
    Job: Job;
    Link: Link;
    Location: Location;
    MailingSettings: MailingSettings;
    Membership: Membership;
    OrganizationDomain: OrganizationDomain;
    OrganizationUnit: OrganizationUnit;
    PermissionService: PermissionService;
    Role: Role;
    ScheduledDeactivation: ScheduledDeactivation;
    Session: Session;
    SupplementalPosition: SupplementalPosition;
    User: User;
    UserAchievement: UserAchievement;
    UserCreationRequest: UserCreationRequest;
    UserDevice: UserDevice;
    UserNames: UserNames;
    UserRoleModel: UserRole;
    UserServices: UserService;
    UserSettings: UserSettings;
    Vacancy: Vacancy;
    VerificationToken: VerificationToken;
};
