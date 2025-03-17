import {
    User,
    UserCreationRequest,
    Group,
    OrganizationUnit,
    ScheduledDeactivation,
    SupplementalPosition,
} from '@prisma/client';

import { AdditionalDevice } from '../modules/scheduledDeactivationTypes';
import { UserCreationRequestWithRelations } from '../modules/userCreationRequestTypes';

import { defaultLocale } from './getLang';
import { formatDate } from './dateTime';
import { tr } from './utils.i18n';
import { db } from './db';
import { Links } from './links';
import { corporateDomain } from './organizationalDomains';

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
    data: ScheduledDeactivation & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    sigmaMail?: string;
    corporateAppName: string;
}) =>
    tableTemplate({
        tableArray: [
            { title: tr('Dismissal date'), content: formatDate(data.data.deactivateDate, defaultLocale) },
            { title: tr('Employee full name'), content: data.data.user?.name || '' },
            { title: tr('Location'), content: data.data.location },
            { title: tr('Unit Id'), content: data.unitId },
            { title: tr('Role'), content: data.role },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: tr('Teamlead'), content: data.teamlead },
            {
                title: tr('Work mode and workplace'),
                content: `${data.data.workMode} ${data.data.workPlace ? `, ${data.data.workPlace}` : ''} `,
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
                title: tr('Screenshot or photo from personal account {corpAppName}', {
                    corpAppName: data.corporateAppName,
                }),
                content: tr('In attachment'),
            },
            {
                title: tr('Application for return of equipment'),
                content: data.data.applicationForReturnOfEquipment || '',
            },
            { title: tr('Comments'), content: data.data.comments ? data.data.comments.replace(/\n/g, '<br/>') : '' },
        ],
    });

export const scheduledDeactivationFromNotMainEmailHtml = async (data: {
    data: ScheduledDeactivation & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    sigmaMail?: string;
    corporateMail?: string;
    corporateAppName: string;
}) => {
    const corpDomain = await corporateDomain();

    return tableTemplate({
        tableArray: [
            { title: tr('Dismissal date'), content: formatDate(data.data.deactivateDate, defaultLocale) },
            { title: tr('Employee full name'), content: data.data.user?.name || '' },
            { title: tr('Location'), content: data.data.location },
            { title: 'UIN', content: data.unitId },
            { title: tr('Role'), content: data.role },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: `${tr('Email')} ${corpDomain}`, content: data.corporateMail || '' },
            { title: tr('Teamlead'), content: data.teamlead },
            {
                title: tr('Work mode and workplace'),
                content: `${data.data.workMode}${data.data.workPlace ? `, ${data.data.workPlace}` : ''} `,
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
                title: tr('Screenshot or photo from personal account {corpAppName}', {
                    corpAppName: data.corporateAppName,
                }),
                content: tr('In attachment'),
            },
            {
                title: tr('Application for return of equipment'),
                content: data.data.applicationForReturnOfEquipment || '',
            },
            { title: tr('Comments'), content: data.data.comments ? data.data.comments.replace(/\n/g, '<br/>') : '' },
        ],
        dzoMail: true,
    });
};

export const scheduledTransferEmailHtml = (data: {
    data: ScheduledDeactivation & { user: { name: string | null } | null };
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
}) =>
    tableTemplate({
        tableArray: [
            { title: tr('Transfer date'), content: formatDate(data.data.deactivateDate, defaultLocale) },
            { title: tr('Employee full name'), content: data.data.user?.name || '' },
            { title: tr('Transfer from'), content: data.transferFrom },
            { title: tr('Transfer to'), content: data.transferTo },
            { title: tr('Location'), content: data.data.location },
            { title: tr('Unit Id'), content: data.unitId },
            { title: tr('Role'), content: data.role },
            { title: tr('SIGMA email'), content: data.sigmaMail || '' },
            { title: tr('Teamlead'), content: data.teamlead },
            { title: tr('Line managers'), content: data.lineManagers || '' },
            { title: tr('Coordinator'), content: data.coordinators || '' },
            {
                title: tr('Work mode and workplace'),
                content: `${data.data.workMode} ${data.data.workPlace ? `, ${data.data.workPlace}` : ''} `,
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
            { title: tr('Comments'), content: data.data.comments ? data.data.comments.replace(/\n/g, '<br/>') : '' },
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

    const domains = (
        await db.selectFrom('OrganizationDomain').select('domain').where('id', 'in', domainIds).execute()
    ).map((d) => d.domain);

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
            { title: tr('Extra equipment'), content: userCreationRequest.extraEquipment || '' },
            {
                title: tr('Application for organizing a workplace and ordering equipment'),
                content: userCreationRequest.workSpace || '',
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

export const htmlToDecreeRequest = (
    data: UserCreationRequest & { group: Group | null } & { supervisor: User | null } & {
        buddy: User | null;
    } & {
        recruiter: User | null;
    } & {
        coordinators: User[] | null;
    } & {
        organization: OrganizationUnit;
    } & {
        lineManagers: User[] | null;
    },
) =>
    tableTemplate({
        tableArray: [
            { title: tr('Date'), content: data.date ? formatDate(data.date, defaultLocale) : '' },
            { title: tr('Name'), content: data.name || '' },
            { title: tr('Location'), content: data.location || '' },
            { title: tr('Unit'), content: data.unitId || '' },
            { title: tr('Role'), content: data.title || '' },
            { title: tr('Corporate Email'), content: data.corporateEmail || '' },
            { title: tr('Teamlead'), content: data.supervisor?.name ?? '' },
            { title: tr('Work mode'), content: data.workMode || '' },
            { title: tr('Equipment'), content: data.equipment || '' },
            { title: tr('Extra equipment'), content: data.extraEquipment || '' },
            { title: tr('Screenshot'), content: tr('In attachment') },
            { title: tr('Comments'), content: data.comment ? data.comment.replace(/\n/g, '<br/>') : '' },
        ],
    });

export const htmlFromDecreeRequest = (
    data: UserCreationRequest & { group: Group | null } & { supervisor: User | null } & {
        buddy: User | null;
    } & {
        recruiter: User | null;
    } & {
        coordinators: User[] | null;
    } & {
        organization: OrganizationUnit;
    } & {
        lineManagers: User[] | null;
    },
) =>
    tableTemplate({
        tableArray: [
            { title: tr('Date'), content: data.date ? formatDate(data.date, defaultLocale) : '' },
            { title: tr('Name'), content: data.name || '' },
            { title: tr('Location'), content: data.location || '' },
            { title: tr('Unit'), content: data.unitId || '' },
            { title: tr('Role'), content: data.title || '' },
            { title: tr('Teamlead'), content: data.supervisor?.name ?? '' },
            { title: tr('Coordinator'), content: data.coordinators?.map(({ name }) => name).join(', ') || '' },
            { title: tr('Work mode'), content: data.workMode || '' },
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
            return workStartDate?.toDateString();
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
