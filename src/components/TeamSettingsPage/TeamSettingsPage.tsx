import { ChangeEvent } from 'react';
import { Group } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, CheckboxInput, Fieldset, Form, FormAction, FormActions, FormInput, Text } from '@taskany/bricks';
import { gapM, gapS, gapXs, gray3, gray8, textColor } from '@taskany/colors';
import { IconPlusCircleOutline, IconXCircleSolid } from '@taskany/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '../../trpc/trpcClient';
import { PageSep } from '../PageSep';
import { LayoutMain } from '../LayoutMain';
import { SettingsCard, SettingsContainer } from '../Settings';
import { EditGroup, editGroupSchema } from '../../modules/groupSchemas';
import { GroupMeta, GroupParent, GroupSupervisor } from '../../modules/groupTypes';
import { useGroupMutations } from '../../modules/groupHooks';
import { InlineGroupSelectForm } from '../InlineGroupSelectForm';
import { TeamPageHeader } from '../TeamPageHeader/TeamPageHeader';
import { GroupListItem } from '../GroupListItem';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { GroupAdmins } from '../GroupAdmins/GroupAdmins';
import NotFound from '../../pages/404';

import { tr } from './TeamSettingsPage.i18n';

interface TeamSettingsPageProps {
    teamId: string;
}

const StyledFormSection = styled(Text)`
    margin: 0 ${gapM} ${gapS} ${gapM};
    display: flex;
    gap: ${gapM};
    flex-wrap: wrap;
    align-items: center;
    min-height: 28px;
`;

interface TeamSettingsPageBaseProps {
    group: Group & GroupMeta & GroupParent & GroupSupervisor;
}

const StyledGroupListItemWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
`;

const StyledInputContainer = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    padding: ${gapXs} ${gapM};
    background-color: ${gray3};
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
        watch,
        setValue,
        formState: { isDirty, errors },
    } = useForm<EditGroup>({
        resolver: zodResolver(editGroupSchema),
        defaultValues: {
            groupId: group.id,
            name: group.name,
            description: group.description ?? '',
            organizational: group.organizational,
            supervisorId: group.supervisorId,
        },
    });

    const organizational = watch('organizational');

    const onOrganizationalClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('organizational', e.target.checked, { shouldDirty: true });
    };

    const onSubmit = handleSubmit(async (data) => {
        const editedGroup = await editGroup(data);
        reset({
            groupId: editedGroup.id,
            name: editedGroup.name,
            description: editedGroup.description ?? '',
            organizational: editedGroup.organizational,
            supervisorId: editedGroup.supervisorId,
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
                            <FormInput
                                {...register('name')}
                                label={tr('Name')}
                                autoComplete="off"
                                flat="bottom"
                                error={errors.name}
                            />
                            <FormInput
                                {...register('description')}
                                label={tr('Description')}
                                autoComplete="off"
                                flat="top"
                            />

                            <StyledInputContainer>
                                <Text weight="bold" color={gray8}>
                                    {tr('Organizational group:')}
                                </Text>
                                <CheckboxInput
                                    value="organizational"
                                    checked={organizational}
                                    onChange={onOrganizationalClick}
                                />
                            </StyledInputContainer>

                            <StyledInputContainer>
                                <Text weight="bold" color={gray8}>
                                    {tr('Supervisor:')}
                                </Text>
                                <UserComboBox
                                    value={group.supervisor}
                                    onChange={(user) =>
                                        setValue('supervisorId', user?.id || null, { shouldDirty: true })
                                    }
                                />
                            </StyledInputContainer>

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

                    <GroupAdmins isEditable={group.meta.isEditable} groupId={group.id} />

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
                                    filter={[group.id]}
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
                                filter={[group.id]}
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

    if (!groupQuery.data || !groupQuery.data.meta.isEditable) return <NotFound />;

    return <TeamSettingsPageBase group={groupQuery.data} />;
};
