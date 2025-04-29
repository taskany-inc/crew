import { UserCreationRequest, OrganizationUnit, ScheduledDeactivation, SupplementalPosition } from '@prisma/client';
import { ICalCalendarMethod } from 'ical-generator';

import { AdditionalDevice } from '../modules/scheduledDeactivationTypes';
import { userMethods } from '../modules/userMethods';
import { groupMethods } from '../modules/groupMethods';
import { UserCreationRequestType, UserCreationRequestWithRelations } from '../modules/userCreationRequestTypes';
import { calendarEvents, createIcalEventData, sendMail, nodemailerAttachments } from '../modules/nodemailer';
import { config } from '../config';

import { defaultLocale } from './getLang';
import { formatDate } from './dateTime';
import { tr } from './utils.i18n';
import { db } from './db';
import { Links } from './links';
import { corporateDomain, findSigmaMail } from './organizationalDomains';
import { userCreationRequestPhone } from './createUserCreationRequest';

export const userCreationMailText = (name: string, link: string) => `${tr('Hello colleagues!')}

${tr('Please look at profile creation request for {userName}', { userName: name })}
            
${process.env.NEXTAUTH_URL}${link}
            
${tr('Sincerely,')}
HR-team!`;

const tableTemplate = (data: { tableArray: { title: string; content: string }[]; dzoMail?: boolean }) => `
<head>
    <style>
        body { -webkit-text-size-adjust:none; font-size: 11px; }
        table { border-collapse: collapse; font-size: 16px; margin-top: 8px; margin-bottom: 8px; }
        th { text-align: left; }
    </style>
</head>        
<body>
    ${tr('The meeting is for informational purposes only.')}<br/>
    <table border='1' cellpadding='8'>
    ${data.tableArray
        .map(
            ({ title, content }) => ` <tr>
            <th>${title}</th>
            <td>${content}</td>
        </tr>`,
        )
        .join('')}
    </table>
    ${data.dzoMail ? '#DZOmail' : ''}
</body>
`;

const devicesToTable = (devices?: Record<'name' | 'id', string>[], fallback = '') => `
${
    !devices || !devices.length
        ? fallback
        : devices
              .map(
                  (d: AdditionalDevice) =>
                      '<tr>' +
                      '<th></th>' +
                      `<td style="font-weight:bold">${tr('Device name')}</td>` +
                      '</tr>' +
                      '<tr>' +
                      '<th></th>' +
                      `<td>${d.name}</td>` +
                      '</tr>' +
                      '<tr>' +
                      '<th></th>' +
                      `<td style="font-weight:bold">${tr('Device id')}</td>` +
                      '</tr>' +
                      '<tr>' +
                      '<th></th>' +
                      `<td>${d.id}</td>` +
                      '</tr>',
              )
              .join('')
}
`;

export const scheduledDeactivationFromMainEmailHtml = (data: {
    data: (UserCreationRequest | ScheduledDeactivation) & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    sigmaMail?: string;
    corporateAppName: string;
    date: Date;
    workPlace: string | null;
    comment: string | null;
}) => {
    return tableTemplate({
        tableArray: [
            { title: tr('Dismissal date'), content: formatDate(data.date, defaultLocale) },
            { title: tr('Employee full name'), content: data.data.user?.name || '' },
            { title: tr('Location'), content: data.data.location || '' },
            { title: tr('Unit Id'), content: data.unitId },
            { title: tr('Role'), content: data.role },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: tr('Teamlead'), content: data.teamlead },
            {
                title: tr('Work mode and workplace'),
                content: `${data.data.workMode} ${data.workPlace ? `, ${data.workPlace}` : ''} `,
            },
            {
                title: tr('Testing devices'),
                content: devicesToTable(
                    data.data.testingDevices as Record<'name' | 'id', string>[],
                    tr('Did not take any'),
                ),
            },
            {
                title: tr('Devices from personal account {corpAppName} in text format', {
                    corpAppName: data.corporateAppName,
                }),
                content: devicesToTable(data.data.devices as Record<'name' | 'id', string>[]),
            },
            {
                title: tr('Application for return of equipment'),
                content: data.data.applicationForReturnOfEquipment || '',
            },
            {
                title: tr('Screenshot or photo from personal account {corpAppName}', {
                    corpAppName: data.corporateAppName,
                }),
                content: tr('In attachment'),
            },
            { title: tr('Comments'), content: data.comment ? data.comment.replace(/\n/g, '<br/>') : '' },
        ],
    });
};

export const scheduledDeactivationFromNotMainEmailHtml = async (data: {
    data: (UserCreationRequest | ScheduledDeactivation) & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    sigmaMail?: string;
    corporateMail?: string;
    corporateAppName: string;
    workPlace: string | null;
    date: Date;
    comment: string | null;
}) => {
    const corpDomain = await corporateDomain();

    return tableTemplate({
        tableArray: [
            { title: tr('Dismissal date'), content: formatDate(data.date, defaultLocale) },
            { title: tr('Employee full name'), content: data.data.user?.name || '' },
            { title: tr('Location'), content: data.data.location || '' },
            { title: 'UIN', content: data.unitId },
            { title: tr('Role'), content: data.role },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: `${tr('Email')} ${corpDomain}`, content: data.corporateMail || '' },
            { title: tr('Teamlead'), content: data.teamlead },
            {
                title: tr('Work mode and workplace'),
                content: `${data.data.workMode}${data.workPlace ? `, ${data.workPlace}` : ''} `,
            },
            {
                title: tr('Testing devices'),
                content: devicesToTable(
                    data.data.testingDevices as Record<'name' | 'id', string>[],
                    tr('Did not take any'),
                ),
            },
            {
                title: tr('Devices from personal account {corpAppName} in text format', {
                    corpAppName: data.corporateAppName,
                }),
                content: devicesToTable(data.data.devices as Record<'name' | 'id', string>[]),
            },
            {
                title: tr('Application for return of equipment'),
                content: data.data.applicationForReturnOfEquipment || '',
            },
            {
                title: tr('Screenshot or photo from personal account {corpAppName}', {
                    corpAppName: data.corporateAppName,
                }),
                content: tr('In attachment'),
            },
            { title: tr('Comments'), content: data.comment ? data.comment.replace(/\n/g, '<br/>') : '' },
        ],
        dzoMail: true,
    });
};

export const scheduledTransferEmailHtml = (data: {
    data: (UserCreationRequest | ScheduledDeactivation) & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    transferFrom: string;
    transferTo: string;
    corporateAppName: string;
    lineManagers?: string;
    coordinators?: string;
    sigmaMail?: string;
    applicationForReturnOfEquipment?: string;
    date: Date;
    workPlace: string | null;
    comment: string | null;
}) =>
    tableTemplate({
        tableArray: [
            { title: tr('Transfer date'), content: formatDate(data.date, defaultLocale) },
            { title: tr('Employee full name'), content: data.data.user?.name || '' },
            { title: tr('Transfer from'), content: data.transferFrom },
            { title: tr('Transfer to'), content: data.transferTo },
            { title: tr('Location'), content: data.data.location || '' },
            { title: tr('Unit Id'), content: data.unitId },
            { title: tr('Role'), content: data.role },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: tr('Teamlead'), content: data.teamlead },
            { title: tr('Line managers'), content: data.lineManagers || '' },
            { title: tr('Coordinator'), content: data.coordinators || '' },
            {
                title: tr('Work mode and workplace'),
                content: `${data.data.workMode} ${data.workPlace ? `, ${data.workPlace}` : ''} `,
            },
            {
                title: tr('Testing devices'),
                content: devicesToTable(
                    data.data.testingDevices as Record<'name' | 'id', string>[],
                    tr('Did not take any'),
                ),
            },
            {
                title: tr('Devices from personal account {corpAppName} in text format', {
                    corpAppName: data.corporateAppName,
                }),
                content: devicesToTable(data.data.devices as Record<'name' | 'id', string>[]),
            },
            { title: tr('Application for return of equipment'), content: data.applicationForReturnOfEquipment || '' },
            {
                title: tr('Screenshot or photo from personal account {corpAppName}', {
                    corpAppName: data.corporateAppName,
                }),
                content: tr('In attachment'),
            },
            { title: tr('Comments'), content: data.comment ? data.comment.replace(/\n/g, '<br/>') : '' },
        ],
    });

export const newComerNotInMainEmailHtml = async (data: {
    userCreationRequest: UserCreationRequestWithRelations;
    date: Date;
}) => {
    const { userCreationRequest, date } = data;

    const notMainOrgIds = [
        userCreationRequest.organizationUnitId,
        ...userCreationRequest.supplementalPositions.reduce((acc: string[], rec) => {
            if (rec.organizationUnit.main) return acc;
            return [...acc, rec.organizationUnit.id];
        }, []),
    ];

    const domainIds = (
        await db
            .selectFrom('_OrganizationDomainToOrganizationUnit')
            .select('A')
            .where('B', 'in', notMainOrgIds)
            .execute()
    ).map((d) => d.A);

    const domains = domainIds.length
        ? (await db.selectFrom('OrganizationDomain').select('domain').where('id', 'in', domainIds).execute()).map(
              (d) => d.domain,
          )
        : [];

    const links = await db
        .selectFrom('Link')
        .selectAll()
        .where('name', 'in', [Links.GoalSettingsInfoOnProbation, Links.OnePagerForNewcomerLeads])
        .execute();

    return tableTemplate({
        tableArray: [
            { title: tr('Start date'), content: formatDate(date, defaultLocale) },
            { title: tr('Employee full name'), content: userCreationRequest.name },
            { title: tr('Personal mail'), content: userCreationRequest.personalEmail || '' },
            { title: tr('Team'), content: userCreationRequest.group ? userCreationRequest.group.name : '' },
            { title: tr('Role'), content: userCreationRequest.title || '' },
            { title: tr('Location'), content: userCreationRequest.location || '' },
            { title: 'UIN', content: userCreationRequest.unitId || '' },
            {
                title: tr('Organizaion'),
                content:
                    userCreationRequest.supplementalPositions.length === 1
                        ? userCreationRequest.supplementalPositions[0].organizationUnit.name
                        : `(${tr('Part-timer')} ${data.userCreationRequest.supplementalPositions
                              .sort((a, b) => Number(b.main) - Number(a.main))
                              .map((o) => `${o.organizationUnit.name}`)
                              .join(' + ')})`,
            },
            { title: tr('Teamlead'), content: userCreationRequest.supervisor?.name || '' },
            { title: tr('Buddy'), content: userCreationRequest.buddy?.name || '' },
            {
                title: tr('Coordinator'),
                content: userCreationRequest.coordinators?.map(({ name }) => name).join(', ') || '',
            },
            { title: tr('Recruiter'), content: userCreationRequest.recruiter?.name || '' },
            {
                title: tr('Work mode and workplace'),
                content: userCreationRequest.workMode || '',
            },
            { title: tr('Equipment'), content: userCreationRequest.equipment || '' },
            { title: tr('Extra equipment'), content: userCreationRequest.extraEquipment || '' },
            ...domains.map((domain) => ({
                title: `${tr('Prepare email')} ${domain}`,
                content: tr('Yes'),
            })),
            {
                title: tr('Useful info for supervisor'),
                content: links
                    .map((link) => {
                        const linkName = link.name as
                            | Links.GoalSettingsInfoOnProbation
                            | Links.OnePagerForNewcomerLeads;

                        return `<tr><th></th><td><a href="${link.url}">${tr(linkName)}<a/></td></tr>`;
                    })
                    .join(''),
            },
            {
                title: tr('Comments'),
                content: userCreationRequest.comment ? userCreationRequest.comment.replace(/\n/g, '<br/>') : '',
            },
        ].filter(({ title }) => !!title),
        dzoMail: true,
    });
};

export const newComerInMainEmailHtml = async (data: {
    userCreationRequest: UserCreationRequestWithRelations;
    date: Date;
}) => {
    const { userCreationRequest, date } = data;

    const links = await db
        .selectFrom('Link')
        .selectAll()
        .where('name', 'in', [Links.GoalSettingsInfoOnProbation, Links.OnePagerForNewcomerLeads])
        .execute();

    return tableTemplate({
        tableArray: [
            { title: tr('Start date'), content: formatDate(date, defaultLocale) },
            { title: tr('Employee full name'), content: userCreationRequest.name },
            { title: tr('Role'), content: userCreationRequest.title || '' },
            { title: tr('Location'), content: userCreationRequest.location || '' },
            { title: tr('Unit Id'), content: userCreationRequest.unitId || '' },
            {
                title: tr('Organizaion'),
                content:
                    userCreationRequest.supplementalPositions.length === 1
                        ? userCreationRequest.supplementalPositions[0].organizationUnit.name
                        : `(${tr('Part-timer')} ${data.userCreationRequest.supplementalPositions
                              .sort((a, b) => Number(b.main) - Number(a.main))
                              .map((o) => `${o.organizationUnit.name}`)
                              .join(' + ')})`,
            },
            { title: tr('Teamlead'), content: userCreationRequest.supervisor?.name || '' },
            { title: tr('Buddy'), content: userCreationRequest.buddy?.name || '' },
            {
                title: tr('Coordinator'),
                content: userCreationRequest.coordinators?.map(({ name }) => name).join(', ') || '',
            },
            { title: tr('Recruiter'), content: userCreationRequest.recruiter?.name || '' },
            {
                title: tr('Work mode and workplace'),
                content: userCreationRequest.workMode || '',
            },
            { title: tr('Equipment'), content: userCreationRequest.equipment || '' },
            {
                title: tr('Application for organizing a workplace and ordering equipment'),
                content: userCreationRequest.workSpace || '',
            },
            { title: tr('Extra equipment'), content: userCreationRequest.extraEquipment || '' },
            {
                title: tr('Useful info for supervisor'),
                content: links
                    .map((link) => {
                        const linkName = link.name as
                            | Links.GoalSettingsInfoOnProbation
                            | Links.OnePagerForNewcomerLeads;

                        return `<tr><th></th><td><a href="${link.url}">${tr(linkName)}<a/></td></tr>`;
                    })
                    .join(''),
            },
            {
                title: tr('Comments'),
                content: userCreationRequest.comment ? userCreationRequest.comment.replace(/\n/g, '<br/>') : '',
            },
        ],
        dzoMail: userCreationRequest.supplementalPositions.length > 1,
    });
};

export const transferNewcomerFromMainEmailHtml = async (data: {
    userCreationRequest: UserCreationRequestWithRelations;
    date: Date;
    transferFrom: string;
    transferTo: string;
    sigmaMail?: string;
}) => {
    const { userCreationRequest, date, transferFrom, transferTo, sigmaMail } = data;

    const link = await db
        .selectFrom('Link')
        .selectAll()
        .where('name', '=', Links.GoalSettingsInfo)
        .executeTakeFirstOrThrow();

    return tableTemplate({
        tableArray: [
            { title: tr('Transfer date'), content: formatDate(date, defaultLocale) },
            { title: tr('Employee full name'), content: userCreationRequest.name },
            {
                title: tr('Transfer from'),
                content: transferFrom,
            },
            {
                title: tr('Transfer to'),
                content: transferTo,
            },
            { title: tr('Location'), content: userCreationRequest.location || '' },
            { title: tr('Unit Id'), content: userCreationRequest.unitId || '' },
            { title: tr('Role'), content: userCreationRequest.title || '' },
            { title: tr('SIGMA email'), content: sigmaMail || '' },
            { title: tr('Teamlead'), content: userCreationRequest.supervisor?.name || '' },
            {
                title: tr('Coordinator'),
                content: userCreationRequest.coordinators?.map(({ name }) => name).join(', ') || '',
            },
            { title: tr('Recruiter'), content: userCreationRequest.recruiter?.name || '' },
            {
                title: tr('Work mode and workplace'),
                content: userCreationRequest.workMode || '',
            },
            {
                title: tr('Application for organizing a workplace and ordering equipment'),
                content: userCreationRequest.workSpace || '',
            },
            {
                title: tr('Useful info for supervisor'),
                content: `<a href="${link.url}">${tr(Links.GoalSettingsInfo)}<a/>`,
            },
            {
                title: tr('Comments'),
                content: userCreationRequest.comment ? userCreationRequest.comment.replace(/\n/g, '<br/>') : '',
            },
        ],
    });
};

export const htmlToDecreeRequest = (data: {
    userCreationRequest: UserCreationRequestWithRelations;
    corporateAppName: string;
    sigmaMail?: string;
}) =>
    tableTemplate({
        tableArray: [
            {
                title: tr('Date'),
                content: data.userCreationRequest.date ? formatDate(data.userCreationRequest.date, defaultLocale) : '',
            },
            { title: tr('Name'), content: data.userCreationRequest.name || '' },
            { title: tr('Location'), content: data.userCreationRequest.location || '' },
            { title: tr('Unit'), content: data.userCreationRequest.unitId || '' },
            { title: tr('Role'), content: data.userCreationRequest.title || '' },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: tr('Teamlead'), content: data.userCreationRequest.supervisor?.name ?? '' },
            { title: tr('Work mode and workplace'), content: data.userCreationRequest.workMode || '' },
            {
                title: tr('Testing devices'),
                content: data.userCreationRequest.extraEquipment
                    ? data.userCreationRequest.extraEquipment.replace(/\n/g, '<br/>')
                    : tr('Did not take any'),
            },
            {
                title: tr('Devices from personal account {corpAppName} in text format', {
                    corpAppName: data.corporateAppName || '',
                }),
                content: data.userCreationRequest.equipment
                    ? data.userCreationRequest.equipment.replace(/\n/g, '<br/>')
                    : tr('Did not take any'),
            },
            { title: tr('Screenshot'), content: tr('In attachment') },
            {
                title: tr('Comments'),
                content: data.userCreationRequest.comment
                    ? data.userCreationRequest.comment.replace(/\n/g, '<br/>')
                    : '',
            },
        ],
    });

export const htmlFromDecreeRequest = (data: UserCreationRequestWithRelations) =>
    tableTemplate({
        tableArray: [
            { title: tr('Date'), content: data.date ? formatDate(data.date, defaultLocale) : '' },
            { title: tr('Name'), content: data.name || '' },
            { title: tr('Role'), content: data.title || '' },
            { title: tr('Location'), content: data.location || '' },
            { title: tr('Unit'), content: data.unitId || '' },
            { title: tr('Teamlead'), content: data.supervisor?.name ?? '' },
            { title: tr('Coordinator'), content: data.coordinators?.map(({ name }) => name).join(', ') || '' },
            { title: tr('Work mode and workplace'), content: data.workMode || '' },
            { title: tr('Equipment'), content: data.equipment || '' },
            { title: tr('Extra equipment'), content: data.extraEquipment || '' },
            { title: tr('Comments'), content: data.comment ? data.comment.replace(/\n/g, '<br/>') : '' },
        ],
    });

export const newcomerSubject = (data: {
    userCreationRequest: UserCreationRequest & {
        supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
    };
    name: string;
    phone: string;
    intern?: boolean;
    transferFrom?: string;
}) => {
    if (data.userCreationRequest.supplementalPositions.length === 1) {
        return `${
            data.userCreationRequest.creationCause === 'transfer'
                ? `${tr('Transfer')} ${tr('from')} ${data.transferFrom || ''}`
                : tr('Employment')
        } ${data.intern ? tr('intern ') : ''}${data.userCreationRequest.supplementalPositions
            .map((o) => `${o.organizationUnit.name}`)
            .join(', ')} ${data.name}  (${data.phone})`;
    }

    const sameDate = data.userCreationRequest.supplementalPositions
        .map(({ workStartDate }) => {
            return workStartDate && new Date(workStartDate).toDateString();
        })
        .every((val, _index, arr) => val === arr[0]);

    return `${
        data.userCreationRequest.creationCause === 'transfer'
            ? `${tr('Transfer')} ${tr('from')} ${data.transferFrom || ''}`
            : tr('Employment')
    } ${tr('part-time')} (${tr('employment in')} ${data.userCreationRequest.supplementalPositions
        .sort((a, b) => Number(b.main) - Number(a.main))
        .map(
            (o) =>
                `${o.organizationUnit.name} ${
                    o.workStartDate && !sameDate ? formatDate(o.workStartDate, defaultLocale) : ''
                }`,
        )
        .join(' + ')}) ${data.name} (${data.phone})`;
};

export const transferInternToStaffEmailHtml = (data: {
    request: UserCreationRequest;
    transferFrom: string;
    transferTo: string;
    sigmaMail?: string;
    corporateAppName: string | null;
    supervisorName: string;
}) => {
    const { request, transferFrom, transferTo, sigmaMail } = data;

    return tableTemplate({
        tableArray: [
            {
                title: tr('Transfer employee date'),
                content: request.date ? formatDate(request.date, defaultLocale) : '',
            },
            { title: tr('Employee full name'), content: request.name },
            {
                title: tr('Transfer from'),
                content: transferFrom,
            },
            {
                title: tr('Transfer to'),
                content: transferTo,
            },
            {
                title: tr('Work mode'),
                content: request.workMode || '',
            },
            { title: tr('Workplace'), content: request.workSpace || '' },
            { title: tr('Location'), content: request.location || '' },
            { title: tr('SIGMA email'), content: sigmaMail || '' },
            { title: tr('Unit Id'), content: request.unitId || '' },
            { title: tr('Teamlead'), content: data.supervisorName || '' },
            {
                title: tr('Testing devices'),
                content: devicesToTable(
                    data.request.testingDevices as Record<'name' | 'id', string>[],
                    tr('Did not take any'),
                ),
            },
            {
                title: tr('Devices from personal account {corpAppName} in text format', {
                    corpAppName: data.corporateAppName || '',
                }),
                content: devicesToTable(data.request.devices as Record<'name' | 'id', string>[]),
            },
            {
                title: tr('Application for moving worskspace/return of equipment'),
                content: data.request.applicationForReturnOfEquipment || '',
            },
            {
                title: tr('Comments'),
                content: request.comment ? request.comment.replace(/\n/g, '<br/>') : '',
            },
            {
                title: tr('Screenshot or photo from personal account {corpAppName}', {
                    corpAppName: data.corporateAppName || '',
                }),
                content: tr('In attachment'),
            },
        ],
    });
};

interface SendNewcomerEmails {
    request: UserCreationRequestWithRelations;
    sessionUserId: string;
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL;
    newOrganizationIds?: string[];
}

export const sendNewCommerEmails = async ({
    request,
    sessionUserId,
    method,
    newOrganizationIds,
}: SendNewcomerEmails) => {
    const mainOrganization = await db
        .selectFrom('OrganizationUnit')
        .select('name')
        .where('main', '=', true)
        .executeTakeFirstOrThrow();

    const groups =
        request.creationCause === 'transfer' && request.groupId
            ? `> ${(await groupMethods.getBreadcrumbs(request.groupId)).map(({ name }) => name).join('>')}`
            : '';

    return Promise.all(
        request.supplementalPositions.map(async ({ organizationUnitId, workStartDate, main }) => {
            if (!workStartDate) return;

            if (
                method === ICalCalendarMethod.CANCEL &&
                newOrganizationIds &&
                newOrganizationIds.includes(organizationUnitId)
            ) {
                return;
            }

            const additionalEmails = [sessionUserId];

            if (request.creatorId && request.creatorId !== sessionUserId) additionalEmails.push(request.creatorId);

            if (request.supervisorId && main) additionalEmails.push(request.supervisorId);

            if (request.buddyId && main) additionalEmails.push(request.buddyId);

            const { users, to } = await userMethods.getMailingList(
                'createScheduledUserRequest',
                [organizationUnitId],
                additionalEmails,
                !!request.workSpace,
            );

            const transferFrom = `${mainOrganization.name} (${request.transferFromGroup || ''})`;

            const subject = newcomerSubject({
                userCreationRequest: request,
                phone: userCreationRequestPhone(request),
                name: request.name,
                intern: !!request.supplementalPositions.find(({ intern }) => intern),
                transferFrom,
            });

            const date = new Date(workStartDate);

            request.creationCause === 'transfer'
                ? date.setUTCHours(config.employmentUtcHour + 1)
                : date.setUTCHours(config.employmentUtcHour);

            let icalEventId = request.id + config.nodemailer.authUser + organizationUnitId;

            if (request.type === UserCreationRequestType.transferInside) icalEventId += 'newcomerMail';

            const icalEvent = createIcalEventData({
                id: icalEventId,
                start: date,
                duration: 30,
                users,
                summary: subject,
                description: subject,
            });

            let html = await newComerInMainEmailHtml({
                userCreationRequest: request,
                date,
            });

            if (!request.organization.main) {
                html = await newComerNotInMainEmailHtml({
                    userCreationRequest: request,
                    date,
                });
            }

            if (request.creationCause === 'transfer') {
                const transferFrom = `${mainOrganization.name} ${
                    request.transferFromGroup ? `> ${request.transferFromGroup}` : ''
                }`;

                const transferTo = `${request.organization.name} ${groups}`;
                const sigmaMail = await findSigmaMail([request.workEmail, request.email, request.personalEmail]);

                html = await transferNewcomerFromMainEmailHtml({
                    userCreationRequest: request,
                    date,
                    transferFrom,
                    transferTo,
                    sigmaMail,
                });
            }

            sendMail({
                to,
                subject,
                html,
                icalEvent: calendarEvents({
                    method,
                    events: [icalEvent],
                }),
            });
        }),
    );
};

export const sendDecreeEmails = async ({
    request,
    sessionUserId,
    method,
    newOrganizationIds,
}: {
    request: UserCreationRequestWithRelations;
    sessionUserId: string;
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL;
    newOrganizationIds?: string[];
}) => {
    const appConfig = await db.selectFrom('AppConfig').select('corporateAppName').executeTakeFirstOrThrow();
    const { corporateAppName } = appConfig;

    const sigmaMail = await findSigmaMail([request.email, request.workEmail, request.personalEmail]);
    const phone = userCreationRequestPhone(request);

    if (!request.date) return;

    const date = new Date(request.date);
    date.setUTCHours(config.employmentUtcHour);

    return Promise.all(
        request.supplementalPositions.map(async ({ organizationUnitId, main }) => {
            if (
                method === ICalCalendarMethod.CANCEL &&
                newOrganizationIds &&
                newOrganizationIds.includes(organizationUnitId)
            ) {
                return;
            }

            const additionalEmails = [sessionUserId];

            if (request.creatorId && request.creatorId !== sessionUserId) additionalEmails.push(request.creatorId);
            if (request.supervisorId && main) additionalEmails.push(request.supervisorId);

            const { users, to } = await userMethods.getMailingList('decree', [organizationUnitId], additionalEmails);

            const orgUnit = await db
                .selectFrom('OrganizationUnit')
                .select('name')
                .where('id', '=', organizationUnitId)
                .executeTakeFirst();

            const subjectCase =
                request.type === UserCreationRequestType.fromDecree ? tr('From decree') : tr('To decree');
            const subject = `${subjectCase} ${orgUnit?.name} ${request.name} ${phone}`;

            const icalEventId = `${request.id + config.nodemailer.authUser + organizationUnitId}decreeMail`;

            const icalEvent = createIcalEventData({
                id: icalEventId,
                start: date,
                duration: 30,
                users,
                summary: subject,
                description: subject,
            });

            const html =
                request.type === UserCreationRequestType.fromDecree
                    ? htmlFromDecreeRequest(request)
                    : htmlToDecreeRequest({
                          userCreationRequest: request,
                          corporateAppName: corporateAppName ?? '',
                          sigmaMail,
                      });

            const attachments = await nodemailerAttachments(request.attaches ?? []);

            sendMail({
                to,
                subject,
                html,
                attachments,
                icalEvent: calendarEvents({
                    method,
                    events: [icalEvent],
                }),
            });
        }),
    );
};
