import { ComponentProps, FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { IconEdit1Outline, IconMoreVerticalOutline, IconXCircleOutline } from '@taskany/icons';
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
import { UserContacts } from '../UserContactsV2/UserContactsV2';

import s from './UserItem.module.css';
import { tr } from './UserItem.i18n';

type Size = 'm' | 'l';

interface UserItemProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
    editable?: boolean;
    size?: Size;
    showAvatar?: boolean;
}

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

export const UserItem: FC<UserItemProps> = ({ className, user, editable = false, size = 'l', showAvatar, ...rest }) => {
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
        <div
            className={cn(
                s.UserItem,
                {
                    [s.UserItem_L]: size === 'l',
                    [s.UserItem_M]: size === 'm',
                },
                className,
            )}
            {...rest}
        >
            <Link className={s.UserItemContent} href={pages.user(user.id)} onClick={() => showUserPreview(user.id)}>
                <div className={s.UserInfo}>
                    {nullable(showAvatar, () => (
                        <Avatar size={size === 'm' ? 'ml' : 'l'} email={user.email} name={user.name} src={user.image} />
                    ))}
                    <div className={s.UserPersonalInfo}>
                        <Text className={cn(s.UserName, s.UserInfoText)} size={textSizesMap[size]}>
                            {user.name}
                        </Text>
                        {nullable(mainPosition, (p) => (
                            <>
                                <Text className={s.UserInfoText} size={textSizesMap[size]}>
                                    {p.role}
                                </Text>
                                <Text className={s.UserInfoText} size={textSizesMap[size]}>
                                    {p.organizationUnit.name}
                                </Text>
                            </>
                        ))}
                    </div>
                </div>
                <UserContacts user={user} size={size} />
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
