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
