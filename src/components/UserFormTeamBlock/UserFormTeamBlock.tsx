import React, { useEffect } from 'react';
import { Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { Group, User } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';

import { FormControl } from '../FormControl/FormControl';
import { UserSelect } from '../UserSelect/UserSelect';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';

import s from './UserFormTeamBlock.module.css';
import { tr } from './UserFormTeamBlock.i18n';

interface UserFormTeamBlockProps {
    className: string;
    id: string;
    type: 'internal' | 'existing' | 'dismissal';
    readOnly?: boolean;
    userId?: string;
    defaultGroupId?: string;
}

interface UserFormTeamBlockType {
    groupId?: string;
    supervisorId: string;
    lineManagerIds: string[];
    buddyId?: string;
    coordinatorIds: string[];
}

export const UserFormTeamBlock = ({
    className,
    id,
    type,
    readOnly,
    userId,
    defaultGroupId,
}: UserFormTeamBlockProps) => {
    const {
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormTeamBlockType>();

    const onUserChange = (user: Nullish<User>, userType: keyof UserFormTeamBlockType) => {
        user && setValue(userType, user.id);
        trigger(userType);
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const selectedBuddyId = watch('buddyId');

    const supervisorId = watch('supervisorId');

    const { data: supervisorGroups = [] } = trpc.group.getListByUserId.useQuery(
        {
            userId: supervisorId,
            organizational: true,
        },
        {
            enabled: Boolean(supervisorId),
        },
    );

    useEffect(() => {
        if (supervisorGroups[0] && !defaultGroupId) {
            setValue('groupId', supervisorGroups[0]?.id);
        }
    }, [supervisorGroups]);

    const excludedUsers = userId ? [userId] : undefined;

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Team')}
            </Text>
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Supervisor')} required>
                    <UserSelect
                        excludedUsers={excludedUsers}
                        readOnly={readOnly}
                        mode="single"
                        selectedUsers={supervisorId ? [supervisorId] : undefined}
                        onChange={(users) => onUserChange(users[0], 'supervisorId')}
                        error={errors.supervisorId}
                    />
                </FormControl>
                <FormControl label={tr('Line managers')}>
                    <UserSelect
                        excludedUsers={excludedUsers}
                        readOnly={readOnly}
                        mode="multiple"
                        selectedUsers={watch('lineManagerIds')}
                        onChange={(users) =>
                            setValue(
                                'lineManagerIds',
                                users.map((user) => user.id),
                            )
                        }
                    />
                </FormControl>
            </div>

            {nullable(
                type === 'internal',
                () => (
                    <div className={s.ThreeInputsRow}>
                        <FormControl label="Buddy">
                            <UserSelect
                                excludedUsers={excludedUsers}
                                readOnly={readOnly}
                                mode="single"
                                selectedUsers={selectedBuddyId ? [selectedBuddyId] : undefined}
                                onChange={(users) => onUserChange(users[0], 'buddyId')}
                                onReset={() => setValue('buddyId', undefined)}
                            />
                        </FormControl>
                        <FormControl label={tr('OrgGroup')}>
                            <GroupComboBox
                                readOnly={readOnly}
                                defaultGroupId={watch('groupId')}
                                onChange={onTeamChange}
                                error={errors.groupId}
                                organizational
                                onReset={() => setValue('groupId', undefined)}
                            />
                        </FormControl>
                        <FormControl label={tr('Coordinators')}>
                            <UserSelect
                                excludedUsers={excludedUsers}
                                readOnly={readOnly}
                                mode="multiple"
                                selectedUsers={watch('coordinatorIds')}
                                onChange={(users) =>
                                    setValue(
                                        'coordinatorIds',
                                        users.map((user) => user.id),
                                    )
                                }
                            />
                        </FormControl>
                    </div>
                ),
                <div className={s.TwoInputsRow}>
                    <FormControl label={tr('OrgGroup')}>
                        <GroupComboBox
                            readOnly={readOnly}
                            defaultGroupId={watch('groupId')}
                            onChange={onTeamChange}
                            error={errors.groupId}
                            organizational
                            onReset={() => setValue('groupId', undefined)}
                        />
                    </FormControl>
                </div>,
            )}
        </div>
    );
};
