import { nullable } from '@taskany/bricks';
import { Select, SelectPanel, SelectTrigger, TagCleanButton, AppliedFilter, Dropdown, DropdownTrigger, DropdownPanel, Counter, StateGroup, State } from '@taskany/bricks/harmony';
import { useState } from 'react';
import { trpc } from '../../trpc/trpcClient';

interface AppliedStatusFilterProps {
    label: string;
    onCleanFilter: () => void;
    selectedStatuses: { title: string }[] | undefined;
    onChange: (status: { id: string; name: string; email: string }[]) => void;
    onClose: () => void;
}

export const AppliedStatusFilter = ({ label, onCleanFilter, selectedStatuses, onClose }: AppliedStatusFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const onDropdownClose = () => {
        setIsOpen(false);
        onClose();
    };

    // const { data: statuses } = trpc.

    // const statusValue = 
    
    return (
        <AppliedFilter label={label} action={<TagCleanButton size='s' onClick={onCleanFilter} />}>
            <Dropdown isOpen={isOpen} onClose={onDropdownClose}>
                <DropdownTrigger>
                    {nullable(
                        selectedStatuses && selectedStatuses.length > 1,
                        () => <StateGroup items={selectedStatuses} />,
                        nullable(selectedStatuses, ([props]) => <State {...props} />)
                    )}
                </DropdownTrigger>
                <DropdownPanel>

                </DropdownPanel>
            </Dropdown>
        </AppliedFilter>
    );
};
