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
import { IconEdit1Outline, IconMoreVerticalOutline, IconXCircleOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { AddUserToTeamForm } from '../AddUserToTeamForm/AddUserToTeamForm';
import { UserItem } from '../UserItem/UserItem';
import { List, ListItem } from '../List/List';
import { Restricted } from '../Restricted';
import { EditRolesModal } from '../EditRolesModal/EditRolesModal';
import { RemoveUserFromGroupModal } from '../RemoveUserFromGroupModal/RemoveUserFromGroupModal';
import { MembershipInfo } from '../../modules/userTypes';

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
                            <AddUserToTeamForm triggerText={tr('Add')} groupId={groupId} />
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
                <EditRolesModal visible membership={membership} onClose={() => setEditMembership(null)} />
            ))}

            {nullable(removeMembership, (membership) => (
                <RemoveUserFromGroupModal visible membership={membership} onClose={() => setRemoveMembership(null)} />
            ))}
        </>
    );
};
