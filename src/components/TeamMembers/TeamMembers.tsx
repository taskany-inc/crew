import { FC, HTMLAttributes, useState, useMemo, ComponentProps } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import {
    Button,
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    ListView,
    ListViewItem,
    MenuItem,
    Text,
} from '@taskany/bricks/harmony';
import { IconEdit1Outline, IconMoreVerticalOutline, IconXCircleOutline, IconPlusCircleOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { AddUserToTeamModal } from '../AddUserToTeamModal/AddUserToTeamModal';
import { UserItem } from '../UserItem/UserItem';
import { List, ListItem } from '../List/List';
import { Restricted } from '../Restricted';
import { MembershipInfo } from '../../modules/userTypes';
import { useBoolean } from '../../hooks/useBoolean';
import { WarningModal } from '../WarningModal/WarningModal';
import { useUserMutations } from '../../modules/userHooks';

import s from './TeamMembers.module.css';
import { tr } from './TeamMembers.i18n';

interface TeamMembersProps extends HTMLAttributes<HTMLDivElement> {
    editable?: boolean;
    groupId: string;
    size?: ComponentProps<typeof TeamPageSubtitle>['size'];
    showAvatar?: ComponentProps<typeof UserItem>['showAvatar'];
}

export const TeamMembers: FC<TeamMembersProps> = ({
    className,
    children,
    editable = false,
    groupId,
    size,
    showAvatar,
    ...props
}) => {
    const { data: memberships = [] } = trpc.group.getMemberships.useQuery({ groupId });
    const [editMembership, setEditMembership] = useState<MembershipInfo | null>(null);
    const [removeMembership, setRemoveMembership] = useState<MembershipInfo | null>(null);
    const [dropdownId, setDropdownId] = useState<string | null>(null);

    const modalAddUserToTeamVisibility = useBoolean(false);

    const { removeUserFromGroup } = useUserMutations();

    const onRemoveClick = async (membership: MembershipInfo) => {
        await removeUserFromGroup({ userId: membership.userId, groupId: membership.groupId });
        setRemoveMembership(null);
    };

    const items = useMemo(
        () => [
            {
                label: tr('Edit'),
                action: (m: MembershipInfo) => {
                    setEditMembership(m);
                    setDropdownId(null);
                },
                icon: <IconEdit1Outline size="s" />,
            },
            {
                label: tr('Delete'),
                action: (m: MembershipInfo) => {
                    setRemoveMembership(m);
                    setDropdownId(null);
                },
                icon: <IconXCircleOutline size="s" className={s.IconArchive} />,
            },
        ],
        [setDropdownId, setEditMembership, setRemoveMembership],
    );

    return (
        <>
            <div className={cn(s.TeamMembers, className)} {...props}>
                <TeamPageSubtitle
                    className={s.TeamMembersSubtitle}
                    size={size}
                    counter={memberships.length}
                    action={
                        <Restricted visible={editable}>
                            <Button
                                text={tr('Add')}
                                className={s.AddButton}
                                view="clear"
                                brick="right"
                                iconLeft={<IconPlusCircleOutline size="s" />}
                                onClick={modalAddUserToTeamVisibility.setTrue}
                            />
                            <AddUserToTeamModal
                                visible={modalAddUserToTeamVisibility.value}
                                onClose={modalAddUserToTeamVisibility.setFalse}
                                groupId={groupId}
                                type="user-to-team"
                            />
                        </Restricted>
                    }
                >
                    {tr('Members')}
                </TeamPageSubtitle>

                <List className={s.TeamMembersList}>
                    {nullable(
                        memberships,
                        () =>
                            memberships.map((m, index) => (
                                <ListItem className={s.TeamMembersItemWrapper} key={index}>
                                    <UserItem
                                        showAvatar={showAvatar}
                                        className={cn(s.TeamMembersItem, {
                                            [s.TeamMembersItem_L]: size === 'l',
                                        })}
                                        user={m.user}
                                        size={size}
                                    />
                                    {nullable(editable, () => (
                                        <Dropdown isOpen={dropdownId === m.id} onClose={() => setDropdownId(null)}>
                                            <DropdownTrigger
                                                renderTrigger={(props) => (
                                                    <Button
                                                        onClick={() => {
                                                            setDropdownId((id) => (id ? null : m.id));
                                                        }}
                                                        iconLeft={<IconMoreVerticalOutline ref={props.ref} size="xs" />}
                                                    />
                                                )}
                                            />
                                            <DropdownPanel placement="right-start">
                                                <ListView>
                                                    {items.map((item) => (
                                                        <ListViewItem
                                                            key={item.label}
                                                            value={item}
                                                            renderItem={({ active, hovered, ...props }) => (
                                                                <MenuItem
                                                                    hovered={active || hovered}
                                                                    onClick={() => item.action(m)}
                                                                    key={item.label}
                                                                    {...props}
                                                                >
                                                                    <Text
                                                                        className={cn(s.TeamMembersItemAction)}
                                                                        size="s"
                                                                    >
                                                                        {item.icon}
                                                                        {item.label}
                                                                    </Text>
                                                                </MenuItem>
                                                            )}
                                                        />
                                                    ))}
                                                </ListView>
                                            </DropdownPanel>
                                        </Dropdown>
                                    ))}
                                </ListItem>
                            )),
                        <Text
                            className={cn(s.Empty, {
                                [s.Empty_L]: size === 'l',
                            })}
                        >
                            {tr('No members')}
                        </Text>,
                    )}
                </List>
            </div>
            {nullable(editMembership, (membership) => (
                <AddUserToTeamModal
                    membership={membership}
                    visible={!!editMembership}
                    onClose={() => setEditMembership(null)}
                    groupId={groupId}
                    type="edit"
                />
            ))}

            {nullable(removeMembership, (membership) => (
                <WarningModal
                    view="danger"
                    warningText={tr('Do you really want to remove a member {user} from the team {team}', {
                        user: membership.user.name || 'user',
                        team: membership.group.name,
                    })}
                    visible
                    onCancel={() => setRemoveMembership(null)}
                    onConfirm={() => onRemoveClick(membership)}
                />
            ))}
        </>
    );
};
