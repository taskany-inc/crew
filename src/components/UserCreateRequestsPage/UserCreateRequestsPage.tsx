import { Badge, getTableComponents, TableRow, Tooltip } from '@taskany/bricks/harmony';
import { forwardRef, useCallback, useRef, useState } from 'react';
import cn from 'classnames';
import { UserCreationRequestStatus } from 'prisma/prisma-client';

import { trpc } from '../../trpc/trpcClient';
import { useRouter } from '../../hooks/useRouter';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserListFilter } from '../../hooks/useUserListFilter';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';
import { getRequestPageLinkByType } from '../../utils/userCreationRequests';
import { StatusDot } from '../StatusDot/StatusDot';
import { getStatusText } from '../../utils/getStatusText';

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
    requestTypeName: string;
    id: string;
    type: UserCreationRequestType;
}

const RequestActions = ({
    id,
    status,
    type,
}: {
    id: string;
    status: UserCreationRequestStatus | null;
    type: UserCreationRequestType;
}) => {
    const router = useRouter();

    const onEdit = useCallback(() => {
        if (type === UserCreationRequestType.transferInternToStaff) {
            return router.editTransferInternToStaff(id);
        }
        if (type === UserCreationRequestType.transferInside) {
            return router.editTransferInside(id);
        }
        if (type === UserCreationRequestType.createSuppementalPosition) {
            return router.updateSupplementalPositionRequest(id);
        }
        return router.internalUserRequestEdit(id);
    }, [type, router, id]);

    return (
        <div onClick={(e) => e.preventDefault()}>
            <RequestFormActions
                requestId={id}
                requestStatus={status ?? undefined}
                small
                requestType={type}
                onEdit={onEdit}
            />
        </div>
    );
};

const ClickableRow = forwardRef<HTMLDivElement, React.ComponentProps<any>>((props, ref) => {
    const href = getRequestPageLinkByType(props.item.id, props.item.type);

    return (
        <a href={href} className={s.TableRowLink}>
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
        type: [
            UserCreationRequestType.internalEmployee,
            UserCreationRequestType.transferInternToStaff,
            UserCreationRequestType.transferInside,
            UserCreationRequestType.createSuppementalPosition,
        ],
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            date: sorting.find(({ key }) => key === 'date')?.dir,
        },
        search: userListFilter.values.search,
    });

    const requestType = (type: string | null, creationCause: string | null) => {
        if (type === UserCreationRequestType.transferInternToStaff) {
            return tr('Transfer intern to staff');
        }

        if (type === UserCreationRequestType.transferInside) {
            return tr('Transfer inside SD');
        }

        if (creationCause === 'transfer') {
            return tr('Transfer to SD');
        }

        if (creationCause === UserCreationRequestType.createSuppementalPosition) {
            return tr('New supplemental position');
        }

        return tr('Exit of a new employee');
    };

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
        requestTypeName: requestType(request.type, request.creationCause),
        type: request.type as UserCreationRequestType,
        id: request.id,
    }));

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
                                { [s.StatusTextCanceled]: status === 'Canceled' },
                                { [s.StatusTextDraft]: status === 'Draft' },
                            )}
                            text={getStatusText(status)}
                            iconLeft={<StatusDot status={status} />}
                        />
                    )}
                    title={tr('Status')}
                    width="11vw"
                    fixed
                />
                <DataTableColumn name="name" value="name" title={tr('Name')} width="8vw" fixed />
                <DataTableColumn sortable={false} name="title" value="title" width="8vw" title={tr('Role')} />
                <DataTableColumn name="team" width="8vw" value="team" title={tr('Team')} sortable={false} />
                <DataTableColumn
                    name="supervisor"
                    width="8vw"
                    value="supervisor"
                    title={tr('Supervisor')}
                    sortable={false}
                />
                <DataTableColumn name="author" width="8vw" value="author" title={tr('Author')} sortable={false} />
                <DataTableColumn
                    name="coordinators"
                    width="7vw"
                    value="coordinators"
                    title={tr('Coordinator')}
                    sortable={false}
                />
                <DataTableColumn
                    name="recruiter"
                    width="7vw"
                    value="recruiter"
                    title={tr('Recruiter')}
                    sortable={false}
                />
                <DataTableColumn
                    name="requestType"
                    width="6vw"
                    value="requestTypeName"
                    title={tr('Request type')}
                    sortable={false}
                />
                <DataTableColumn
                    fixed="right"
                    name="date"
                    value="date"
                    title={
                        <>
                            <span className={s.StartDate} ref={dateTitleRef}>
                                {tr('Start date')}
                            </span>
                            <Tooltip reference={dateTitleRef} placement="bottom">
                                {tr('Start date')}
                            </Tooltip>
                        </>
                    }
                    width="9vw"
                    lines={1}
                />
                <DataTableColumn
                    sortable={false}
                    fixed="right"
                    name="actions"
                    title={tr('Actions')}
                    width={canEditRequest && sessionUser.role?.decideOnUserCreationRequest ? '180px' : '100px'}
                    renderCell={RequestActions}
                />
            </DataTable>
        </ProfilesManagementLayout>
    );
};
