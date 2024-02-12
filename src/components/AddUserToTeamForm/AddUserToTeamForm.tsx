import { ChangeEvent, useCallback } from 'react';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Form,
    FormControl,
    FormControlError,
    FormControlInput,
    FormControlLabel,
    Text,
    nullable,
} from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';
import { danger0, gapS, gray7 } from '@taskany/colors';

import { InlineTrigger } from '../InlineTrigger';
import { useUserMutations } from '../../modules/userHooks';
import { PopupTrigger } from '../PopupTrigger';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { AddUserToGroup, addUserToGroupSchema } from '../../modules/userSchemas';
import { trpc } from '../../trpc/trpcClient';
import { Nullish } from '../../utils/types';

import { tr } from './AddUserToTeamForm.i18n';

type AddUserToTeamFormProps = {
    groupId: string;
};

const StyledBottomRow = styled.div`
    margin-top: ${gapS};
    display: flex;
    align-items: center;
    gap: ${gapS};
`;

const StyledFormControlInput = styled(FormControlInput)`
    width: 7ch;
`;

const StyledSubmitButton = styled(Button)`
    margin-left: auto;
`;

export const AddUserToTeamForm = ({ groupId }: AddUserToTeamFormProps) => {
    const { addUserToGroup } = useUserMutations();

    const defaultValues = {
        userId: undefined,
        groupId,
        percentage: undefined,
    };

    const {
        reset,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        watch,
        trigger,
        formState: { errors },
    } = useForm<AddUserToGroup>({
        resolver: zodResolver(addUserToGroupSchema),
        defaultValues,
    });

    const userId = watch('userId');
    const availableMembershipQuery = trpc.user.getAvailableMembershipPercentage.useQuery(userId, { enabled: !!userId });
    const max = availableMembershipQuery.data ?? 100;

    const onUserChange = useCallback(
        (user: Nullish<User>) => {
            if (user) {
                setValue('userId', user.id);
                trigger('userId');
            } else {
                reset({ userId: undefined });
            }
        },
        [reset, setValue, trigger],
    );

    const onPercentageChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const percentage = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
            setValue('percentage', percentage);
            if (percentage && percentage > max) {
                setError('percentage', { message: tr('Maximum value is {max}', { max }) });
            } else {
                clearErrors('percentage');
            }
        },
        [setValue, setError, clearErrors, max],
    );

    const onSubmit = handleSubmit(async (data) => {
        await addUserToGroup(data);
        reset(defaultValues);
    });

    return (
        <PopupTrigger
            placement="bottom-start"
            renderTrigger={(props) => (
                <InlineTrigger text={tr('Add participant')} icon={<IconPlusCircleSolid size="s" />} {...props} />
            )}
            onCancel={() => reset(defaultValues)}
            width={450}
        >
            <Form onSubmit={onSubmit}>
                <UserComboBox onChange={onUserChange} />
                {nullable(errors.userId, (e) => (
                    <Text size="xs" color={danger0}>
                        {e.message}
                    </Text>
                ))}
                <StyledBottomRow>
                    {nullable(userId, () => (
                        <FormControl error={errors.percentage !== undefined} variant="outline" inline>
                            <FormControlLabel color={gray7}>{tr('Membership percentage')}</FormControlLabel>
                            <StyledFormControlInput onChange={onPercentageChange} />
                            {nullable(errors.percentage, (e) => (
                                <FormControlError error={e} />
                            ))}
                            <Text size="s" color={gray7}>
                                {tr.raw('Available: {max}', { max })}
                            </Text>
                        </FormControl>
                    ))}
                    <StyledSubmitButton text={tr('Add')} view="primary" type="submit" />
                </StyledBottomRow>
            </Form>
        </PopupTrigger>
    );
};
