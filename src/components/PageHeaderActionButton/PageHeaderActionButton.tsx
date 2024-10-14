import { useMemo } from 'react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';
import { IconDownSmallSolid, IconUpSmallSolid } from '@taskany/icons';

import { CreateUserModal } from '../CreateUserModal/CreateUserModal';
import { CreateGroupModal } from '../CreateGroupModal/CreateGroupModal';
import { useBoolean } from '../../hooks/useBoolean';
import { UserSettings } from '../../modules/userTypes';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './PageHeaderActionButton.i18n';

export const PageHeaderActionButton: React.FC<{ logo?: string; userSettings?: UserSettings }> = ({ userSettings }) => {
    const sessionUser = useSessionUser();

    const createUserModalVisibility = useBoolean(false);
    const createGroupModalVisibility = useBoolean(false);

    const items: { title: string; action: VoidFunction }[] = useMemo(() => {
        const result = [];
        if (sessionUser.role?.createUser) {
            result.push({ title: tr('User'), action: createUserModalVisibility.setTrue });
        }
        result.push({ title: tr('Team'), action: createGroupModalVisibility.setTrue });
        return result;
    }, [sessionUser.role, createGroupModalVisibility.setTrue, createUserModalVisibility.setTrue, userSettings]);

    if (items.length === 0) return null;

    return (
        <>
            <Button text={tr('Create')} view="primary" outline brick="right" onClick={items[0].action} />
            <Dropdown
                onChange={(item) => item.action()}
                items={items}
                renderTrigger={(props) => (
                    <Button
                        view="primary"
                        outline
                        brick="left"
                        iconRight={props.visible ? <IconUpSmallSolid size="s" /> : <IconDownSmallSolid size="s" />}
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
            <CreateUserModal visible={createUserModalVisibility.value} onClose={createUserModalVisibility.setFalse} />
            <CreateGroupModal
                visible={createGroupModalVisibility.value}
                onClose={createGroupModalVisibility.setFalse}
            />
        </>
    );
};
