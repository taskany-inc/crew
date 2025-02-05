import { FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import {
    IconChatOutline,
    IconEdit1Outline,
    IconEnvelopeOutline,
    IconMoreVerticalOutline,
    IconXCircleOutline,
} from '@taskany/icons';
import {
    Button,
    Avatar,
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    Text,
    ListView,
    ListViewItem,
    MenuItem,
} from '@taskany/bricks/harmony';

import { useBoolean } from '../../hooks/useBoolean';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { UserWithSuplementalPositions } from '../../modules/userTypes';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { Restricted } from '../Restricted';
import { Link } from '../Link';

import s from './UserItem.module.css';
import { tr } from './UserItem.i18n';

interface UserItemProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
    editable?: boolean;
}

export const UserItem: FC<UserItemProps> = ({ className, user, editable = false, ...rest }) => {
    const mainPosition = useMemo(() => {
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions.find((item) => item.main);
    }, [user]);

    const dropdownVisibility = useBoolean(false);
    const editRolesModalVisible = useBoolean(false);
    const removeModalVisible = useBoolean(false);

    const items = useMemo(
        () => [
            {
                label: tr('Edit'),
                action: () => {
                    editRolesModalVisible.setTrue();
                    dropdownVisibility.setFalse();
                },
                icon: <IconEdit1Outline size="s" />,
            },
            {
                label: tr('Delete'),
                action: () => {
                    removeModalVisible.setTrue();
                    dropdownVisibility.setFalse();
                },
                icon: <IconXCircleOutline size="s" className={s.IconArchive} />,
            },
        ],
        [removeModalVisible, editRolesModalVisible, dropdownVisibility],
    );

    const { showUserPreview } = usePreviewContext();

    return (
        <div className={cn(s.UserItem, className)} {...rest}>
            <Link className={s.UserItemContent} href={pages.user(user.id)} onClick={() => showUserPreview(user.id)}>
                <div className={s.UserInfo}>
                    <Avatar size="l" email={user.email} name={user.name} src={user.image} />
                    <div className={s.UserPersonalInfo}>
                        <Text className={cn(s.UserName, s.UserInfoText)} size="sm">
                            {user.name}
                        </Text>
                        {nullable(mainPosition, (p) => (
                            <>
                                <Text className={s.UserInfoText} size="sm">
                                    {p.role}
                                </Text>
                                <Text className={s.UserInfoText} size="sm">
                                    {p.organizationUnit.name}
                                </Text>
                            </>
                        ))}
                    </div>
                </div>
                <div className={s.Contacts}>
                    {nullable(user.email, () => (
                        <div className={s.ContactsBadge}>
                            <IconEnvelopeOutline className={s.UserInfoText} size="s" />
                            <Text className={s.UserInfoText} title={user.email} lines={1} size="sm" ellipsis>
                                {user.email}
                            </Text>
                        </div>
                    ))}

                    {nullable(user.login, () => (
                        <div className={s.ContactsBadge}>
                            <IconChatOutline className={s.UserInfoText} size="s" />
                            <Text className={s.UserInfoText} title={user.login ?? ''} lines={1} size="sm" ellipsis>
                                {user.login}
                            </Text>
                        </div>
                    ))}
                </div>
            </Link>
            <Restricted visible={editable}>
                <Dropdown isOpen={dropdownVisibility.value} onClose={() => dropdownVisibility.setFalse()}>
                    <DropdownTrigger
                        renderTrigger={(props) => (
                            <Button
                                iconLeft={
                                    <IconMoreVerticalOutline
                                        ref={props.ref}
                                        onClick={() => dropdownVisibility.toggle()}
                                        size="xs"
                                    />
                                }
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
                                            onClick={item.action}
                                            key={item.label}
                                            {...props}
                                        >
                                            <Text className={cn(s.UserItemAction)} size="s">
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
            </Restricted>
        </div>
    );
};
