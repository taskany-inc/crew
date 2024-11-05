import { PermissionService } from '@prisma/client';
import React, { useState } from 'react';
import { Select, SelectTrigger, SelectPanel, Input, Badge, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconXCircleOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { suggestionsTake } from '../../utils/suggestions';

import { tr } from './PermissionServiceSelect.i18n';

interface PermissionServiceSelectProps {
    mode: 'single' | 'multiple';
    selectedServices?: string[];
    onChange?: (services: PermissionService[]) => void;
    onClose?: () => void;
    onReset?: () => void;
    error?: React.ComponentProps<typeof SelectTrigger>['error'];

    className?: string;
    readOnly?: boolean;
}

export const PermissionServiceSelect = ({
    mode,
    selectedServices,
    onClose,
    onChange,
    onReset,
    className,
    error,
    readOnly,
}: PermissionServiceSelectProps) => {
    const [serviceQuery, setServiceQuery] = useState('');
    const { data: services = [] } = trpc.permissionService.suggestions.useQuery(
        {
            query: serviceQuery,
            take: suggestionsTake,
            include: selectedServices,
        },
        {
            keepPreviousData: true,
        },
    );
    const serviceValue = services.filter((service) => selectedServices?.includes(service.id));

    return (
        <Select
            arrow
            value={serviceValue}
            items={services}
            onClose={onClose}
            onChange={onChange}
            selectable
            mode={mode}
            renderItem={(props) => (
                <Text key={props.item.id} size="s" ellipsis>
                    {props.item.name}
                </Text>
            )}
        >
            <SelectTrigger
                size="m"
                placeholder={tr('Choose from the list')}
                view="outline"
                className={className}
                error={error}
                readOnly={readOnly}
            >
                {nullable(selectedServices?.length, () => (
                    <Badge
                        weight="regular"
                        text={serviceValue?.map((s) => s.name).join(', ')}
                        iconRight={!readOnly && onReset && <IconXCircleOutline size="s" onClick={onReset} />}
                    />
                ))}
            </SelectTrigger>
            <SelectPanel placement="bottom-start" title={tr('Suggestions')}>
                <Input autoFocus placeholder={tr('Search')} onChange={(e) => setServiceQuery(e.target.value)} />
            </SelectPanel>
        </Select>
    );
};
