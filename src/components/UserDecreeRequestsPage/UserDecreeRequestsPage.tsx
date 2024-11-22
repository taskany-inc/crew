import { getTableComponents, TableRow } from '@taskany/bricks/harmony';
import { useState } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './UserDecreeRequestsPage.i18n';
import s from './UserDecreeRequestsPage.module.css';

interface tableData {
    type: string;
    name: string;
    title?: string;
    team?: string;
    supervisor?: string;
    author?: string;
    coordinators: string;
    date?: string;
    id: string;
}

export const UserDecreeRequestsPage = () => {
    const sessionUser = useSessionUser();

    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'date', dir: 'desc' },
    ]);

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        type: ['fromDecree', 'toDecree'],
        status: null,
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            date: sorting.find(({ key }) => key === 'date')?.dir,
        },
    });

    const data: tableData[] = userRequests.map((request) => ({
        type: request.type === 'toDecree' ? tr('To decree') : tr('From decree'),
        name: request.name,
        title: request.title || '',
        team: request.group?.name || '',
        supervisor: request.supervisor?.name || '',
        author: request.creator?.name || '',
        coordinators: request.coordinators.map(({ name }) => name).join(', '),
        date: request.date?.toLocaleDateString(),
        id: request.id,
    }));

    return (
        <ProfilesManagementLayout>
            <DataTable
                data={data}
                sorting={sorting}
                onSort={(val) => setSorting([val])}
                className={s.Table}
                rowComponent={TableRow}
            >
                <DataTableColumn name="name" value="name" title={tr('Name')} width="9vw" fixed />
                <DataTableColumn name="type" value="type" title={tr('Type')} width="9vw" fixed />
                <DataTableColumn sortable={false} name="title" value="title" width="9vw" title={tr('Role')} />
                <DataTableColumn name="team" width="9vw" value="team" title={tr('Team')} sortable={false} />
                <DataTableColumn
                    name="supervisor"
                    width="9vw"
                    value="supervisor"
                    title={tr('Supervisor')}
                    sortable={false}
                />
                <DataTableColumn name="author" width="9vw" value="author" title={tr('Author')} sortable={false} />
                <DataTableColumn
                    name="coordinators"
                    width="9vw"
                    value="coordinators"
                    title={tr('Coordinator')}
                    sortable={false}
                />
                <DataTableColumn
                    fixed="right"
                    name="date"
                    value="date"
                    title={tr('Start date')}
                    width="140px"
                    lines={1}
                />
                <DataTableColumn
                    sortable={false}
                    fixed="right"
                    name="actions"
                    title={tr('Actions')}
                    width={
                        sessionUser.role?.createUser && sessionUser.role.editUserCreationRequests ? '180px' : '100px'
                    }
                    renderCell={({ id }) => (
                        <div onClick={(e) => e.preventDefault()}>
                            <RequestFormActions requestId={id} small requestType="decree" />
                        </div>
                    )}
                />
            </DataTable>
        </ProfilesManagementLayout>
    );
};
