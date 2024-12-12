import { Badge, Dot, getTableComponents, TableRow, Tooltip } from '@taskany/bricks/harmony';
import { forwardRef, useRef, useState } from 'react';
import cn from 'classnames';
import { UserCreationRequestStatus } from 'prisma/prisma-client';

import { trpc } from '../../trpc/trpcClient';
import { pages, useRouter } from '../../hooks/useRouter';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserListFilter } from '../../hooks/useUserListFilter';

import { tr } from './UserCreateRequestsPage.i18n';
import s from './UserCreateRequestsPage.module.css';

interface tableData {
    status: UserCreationRequestStatus | null;
    name: string;
    title?: string;
    team?: string;
    supervisor?: string;
    author?: string;
    coordinators: string;
    recruiter?: string;
    date?: string;
    id: string;
}

const ClickableRow = forwardRef<HTMLDivElement, React.ComponentProps<any>>((props, ref) => {
    return (
        <a href={pages.internalUserRequest(props.item.id)} className={s.TableRowLink}>
            <TableRow {...props} ref={ref} />
        </a>
    );
});

export const UserCreateRequestsPage = () => {
    const sessionUser = useSessionUser();
    const userListFilter = useUserListFilter();
    const dateTitleRef = useRef(null);

    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'date', dir: 'desc' },
    ]);

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        type: ['internalEmployee'],
        status: null,
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            date: sorting.find(({ key }) => key === 'date')?.dir,
        },
        search: userListFilter.values.search,
    });

    const data: tableData[] = userRequests.map((request) => ({
        status: request.status,
        name: request.name,
        title: request.title || '',
        team: request.group?.name || '',
        supervisor: request.supervisor?.name || '',
        author: request.creator?.name || '',
        coordinators: request.coordinators.map(({ name }) => name).join(', '),
        recruiter: request.recruiter?.name || '',
        date: request.date?.toLocaleDateString(),
        id: request.id,
    }));

    const router = useRouter();

    const statusText = (status: 'Approved' | 'Denied' | null) => {
        if (status === 'Approved') return tr('Approved');
        if (status === 'Denied') return tr('Denied');
        return tr('Under concideration');
    };

    const canEditRequest =
        sessionUser.role?.editInternalUserRequest ||
        sessionUser.role?.editExternalUserRequest ||
        sessionUser.role?.editExternalFromMainUserRequest;

    return (
        <ProfilesManagementLayout>
            <DataTable
                data={data}
                sorting={sorting}
                onSort={(val) => setSorting([val])}
                className={s.Table}
                rowComponent={ClickableRow}
            >
                <DataTableColumn
                    sortable={false}
                    name="status"
                    renderCell={({ status }) => (
                        <Badge
                            className={cn(
                                s.StatusText,
                                { [s.StatusTextApproved]: status === 'Approved' },
                                { [s.StatusTextDenied]: status === 'Denied' },
                            )}
                            text={statusText(status)}
                            iconLeft={
                                <Dot
                                    className={cn(
                                        s.StatusDot,
                                        { [s.StatusDotApproved]: status === 'Approved' },
                                        { [s.StatusDotDenied]: status === 'Denied' },
                                    )}
                                />
                            }
                        />
                    )}
                    title={tr('Status')}
                    width="180px"
                    fixed
                />
                <DataTableColumn name="name" value="name" title={tr('Name')} width="9vw" fixed />
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
                    name="recruiter"
                    width="9vw"
                    value="recruiter"
                    title={tr('Recruiter')}
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
                    width={canEditRequest && sessionUser.role?.decideOnUserCreationRequest ? '180px' : '100px'}
                    renderCell={({ id }) => (
                        <div onClick={(e) => e.preventDefault()}>
                            <RequestFormActions
                                requestId={id}
                                small
                                onEdit={() => router.internalUserRequestEdit(id)}
                            />
                        </div>
                    )}
                />
            </DataTable>
        </ProfilesManagementLayout>
    );
};
