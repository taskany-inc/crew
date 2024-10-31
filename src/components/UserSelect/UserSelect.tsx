import { User } from '@prisma/client';
import React, { useState } from 'react';
import {
    User as HarmonyUser,
    Select,
    SelectTrigger,
    SelectPanel,
    Input,
    Text,
    UserGroup,
} from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconXCircleOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { suggestionsTake } from '../../utils/suggestions';

import { tr } from './UserSelect.i18n';

interface UserSelectProps {
    mode: 'single' | 'multiple';
    selectedUsers?: string[];
    onChange?: (users: User[]) => void;
    onClose?: () => void;
    onReset?: () => void;
    error?: React.ComponentProps<typeof SelectTrigger>['error'];

    className?: string;
    readOnly?: boolean;
}

export const UserSelect = ({
    mode,
    selectedUsers,
    onClose,
    onChange,
    onReset,
    className,
    error,
    readOnly,
}: UserSelectProps) => {
    const [userQuery, setUserQuery] = useState('');
    const { data: users = [] } = trpc.user.suggestions.useQuery(
        {
            query: userQuery,
            take: suggestionsTake,
            include: selectedUsers,
        },
        {
            keepPreviousData: true,
        },
    );
    const userValue = users.filter((user) => selectedUsers?.includes(user.id));

    return (
        <Select
            value={userValue}
            items={users.map((user) => ({
                ...user,
                name: user.name || user.email,
                email: user.email,
            }))}
            onClose={onClose}
            onChange={onChange}
            selectable
            mode={mode}
            renderItem={({ item }) => <HarmonyUser name={item.name} email={item.email} />}
        >
            <SelectTrigger
                readOnly={readOnly}
                size="m"
                placeholder={tr('Choose from the list')}
                view="outline"
                className={className}
                error={error}
            >
                {nullable(
                    selectedUsers && selectedUsers?.length > 1,
                    () => (
                        <UserGroup users={userValue} />
                    ),
                    nullable(
                        userValue[0],
                        (user) => (
                            <HarmonyUser
                                name={user.name}
                                email={user.email}
                                iconRight={!readOnly && onReset && <IconXCircleOutline size="s" onClick={onReset} />}
                            />
                        ),

                        nullable(readOnly, () => <Text>{tr('Not specified')}</Text>),
                    ),
                )}
            </SelectTrigger>
            <SelectPanel disabled={readOnly} placement="bottom-start" title={tr('Suggestions')}>
                <Input autoFocus placeholder={tr('Search')} onChange={(e) => setUserQuery(e.target.value)} />
            </SelectPanel>
        </Select>
    );
};
