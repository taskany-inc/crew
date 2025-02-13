import { ComponentProps, HTMLAttributes, useState } from 'react';
import { Button, FormControl, FormControlEditor, Text } from '@taskany/bricks/harmony';
import { nullable, Form } from '@taskany/bricks';
import { Controller, useForm } from 'react-hook-form';
import { IconEdit1Outline } from '@taskany/icons';
import { zodResolver } from '@hookform/resolvers/zod';

import { EditGroup, editGroupSchema } from '../../modules/groupSchemas';
import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { useGroupMutations } from '../../modules/groupHooks';

import { tr } from './TeamPageDecription.i18n';
import s from './TeamPageDecription.module.css';

type Size = NonNullable<ComponentProps<typeof TeamPageSubtitle>['size']>;

interface TeamPageDecriptionProps extends HTMLAttributes<HTMLDivElement> {
    value?: string;
    size?: Size;
    isEditable: boolean;
}

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

export const TeamPageDecription = ({
    children,
    value,
    size = 'l',
    isEditable = false,
    ...rest
}: TeamPageDecriptionProps) => {
    const { editGroup } = useGroupMutations();
    const { watch, control, handleSubmit, reset } = useForm<EditGroup>({
        resolver: zodResolver(editGroupSchema),
        defaultValues: {
            description: value,
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        const editedGroup = await editGroup(data);
        reset({
            description: editedGroup.description ?? '',
        });
    });
    const description = watch('description');

    const [showDecription, setComment] = useState(false);

    return (
        <div className={s.TeamPageDecription} {...rest}>
            <div className={s.TeamPageDecriptionHeader}>
                <TeamPageSubtitle size={size}>{tr('Description')}</TeamPageSubtitle>
                {!showDecription && isEditable ? (
                    nullable(value, () => (
                        <>
                            <Button
                                iconLeft={<IconEdit1Outline size="s" />}
                                className={s.PreviewButton}
                                type="button"
                                onClick={() => setComment(!showDecription)}
                                text={tr('Edit')}
                            />
                        </>
                    ))
                ) : (
                    <div className={s.TeamPageDecriptionHeader}>
                        <Button
                            iconLeft={<IconEdit1Outline size="s" />}
                            className={s.PreviewButton}
                            type="button"
                            onClick={() => setComment(!showDecription)}
                            text={tr('Cancel')}
                        />
                        <Button
                            iconLeft={<IconEdit1Outline size="s" />}
                            className={s.PreviewButton}
                            type="submit"
                            onClick={() => setComment(!showDecription)}
                            text={tr('Save')}
                        />
                    </div>
                )}
            </div>
            {!showDecription ? (
                nullable(
                    description,
                    (t) => (
                        <div>
                            <div>
                                <Text lines={4} ellipsis size={textSizesMap[size]}>
                                    {t}
                                </Text>
                            </div>
                        </div>
                    ),
                    <Text>{tr('Not provided')}</Text>,
                )
            ) : (
                <Form onSubmit={onSubmit}>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <FormControl>
                                <FormControlEditor
                                    outline
                                    {...field}
                                    value={value && !description ? tr('Not provided') : description}
                                    disableAttaches
                                />
                            </FormControl>
                        )}
                    />
                </Form>
            )}
        </div>
    );
};
