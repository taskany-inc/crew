export interface AdditionalEmails {
    active: boolean;
    description: string;
    email: string;
}

export interface Devices {
    deviceId: string;
    name: string;
}

export interface Role {
    emoji: string;
    title: string;
    protected: boolean;
}

declare type JiraInfo = {
    self: string;
    name: string;
    emailAddress: string;
    timeZone: string;
    locale: string;
    key: string;
};

declare type GitlabInfo = {
    uid: string;
    name: string;
    username: string;
    avatar_url: string;
    web_url: string;
    email: string;
};

export declare type MattermostUser = {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    username: string;
    auth_data: string;
    auth_service: string;
    email: string;
    nickname: string;
    first_name: string;
    last_name: string;
    position: string;
    roles: string;
    disable_welcome_email: boolean;
};

declare type GroupMembership = {
    uid: string;
    isAdmin: boolean;
    groupName: string;
    roles: Role[];
    isOrgGroup: boolean;
};

export declare type Supervisor = {
    userId: string;
    fullName: string;
};

declare type ApiBot = {
    description: string;
    tokenHash: string;
};

export interface User {
    groupMemberships: GroupMembership[];
    _id: string;
    fullName: string;
    email: string;
    additionalEmails: AdditionalEmails[];
    devices: Devices[];
    supervisor: Supervisor | undefined | null;
    phone: string | undefined | null;
    apiBot: ApiBot | undefined;
    avatar?: string;
    bio?: string;
    mattermostFullName?: string;
    deactivated?: boolean;
    source?: string;
    telegram?: string;
    github?: string;
    jira?: JiraInfo;
    gitlab?: GitlabInfo;
    mattermost?: MattermostUser;
}
