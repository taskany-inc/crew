import { getTableComponents, TableRow, Tooltip } from '@taskany/bricks/harmony';
import { forwardRef, useRef, useState } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { pages, useRouter } from '../../hooks/useRouter';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserListFilter } from '../../hooks/useUserListFilter';
import { ExternalServiceName, findService } from '../../utils/externalServices';

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
    type: string;
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

export const AccessCoordinationList = () => {
    const sessionUser = useSessionUser();
    const userListFilter = useUserListFilter();

    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'createdAt', dir: 'desc' },
    ]);

    const router = useRouter();
    const dateTitleRef = useRef(null);

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        status: null,
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            createdAt: sorting.find(({ key }) => key === 'createdAt')?.dir,
        },
        search: userListFilter.values.search,
    });

    const onEdit = (id: string, type: string) => {
        if (type === 'externalEmployee') return router.externalUserRequestEdit(id);
        if (type === 'externalFromMainOrgEmployee') return router.externalUserFromMainOrgRequestEdit(id);
        if (type === 'internalEmployee') return router.internalUserRequestEdit(id);
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
        type: request.type || '',
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
                <DataTableColumn name="name" value="name" title={tr('Name')} width="9vw" fixed />
                <DataTableColumn
                    name="email"
                    value="email"
                    title={tr('Email')}
                    width="9vw"
                    lines={1}
                    sortable={false}
                />

                <DataTableColumn
                    name="login"
                    width="9vw"
                    value="login"
                    title={tr('Login')}
                    lines={1}
                    sortable={false}
                />
                <DataTableColumn
                    name="phone"
                    width="9vw"
                    value="phone"
                    title={tr('Phone')}
                    lines={1}
                    sortable={false}
                />
                <DataTableColumn
                    name="organization"
                    width="9vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                />
                <DataTableColumn name="title" width="9vw" value="title" lines={1} title={tr('Role')} sortable={false} />
                <DataTableColumn
                    name="lineManagers"
                    width="9vw"
                    value="lineManagers"
                    title={tr('Manager')}
                    sortable={false}
                />
                <DataTableColumn name="author" width="9vw" value="author" title={tr('Author')} sortable={false} />
                <DataTableColumn
                    fixed="right"
                    name="createdAt"
                    value="createdAt"
                    title={
                        <>
                            <span ref={dateTitleRef}>{tr('Creation date')}</span>
                            <Tooltip reference={dateTitleRef} placement="right">
                                {tr('Creation date')}
                            </Tooltip>
                        </>
                    }
                    width="150px"
                    lines={1}
                />
                <DataTableColumn
                    sortable={false}
                    fixed="right"
                    name="actions"
                    title={tr('Actions')}
                    width={canEditRequest && sessionUser.role?.decideOnUserCreationRequest ? '180px' : '100px'}
                    renderCell={({ id, type }) => (
                        <div onClick={(e) => e.preventDefault()}>
                            <RequestFormActions requestId={id} small onEdit={() => onEdit(id, type)} />
                        </div>
                    )}
                />
            </DataTable>
        </ProfilesManagementLayout>
    );
};
