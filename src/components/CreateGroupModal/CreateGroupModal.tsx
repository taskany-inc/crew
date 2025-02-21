import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
    Button,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    Tip,
    RadioControl,
    RadioGroup,
    Checkbox,
    FormControlInput,
} from '@taskany/bricks/harmony';
import { IconInfoCircleOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { CreateGroup, createGroupSchema } from '../../modules/groupSchemas';
import { useGroupMutations } from '../../modules/groupHooks';
import { useRouter } from '../../hooks/useRouter';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { useSessionUser } from '../../hooks/useSessionUser';
import { FormActions } from '../FormActions/FormActions';
import { FormControl } from '../FormControl/FormControl';

import { tr } from './CreateGroupModal.i18n';
import s from './CreateGroupModal.module.css';

interface CreateGroupModalProps {
    visible: boolean;
    onClose: VoidFunction;
}

type GroupType = 'regular' | 'organizational';

export const CreateGroupModal = ({ visible, onClose }: CreateGroupModalProps) => {
    const sessionUser = useSessionUser();
    const { createGroup } = useGroupMutations();
    const router = useRouter();
    const canCreateGroup = sessionUser.role?.editFullGroupTree;

    const groupTypes = useMemo<{ type: GroupType; text: string }[]>(
        () => [
            { type: 'regular', text: tr('V-team') },
            { type: 'organizational', text: tr('Organizational') },
        ],
        [],
    );
    const [type, setType] = useState<GroupType>(canCreateGroup ? 'organizational' : 'regular');

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateGroup>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: { name: '', parentId: undefined },
    });

    const onSubmit = handleSubmit(async (value) => {
        const newGroup = await createGroup({
            ...value,
            parentId: value.parentId,
            virtual: false,
            organizational: type === 'organizational',
        });
        router.team(newGroup.id);

        onClose();
    });

    useEffect(() => {
        setValue('parentId', undefined);
    }, [type, setValue]);

    const closeAndReset = () => {
        reset();
        onClose();
    };

    const businessUnit = watch('businessUnit');

    return (
        <Modal visible={visible} onClose={closeAndReset}>
            <ModalHeader>
                <Text>{tr('Create team')}</Text>
                <ModalCross onClick={closeAndReset} />
            </ModalHeader>

            <ModalContent>
                <form onSubmit={onSubmit}>
                    <FormControl label={tr('Name')} required error={errors.name} className={s.FormBlock}>
                        <FormControlInput
                            autoComplete="off"
                            size="m"
                            outline
                            placeholder={tr('Write group name')}
                            {...register('name', {
                                required: tr('Required field'),
                            })}
                        />
                    </FormControl>
                    {nullable(canCreateGroup, () => (
                        <RadioGroup
                            className={s.FormBlock}
                            name="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as GroupType)}
                        >
                            <Text className={s.RadioLabel} weight="normal">
                                {tr('Group type')}{' '}
                            </Text>
                            {groupTypes.map((t) => (
                                <RadioControl key={t.type} value={t.type}>
                                    {t.text}
                                </RadioControl>
                            ))}
                        </RadioGroup>
                    ))}
                    {nullable(canCreateGroup, () => (
                        <div className={s.FormBlock}>
                            <FormControl label={tr('Parent team:')}>
                                <GroupComboBox
                                    defaultGroupId={watch('parentId')}
                                    onChange={(group) => setValue('parentId', group?.id)}
                                    organizational={type === 'organizational'}
                                />
                            </FormControl>
                            <Tip icon={<IconInfoCircleOutline size="s" />}>
                                {tr('Group without a parent will show up as the top-level group')}
                            </Tip>
                        </div>
                    ))}
                    <div className={s.CheckBoxContainer}>
                        <Text weight="normal">{tr('Buseness unit')}</Text>
                        <Checkbox checked={businessUnit} onChange={(e) => setValue('businessUnit', e.target.checked)} />
                    </div>
                    <FormActions>
                        <Button type="button" text={tr('Cancel')} onClick={closeAndReset} />
                        <Button
                            type="submit"
                            text={tr('Create')}
                            view="primary"
                            size="m"
                            disabled={isSubmitting || isSubmitSuccessful}
                        />
                    </FormActions>
                </form>
            </ModalContent>
        </Modal>
    );
};
