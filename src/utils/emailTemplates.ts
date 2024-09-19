import { User, UserCreationRequest, Group, OrganizationUnit, ScheduledDeactivation } from '@prisma/client';

import { pages } from '../hooks/useRouter';
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

export const userCreationMailText = (name: string) => `${tr('Hello colleagues!')}

${tr('Please look at profile creation request for {userName}', { userName: name })}
            
${process.env.NEXTAUTH_URL}${pages.userRequests}
            
${tr('Sincerely,')}
HR-team!`;

export const cancelUserCreationMailText = (data: { name: string; organization: string; comment?: string }) => {
    const { name, organization, comment } = data;

    return `${tr('Hello colleagues!')}

${tr('Cancelling planned newcomer {userName} to {organization}', { userName: name, organization })}

${
    comment
        ? `${tr('Comment')}:
${comment}`
        : ''
}
            
${tr('Sincerely,')}
HR-team!`;
};

export const scheduledDeactivationEmailHtml = (
    data: ScheduledDeactivation & ScheduledDeactivationUser & ScheduledDeactivationNewOrganizationUnit,
) => `
<head>
  <style>
    table { border-collapse: collapse; }
    th { text-align: left; }
  </style>
</head>        
<body>
    ${tr('Hello colleagues!')}<br/>
    ${
        data.type === 'retirement'
            ? tr('Planning retirement of worker.')
            : tr('Planning transfer of worker to {newOrganization} {unitId}', {
                  newOrganization: data?.newOrganizationUnit ? getOrgUnitTitle(data?.newOrganizationUnit) : '',
                  unitId: data.unitId || '',
              })
    }<br/>
    ${tr('Details below.')}<br/>
    ${tr('The meeting is for informational purposes only.')}<br/>
    <table border='1' cellpadding='8'>
        <tr>
            <th>${tr('Date')}</th>
            <td>${formatDate(data.deactivateDate, defaultLocale)}</td>
        </tr>
        <tr>
            <th>${tr('Full name')}</th>
            <td>${data.user.name}</td>
        </tr>
        <tr>
            <th>${tr('Working hours,<br/>workplace (if any)')}</th>
            <td>
                ${data.workMode}
                ${data.workPlace ? `, ${data.workPlace}` : ''}
                ${data.workModeComment ? `, ${data.workModeComment}` : ''}
            </td>
        </tr>
    ${
        data.type === 'transfer'
            ? `
        <tr>
            <th>${tr('Transfer from, role')}</th>
            <td>${data.organizationalGroup}, ${data.organizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Transfer to, role')}</th>
            <td>${data.newOrganizationalGroup}, ${data.newOrganizationRole}</td>
        </tr>
        <tr>
            <th>${tr('Unit')}</th>
            <td>${data.unitId}</td>
        </tr>
    `
            : ''
    }
        <tr>
            <th>${tr('Location')}</th>
            <td>${data.location}</td>
        </tr>
        <tr>
            <th>${tr('Email')}</th>
            <td>${data.email}</td>
        </tr>
        <tr>
            <th>${tr('Teamlead')}</th>
            <td>${data.teamLead}</td>
        </tr>
        <tr>
            <th>${tr('Devices')}</th>
            <td></td>
        </tr>
    ${
        JSON.parse(data.devices as string)
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
        JSON.parse(data.testingDevices as string)
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
            <th>${tr('Comments')}</th>
            <td>${data.comments}</td>
        </tr>
    </table>
${tr('Sincerely,')}<br/>HR-team!
</body>
`;

export const htmlUserCreationRequestWithDate = (data: {
    userCreationRequest: UserCreationRequest & { group: Group } & { supervisor: User | null } & {
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
    const fullNameArray = userCreationRequest.name.split(' ');
    return `
            <head>
              <style>
                table { border-collapse: collapse; }
                th { text-align: left; }
              </style>
            </head>        
            <body>
                ${tr('Hello colleagues!')}<br/>
                ${tr('Planning new worker in')} ${getOrgUnitTitle(userCreationRequest.organization)}
                <br/>
                ${tr('Details below.')}<br/>
                ${tr('The meeting is for informational purposes only.')}<br/>
                <table border='1' cellpadding='8'>
                    <tr>
                        <th>${tr('First name')}</th>
                        <td>${fullNameArray[1]}</td>
                    </tr>
                    <tr>
                        <th>${tr('Surname')}</th>
                        <td>${fullNameArray[0]}</td>
                    </tr>
                    <tr>
                    ${
                        fullNameArray[2]
                            ? `<th>${tr('Middle name')}</th>
                        <td>${fullNameArray[2]}</td>
                    </tr>`
                            : ''
                    }
                    <tr>
                        <th>${tr('Email')}</th>
                        <td>${
                            userCreationRequest.workEmail
                                ? `${userCreationRequest.email} / ${userCreationRequest.workEmail}`
                                : userCreationRequest.email
                        }</td>
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
                        <th>${tr('Team')}</th>
                        <td>${userCreationRequest.group.name}</td>
                    </tr>
                    <tr>
                    <tr>
                        <th>${tr('Start date')}</th>
                        <td>${formatDate(date, defaultLocale)}</td>
                    </tr>
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
                        <td>${userCreationRequest.comment || ''}</td>
                    </tr>
                </table>
            ${tr('Sincerely,')}<br/>HR-team!
            </body>
            `;
};
