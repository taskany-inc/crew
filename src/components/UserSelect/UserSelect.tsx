import { User } from '@prisma/client';
import React, { useCallback, useState } from 'react';
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
    excludedUsers?: string[];
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
    excludedUsers,
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
            exclude: excludedUsers,
        },
        {
            keepPreviousData: true,
        },
    );
    const userValue = users.filter((user) => selectedUsers?.includes(user.id));

    const onCloseHandler = useCallback(() => {
        setUserQuery('');
        onClose?.();
    }, [onClose]);

    return (
        <Select
            value={userValue}
            items={users.map((user) => ({
                ...user,
                name: user.name || user.email,
                email: user.email,
            }))}
            onClose={onCloseHandler}
            onChange={onChange}
            selectable
            mode={mode}
            arrow
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
                <Input
                    autoFocus
                    placeholder={tr('Search')}
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                />
            </SelectPanel>
        </Select>
    );
};
