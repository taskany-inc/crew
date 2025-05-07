import { nullable } from '@taskany/bricks';
import { TagCleanButton, AppliedFilter, Badge, Select, SelectTrigger, SelectPanel } from '@taskany/bricks/harmony';
import { UserCreationRequestStatus } from 'prisma/prisma-client';

import { StatusDot } from '../StatusDot/StatusDot';
import { getStatusText } from '../../utils/getStatusText';

interface AppliedStatusFilterProps {
    label: string;
    onCleanFilter: () => void;
    selectedStatuses: string[] | undefined;
    onChange: (status: { id: string; name: string }[]) => void;
    onClose: () => void;
}

const requestStatuses: UserCreationRequestStatus[] = ['Approved', 'Denied', 'Canceled', 'Draft', 'Completed'];

export const AppliedStatusFilter = ({
    label,
    onCleanFilter,
    selectedStatuses,
    onChange,
    onClose,
}: AppliedStatusFilterProps) => {
    const statuses = requestStatuses.map((s) => ({ id: s as string, name: getStatusText(s) }));

    const statusValue = statuses.filter((status) => selectedStatuses?.includes(status.id));

    return (
        <AppliedFilter label={label} action={<TagCleanButton size="s" onClick={onCleanFilter} />}>
            <Select
                arrow
                value={statusValue}
                items={statuses}
                onClose={onClose}
                onChange={onChange}
                selectable
                mode="multiple"
                renderItem={({ item }) => (
                    <Badge key={item.id} size="s" text={item.name} iconLeft={<StatusDot status={item.id} />} />
                )}
            >
                <SelectTrigger>
                    {nullable(
                        selectedStatuses && selectedStatuses.length > 1,
                        () =>
                            statusValue?.map((status) => (
                                <Badge key={status.id} iconLeft={<StatusDot status={status.id} />} />
                            )),
                        nullable(statusValue[0], (status) => (
                            <Badge text={status.name} iconLeft={<StatusDot status={status.id} />} />
                        )),
                    )}
                </SelectTrigger>
                <SelectPanel placement="bottom">
                    <div />
                </SelectPanel>
            </Select>
        </AppliedFilter>
    );
};
