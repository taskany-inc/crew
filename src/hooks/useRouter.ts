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

    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',

    logs: '/logs',
    scheduledDeactivations: '/scheduled-deactivations',
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

        signIn: () => router.push(pages.signIn),
        signOut: () => router.push(pages.signOut),
    };
};
