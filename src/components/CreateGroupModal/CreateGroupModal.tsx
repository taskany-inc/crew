import { ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import {
    Button,
    CheckboxInput,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    FormInput,
    nullable,
    Tip,
} from '@taskany/bricks';
import { gapM, gapS, gapXs, gray3, gray8 } from '@taskany/colors';
import { IconInfoCircleOutline } from '@taskany/icons';

import { CreateGroup, createGroupSchema } from '../../modules/groupSchemas';
import { useGroupMutations } from '../../modules/groupHooks';
import { useRouter } from '../../hooks/useRouter';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';

import { tr } from './CreateGroupModal.i18n';

interface CreateGroupModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

const StyledInputContainer = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    padding: ${gapXs} ${gapM};
    background-color: ${gray3};
`;

const StyledTip = styled(Tip)`
    margin-left: ${gapM};
`;

export const CreateGroupModal = ({ visible, onClose }: CreateGroupModalProps) => {
    const { createGroup } = useGroupMutations();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateGroup>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: { name: '', virtual: false, parentId: undefined },
    });

    const virtual = watch('virtual');

    const onVirtualClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('virtual', e.target.checked);
        if (e.target.checked) setValue('parentId', undefined);
    };

    const onSubmit = handleSubmit(async (data) => {
        const newGroup = await createGroup(data);
        router.team(newGroup.id);
        onClose();
    });

    const closeAndReset = () => {
        reset();
        onClose();
    };

    return (
        <Modal visible={visible} onClose={closeAndReset}>
            <ModalHeader>
                <FormTitle>{tr('Create team')}</FormTitle>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <FormInput
                        label={tr('Name')}
                        brick="right"
                        autoComplete="off"
                        {...register('name', { required: tr('Required field') })}
                        error={errors.name}
                    />

                    <StyledInputContainer>
                        <Text weight="bold" color={gray8}>
                            {tr('Virtual group:')}
                        </Text>
                        <CheckboxInput value="virtual" checked={!!virtual} onChange={onVirtualClick} />
                    </StyledInputContainer>

                    {nullable(!virtual, () => (
                        <>
                            <StyledInputContainer>
                                <Text weight="bold" color={gray8}>
                                    {tr('Parent team:')}
                                </Text>
                                <GroupComboBox onChange={(group) => setValue('parentId', group?.id)} />
                            </StyledInputContainer>
                            <StyledTip icon={<IconInfoCircleOutline size="s" />}>
                                {tr('Group without a parent will show up as the top-level group')}
                            </StyledTip>
                        </>
                    ))}

                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button type="button" text={tr('Cancel')} onClick={closeAndReset} />
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
            </ModalContent>
        </Modal>
    );
};
