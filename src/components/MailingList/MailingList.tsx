import { useMemo, useState } from 'react';
import { User } from '@prisma/client';
import { IconEnvelopeOpenOutline, IconXCircleOutline, IconXOutline } from '@taskany/icons';
import { FormAction, FormActions, FormTitle, Modal, ModalContent, ModalHeader, nullable } from '@taskany/bricks';
import { Badge, FormControl, FormControlError, FormControlInput, Text, Button } from '@taskany/bricks/harmony';

import { trpc } from '../../trpc/trpcClient';
import { MailingSettingType } from '../../modules/userTypes';
import { useUserMutations } from '../../modules/userHooks';
import { UserList } from '../UserList/UserList';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { useBoolean } from '../../hooks/useBoolean';
import { useMailSettingsMutations } from '../../modules/mailSettingsHooks';
import { regexTestEmail } from '../../utils/regex';

import { tr } from './MailingList.i18n';
import s from './MailingList.module.css';

interface MailingListProps {
    mailingType: MailingSettingType;
    organizationUnitId: string;
}

export const MailingList = ({ mailingType, organizationUnitId }: MailingListProps) => {
    const [userId, setUserId] = useState<null | string>();
    const [userName, setUserName] = useState<null | string>();
    const [user, setUser] = useState<null | User>();

    const confirmationVisibility = useBoolean(false);

    const userQuery = trpc.user.getList.useQuery({ mailingSettings: { type: mailingType, organizationUnitId } });

    const { data: additionalEmails = [] } = trpc.mailSettings.getEmails.useQuery({
        mailingType,
        organizationUnitIds: [organizationUnitId],
    });

    const { data: workSpaceEmails = [] } = trpc.mailSettings.getEmails.useQuery({
        mailingType,
        organizationUnitIds: [organizationUnitId],
        workSpaceNotify: true,
    });
    const { addEmail, deleteEmail } = useMailSettingsMutations();

    const { editUserMailingSettings } = useUserMutations();

    const onUserChoose = async () => {
        user &&
            (await editUserMailingSettings({
                userId: user.id,
                type: mailingType,
                value: true,
                organizationUnitId,
            }));
        return setUser(null);
    };

    const onRemoveCancel = () => {
        setUserId(null);
        setUserName(null);
        confirmationVisibility.setFalse();
    };

    const onUserRemove = async () => {
        userId && (await editUserMailingSettings({ userId, type: mailingType, value: false, organizationUnitId }));
        onRemoveCancel();
    };

    const mailingSettingsTr = useMemo<Record<MailingSettingType, string>>(
        () => ({
            createUserRequest: tr('Create user request'),
            createScheduledUserRequest: tr('Scheduled new user'),
            scheduledDeactivation: tr('Scheduled profile deactivation'),
            decree: tr('Decree'),
        }),
        [],
    );

    const [newEmail, setNewEmail] = useState('');
    const [newWorkSpaceEmail, setNewWorkSpaceEmail] = useState('');

    const isEmailValid = useBoolean(true);
    const isWorkSpaceEmailValid = useBoolean(true);

    const onEmainAdd = (workSpaceNotify?: boolean) => {
        const email = workSpaceNotify ? newWorkSpaceEmail : newEmail;
        if (!regexTestEmail(email)) {
            workSpaceNotify ? isWorkSpaceEmailValid.setFalse() : isEmailValid.setFalse();
            return;
        }
        addEmail({
            organizationUnitId,
            mailingType,
            email,
            workSpaceNotify,
        });
        workSpaceNotify ? setNewWorkSpaceEmail('') : setNewEmail('');
    };

    const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewEmail(e.target.value);
        if (!isEmailValid.value && regexTestEmail(newEmail)) {
            isEmailValid.setTrue();
        }
    };
    const onWorkSpaceEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewWorkSpaceEmail(e.target.value);
        if (!isWorkSpaceEmailValid.value && regexTestEmail(newWorkSpaceEmail)) {
            isWorkSpaceEmailValid.setTrue();
        }
    };

    const onEmailDelete = (email: string, workSpaceNotify?: boolean) =>
        deleteEmail({ email, organizationUnitId, mailingType, workSpaceNotify });

    return (
        <div className={s.UserList}>
            <UserList
                title={mailingSettingsTr[mailingType]}
                titleFragment={
                    <>
                        <UserComboBox onChange={(u) => setUser(u)} value={user} />
                        {user && (
                            <>
                                <Button onClick={() => setUser(null)} text={tr('Cancel')} brick="center" />
                                <Button text="Add" onClick={onUserChoose} brick="left" view="primary" />
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

            <Text as="h4">{tr('Additional emails')}</Text>
            <FormControl className={s.NewEmailForm}>
                <FormControlInput
                    outline
                    placeholder={tr('Add new additional email')}
                    brick="right"
                    value={newEmail}
                    onChange={onEmailChange}
                />
                <Button brick="left" onClick={() => onEmainAdd()} text={tr('Add')} view="primary" />
                {nullable(!isEmailValid.value, () => (
                    <FormControlError error={{ message: tr('Enter valid email') }} />
                ))}
            </FormControl>
            {additionalEmails.map((email) => (
                <Badge
                    key={email}
                    iconLeft={<IconEnvelopeOpenOutline size="s" />}
                    text={email}
                    action="dynamic"
                    iconRight={<IconXCircleOutline size="s" onClick={() => onEmailDelete(email)} />}
                />
            ))}

            <Text as="h4">{tr('Workspace emails')}</Text>
            <FormControl className={s.NewEmailForm}>
                <FormControlInput
                    outline
                    placeholder={tr('Add new workspace email')}
                    brick="right"
                    value={newWorkSpaceEmail}
                    onChange={onWorkSpaceEmailChange}
                />
                <Button brick="left" onClick={() => onEmainAdd(true)} text={tr('Add')} view="primary" />
                {nullable(!isWorkSpaceEmailValid.value, () => (
                    <FormControlError error={{ message: tr('Enter valid email') }} />
                ))}
            </FormControl>
            {workSpaceEmails.map((email) => (
                <Badge
                    key={email}
                    iconLeft={<IconEnvelopeOpenOutline size="s" />}
                    text={email}
                    action="dynamic"
                    iconRight={<IconXCircleOutline size="s" onClick={() => onEmailDelete(email, true)} />}
                />
            ))}

            <Modal visible={confirmationVisibility.value}>
                <ModalHeader>
                    <FormTitle>
                        {tr('Remove {userName} from', {
                            userName: userName || '',
                            mailingList: mailingType,
                        })}{' '}
                        {mailingSettingsTr[mailingType]}
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
        </div>
    );
};
