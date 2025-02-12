import { getTableComponents, TableRow, Tooltip } from '@taskany/bricks/harmony';
import { forwardRef, useRef, useState } from 'react';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { ScheduledDeactivationEditMenu } from '../ScheduledDeactivationEditMenu/ScheduledDeactivationEditMenu';
import { useSessionUser } from '../../hooks/useSessionUser';
import { CancelScheduleDeactivation } from '../CancelScheduleDeactivation/CancelScheduleDeactivation';
import { useUserListFilter } from '../../hooks/useUserListFilter';
import { pages, useRouter } from '../../hooks/useRouter';

import { tr } from './ScheduledDeactivationList.i18n';
import s from './ScheduledDeactivationList.module.css';

interface tableData {
    name: string;
    email: string;
    organization: string;
    supervisor: string;
    deactivateDate?: string;
    id: string;
    team: string;
    type: string;
    requestType: string;
    userId: string;
}

interface EditOrCancelFormProps {
    id: string;
    onClose: () => void;
}

const CancelForm = ({ id, onClose }: EditOrCancelFormProps) => {
    const { data: scheduledDeactivation } = trpc.scheduledDeactivation.getById.useQuery(id);
    if (!scheduledDeactivation) return null;

    return (
        <CancelScheduleDeactivation scheduledDeactivation={scheduledDeactivation} visible={true} onClose={onClose} />
    );
};

const ClickableRow = forwardRef<HTMLDivElement, React.ComponentProps<any>>((props, ref) => (
    <a
        href={props.item.type === 'transfer' ? pages.userTransfer(props.item.id) : pages.userDismiss(props.item.id)}
        className={s.TableRowLink}
    >
        <TableRow {...props} ref={ref} />
    </a>
));

export const ScheduledDeactivationList = () => {
    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();
    const userListFilter = useUserListFilter();

    const sessionUser = useSessionUser();
    const router = useRouter();

    const [sorting, setSorting] = useState<React.ComponentProps<typeof DataTable>['sorting']>([
        { key: 'deactivateDate', dir: 'desc' },
    ]);

    const { data: scheduledDeactivations = [] } = trpc.scheduledDeactivation.getList.useQuery({
        orderBy: {
            name: sorting.find(({ key }) => key === 'name')?.dir,
            deactivateDate: sorting.find(({ key }) => key === 'deactivateDate')?.dir,
        },
        search: userListFilter.values.search,
    });

    const requestType = (type: string | null) => {
        if (type === 'transfer') {
            return tr('Transfer from SD');
        }

        return tr('Dismissal');
    };

    const data: tableData[] = scheduledDeactivations.map((deactivation) => {
        const organization = deactivation.organizationUnit
            ? getOrgUnitTitle(deactivation.organizationUnit)
            : deactivation.user.supplementalPositions
                  .map(({ organizationUnit }) => getOrgUnitTitle(organizationUnit))
                  .join(', ');

        return {
            name: deactivation.user.name || deactivation.user.email,
            email: deactivation.email,
            organization,
            supervisor: deactivation.user.supervisor?.name || '',
            deactivateDate: deactivation.deactivateDate.toLocaleDateString(),
            team: deactivation.user.memberships.map(({ group }) => group.name).join(', '),
            id: deactivation.id,
            type: deactivation.type,
            requestType: requestType(deactivation.type),
            userId: deactivation.userId,
        };
    });

    const dateTitleRef = useRef(null);

    const [cancelRequestId, setCancelRequestId] = useState<undefined | string>();

    return (
        <ProfilesManagementLayout>
            <DataTable
                data={data}
                sorting={sorting}
                onSort={(val) => setSorting([val])}
                className={s.Table}
                rowComponent={ClickableRow}
            >
                <DataTableColumn name="name" value="name" title={tr('Name')} width="12vw" fixed />
                <DataTableColumn
                    sortable={false}
                    name="email"
                    value="email"
                    width="12vw"
                    title={tr('Email')}
                    lines={1}
                    ellipsis
                />
                <DataTableColumn
                    name="organization"
                    width="13vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                    ellipsis
                />
                <DataTableColumn name="team" width="12vw" value="team" title={tr('Team')} sortable={false} />
                <DataTableColumn
                    name="supervisor"
                    width="13vw"
                    value="supervisor"
                    title={tr('Supervisor')}
                    sortable={false}
                    lines={2}
                />
                <DataTableColumn
                    name="requestType"
                    width="10vw"
                    value="requestType"
                    title={tr('Request type')}
                    sortable={false}
                />
                <DataTableColumn
                    name="deactivateDate"
                    width="14vw"
                    value="deactivateDate"
                    title={
                        <>
                            <span className={s.Date} ref={dateTitleRef}>
                                {tr('Date')}
                            </span>
                            <Tooltip reference={dateTitleRef} placement="bottom">
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
                        width="11vw"
                        renderCell={({ id, type }) => (
                            <div onClick={(e) => e.preventDefault()}>
                                <ScheduledDeactivationEditMenu
                                    onEditClick={() =>
                                        type === 'retirement' ? router.userDismissEdit(id) : router.userTransferEdit(id)
                                    }
                                    onCancelClick={() => setCancelRequestId(id)}
                                />
                            </div>
                        )}
                    />
                ))}
            </DataTable>

            {nullable(cancelRequestId, (id) => (
                <CancelForm id={id} onClose={() => setCancelRequestId(undefined)} />
            ))}
        </ProfilesManagementLayout>
    );
};
