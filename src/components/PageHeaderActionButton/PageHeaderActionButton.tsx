import { useSession } from 'next-auth/react';
import { UserRole } from 'prisma/prisma-client';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';
import { IconDownSmallSolid, IconUpSmallSolid } from '@taskany/icons';

import { CreateUserModal } from '../CreateUserModal/CreateUserModal';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './PageHeaderActionButton.i18n';

export const PageHeaderActionButton = () => {
    const { data } = useSession();

    const createUserModalVisibility = useBoolean(false);

    if (data?.user.role !== UserRole.ADMIN) return null;

    const items = [{ title: tr('User'), action: createUserModalVisibility.setTrue }];

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
        </>
    );
};
