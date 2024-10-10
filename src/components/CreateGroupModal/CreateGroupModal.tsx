import { ComponentProps, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import {
    Button,
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
    FormRadio,
    FormRadioInput,
} from '@taskany/bricks';
import { gapM, gapS, gapXs, gray3, gray8 } from '@taskany/colors';
import { IconInfoCircleOutline } from '@taskany/icons';

import { CreateGroup, createGroupSchema } from '../../modules/groupSchemas';
import { useGroupMutations } from '../../modules/groupHooks';
import { useRouter } from '../../hooks/useRouter';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './CreateGroupModal.i18n';

interface CreateGroupModalProps {
    visible: boolean;
    onClose: VoidFunction;
    parentId?: ComponentProps<typeof GroupComboBox>['defaultGroupId'];
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

type GroupType = 'regular' | 'virtual' | 'organizational';

export const CreateGroupModal = ({ visible, onClose, parentId }: CreateGroupModalProps) => {
    const sessionUser = useSessionUser();
    const { createGroup } = useGroupMutations();
    const router = useRouter();
    const canCreateGroup = sessionUser.role?.editFullGroupTree;

    const groupTypes = useMemo<{ type: GroupType; text: string }[]>(
        () => [
            { type: 'regular', text: tr('Regular') },
            { type: 'organizational', text: tr('Organizational') },
            { type: 'virtual', text: tr('Virtual') },
        ],
        [],
    );
    const [type, setType] = useState<GroupType>(canCreateGroup ? 'regular' : 'virtual');

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateGroup>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: { name: '', parentId: type !== 'virtual' && parentId ? parentId : undefined },
    });

    const onSubmit = handleSubmit(async (value) => {
        const newGroup = await createGroup({
            ...value,
            parentId: type !== 'virtual' ? value.parentId : undefined,
            virtual: type === 'virtual',
            organizational: type === 'organizational',
        });
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
                    {nullable(canCreateGroup, () => (
                        <FormRadio
                            label={tr('Group type')}
                            name="type"
                            value={type}
                            onChange={(v) => setType(v as GroupType)}
                        >
                            {groupTypes.map((t) => (
                                <FormRadioInput key={t.type} value={t.type} label={t.text} />
                            ))}
                        </FormRadio>
                    ))}
                    {nullable(type !== 'virtual' && canCreateGroup, () => (
                        <>
                            <StyledInputContainer>
                                <Text weight="bold" color={gray8}>
                                    {tr('Parent team:')}
                                </Text>
                                <GroupComboBox
                                    defaultGroupId={parentId}
                                    onChange={(group) => setValue('parentId', group?.id)}
                                />
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
