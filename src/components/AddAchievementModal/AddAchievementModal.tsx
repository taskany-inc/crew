import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import {
    Button,
    Form,
    FormInput,
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
    FormActions,
    FormAction,
    FormTextarea,
    ErrorPopup,
} from '@taskany/bricks';
import { gapM, gapS, gray9 } from '@taskany/colors';
import { Achievement } from '@prisma/client';

import { useAchievmentMutations } from '../../modules/achievementHooks';
import { CreateAndGiveAchievement, createAndGiveAchievementSchema } from '../../modules/achievementSchemas';
import { trpc } from '../../trpc/trpcClient';
import { AchievementGridItem } from '../AchievementGridItem';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './AddAchievementModal.i18n';

interface AddAchievementModalProps {
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

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    max-width: 500px;
    max-height: 250px;
    overflow-y: auto;
`;

export const AddAchievementModal = ({ userId, visible, onClose }: AddAchievementModalProps) => {
    const { giveAchievement, createAndGiveAchievement } = useAchievmentMutations();
    const suggestionsVisibility = useBoolean(false);

    const [search, setSearch] = useState('');
    const achievementsQuery = trpc.achievement.getList.useQuery({ search });

    const {
        register,
        setValue,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateAndGiveAchievement>({
        defaultValues: { userId },
        resolver: zodResolver(createAndGiveAchievementSchema),
    });

    const hideModal = useCallback(() => {
        onClose();
        setSearch('');
        suggestionsVisibility.setFalse();
        reset();
    }, [onClose, reset, suggestionsVisibility]);

    const sendAchievement = useCallback(
        async (achievement: Achievement) => {
            await giveAchievement({
                userId,
                achievementId: achievement.id,
                achievementTitle: achievement.title,
            });
            hideModal();
        },
        [userId, giveAchievement, hideModal],
    );

    const onSubmit = handleSubmit(async (data) => {
        await createAndGiveAchievement(data);
        hideModal();
    });
    const popupRef = useRef<HTMLInputElement>(null);

    return (
        <Modal visible={visible} onClose={hideModal} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Give an achievement')}</FormTitle>
                <ModalCross onClick={hideModal} />
            </ModalHeader>

            <ModalContent style={{ height: 350 }}>
                <StyledTabs layout="horizontal" active="choose">
                    <Tab label={<StyledTabLabel>{tr('Choose')}</StyledTabLabel>} name="choose">
                        <FormInput
                            ref={popupRef}
                            placeholder={tr('Choose achievement')}
                            autoComplete="off"
                            onFocus={suggestionsVisibility.setTrue}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setValue('title', e.target.value);
                            }}
                        />
                        <Grid>
                            {nullable(
                                achievementsQuery.data?.length,
                                () =>
                                    achievementsQuery.data?.map((achievement) => (
                                        <AchievementGridItem
                                            key={`achievementId-${achievement.id}`}
                                            achievement={achievement}
                                            onClick={sendAchievement}
                                        />
                                    )),
                                <Text size="s" color="gray">
                                    {tr('Nothing found')}
                                </Text>,
                            )}
                        </Grid>
                    </Tab>
                    <Tab label={<StyledTabLabel>{tr('Create')}</StyledTabLabel>} name="create">
                        <Form onSubmit={onSubmit}>
                            <FormInput
                                error={errors.title}
                                autoComplete="off"
                                placeholder={tr('Title')}
                                {...register('title')}
                            />
                            <FormInput
                                autoComplete="off"
                                placeholder={tr('Icon URL')}
                                error={errors.icon}
                                {...register('icon')}
                            />
                            <FormTextarea
                                minHeight={180}
                                autoComplete="off"
                                placeholder={tr('Description')}
                                {...register('description')}
                            />
                            {errors.description && (
                                <ErrorPopup placement="left">{errors.description.message}</ErrorPopup>
                            )}

                            <FormActions>
                                <FormAction left />
                                <FormAction right inline>
                                    <Button type="button" text={tr('Cancel')} onClick={hideModal} />
                                    <Button
                                        type="submit"
                                        text={tr('Create')}
                                        view="primary"
                                        size="m"
                                        outline
                                        disabled={isSubmitting || isSubmitSuccessful}
                                    />
                                </FormAction>
                            </FormActions>
                        </Form>
                    </Tab>
                </StyledTabs>
            </ModalContent>
        </Modal>
    );
};
