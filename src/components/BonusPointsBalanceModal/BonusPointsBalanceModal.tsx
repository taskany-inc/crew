import { useState } from 'react';
import { BonusAction } from 'prisma/prisma-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
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
    nullable,
    Tabs,
    Tab,
    Text,
    TabsMenu,
    TabContent,
} from '@taskany/bricks';
import { danger10, gapM, gapS, gray9 } from '@taskany/colors';

import { BonusAchievementComboBox } from '../BonusAchievementComboBox/BonusAchievementComboBox';
import { ChangeBonusPoints, changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { useBonusPointsMutations } from '../../modules/bonusPointsHooks';
import { BonusPointsAchievement } from '../../modules/bonusPointsTypes';

import { tr } from './BonusPointsBalanceModal.i18n';

interface BonusPointsBalanceModalProps {
    userId: string;
    visible: boolean;
    onClose: VoidFunction;
}

const StyledTabs = styled(Tabs)`
    ${TabsMenu} {
        margin-bottom: ${gapM};
        gap: ${gapS};
    }

    ${TabContent} {
        overflow: unset;
    }
`;

const StyledTabLabel = styled(Text)`
    color: ${gray9};
`;

const StyledAchievementRow = styled.div`
    display: grid;
    grid-template-columns: 1fr max-content;
    gap: ${gapS};
`;

const StyledRowWrapper = styled.div`
    margin-top: ${gapS};
    display: grid;
    grid-template-columns: 1fr max-content max-content;
    gap: ${gapS};
`;

export const BonusPointsBalanceModal = ({ userId, visible, onClose }: BonusPointsBalanceModalProps) => {
    const { changeBonusPoints, bonusPointsIsLoading } = useBonusPointsMutations();

    const {
        register,
        setValue,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<ChangeBonusPoints>({
        defaultValues: { userId, amount: 0, description: '' },
        resolver: zodResolver(changeBonusPointsSchema),
    });

    const [achievement, setAchievement] = useState<BonusPointsAchievement>();

    const hideModal = () => {
        onClose();
        reset();
        setAchievement(undefined);
    };

    const onSubmit = handleSubmit(async (data) => {
        await changeBonusPoints(data);
        hideModal();
    });

    const onPlusClick = () => {
        setValue('action', BonusAction.ADD);
    };

    const onMinusClick = () => {
        setValue('action', BonusAction.SUBTRACT);
    };

    const addAchievement = async () => {
        if (!achievement || bonusPointsIsLoading) return;
        await changeBonusPoints({
            userId,
            action: BonusAction.ADD,
            amount: achievement.attributes.bonus,
            achievementId: String(achievement.id),
            achievementCategory: String(achievement.attributes.achievment_category?.data.id),
            description: `${tr('Points for achievement')} ${achievement.attributes.title} (id ${achievement.id})`,
        });
        hideModal();
    };

    return (
        <Modal visible={visible} onClose={hideModal} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Add / subtract bonus points')}</FormTitle>
                <ModalCross onClick={hideModal} />
            </ModalHeader>

            <ModalContent>
                <StyledTabs layout="horizontal" active="achievement">
                    <Tab name="achievement" label={<StyledTabLabel>{tr('Achievements')}</StyledTabLabel>}>
                        <StyledAchievementRow>
                            <BonusAchievementComboBox achievement={achievement} onChange={setAchievement} />
                            <Button text={tr('Add')} view="primary" disabled={!achievement} onClick={addAchievement} />
                        </StyledAchievementRow>
                    </Tab>

                    <Tab name="custom" label={<StyledTabLabel>{tr('Other')}</StyledTabLabel>}>
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
                                <Button
                                    type="submit"
                                    text="+"
                                    onClick={onPlusClick}
                                    disabled={isSubmitting || isSubmitSuccessful}
                                />
                                <Button
                                    type="submit"
                                    text="-"
                                    onClick={onMinusClick}
                                    disabled={isSubmitting || isSubmitSuccessful}
                                />
                            </StyledRowWrapper>
                        </Form>
                    </Tab>
                </StyledTabs>
            </ModalContent>
        </Modal>
    );
};
