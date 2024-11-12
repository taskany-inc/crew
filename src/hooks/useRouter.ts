import { useRouter as useRouterNext } from 'next/router';

export const pages = {
    home: '/',

    teams: '/teams',
    team: (teamId: string) => `/teams/${teamId}`,
    teamSettings: (teamId: string) => `/teams/${teamId}/settings`,

    users: '/users',
    user: (userId: string) => `/users/${userId}`,
    userActivity: (userId: string) => `/users/${userId}/activity`,
    userSettings: '/users/settings',
    userRequests: '/requests/users',
    accessCoordination: '/requests/access',

    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',

    logs: '/logs',
    scheduledDeactivations: '/deactivations',

    adminPanel: '/admin-panel',
    mailingLists: '/admin-panel/mailing-lists',

    attaches: '/api/attach',
    attach: (attachId: string) => `/api/attach?id=${attachId}`,
    attachParseStructure: '/api/attach?parseStructure',

    newInternalUserRequest: '/requests/users/new/internal',
    newExternalUserRequest: '/requests/users/new/external',
    newExternalFromMainUserRequest: '/requests/users/new/external-from-main',
    newExistingUserRequest: '/requests/users/new/existing',
    internalUserRequest: (requestId: string) => `/requests/users/internal/${requestId}`,
    internalUserRequestEdit: (requestId: string) => `/requests/users/internal/${requestId}/edit`,
    externalUserRequest: (requestId: string) => `/requests/users/external/${requestId}`,
    externalUserRequestEdit: (requestId: string) => `/requests/users/external/${requestId}/edit`,

    externalUserFromMainOrgRequest: (requestId: string) => `/requests/users/external-from-main/${requestId}`,
    externalUserFromMainOrgRequestEdit: (requestId: string) => `/requests/users/external-from-main/${requestId}/edit`,
};

export const useRouter = () => {
    const router = useRouterNext();

    return {
        home: () => router.push(pages.home),

        teams: () => router.push(pages.teams),
        team: (teamId: string) => router.push(pages.team(teamId)),
        teamSettings: (teamId: string) => router.push(pages.teamSettings(teamId)),

        users: () => router.push(pages.users),
        user: (userId: string) => router.push(pages.user(userId)),
        userActivity: (userId: string) => router.push(pages.userActivity(userId)),
        userSettings: () => router.push(pages.userSettings),
        userRequests: () => router.push(pages.userRequests),
        accessCoordination: () => router.push(pages.accessCoordination),

        signIn: () => router.push(pages.signIn),
        signOut: () => router.push(pages.signOut),

        logs: () => router.push(pages.logs),
        scheduledDeactivations: () => router.push(pages.scheduledDeactivations),

        adminPanel: () => router.push(pages.adminPanel),
        mailingLists: () => router.push(pages.mailingLists),

        attaches: () => router.push(pages.attaches),
        attach: (attachId: string) => () => router.push(pages.attach(attachId)),

        newInternalUserRequest: () => router.push(pages.newInternalUserRequest),
        newExternalUserRequest: () => router.push(pages.newExternalUserRequest),
        newExternalFromMainUserRequest: () => router.push(pages.newExternalFromMainUserRequest),
        newExistingUserRequest: () => router.push(pages.newExistingUserRequest),
        internalUserRequest: (requestId: string) => router.push(pages.internalUserRequest(requestId)),
        internalUserRequestEdit: (requestId: string) => router.push(pages.internalUserRequestEdit(requestId)),
        externalUserRequest: (requestId: string) => router.push(pages.externalUserRequest(requestId)),
        externalUserRequestEdit: (requestId: string) => router.push(pages.externalUserRequestEdit(requestId)),

        externalUserFromMainOrgRequest: (requestId: string) =>
            router.push(pages.externalUserFromMainOrgRequest(requestId)),
        externalUserFromMainOrgRequestEdit: (requestId: string) =>
            router.push(pages.externalUserFromMainOrgRequestEdit(requestId)),
    };
};
