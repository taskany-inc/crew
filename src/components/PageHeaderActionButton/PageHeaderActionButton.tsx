import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';
import { IconDownSmallSolid, IconUpSmallSolid } from '@taskany/icons';

import { CreateUserModal } from '../CreateUserModal/CreateUserModal';
import { CreateGroupModal } from '../CreateGroupModal/CreateGroupModal';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './PageHeaderActionButton.i18n';

export const PageHeaderActionButton = () => {
    const { data } = useSession();

    const createUserModalVisibility = useBoolean(false);
    const createGroupModalVisibility = useBoolean(false);

    const items: { title: string; action: VoidFunction }[] = useMemo(() => {
        const result = [];
        if (data?.access.user.create) {
            result.push({ title: tr('User'), action: createUserModalVisibility.setTrue });
        }
        if (data?.access.group.create) {
            result.push({ title: tr('Team'), action: createGroupModalVisibility.setTrue });
        }
        return result;
    }, [data?.access, createGroupModalVisibility.setTrue, createUserModalVisibility.setTrue]);

    if (items.length === 0) return null;

    return (
        <>
            <Button
                text={tr('Create')}
                view="primary"
                outline
                brick="right"
                onClick={createUserModalVisibility.setTrue}
            />
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
