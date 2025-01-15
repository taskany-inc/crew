import { useMemo } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';
import { IconDownSmallOutline, IconUpSmallOutline } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { CreateUserModal } from '../CreateUserModal/CreateUserModal';
import { CreateGroupModal } from '../CreateGroupModal/CreateGroupModal';
import { useBoolean } from '../../hooks/useBoolean';
import { UserSettings } from '../../modules/userTypes';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './PageHeaderActionButton.i18n';
import s from './PageHeaderActionButton.module.css';

export const PageHeaderActionButton: React.FC<{ logo?: string; userSettings?: UserSettings }> = ({ userSettings }) => {
    const sessionUser = useSessionUser();

    const createUserModalVisibility = useBoolean(false);
    const createGroupModalVisibility = useBoolean(false);

    const items: { title: string; action: VoidFunction }[] = useMemo(() => {
        const result = [];
        if (
            sessionUser.role?.createInternalUserRequest ||
            sessionUser.role?.createExistingUserRequest ||
            sessionUser.role?.createExternalUserRequest ||
            sessionUser.role?.createExternalFromMainUserRequest
        ) {
            result.push({ title: tr('User'), action: createUserModalVisibility.setTrue });
        }
        result.push({ title: tr('Team'), action: createGroupModalVisibility.setTrue });
        return result;
    }, [sessionUser.role, createGroupModalVisibility.setTrue, createUserModalVisibility.setTrue, userSettings]);

    if (items.length === 0) return null;

    return (
        <>
            <div className={s.Wrapper}>
                <Button text={tr('Create')} brick="right" onClick={items[0].action} />
                <Dropdown
                    className={s.Dropdown}
                    onChange={(item) => item.action()}
                    items={items}
                    renderTrigger={(props) => (
                        <Button
                            brick="left"
                            iconRight={
                                props.visible ? <IconUpSmallOutline size="s" /> : <IconDownSmallOutline size="s" />
                            }
                            ref={props.ref}
                            onClick={props.onClick}
                        />
                    )}
                    renderItem={(props) => (
                        <MenuItem
                            key={props.item.title}
                            focused={props.cursor === props.index}
                            onClick={props.onClick}
                            view="primary"
                            ghost
                        >
                            {props.item.title}
                        </MenuItem>
                    )}
                />
            </div>
            <CreateUserModal visible={createUserModalVisibility.value} onClose={createUserModalVisibility.setFalse} />
            <CreateGroupModal
                visible={createGroupModalVisibility.value}
                onClose={createGroupModalVisibility.setFalse}
            />
        </>
    );
};
