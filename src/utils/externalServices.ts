import { UserService } from 'prisma/prisma-client';

export enum ExternalServiceName {
    Email = 'Email',
    WorkEmail = 'WorkEmail',
    PersonalEmail = 'PersonalEmail',
    Phone = 'Phone',
    Github = 'Github',
    Gitlab = 'Gitlab',
    Telegram = 'Telegram',
    AccountingSystem = 'Accounting system',
    ServiceNumber = 'ServiceNumber',
}

export const findService = (
    type: ExternalServiceName,
    services?: UserService[] | { serviceId: string; serviceName: string }[],
) => services?.find((s) => s.serviceName === type)?.serviceId;
