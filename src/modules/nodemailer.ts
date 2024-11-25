import ical, { ICalAttendeeStatus, ICalCalendarMethod, ICalEventData, ICalEventStatus } from 'ical-generator';
import nodemailer from 'nodemailer';

import { config } from '../config';
import { minuteInMiliSeconds } from '../utils/dateTime';

export const transporter = nodemailer.createTransport({
    host: config.nodemailer.host,
    port: Number(config.nodemailer.port),
    secure: Number(config.nodemailer.port) === 465,
    auth: {
        pass: config.nodemailer.authPass,
        user: config.nodemailer.authUser,
    },
});

export interface MessageBody {
    to: string | string[];
    subject: string;
    text?: string;
    from?: string;
    html?: string;
    icalEvent?: string;
    attachments?: Array<{ filename?: string; path?: string; content?: string | Buffer; contentType?: string }>;
}

const message = ({ from = 'Crew', to, subject, text, html, icalEvent, attachments }: MessageBody) => ({
    from: `${from} <${config.nodemailer.authUser}>`,
    to,
    subject,
    text,
    attachments,
    ...(html && { html }),
    ...(icalEvent && { icalEvent: { content: icalEvent } }),
});

export const sendMail = (body: MessageBody) => {
    if (!config.nodemailer.enabled) {
        console.log(`Skipping mail ${body.subject}`);
        return;
    }

    return transporter.sendMail(message(body));
};

interface CalendarEventData {
    method: ICalCalendarMethod;
    events: ICalEventData[];
}
interface CreateIcalEventDTO {
    start: Date;
    duration: number;
    users: { email: string; name?: string }[];
    id: string;
    summary: string;
    description: string;
    location?: string;
    url?: string;
    sequence?: number;
    status?: ICalEventStatus;
    allDay?: boolean;
}

export const createIcalEventData = (data: CreateIcalEventDTO) => {
    const { start, duration, users, ...restData } = data;
    const end = !data.allDay ? new Date(start.getTime() + duration * minuteInMiliSeconds) : undefined;

    const attendees = users.map((user) => ({ ...user, status: ICalAttendeeStatus.ACCEPTED }));

    const icalEventData: ICalEventData = {
        start,
        end,
        attendees,
        organizer: { name: 'Crew', email: config.nodemailer.authUser },
        ...restData,
    };
    return icalEventData;
};

export const calendarEvents = (data: CalendarEventData) => {
    const calendar = ical();
    calendar.method(data.method);

    calendar.prodId({
        company: 'taskany',
        product: 'crew',
        language: 'EN',
    });

    calendar.events(data.events);

    return calendar.toString();
};
