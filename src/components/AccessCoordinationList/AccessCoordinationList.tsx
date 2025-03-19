import { getTableComponents, TableRow, Tooltip } from '@taskany/bricks/harmony';
import { forwardRef, useCallback, useRef, useState } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { pages, useRouter } from '../../hooks/useRouter';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserListFilter } from '../../hooks/useUserListFilter';
import { ExternalServiceName, findService } from '../../utils/externalServices';
import { config } from '../../config';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import s from './AccessCoordinationList.module.css';
import { tr } from './AccessCoordinationList.i18n';

interface tableData {
    name: string;
    email: string;
    login: string;
    phone: string;
    organization: string;
    title: string;
    lineManagers?: string;
    author?: string;
    createdAt?: string;
    id: string;
    type: UserCreationRequestType;
    requestTypeName?: string;
}

const requestLink = (id: string, type: string) => {
    if (type === 'externalEmployee') return pages.externalUserRequest(id);
    if (type === 'externalFromMainOrgEmployee') return pages.externalUserFromMainOrgRequest(id);
    if (type === 'internalEmployee') return pages.internalUserRequest(id);
};

const ClickableRow = forwardRef<HTMLDivElement, React.ComponentProps<any>>((props, ref) => {
    return (
        <a href={requestLink(props.item.id, props.item.type)} className={s.TableRowLink}>
            <TableRow {...props} ref={ref} />
        </a>
    );
});

const RequestActions = ({ type, id }: { type: UserCreationRequestType; id: string }) => {
    const router = useRouter();
    const onEdit = useCallback(() => {
        if (type === 'externalEmployee') return router.externalUserRequestEdit(id);

        if (type === 'externalFromMainOrgEmployee') return router.externalUserFromMainOrgRequestEdit(id);

        return router.internalUserRequestEdit(id);
    }, [type, router, id]);

    return (
        <div onClick={(e) => e.preventDefault()}>
            <RequestFormActions requestType={type} requestId={id} small onEdit={onEdit} />
        </div>
    );
};

export const AccessCoordinationList = () => {
    const sessionUser = useSessionUser();
    const userListFilter = useUserListFilter();

    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'createdAt', dir: 'desc' },
    ]);

    const dateTitleRef = useRef(null);

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        type: [
            UserCreationRequestType.internalEmployee,
            UserCreationRequestType.externalEmployee,
            UserCreationRequestType.externalFromMainOrgEmployee,
        ],
        status: null,
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            createdAt: sorting.find(({ key }) => key === 'createdAt')?.dir,
        },
        search: userListFilter.values.search,
    });

    const requestTypeName = (type: string | null) => {
        if (type === 'externalEmployee') {
            return tr('Account for external employee not from {main}', { main: config.mainOrganizationName });
        }

        if (type === 'externalFromMainOrgEmployee') {
            return tr('Account for external employee from {main}', { main: config.mainOrganizationName });
        }

        return tr('Exit of a new employee');
    };

    const data: tableData[] = userRequests.map((request) => ({
        name: request.name,
        email: request.email,
        login: request.login,
        phone: findService(ExternalServiceName.Phone, request.services || undefined) || '',
        organization: getOrgUnitTitle(request.organization),
        title: request.title || '',
        lineManagers: request.lineManagers.map(({ name }) => name).join(', '),
        author: request.creator?.name || '',
        createdAt: request.createdAt.toLocaleDateString(),
        id: request.id,
        type: request.type as UserCreationRequestType,
        requestTypeName: requestTypeName(request.type),
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
                <DataTableColumn lines={2} ellipsis name="name" value="name" title={tr('Name')} width="9vw" fixed />
                <DataTableColumn
                    name="email"
                    value="email"
                    title={tr('Email')}
                    width="7vw"
                    lines={1}
                    sortable={false}
                    ellipsis
                />

                <DataTableColumn
                    name="login"
                    width="7vw"
                    value="login"
                    title={tr('Login')}
                    lines={1}
                    sortable={false}
                    ellipsis
                />
                <DataTableColumn
                    name="phone"
                    width="7vw"
                    value="phone"
                    title={tr('Phone')}
                    lines={1}
                    sortable={false}
                    ellipsis
                />
                <DataTableColumn
                    name="organization"
                    width="8vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                    ellipsis
                />
                <DataTableColumn name="title" width="8vw" value="title" lines={1} title={tr('Role')} sortable={false} />
                <DataTableColumn
                    name="lineManagers"
                    width="8vw"
                    value="lineManagers"
                    title={tr('Manager')}
                    sortable={false}
                    ellipsis
                />
                <DataTableColumn
                    name="author"
                    width="7vw"
                    value="author"
                    ellipsis
                    title={tr('Author')}
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
                    name="createdAt"
                    value="createdAt"
                    title={
                        <>
                            <span className={s.CreationData} ref={dateTitleRef}>
                                {tr('Creation date')}
                            </span>
                            <Tooltip reference={dateTitleRef} placement="bottom">
                                {tr('Creation date')}
                            </Tooltip>
                        </>
                    }
                    width="10vw"
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
