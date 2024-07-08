export const config = {
    nextAuth: {
        secret: process.env.NEXTAUTH_SECRET,
        keycloak: {
            id: process.env.KEYCLOAK_ID,
            secret: process.env.KEYCLOAK_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER,
            jwsAlgorithm: process.env.KEYCLOAK_JWS_ALGORITHM || 'RS256',
        },
        credentialsAuth: process.env.CREDENTIALS_AUTH,
    },
    bonusPoints: {
        storeLink: process.env.NEXT_PUBLIC_BONUS_POINTS_STORE_LINK,
        apiUrl: process.env.BONUS_POINTS_API_URL,
        apiToken: process.env.BONUS_POINTS_API_TOKEN,
    },
    externalUserService: {
        apiUrlCreate: process.env.EXTERNAL_SERVICE_CREATE_PROFILE_API_URL,
        apiUrlUpdate: process.env.EXTERNAL_SERVICE_UPDATE_PROFILE_API_URL,
        apiToken: process.env.EXTERNAL_SERVICE_API_TOKEN,
    },
    hireIntegration: {
        url: process.env.NEXT_PUBLIC_HIRE_INTEGRATION_URL,
        apiToken: process.env.HIRE_INTEGRATION_API_TOKEN,
    },
    nodemailer: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        authPass: process.env.MAIL_PASS,
        authUser: process.env.MAIL_USER,
        enabled: process.env.MAIL_ENABLE,
    },
    s3: {
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        bucket: process.env.S3_BUCKET,
    },
    worker: {
        queueInterval: process.env.WORKER_JOBS_INTERVAL ? parseInt(process.env.WORKER_JOBS_INTERVAL, 10) : 3000,
        retryLimit: process.env.WORKER_JOBS_RETRY,
        defaultJobDelay: process.env.WORKER_JOBS_DELAY ? parseInt(process.env.WORKER_JOBS_DELAY, 10) : 1000,
    },
    techAdminId: process.env.TECH_ADMIN_ID,
    corporateEmailDomain: process.env.CORPORATE_EMAIL_DOMAIN,
    sectionAchiementId: process.env.SECTION_ACHIEVEMENT_ID,
    sectionAmountForAchievement: process.env.SECTION_AMOUNT_FOR_ACHIEVEMENT,
    deactivateUtcHour: !Number.isNaN(Number(process.env.DEACTIVATE_UTC_HOUR))
        ? Number(process.env.DEACTIVATE_UTC_HOUR)
        : 20,
};
