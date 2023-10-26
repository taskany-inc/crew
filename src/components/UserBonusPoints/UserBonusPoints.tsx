import { useState } from 'react';
import { BonusAction, User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Form,
    FormInput,
    FormTextarea,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    nullable,
} from '@taskany/bricks';
import { IconEditSolid } from '@taskany/icons';
import { danger10, gapM, gapS } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { UserMeta } from '../../modules/userTypes';
import { ChangeBonusPoints, changeBonusPointsSchema } from '../../modules/userSchemas';
import { useUserMutations } from '../../modules/userHooks';
import { BonusPointsHistory } from '../BonusPointsHistory/BonusPointsHistory';

import { tr } from './UserBonusPoints.i18n';

type UserBonusPointsProps = {
    user: User & UserMeta;
};

const StyledText = styled(Text)`
    margin-bottom: ${gapM};
`;

const StyledRowWrapper = styled.div`
    margin-top: ${gapS};
    display: grid;
    grid-template-columns: 1fr max-content max-content;
    gap: ${gapS};
`;

export const UserBonusPoints = ({ user }: UserBonusPointsProps) => {
    const { changeBonusPoints } = useUserMutations();
    const [modalVisible, setModalVisible] = useState(false);

    const {
        register,
        setValue,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangeBonusPoints>({
        defaultValues: { userId: user.id, amount: 0, description: '' },
        resolver: zodResolver(changeBonusPointsSchema),
    });

    const hideModal = () => {
        setModalVisible(false);
        reset();
    };

    const onSubmit = handleSubmit(async (data) => {
        await changeBonusPoints.mutateAsync(data);
        hideModal();
    });

    const onPlusClick = () => {
        setValue('action', BonusAction.ADD);
    };

    const onMinusClick = () => {
        setValue('action', BonusAction.SUBTRACT);
    };

    return (
        <NarrowSection title={tr('Bonus points')}>
            <StyledText>
                {tr('Balance')}: {user.bonusPoints}
            </StyledText>

            {nullable(user.meta.isBonusEditable && !modalVisible, () => (
                <InlineTrigger
                    text={tr('Add / Subtract')}
                    icon={<IconEditSolid size="s" />}
                    onClick={() => setModalVisible(true)}
                />
            ))}

            {nullable(user.meta.isBonusHistoryViewable, () => (
                <BonusPointsHistory userId={user.id} />
            ))}

            <Modal visible={modalVisible} onClose={hideModal} width={500}>
                <ModalHeader>
                    <FormTitle>{tr('Add / subtract bonus points')}</FormTitle>
                    <ModalCross onClick={hideModal} />
                </ModalHeader>

                <ModalContent>
                    <Form onSubmit={onSubmit}>
                        {/* TODO: pass error in textarea https://github.com/taskany-inc/bricks/issues/507 */}
                        <FormTextarea
                            placeholder={tr('Reason for balance change')}
                            autoComplete="off"
                            {...register('description')}
                        />
                        {nullable(errors.description?.message, (m) => (
                            <Text color={danger10}>{m}</Text>
                        ))}
                        <StyledRowWrapper>
                            <FormInput
                                // TODO: remove ignore after https://github.com/taskany-inc/bricks/issues/508
                                // @ts-ignore
                                type="number"
                                min={0}
                                {...register('amount', { valueAsNumber: true })}
                                error={errors.amount}
                            />
                            <Button type="submit" text="+" onClick={onPlusClick} />
                            <Button type="submit" text="-" onClick={onMinusClick} />
                        </StyledRowWrapper>
                    </Form>
                </ModalContent>
            </Modal>
        </NarrowSection>
    );
};
