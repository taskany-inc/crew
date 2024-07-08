import { ScheduledDeactivation } from '@prisma/client';

import { pages } from '../hooks/useRouter';
import {
    AdditionalDevice,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationUser,
} from '../modules/scheduledDeactivationTypes';

import { getOrgUnitTitle } from './organizationUnit';
import { defaultLocale } from './getLang';
import { formatDate } from './dateTime';
import { tr } from './utils.i18n';

export const userCreationMailText = (name: string) => `${tr('Hello colleagues!')}<br/>
            ${tr('Plese look at profile creation request for {userName}', { userName: name })}
            
            ${process.env.NEXTAUTH_URL}${pages.userRequests}
            
            ${tr('Sincerely,<br/>HR-team!')}
                    `;

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
                  unitId: data.unitId!,
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
                ${data.workMode}${data.workModeComment ? `, ${data.workModeComment}` : ''}
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
${tr('Sincerely,<br/>HR-team!')}
</body>
`;
