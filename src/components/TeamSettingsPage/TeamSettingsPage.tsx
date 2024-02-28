import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, Fieldset, Form, FormAction, FormActions, FormInput, Text } from '@taskany/bricks';
import { gapM, gapS, gray8, textColor } from '@taskany/colors';
import { IconPlusCircleOutline, IconXCircleSolid } from '@taskany/icons';
import { useForm } from 'react-hook-form';

import { trpc } from '../../trpc/trpcClient';
import { PageSep } from '../PageSep';
import { LayoutMain } from '../LayoutMain';
import { SettingsCard, SettingsContainer } from '../Settings';
import { EditGroup } from '../../modules/groupSchemas';
import { GroupMeta, GroupParent } from '../../modules/groupTypes';
import { useGroupMutations } from '../../modules/groupHooks';
import { InlineGroupSelectForm } from '../InlineGroupSelectForm';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { GroupListItem } from '../GroupListItem';

import { tr } from './TeamSettingsPage.i18n';

type TeamSettingsPageProps = {
    teamId: string;
};

const StyledFormSection = styled(Text)`
    margin: 0 ${gapM} ${gapS} ${gapM};
    display: flex;
    gap: ${gapM};
    flex-wrap: wrap;
    align-items: center;
    min-height: 28px;
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
            <GroupListItem groupName={props.group.name} groupId={props.group.id} />
            <IconXCircleSolid size="s" onClick={props.onClick} />
        </StyledGroupListItemWrapper>
    );
};

const TeamSettingsPageBase = ({ group }: TeamSettingsPageBaseProps) => {
    const { editGroup, moveGroup } = useGroupMutations();

    const onAddParent = async (newParent: Group) => {
        await moveGroup({ id: group.id, newParentId: newParent.id });
    };

    const onAddChild = async (newChild: Group) => {
        await moveGroup({ id: newChild.id, newParentId: group.id });
    };

    const onRemoveParent = () => {
        moveGroup({ id: group.id, newParentId: null });
    };

    const onRemoveChild = (id: string) => {
        moveGroup({ id, newParentId: null });
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
        const editedGroup = await editGroup(data);
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
