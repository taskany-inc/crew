import { ComponentProps, HTMLAttributes, useState } from 'react';
import { Button, FormControl, FormControlEditor } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { Controller, useForm } from 'react-hook-form';
import { IconEdit1Outline, IconSaveOutline, IconXOutline } from '@taskany/icons';
import { zodResolver } from '@hookform/resolvers/zod';

import { EditGroup, editGroupSchema } from '../../modules/groupSchemas';
import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { useGroupMutations } from '../../modules/groupHooks';
import { Description } from '../Description/Description';

import { tr } from './TeamPageDescription.i18n';
import s from './TeamPageDescription.module.css';

type Size = NonNullable<ComponentProps<typeof TeamPageSubtitle>['size']>;

interface TeamPageDecriptionProps extends HTMLAttributes<HTMLDivElement> {
    value?: string;
    size?: Size;
    isEditable?: boolean;
    groupId: string;
}

export const TeamPageDescription = ({
    children,
    value,
    size = 'l',
    isEditable,
    groupId,
    ...rest
}: TeamPageDecriptionProps) => {
    const [editDescription, setEditDescription] = useState(false);

    const { editGroup } = useGroupMutations();
    const { watch, control, handleSubmit, reset } = useForm<EditGroup>({
        resolver: zodResolver(editGroupSchema),
        defaultValues: {
            description: value,
            groupId,
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        const editedGroup = await editGroup(data);
        reset({
            groupId,
            description: editedGroup.description ?? '',
        });
        setEditDescription(!editDescription);
    });

    const description = watch('description');

    return (
        <form onSubmit={onSubmit}>
            <div className={s.TeamPageDecription} {...rest}>
                <div className={s.TeamPageDecriptionHeader}>
                    <TeamPageSubtitle size={size}>{tr('Description')}</TeamPageSubtitle>
                    {nullable(isEditable, () => (
                        <>
                            {editDescription ? (
                                <div className={s.TeamPageDecriptionHeader}>
                                    <Button
                                        view="ghost"
                                        iconLeft={<IconXOutline size="s" />}
                                        className={s.PreviewButton}
                                        type="button"
                                        onClick={() => setEditDescription(!editDescription)}
                                        text={tr('Cancel')}
                                    />
                                    <Button
                                        view="ghost"
                                        iconLeft={<IconSaveOutline size="s" />}
                                        className={s.PreviewButton}
                                        type="submit"
                                        text={tr('Save')}
                                    />
                                </div>
                            ) : (
                                <Button
                                    view="ghost"
                                    iconLeft={<IconEdit1Outline size="s" />}
                                    className={s.PreviewButton}
                                    type="button"
                                    onClick={() => setEditDescription(!editDescription)}
                                    text={tr('Edit')}
                                />
                            )}
                        </>
                    ))}
                </div>
                {editDescription && isEditable ? (
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <FormControl>
                                <FormControlEditor
                                    outline
                                    {...field}
                                    value={value && !description ? '' : value}
                                    disableAttaches
                                />
                            </FormControl>
                        )}
                    />
                ) : (
                    <Description size={size} description={value} />
                )}
            </div>
        </form>
    );
};
