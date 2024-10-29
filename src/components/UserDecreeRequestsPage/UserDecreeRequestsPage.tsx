import { getTableComponents, TableRow, Tooltip } from '@taskany/bricks/harmony';
import { useRef, useState, FC, forwardRef } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { pages } from '../../hooks/useRouter';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './UserDecreeRequestsPage.i18n';
import s from './UserDecreeRequestsPage.module.css';

interface tableData {
    name: string;
    email?: string;
    organization?: string;
    group: string;
    supervisor?: string;
    date?: string;
    id: string;
}

interface UserDecreeRequestsPageProps {
    type: 'fromDecree' | 'toDecree';
}

const ClickableRow = forwardRef<HTMLDivElement, React.ComponentProps<any>>((props, ref) => {
    return (
        <a href={pages.decreeRequest(props.item.id)} className={s.TableRowLink}>
            <TableRow {...props} ref={ref} />
        </a>
    );
});

export const UserDecreeRequestsPage: FC<UserDecreeRequestsPageProps> = ({ type }) => {
    const sessionUser = useSessionUser();
    const dateTitleRef = useRef(null);

    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'date', dir: 'desc' },
    ]);

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        type: [type],
        status: null,
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            date: sorting.find(({ key }) => key === 'date')?.dir,
        },
    });

    const data: tableData[] = userRequests.map((request) => ({
        name: request.name,
        email: request.email || '',
        organization: request.organization.name || '',
        group: request.group?.name || '',
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
                rowComponent={ClickableRow}
            >
                <DataTableColumn name="name" value="name" title={tr('Name')} width="17vw" fixed />
                <DataTableColumn sortable={false} name="title" value="email" width="17vw" title={tr('Email')} />
                <DataTableColumn
                    name="team"
                    width="15vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                />
                <DataTableColumn name="group" width="15vw" value="group" title={tr('Group')} sortable={false} />
                <DataTableColumn
                    name="supervisor"
                    width="17vw"
                    value="supervisor"
                    title={tr('Supervisor')}
                    sortable={false}
                />
                <DataTableColumn
                    fixed="right"
                    name="date"
                    value="date"
                    title={
                        <>
                            <span ref={dateTitleRef}>{tr('Start date')}</span>
                            <Tooltip reference={dateTitleRef} placement="right">
                                {tr('Start date')}
                            </Tooltip>
                        </>
                    }
                    width="140px"
                    lines={1}
                />
                <DataTableColumn
                    sortable={false}
                    fixed="right"
                    name="actions"
                    title={tr('Actions')}
                    width={
                        sessionUser.role?.createUser && sessionUser.role.editUserCreationRequests ? '110px' : '110px'
                    }
                    renderCell={({ id }) => (
                        <div onClick={(e) => e.preventDefault()}>
                            <RequestFormActions
                                requestId={id}
                                onEdit={() => pages.decreeRequestEdit(id)}
                                small
                                requestType="decree"
                            />
                        </div>
                    )}
                />
            </DataTable>
        </ProfilesManagementLayout>
    );
};
