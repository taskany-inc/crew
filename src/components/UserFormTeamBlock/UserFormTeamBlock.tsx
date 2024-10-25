import React from 'react';
import { Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { Group, User } from 'prisma/prisma-client';

import { FormControl } from '../FormControl/FormControl';
import { UserSelect } from '../UserSelect/UserSelect';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { Nullish } from '../../utils/types';

import s from './UserFormTeamBlock.module.css';
import { tr } from './UserFormTeamBlock.i18n';

interface UserFormTeamBlockProps {
    className: string;
    id: string;
}

interface UserFormTeamBlockType {
    groupId?: string;
    supervisorId: string;
    lineManagerIds: string[];
    buddyId?: string;
    coordinatorIds: string[];
}

export const UserFormTeamBlock = ({ className, id }: UserFormTeamBlockProps) => {
    const {
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormTeamBlockType>();

    const onUserChange = (user: Nullish<User>, type: keyof UserFormTeamBlockType) => {
        user && setValue(type, user.id);
        trigger(type);
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const selectedBuddyId = watch('buddyId');

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Team')}
            </Text>
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Supervisor')} required>
                    <UserSelect
                        mode="single"
                        selectedUsers={watch('supervisorId') ? [watch('supervisorId')] : undefined}
                        onChange={(users) => onUserChange(users[0], 'supervisorId')}
                        error={errors.supervisorId}
                    />
                </FormControl>
                <FormControl label={tr('Line managers')}>
                    <UserSelect
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

            <div className={s.ThreeInputsRow}>
                <FormControl label="Buddy">
                    <UserSelect
                        mode="single"
                        selectedUsers={selectedBuddyId ? [selectedBuddyId] : undefined}
                        onChange={(users) => onUserChange(users[0], 'buddyId')}
                        onReset={() => setValue('buddyId', undefined)}
                    />
                </FormControl>
                <FormControl label={tr('OrgGroup')}>
                    <GroupComboBox
                        defaultGroupId={watch('groupId')}
                        onChange={onTeamChange}
                        error={errors.groupId}
                        onReset={() => setValue('groupId', undefined)}
                    />
                </FormControl>
                <FormControl label={tr('Coordinators')}>
                    <UserSelect
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
        </div>
    );
};
