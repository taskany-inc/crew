export const config = {
    nextAuth: {
        secret: process.env.NEXTAUTH_SECRET,
        keycloak: {
            id: process.env.KEYCLOAK_ID,
            secret: process.env.KEYCLOAK_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER,
            jwsAlgorithm: process.env.KEYCLOAK_JWS_ALGORITHM || 'RS256',
        },
    },
    bonusPoints: {
        storeLink: process.env.NEXT_PUBLIC_BONUS_POINTS_STORE_LINK,
        apiUrl: process.env.BONUS_POINTS_API_URL,
        apiToken: process.env.BONUS_POINTS_API_TOKEN,
    },
    externalUserService: {
        apiUrlCreate: process.env.EXTERNAL_USER_CREATE_SERVICE_API_URL,
        apiUrlDeactivate: process.env.EXTERNAL_USER_DEACTIVATE_SERVICE_API_URL,
        apiToken: process.env.EXTERNAL_USER_SERVICE_API_TOKEN,
    },
};
