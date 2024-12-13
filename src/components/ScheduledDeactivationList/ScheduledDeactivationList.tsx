import { getTableComponents, Tooltip } from '@taskany/bricks/harmony';
import { useRef, useState } from 'react';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { ScheduledDeactivationEditMenu } from '../ScheduledDeactivationEditMenu/ScheduledDeactivationEditMenu';
import { useSessionUser } from '../../hooks/useSessionUser';
import { ScheduleDeactivationForm } from '../ScheduleDeactivationForm/ScheduleDeactivationForm';
import { CancelScheduleDeactivation } from '../CancelScheduleDeactivation/CancelScheduleDeactivation';
import { useUserListFilter } from '../../hooks/useUserListFilter';

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

interface EditOrCancelFormProps {
    id: string;
    onClose: () => void;
}

const EditForm = ({ id, onClose }: EditOrCancelFormProps) => {
    const { data: scheduledDeactivation } = trpc.scheduledDeactivation.getById.useQuery(id);
    if (!scheduledDeactivation) return null;

    return (
        <ScheduleDeactivationForm
            userId={scheduledDeactivation.userId}
            scheduledDeactivation={scheduledDeactivation}
            visible={true}
            onClose={onClose}
        />
    );
};

const CancelForm = ({ id, onClose }: EditOrCancelFormProps) => {
    const { data: scheduledDeactivation } = trpc.scheduledDeactivation.getById.useQuery(id);
    if (!scheduledDeactivation) return null;

    return (
        <CancelScheduleDeactivation scheduledDeactivation={scheduledDeactivation} visible={true} onClose={onClose} />
    );
};

export const ScheduledDeactivationList = () => {
    const { DataTable, DataTableColumn } = getTableComponents<tableData[]>();
    const userListFilter = useUserListFilter();

    const sessionUser = useSessionUser();

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

    const data: tableData[] = scheduledDeactivations.map((deactivation) => ({
        name: deactivation.user.name || deactivation.user.email,
        email: deactivation.email,
        organization: deactivation.organizationUnit ? getOrgUnitTitle(deactivation.organizationUnit) : '',
        supervisor: deactivation.user.supervisor?.name || '',
        deactivateDate: deactivation.deactivateDate.toLocaleDateString(),
        id: deactivation.id,
    }));

    const dateTitleRef = useRef(null);

    const [editRequestId, setEditRequestId] = useState<undefined | string>();
    const [cancelRequestId, setCancelRequestId] = useState<undefined | string>();

    return (
        <ProfilesManagementLayout>
            <DataTable data={data} sorting={sorting} onSort={(val) => setSorting([val])} className={s.Table}>
                <DataTableColumn name="name" value="name" title={tr('Name')} width="18vw" fixed />
                <DataTableColumn
                    sortable={false}
                    name="email"
                    value="email"
                    width="18vw"
                    title={tr('Email')}
                    lines={1}
                />
                <DataTableColumn
                    name="organization"
                    width="18vw"
                    value="organization"
                    title={tr('Organization')}
                    sortable={false}
                />
                <DataTableColumn
                    name="supervisor"
                    width="18vw"
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
                                <ScheduledDeactivationEditMenu
                                    onEditClick={() => setEditRequestId(id)}
                                    onCancelClick={() => setCancelRequestId(id)}
                                />
                            </div>
                        )}
                    />
                ))}
            </DataTable>

            {nullable(editRequestId, (id) => (
                <EditForm id={id} onClose={() => setEditRequestId(undefined)} />
            ))}
            {nullable(cancelRequestId, (id) => (
                <CancelForm id={id} onClose={() => setCancelRequestId(undefined)} />
            ))}
        </ProfilesManagementLayout>
    );
};
