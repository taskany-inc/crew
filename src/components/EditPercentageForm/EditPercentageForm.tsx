import { Form } from '@taskany/bricks';
import React, { ChangeEvent, FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@taskany/bricks/harmony';

import { EditPercentageFormControl } from '../EditPercentageFormControl/EditPercentageFormControl';
import { MembershipInfo } from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';
import { useUserMutations } from '../../modules/userHooks';
import { UpdateMembershipPercentage, updateMembershipPercentageSchema } from '../../modules/userSchemas';

import { tr } from './EditPercentageForm.i18n';

interface EditPercentageFormProps {
    membership: MembershipInfo;
}

export const EditPercentageForm: FC<EditPercentageFormProps> = ({ membership }) => {
    const { updatePercentage } = useUserMutations();
    const {
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        getValues,
        formState: { errors },
    } = useForm<UpdateMembershipPercentage>({
        resolver: zodResolver(updateMembershipPercentageSchema),
        defaultValues: {
            groupId: membership.groupId,
            membershipId: membership.id,
            percentage: membership.percentage,
        },
    });

    const availableMembershipQuery = trpc.user.getAvailableMembershipPercentage.useQuery(membership.userId);
    const max = Math.min(100, Number(availableMembershipQuery.data) + Number(membership.percentage));

    const onPercentageChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const percentage = e.target.value === '' ? null : parseInt(e.target.value, 10);
            setValue('percentage', percentage);
            if (percentage && percentage > max && percentage > Number(membership.percentage)) {
                setError('percentage', { message: tr('Maximum value is {max}', { max }) });
            } else {
                clearErrors('percentage');
            }
        },
        [max, setValue, membership.percentage, setError, clearErrors],
    );

    const onSubmit = async (data: UpdateMembershipPercentage) => {
        await updatePercentage(data);
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <EditPercentageFormControl
                onPercentageChange={onPercentageChange}
                initialPercentage={membership.percentage as number | undefined}
                errors={errors}
                maxPercentage={max}
                submitButton={
                    <Button
                        type="submit"
                        view="primary"
                        disabled={Number(getValues().percentage) > max}
                        brick="left"
                        text={tr('Save')}
                    />
                }
            />
        </Form>
    );
};
