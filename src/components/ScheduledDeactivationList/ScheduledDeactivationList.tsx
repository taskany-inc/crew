import { getTableComponents, Tooltip } from '@taskany/bricks/harmony';
import { useRef, useState } from 'react';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { ScheduledDeactivationEditMenu } from '../ScheduledDeactivationEditMenu/ScheduledDeactivationEditMenu';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './ScheduledDeactivationList.i18n';
import s from './ScheduledDeactivationList.module.css';

interface tableData {
    name: string;
    email: string;
    organization: string;
    supervisor: string;
    deactivateDate?: string;
    id: string;
    // TODO add team after adding it to deactivation form
}

export const ScheduledDeactivationList = () => {
    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();

    const sessionUser = useSessionUser();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'deactivateDate', dir: 'desc' },
    ]);

    const { data: scheduledDeactivations = [] } = trpc.scheduledDeactivation.getList.useQuery({
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            deactivateDate: sorting.find(({ key }) => key === 'deactivateDate')?.dir,
        },
    });

    const data: tableData[] = scheduledDeactivations.map((deactivation) => ({
        name: deactivation.user.name || deactivation.user.email,
        email: deactivation.email,
        organization: deactivation.organizationUnit ? getOrgUnitTitle(deactivation.organizationUnit) : '',
        supervisor: deactivation.user.supervisor?.name || '',
        deactivateDate: deactivation.deactivateDate.toLocaleDateString(),
        id: deactivation.id,
    }));

    const dateTitleRef = useRef(null);

    return (
        <ProfilesManagementLayout>
            <DataTable data={data} sorting={sorting} onSort={(val) => setSorting([val])} className={s.Table}>
                <DataTableColumn name="name" value="name" title={tr('Name')} width="15vw" fixed />
                <DataTableColumn
                    sortable={false}
                    name="email"
                    value="email"
                    width="15vw"
                    title={tr('Email')}
                    lines={1}
                />
                <DataTableColumn
                    name="organization"
                    width="15vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                />
                <DataTableColumn
                    name="organization"
                    width="15vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                />
                <DataTableColumn
                    name="supervisor"
                    width="15vw"
                    value="supervisor"
                    title={tr('Supervisor')}
                    sortable={false}
                />
                <DataTableColumn
                    name="deactivateDate"
                    width="170px"
                    value="deactivateDate"
                    title={
                        <>
                            <span ref={dateTitleRef}>{tr('Date')}</span>
                            <Tooltip reference={dateTitleRef} placement="right">
                                {tr('Firing or transfer date')}
                            </Tooltip>
                        </>
                    }
                    fixed="right"
                    lines={1}
                />
                {nullable(sessionUser.role?.editScheduledDeactivation, () => (
                    <DataTableColumn
                        sortable={false}
                        fixed="right"
                        name="actions"
                        title={tr('Actions')}
                        width="100px"
                        renderCell={({ id }) => (
                            <div onClick={(e) => e.preventDefault()}>
                                <ScheduledDeactivationEditMenu id={id} />
                            </div>
                        )}
                    />
                ))}
            </DataTable>
        </ProfilesManagementLayout>
    );
};
