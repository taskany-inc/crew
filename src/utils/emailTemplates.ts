import {
    User,
    UserCreationRequest,
    Group,
    OrganizationUnit,
    ScheduledDeactivation,
    SupplementalPosition,
} from '@prisma/client';

import { AdditionalDevice } from '../modules/scheduledDeactivationTypes';
import { config } from '../config';
import { UserCreationRequestWithRelations } from '../modules/userCreationRequestTypes';

import { getOrgUnitTitle } from './organizationUnit';
import { defaultLocale } from './getLang';
import { formatDate } from './dateTime';
import { tr } from './utils.i18n';

export const userCreationMailText = (name: string, link: string) => `${tr('Hello colleagues!')}

${tr('Please look at profile creation request for {userName}', { userName: name })}
            
${process.env.NEXTAUTH_URL}${link}
            
${tr('Sincerely,')}
HR-team!`;

const tableTemplate = (data: { title: string; content: string }[]) => `
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
    ${data
        .map(
            ({ title, content }) => ` <tr>
            <th>${title}</th>
            <td>${content}</td>
        </tr>`,
        )
        .join('')}
    </table>
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

export const scheduledDeactivationEmailHtml = (data: {
    data: ScheduledDeactivation & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    workEmail?: string;
}) =>
    tableTemplate([
        { title: tr('Date'), content: formatDate(data.data.deactivateDate, defaultLocale) },
        { title: tr('Full name'), content: data.data.user?.name || '' },
        { title: tr('Location'), content: data.data.location },
        { title: tr('Unit'), content: data.unitId },
        { title: tr('Role'), content: data.role },
        { title: tr('Work email'), content: data.workEmail || '' },
        { title: tr('Email'), content: data.data.email },
        { title: tr('Teamlead'), content: data.teamlead },
        {
            title: tr('Work mode and workplace'),
            content: `${data.data.workMode} ${data.data.workPlace ? `, ${data.data.workPlace}` : ''} `,
        },
        { title: tr('Devices'), content: devicesToTable(data.data.devices as Record<'name' | 'id', string>[]) },
        {
            title: tr('Testing devices'),
            content: devicesToTable(
                data.data.testingDevices as Record<'name' | 'id', string>[],
                tr('Did not take any'),
            ),
        },
        { title: tr('Screenshot'), content: tr('In attachment') },
        { title: tr('Comments'), content: data.data.comments ? data.data.comments.replace(/\n/g, '<br/>') : '' },
    ]);

export const scheduledTransferEmailHtml = (data: {
    data: ScheduledDeactivation & { user: { name: string | null } | null };
    unitId: string;
    teamlead: string;
    role: string;
    transferFrom: string;
    transferTo: string;
    lineManagers?: string;
    coordinators?: string;
    workEmail?: string;
    applicationForReturnOfEquipment?: string;
}) =>
    tableTemplate([
        { title: tr('Date'), content: formatDate(data.data.deactivateDate, defaultLocale) },
        { title: tr('Full name'), content: data.data.user?.name || '' },
        { title: tr('Transfer from'), content: data.transferFrom },
        { title: tr('Transfer to'), content: data.transferTo },
        { title: tr('Location'), content: data.data.location },
        { title: tr('Unit Id'), content: data.unitId },
        { title: tr('Role'), content: data.role },
        { title: tr('Work email'), content: data.workEmail || '' },
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
        { title: tr('Devices'), content: devicesToTable(data.data.devices as Record<'name' | 'id', string>[]) },
        { title: tr('Application for return of equipment'), content: data.applicationForReturnOfEquipment || '' },
        { title: tr('Screenshot'), content: tr('In attachment') },
        { title: tr('Comments'), content: data.data.comments ? data.data.comments.replace(/\n/g, '<br/>') : '' },
    ]);

export const htmlUserCreationRequestWithDate = (data: {
    userCreationRequest: UserCreationRequestWithRelations;
    date: Date;
}) => {
    const { userCreationRequest, date } = data;
    return tableTemplate([
        { title: tr('Start date'), content: formatDate(date, defaultLocale) },
        { title: tr('Name'), content: userCreationRequest.name },
        { title: tr('Role'), content: userCreationRequest.title || '' },
        { title: tr('Location'), content: userCreationRequest.location || '' },
        { title: tr('Unit Id'), content: userCreationRequest.unitId || '' },
        {
            title: tr('Organizaion'),
            content:
                userCreationRequest.supplementalPositions.length === 1
                    ? getOrgUnitTitle(userCreationRequest.supplementalPositions[0].organizationUnit)
                    : `(${tr('employment in')} ${data.userCreationRequest.supplementalPositions
                          .sort((a, b) => Number(b.main) - Number(a.main))
                          .map((o) => `${getOrgUnitTitle(o.organizationUnit)}`)
                          .join(' + ')})`,
        },

        {
            title: tr('Email'),
            content: userCreationRequest.workEmail
                ? `${userCreationRequest.corporateEmail || userCreationRequest.email} / ${
                      userCreationRequest.workEmail
                  }`
                : userCreationRequest.corporateEmail || userCreationRequest.email,
        },
        { title: tr('Personal mail'), content: userCreationRequest.personalEmail || '' },
        { title: tr('Team'), content: userCreationRequest.group ? userCreationRequest.group.name : '' },
        { title: tr('Teamlead'), content: userCreationRequest.supervisor?.name || '' },
        { title: tr('Recruiter'), content: userCreationRequest.recruiter?.name || '' },
        { title: tr('Buddy'), content: userCreationRequest.buddy?.name || '' },
        {
            title: tr('Coordinator'),
            content: userCreationRequest.coordinators?.map(({ name }) => name).join(', ') || '',
        },
        {
            title: tr('Line manager'),
            content: userCreationRequest.lineManagers?.map(({ name }) => name).join(', ') || '',
        },
        { title: tr('Organizaion'), content: getOrgUnitTitle(userCreationRequest.organization) },
        { title: tr('Equipment'), content: userCreationRequest.equipment || '' },
        { title: tr('Work space request'), content: userCreationRequest.workSpace || '' },
        { title: tr('Extra equipment'), content: userCreationRequest.extraEquipment || '' },
        {
            title: `${tr('Corporate email needed')} ${config.corporateEmailDomain || ''}`,
            content: userCreationRequest.corporateEmail || tr('No'),
        },
        { title: tr('Work mode'), content: userCreationRequest.workMode || '' },
        { title: tr('Work mode comment'), content: userCreationRequest.workModeComment || '' },
        {
            title: tr('Comments'),
            content: userCreationRequest.comment ? userCreationRequest.comment.replace(/\n/g, '<br/>') : '',
        },
    ]);
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
    tableTemplate([
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
    ]);

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
    tableTemplate([
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
    ]);

export const newcomerSubject = (data: {
    userCreationRequest: UserCreationRequest & {
        supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
    };
    name: string;
    phone: string;
    intern?: boolean;
}) => {
    if (data.userCreationRequest.supplementalPositions.length === 1) {
        return `${data.userCreationRequest.creationCause === 'transfer' ? tr('Transfer') : tr('Employment')} ${
            data.intern ? tr('intern ') : ''
        }${data.userCreationRequest.supplementalPositions
            .map((o) => `${getOrgUnitTitle(o.organizationUnit)}`)
            .join(', ')} ${data.name}  (${data.phone})`;
    }

    const sameDate = data.userCreationRequest.supplementalPositions
        .map(({ workStartDate }) => workStartDate)
        .every((val, _index, arr) => val === arr[0]);

    return `${data.userCreationRequest.creationCause === 'transfer' ? tr('Transfer') : tr('Employment')} ${tr(
        'part-time',
    )} (${tr('employment in')} ${data.userCreationRequest.supplementalPositions
        .sort((a, b) => Number(b.main) - Number(a.main))
        .map(
            (o) =>
                `${getOrgUnitTitle(o.organizationUnit)} ${
                    o.workStartDate && !sameDate ? formatDate(o.workStartDate, defaultLocale) : ''
                }`,
        )
        .join(' + ')}) ${data.name} (${data.phone})`;
};
