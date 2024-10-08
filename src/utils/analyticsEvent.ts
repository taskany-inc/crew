import { userAgentFromString } from 'next/server';

import { TrpcContext } from '../trpc/trpcContext';

type EventType = 'pageview' | 'click' | 'searchQuery' | 'userRequestCreate' | 'userActiveUpdate' | 'groupCreate';
export interface AnalyticsEvent {
    event_type: EventType;
    event_properties: {
        service: 'crew';
        time: number;
        user_agent: string;
        url: string;
        host: string;
        appHost: string;
        user_id?: string | number;
        session_id?: string | number;
        path?: string;
        locale?: string;
        [key: string]: string | number | undefined;
    };
    device_type?: string;
    device_brand?: string;
    device_model?: string;
    os_name?: string;
    os_version?: string;
}

const constructEvent = (
    eventType: EventType,
    url: string,
    session: TrpcContext['session'],
    uaHeader?: string,
    additionalData?: Record<string, string>,
) => {
    const parts = url.split('/');
    let locale = parts[3];
    const host = parts[2];
    let path = parts.slice(4).join('/');
    if (!['ru', 'en'].includes(locale)) {
        locale = 'en';
        path = parts.slice(3).join('/');
    }

    const ua = userAgentFromString(uaHeader);

    const params: AnalyticsEvent = {
        event_type: eventType,
        event_properties: {
            service: 'crew',
            user_id: session?.user?.id,
            session_id: session?.expires,
            time: Date.now(),
            user_agent: ua.ua,
            url,
            locale,
            host,
            path,
            appHost: process.env.NEXTAUTH_URL || '',
            ...additionalData,
        },
        device_type: ua.device.type,
        device_brand: ua.device.vendor,
        device_model: ua.device.model,
        os_name: ua.os.name,
        os_version: ua.os.version,
    };

    return params;
};

export const trackEvent = (events: AnalyticsEvent[]) => {
    const telemetryURL = process.env.TELEMETRY_URL;

    if (telemetryURL) {
        fetch(telemetryURL, {
            body: JSON.stringify({ events }),
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }
};

export const processEvent = (
    eventType: EventType,
    url: string,
    session: TrpcContext['session'],
    uaHeader?: string,
    additionalData?: Record<string, string>,
) => {
    const fullEvent = constructEvent(eventType, url, session, uaHeader, additionalData);

    trackEvent([fullEvent]);
};
