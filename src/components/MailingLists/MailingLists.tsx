import { TabsMenu, TabsMenuItem, Text } from '@taskany/bricks';
import { useState } from 'react';
import { OrganizationUnit } from '@prisma/client';

import { mailingSettingType } from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { MailingList } from '../MailingList/MailingList';
import { AdminPanelLayout } from '../AdminPanelLayout/AdminPanelLayout';

import { tr } from './MailingLists.i18n';

interface MailingListsInnerProps {
    organizationUnits: OrganizationUnit[];
}

const MailingListsInner = ({ organizationUnits }: MailingListsInnerProps) => {
    const [orgUntId, setOrgUnitId] = useState<string>(organizationUnits[0].id);
    return (
        <AdminPanelLayout>
            <TabsMenu>
                {organizationUnits.map((orgUnit) => (
                    <TabsMenuItem
                        key={orgUnit.id}
                        active={orgUntId === orgUnit.id}
                        onClick={() => setOrgUnitId(orgUnit.id)}
                    >
                        {getOrgUnitTitle(orgUnit)}
                    </TabsMenuItem>
                ))}
            </TabsMenu>
            {mailingSettingType.map((type) => (
                <MailingList key={type} mailingSettings={type} organizationUnitId={orgUntId} />
            ))}
        </AdminPanelLayout>
    );
};

export const MailingLists = () => {
    const organizationUnitQuery = trpc.organizationUnit.getList.useQuery({ search: '' });
    if (!organizationUnitQuery.data) return null;

    if (!organizationUnitQuery.data.length) {
        return (
            <AdminPanelLayout>
                <Text>{tr('No organzations')}</Text>
            </AdminPanelLayout>
        );
    }

    return <MailingListsInner organizationUnits={organizationUnitQuery.data} />;
};
