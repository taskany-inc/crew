import React from 'react';
import { Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { Group, User } from 'prisma/prisma-client';

import { FormControl } from '../FormControl/FormControl';
import { UserSelect } from '../UserSelect/UserSelect';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { Nullish } from '../../utils/types';

import s from './UserFormExternalTeamBlock.module.css';
import { tr } from './UserFormExternalTeamBlock.i18n';

interface UserFormExternalTeamBlockProps {
    className: string;
    id: string;
    readOnly?: boolean;
}

interface UserFormExternalTeamBlockType {
    groupId?: string;
    lineManagerIds: string[];
    curatorIds: string[];
}

export const UserFormExternalTeamBlock = ({ className, id, readOnly }: UserFormExternalTeamBlockProps) => {
    const {
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useFormContext<UserFormExternalTeamBlockType>();

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const onUsersChange = (users: User[], type: keyof UserFormExternalTeamBlockType) => {
        setValue(
            type,
            users.map((user) => user.id),
        );
        trigger(type);
    };
    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Team')}
            </Text>
            <div className={s.TwoInputsRow}>
                <FormControl label={tr('Line managers')}>
                    <UserSelect
                        readOnly={readOnly}
                        mode="multiple"
                        selectedUsers={watch('lineManagerIds') ? watch('lineManagerIds') : undefined}
                        onChange={(users) => onUsersChange(users, 'lineManagerIds')}
                    />
                </FormControl>
                <FormControl label={tr('Curator')} required>
                    <UserSelect
                        readOnly={readOnly}
                        mode="multiple"
                        selectedUsers={watch('curatorIds') ? watch('curatorIds') : undefined}
                        onChange={(users) => onUsersChange(users, 'curatorIds')}
                        error={errors.curatorIds}
                    />
                </FormControl>
                <FormControl label={tr('OrgGroup')}>
                    <GroupComboBox
                        readOnly={readOnly}
                        defaultGroupId={watch('groupId')}
                        onChange={onTeamChange}
                        error={errors.groupId}
                        onReset={() => setValue('groupId', undefined)}
                    />
                </FormControl>
            </div>
        </div>
    );
};
