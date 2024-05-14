import { useCallback, useMemo } from 'react';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Text, nullable } from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';
import { danger0, gapS } from '@taskany/colors';

import { InlineTrigger } from '../InlineTrigger';
import { PopupTrigger } from '../PopupTrigger';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { Nullish } from '../../utils/types';
import { useBoolean } from '../../hooks/useBoolean';
import { useGroupMutations } from '../../modules/groupHooks';
import { addOrRemoveUserFromGroupAdminsSchema, AddOrRemoveUserFromGroupAdmins } from '../../modules/groupSchemas';

import { tr } from './AddUserToGroupAdminsForm.i18n';

interface AddUserToGroupAdminsFormProps {
    groupId: string;
}

const StyledBottomRow = styled.div`
    margin-top: ${gapS};
    display: flex;
    align-items: center;
    gap: ${gapS};
`;

const StyledSubmitButton = styled(Button)`
    margin-left: auto;
`;

export const AddUserToGroupAdminsForm = ({ groupId }: AddUserToGroupAdminsFormProps) => {
    const { addUserToGroupAdmin } = useGroupMutations();

    const popupVisibility = useBoolean(false);

    const defaultValues = useMemo(
        () => ({
            userId: undefined,
            groupId,
        }),
        [groupId],
    );

    const {
        reset,
        handleSubmit,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<AddOrRemoveUserFromGroupAdmins>({
        resolver: zodResolver(addOrRemoveUserFromGroupAdminsSchema),
        defaultValues,
    });

    const onGroupAdminsChange = useCallback(
        (user: Nullish<User>) => {
            if (user) {
                setValue('userId', user.id);
                trigger('userId');
            } else {
                reset({ ...defaultValues, userId: undefined });
            }
        },
        [reset, setValue, trigger, defaultValues],
    );

    const onSubmit = handleSubmit(async (data) => {
        await addUserToGroupAdmin(data);
        reset(defaultValues);
        popupVisibility.setFalse();
    });

    return (
        <PopupTrigger
            placement="bottom-start"
            renderTrigger={(props) => (
                <InlineTrigger text={tr('Add')} icon={<IconPlusCircleSolid size="s" />} {...props} />
            )}
            visible={popupVisibility.value}
            setVisible={popupVisibility.setValue}
            onCancel={() => reset(defaultValues)}
            width={450}
        >
            <Form onSubmit={onSubmit}>
                <UserComboBox onChange={onGroupAdminsChange} />
                {nullable(errors.userId, (e) => (
                    <Text size="xs" color={danger0}>
                        {e.message}
                    </Text>
                ))}
                <StyledBottomRow>
                    <StyledSubmitButton text={tr('Add')} view="primary" type="submit" />
                </StyledBottomRow>
            </Form>
        </PopupTrigger>
    );
};
