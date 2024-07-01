import { useState } from 'react';
import { User } from '@prisma/client';
import { IconXOutline } from '@taskany/icons';
import { Button, FormAction, FormActions, FormTitle, Modal, ModalContent, ModalHeader } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { MailingSettingType } from '../../modules/userTypes';
import { useUserMutations } from '../../modules/userHooks';
import { UserList } from '../UserList/UserList';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './MailingList.i18n';

interface MailingListProps {
    mailingSettings: MailingSettingType;
}

export const MailingList = ({ mailingSettings }: MailingListProps) => {
    const [userId, setUserId] = useState<null | string>();
    const [userName, setUserName] = useState<null | string>();
    const [user, setUser] = useState<null | User>();

    const confirmationVisibility = useBoolean(false);

    const userQuery = trpc.user.getList.useQuery({ mailingSettings });

    const { editUserMailingSettings } = useUserMutations();

    const onUserChoose = async () => {
        user && (await editUserMailingSettings({ userId: user.id, type: mailingSettings, value: true }));
        return setUser(null);
    };

    const onRemoveCancel = () => {
        setUserId(null);
        setUserName(null);
        confirmationVisibility.setFalse();
    };

    const onUserRemove = async () => {
        userId && (await editUserMailingSettings({ userId, type: mailingSettings, value: false }));
        onRemoveCancel();
    };

    return (
        <>
            <UserList
                title={tr(mailingSettings)}
                titleFragment={
                    <>
                        <UserComboBox onChange={(u) => setUser(u)} user={user} brick={user ? 'right' : undefined} />
                        {user && (
                            <>
                                <Button onClick={() => setUser(null)} text={tr('Cancel')} brick="center" outline />
                                <Button text="Add" onClick={onUserChoose} brick="left" view="primary" outline />
                            </>
                        )}
                    </>
                }
                users={userQuery.data?.users || []}
                action={{
                    icon: <IconXOutline size="s" />,
                    handler: (us) => {
                        setUserId(us.id);
                        setUserName(us.name);
                        confirmationVisibility.setTrue();
                    },
                }}
            />
            <Modal visible={confirmationVisibility.value}>
                <ModalHeader>
                    <FormTitle>
                        {tr('Remove {userName} from', {
                            userName: userName!,
                            mailingList: mailingSettings,
                        })}{' '}
                        {tr(mailingSettings)}
                    </FormTitle>
                </ModalHeader>
                <ModalContent>
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button text={tr('Cancel')} onClick={onRemoveCancel} />
                            <Button view="danger" onClick={onUserRemove} text={tr('Yes, remove')} />
                        </FormAction>
                    </FormActions>
                </ModalContent>
            </Modal>
        </>
    );
};
