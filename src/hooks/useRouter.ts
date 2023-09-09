import { useRouter as useRouterNext } from 'next/router';

export const pages = {
    home: '/',

    teams: '/teams',
    team: (teamId: string) => `/teams/${teamId}`,

    users: '/users',
    user: (userId: string) => `/users/${userId}`,

    people: '/people',
    services: '/services',
    projects: '/projects',
    goals: '/goals',
    settings: '/settings',

    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
};

export const useRouter = () => {
    const router = useRouterNext();

    return {
        home: () => router.push(pages.home),

        teams: () => router.push(pages.teams),
        team: (teamId: string) => router.push(pages.team(teamId)),

        users: () => router.push(pages.users),
        user: (userId: string) => router.push(pages.user(userId)),

        people: () => router.push(pages.people),
        services: () => router.push(pages.services),
        projects: () => router.push(pages.projects),
        goals: () => router.push(pages.goals),
        settings: () => router.push(pages.settings),

        signIn: () => router.push(pages.signIn),
        signOut: () => router.push(pages.signOut),
    };
};
