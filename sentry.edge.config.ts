import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    if (process.env.NODE_ENV === 'production') {
        Sentry.init({
            dsn: SENTRY_DSN,
            tracesSampleRate: 1.0,
            release: process.env.SENTRY_RELEASE,
        });
    }
}
