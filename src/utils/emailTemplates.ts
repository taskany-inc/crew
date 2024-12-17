import {
    User,
    UserCreationRequest,
    Group,
    OrganizationUnit,
    ScheduledDeactivation,
    SupplementalPosition,
} from '@prisma/client';

import {
    AdditionalDevice,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationUser,
} from '../modules/scheduledDeactivationTypes';
import { config } from '../config';

import { getOrgUnitTitle } from './organizationUnit';
import { defaultLocale } from './getLang';
import { formatDate } from './dateTime';
import { tr } from './utils.i18n';

export const userCreationMailText = (name: string, link: string) => `${tr('Hello colleagues!')}

${tr('Please look at profile creation request for {userName}', { userName: name })}
            
${process.env.NEXTAUTH_URL}${link}
            
${tr('Sincerely,')}
HR-team!`;

export const scheduledDeactivationEmailHtml = (data: {
    data: ScheduledDeactivation & ScheduledDeactivationUser & ScheduledDeactivationNewOrganizationUnit;
    unitId: string;
    teamlead: string;
    workEmail?: string;
}) => `
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
        <tr>
            <th>${tr('Date')}</th>
            <td>${formatDate(data.data.deactivateDate, defaultLocale)}</td>
        </tr>
        <tr>
            <th>${tr('Full name')}</th>
            <td>${data.data.user.name}</td>
        </tr>
        <tr>
            <th>${tr('Location')}</th>
            <td>${data.data.location}</td>
        </tr>
        <tr>
            <th>${tr('Unit')}</th>
            <td>${data.unitId}</td>
        </tr>
        <tr>
            <th>${tr('Role')}</th>
            <td>${data.data.user.title}</td>
        </tr>
        <tr>
            <th>${tr('Work email')}</th>
            <td>${data.workEmail}</td>
        </tr>
        <tr>
            <th>${tr('Email')}</th>
            <td>${data.data.email}</td>
        </tr>
        <tr>
            <th>${tr('Teamlead')}</th>
            <td>${data.teamlead}</td>
        </tr>
        <tr>
            <th>${tr('Work mode and workplace')}</th>
            <td>
                ${data.data.workMode}
                ${data.data.workPlace ? `, ${data.data.workPlace}` : ''}
            </td>
        </tr>
    ${
        data.data.type === 'transfer'
            ? `
        <tr>
            <th>${tr('Transfer from, role')}</th>
            <td>${data.data.organizationalGroup}, ${data.data.organizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Transfer to, role')}</th>
            <td>${data.data.newOrganizationalGroup}, ${data.data.newOrganizationRole}</td>
        </tr>
    `
            : ''
    }
        <tr>
            <th>${tr('Devices')}</th>
            <td></td>
        </tr>
    ${
        (data.data.devices as Record<'name' | 'id', string>[])
            ?.map(
                (d: AdditionalDevice) =>
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device name')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.name}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device id')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.id}</td>` +
                    '</tr>',
            )
            .join('') || ''
    }
        <tr>
            <th>${tr('Testing devices')}</th>
            <td></td>
        </tr>
    ${
        (data.data.testingDevices as Record<'name' | 'id', string>[])
            ?.map(
                (d: AdditionalDevice) =>
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device name')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.name}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${tr('Device id')}</td>` +
                    '</tr>' +
                    '<tr>' +
                    '<th></th>' +
                    `<td>${d.id}</td>` +
                    '</tr>',
            )
            .join('') || tr('Did not take any')
    }
        <tr>
            <th>${tr('Comments')}</th>
            <td>${data.data.comments ? data.data.comments.replace(/\n/g, '<br/>') : ''}</td>
        </tr>
    </table>
</body>
`;

export const htmlUserCreationRequestWithDate = (data: {
    userCreationRequest: UserCreationRequest & { group: Group | null } & { supervisor: User | null } & {
        buddy: User | null;
    } & {
        recruiter: User | null;
    } & {
        coordinators: User[] | null;
    } & {
        organization: OrganizationUnit;
    } & {
        lineManagers: User[] | null;
    };
    date: Date;
}) => {
    const { userCreationRequest, date } = data;
    return `
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
                    <tr>
                        <th>${tr('Start date')}</th>
                        <td>${formatDate(date, defaultLocale)}</td>
                    </tr>
                    <tr>
                        <th>${tr('Name')}</th>
                        <td>${userCreationRequest.name}</td>
                    </tr>
                    <tr>
                        <th>${tr('Email')}</th>
                        <td>${
                            userCreationRequest.workEmail
                                ? `${userCreationRequest.corporateEmail || userCreationRequest.email} / ${
                                      userCreationRequest.workEmail
                                  }`
                                : userCreationRequest.corporateEmail || userCreationRequest.email
                        }</td>
                    </tr>
                    ${
                        userCreationRequest.personalEmail
                            ? `<tr>
                        <th>${tr('Personal mail')}</th>
                        <td>${userCreationRequest.personalEmail}</td>
                    </tr>`
                            : ''
                    }
                    <tr>
                        <th>${tr('Team')}</th>
                        <td>${userCreationRequest.group ? userCreationRequest.group.name : ''}</td>
                    </tr>
                    ${
                        userCreationRequest.supervisor
                            ? `
                    <tr>
                        <th>${tr('Teamlead')}</th>
                        <td>${userCreationRequest.supervisor.name}</td>
                    </tr>`
                            : ''
                    }
                    ${
                        userCreationRequest.buddy
                            ? `<tr>
                            <th>${tr('Buddy')}</th>
                            <td>${userCreationRequest.buddy.name}</td>
                        </tr>`
                            : ''
                    }
                    ${
                        userCreationRequest.coordinators && userCreationRequest.coordinators.length
                            ? userCreationRequest.coordinators.map(
                                  (c) => `
                            <tr>
                                <th>${tr('Coordinator')}</th>
                                <td>${c.name}</td>
                            </tr>`,
                              )
                            : ''
                    }
                    ${
                        userCreationRequest.lineManagers && userCreationRequest.lineManagers.length
                            ? userCreationRequest.lineManagers.map(
                                  (l) => `
                            <tr>
                                <th>${tr('Line manager')}</th>
                                <td>${l.name}</td>
                            </tr>`,
                              )
                            : ''
                    }
                    <tr>
                    <tr>
                        <th>${tr('Organizaion')}</th>
                        <td>${getOrgUnitTitle(userCreationRequest.organization)}</td>
                    </tr>
                    <tr>
                        <th>${tr('Unit Id')}</th>
                        <td>${userCreationRequest.unitId}</td>
                    </tr>
                    <tr>
                        <th>${tr('Equipment')}</th>
                        <td>${userCreationRequest.equipment}</td>
                    </tr>
                    <tr>
                        <th>${tr('Work space request')}</th>
                        <td>${userCreationRequest.workSpace || ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Extra equipment')}</th>
                        <td>${userCreationRequest.extraEquipment || ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Corporate email needed')} ${config.corporateEmailDomain || ''}</th>
                        <td>${userCreationRequest.corporateEmail || tr('No')}</td>
                    </tr>
                    <tr>
                        <th>${tr('Work mode')}</th>
                        <td>${userCreationRequest.workMode}</td>
                    </tr>
                    <tr>
                        <th>${tr('Work mode comment')}</th>
                        <td>${userCreationRequest.workModeComment || ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Location')}</th>
                        <td>${userCreationRequest.location}</td>
                    </tr>
                    <tr>
                        <th>${tr('Role')}</th>
                        <td>${userCreationRequest.title}</td>
                    </tr>
                    ${
                        userCreationRequest.recruiter
                            ? `<tr>
                            <th>${tr('Recruiter')}</th>
                            <td>${userCreationRequest.recruiter.name}</td>
                        </tr>`
                            : ''
                    }
                    <tr>
                        <th>${tr('Comments')}</th>
                        <td>${
                            userCreationRequest.comment ? userCreationRequest.comment.replace(/\n/g, '<br/>') : ''
                        }</td>
                    </tr>
                </table>
            </body>
            `;
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
) => {
    return `
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
                    <tr>
                        <th>${tr('Date')}</th>
                        <td>${data.date ? formatDate(data.date, defaultLocale) : ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Name')}</th>
                        <td>${data.name}</td>
                    </tr>
                    <tr>
                        <th>${tr('Location')}</th>
                        <td>${data.location}</td>
                    </tr>
                    <tr>
                        <th>${tr('Unit')}</th>
                        <td>${data.unitId}</td>
                    </tr>
                    <tr>
                        <th>${tr('Role')}</th>
                        <td>${data.title}</td>
                    </tr>
                    <tr>
                        <th>${tr('Corporate Email')}</th>
                        <td>${data.corporateEmail}</td>
                    </tr>

                    <tr>
                        <th>${tr('Teamlead')}</th>
                        <td>${data.supervisor?.name ?? ''}</td>
                    </tr>

                    <tr>
                        <th>${tr('Work mode')}</th>
                        <td>${data.workMode}</td>
                    </tr>

                    <tr>
                        <th>${tr('Equipment')}</th>
                        <td>${data.equipment}</td>
                    </tr>
                    <tr>
                        <th>${tr('Extra equipment')}</th>
                        <td>${data.extraEquipment || ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Screenshot')}</th>
                        <td>${tr('In attachment')}</td>
                    </tr>
                    <tr>
                        <th>${tr('Comments')}</th>
                        <td>${data.comment ? data.comment.replace(/\n/g, '<br/>') : ''}</td>
                    </tr>
                </table>
            </body>
    `;
};

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
) => {
    return `
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
                    <tr>
                        <th>${tr('Date')}</th>
                        <td>${data.date ? formatDate(data.date, defaultLocale) : ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Name')}</th>
                        <td>${data.name}</td>
                    </tr>
                    <tr>
                        <th>${tr('Location')}</th>
                        <td>${data.location}</td>
                    </tr>
                    <tr>
                        <th>${tr('Unit')}</th>
                        <td>${data.unitId}</td>
                    </tr>
                    <tr>
                        <th>${tr('Role')}</th>
                        <td>${data.title}</td>
                    </tr>

                    <tr>
                        <th>${tr('Teamlead')}</th>
                        <td>${data.supervisor?.name ?? ''}</td>
                    </tr>

                    ${
                        data.coordinators && data.coordinators.length
                            ? data.coordinators.map(
                                  (c) => `
                            <tr>
                                <th>${tr('Coordinator')}</th>
                                <td>${c.name}</td>
                            </tr>`,
                              )
                            : ''
                    }

                    <tr>
                        <th>${tr('Work mode')}</th>
                        <td>${data.workMode}</td>
                    </tr>

                    <tr>
                        <th>${tr('Equipment')}</th>
                        <td>${data.equipment}</td>
                    </tr>
                    <tr>
                        <th>${tr('Extra equipment')}</th>
                        <td>${data.extraEquipment || ''}</td>
                    </tr>
                    <tr>
                        <th>${tr('Comments')}</th>
                        <td>${data.comment ? data.comment.replace(/\n/g, '<br/>') : ''}</td>
                    </tr>
                </table>
            </body>
    `;
};

export const newcomerSubject = (data: {
    userCreationRequest: UserCreationRequest & { group: Group | null } & { supervisor: User | null } & {
        supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
    } & {
        recruiter: User | null;
    } & {
        coordinators: User[] | null;
    } & {
        organization: OrganizationUnit;
    } & {
        lineManagers: User[] | null;
    };
    name: string;
    phone: string;
}) =>
    `${
        data.userCreationRequest.creationCause === 'transfer' ? tr('Transfer') : tr('Employment')
    } ${data.userCreationRequest.supplementalPositions.map((o) => `${getOrgUnitTitle(o.organizationUnit)}`)} ${
        data.name
    }  (${data.phone})`;
