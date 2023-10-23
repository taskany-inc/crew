import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, Fieldset, Form, FormAction, FormActions, FormInput, Text } from '@taskany/bricks';
import { gapM, gapS, gray8, textColor } from '@taskany/colors';
import { IconPlusCircleOutline, IconXCircleSolid } from '@taskany/icons';
import { useForm } from 'react-hook-form';

import { trpc } from '../../trpc/trpcClient';
import { PageSep } from '../PageSep';
import { LayoutMain } from '../layout/LayoutMain';
import { SettingsCard, SettingsContainer } from '../Settings';
import { EditGroup } from '../../modules/group.schemas';
import { GroupMeta, GroupParent } from '../../modules/group.types';
import { useGroupMutations } from '../../modules/group.hooks';
import { InlineGroupSelectForm } from '../InlineGroupSelectForm';

import { TeamPageHeader } from './TeamPageHeader';
import { tr } from './groups.i18n';
import { GroupListItem } from './GroupListItem';

type TeamSettingsPageProps = {
    teamId: string;
};

const StyledFormSection = styled(Text)`
    margin: 0 ${gapM} ${gapS} ${gapM};
    display: flex;
    gap: ${gapM};
    align-items: center;
    height: 28px;
`;

type TeamSettingsPageBaseProps = {
    group: Group & GroupMeta & GroupParent;
};

const StyledGroupListItemWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
`;

const GroupListItemWithDelete = (props: { group: Group; onClick: VoidFunction }) => {
    return (
        <StyledGroupListItemWrapper>
            <GroupListItem group={props.group} />
            <IconXCircleSolid size="s" onClick={props.onClick} />
        </StyledGroupListItemWrapper>
    );
};

const TeamSettingsPageBase = ({ group }: TeamSettingsPageBaseProps) => {
    const { editGroup, moveGroup } = useGroupMutations();

    const onAddParent = async (newParent: Group) => {
        await moveGroup.mutateAsync({ id: group.id, newParentId: newParent.id });
    };

    const onAddChild = async (newChild: Group) => {
        await moveGroup.mutateAsync({ id: newChild.id, newParentId: group.id });
    };

    const onRemoveParent = () => {
        moveGroup.mutateAsync({ id: group.id, newParentId: null });
    };

    const onRemoveChild = (id: string) => {
        moveGroup.mutateAsync({ id, newParentId: null });
    };

    const childrenQuery = trpc.group.getChildren.useQuery(group.id);
    const children = childrenQuery.data ?? [];

    const {
        register,
        handleSubmit,
        reset,
        formState: { isDirty },
    } = useForm<EditGroup>({
        defaultValues: {
            groupId: group.id,
            name: group.name,
            description: group.description ?? '',
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        const editedGroup = await editGroup.mutateAsync(data);
        reset({
            groupId: editedGroup.id,
            name: editedGroup.name,
            description: editedGroup.description ?? '',
        });
    });

    return (
        <LayoutMain pageTitle={group.name}>
            <TeamPageHeader group={group} />

            <PageSep />

            <SettingsContainer>
                <SettingsCard>
                    <Form onSubmit={onSubmit}>
                        <Fieldset title={tr('General')}>
                            <FormInput {...register('name')} label={tr('Name')} autoComplete="off" flat="bottom" />

                            <FormInput
                                {...register('description')}
                                label={tr('Description')}
                                autoComplete="off"
                                flat="top"
                            />

                            <FormActions flat="top">
                                <FormAction left />
                                <FormAction right inline>
                                    <Button
                                        size="m"
                                        view="primary"
                                        type="submit"
                                        disabled={!isDirty}
                                        text={tr('Save')}
                                        outline
                                    />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>

                    <Fieldset title={tr('Connections')}>
                        <StyledFormSection weight="bold" color={gray8}>
                            Parent:
                            {group.parent ? (
                                <GroupListItemWithDelete group={group.parent} onClick={onRemoveParent} />
                            ) : (
                                <InlineGroupSelectForm
                                    triggerText={tr('Add parent')}
                                    actionText={tr('Add')}
                                    onSubmit={onAddParent}
                                />
                            )}
                        </StyledFormSection>

                        <StyledFormSection weight="bold" color={gray8}>
                            Children:
                            {children.map((child) => (
                                <GroupListItemWithDelete
                                    key={child.id}
                                    group={child}
                                    onClick={() => onRemoveChild(child.id)}
                                />
                            ))}
                            <InlineGroupSelectForm
                                actionText={tr('Add')}
                                onSubmit={onAddChild}
                                icon={<IconPlusCircleOutline size="s" color={textColor} />}
                            />
                        </StyledFormSection>
                    </Fieldset>
                </SettingsCard>
            </SettingsContainer>
        </LayoutMain>
    );
};

export const TeamSettingsPage = ({ teamId }: TeamSettingsPageProps) => {
    const groupQuery = trpc.group.getById.useQuery(teamId);
    if (!groupQuery.data) return null;
    return <TeamSettingsPageBase group={groupQuery.data} />;
};
