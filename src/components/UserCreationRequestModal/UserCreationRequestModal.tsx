import { Button, Modal, ModalContent, ModalCross, ModalHeader, Text, Textarea } from '@taskany/bricks/harmony';
import { ReactNode, useCallback, useState } from 'react';
import { nullable, useLatest } from '@taskany/bricks';

import { useUserMutations } from '../../modules/userHooks';
import { UserRequest } from '../../trpc/inferredTypes';
import { UserListItem } from '../UserListItem/UserListItem';

import s from './UserCreationRequestModal.module.css';
import { tr } from './UserCreationRequestModal.i18n';

interface InfoRowProps {
    label: string;
    text?: string;
    children?: ReactNode;
}

const InfoRow = ({ label, text, children }: InfoRowProps) => (
    <div className={s.InfoRow}>
        <Text className={s.InfoRowLabel}>{label}:</Text>
        {nullable(children, (ch) => ch, <Text weight="bold">{text}</Text>)}
    </div>
);

interface UserCreationRequestModalProps {
    request: UserRequest;
    visible: boolean;
    onClose: () => void;
}

export const UserCreationRequestModal = ({ request, visible, onClose }: UserCreationRequestModalProps) => {
    const { declineUserRequest, acceptUserRequest } = useUserMutations();
    const [comment, setComment] = useState<string | undefined>();
    const commentRef = useLatest(comment);

    const handleSubmit = useCallback(
        (callbackUserRequest: (data: { id: string; comment?: string }) => void) => (id: string) => () => {
            callbackUserRequest({ id, comment: commentRef.current });
            onClose();
        },
        [commentRef, onClose],
    );

    const handleChangeComment = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(event.target.value);
    }, []);

    return (
        <Modal visible={visible} onClose={onClose}>
            <ModalHeader>{tr('Request for creating user')}</ModalHeader>
            <ModalCross onClick={onClose} />
            <ModalContent className={s.ModalContent}>
                <div>
                    <Text className={s.InfoRowLabel} weight="bold" size="m">
                        {tr('General information')}:
                    </Text>
                    <InfoRow label={tr('Name')} text={request.name} />
                    <InfoRow label={tr('Login')} text={request.login} />
                    <InfoRow label={tr('Email')} text={request.email} />
                    <InfoRow label={tr('Group')} text={request.group.name} />
                    <InfoRow label={tr('Organization')} text={request.organization.name} />
                    <InfoRow label={tr('Supervisor')}>
                        <UserListItem user={request.supervisor} />
                    </InfoRow>
                </div>
                <div>
                    <Text className={s.InfoRowLabel} weight="bold" size="m">
                        {tr('Services')}:
                    </Text>
                    {request.services?.map((service) => (
                        <Text key={service.serviceId}>
                            {service.serviceName}: {service.serviceId}
                        </Text>
                    ))}
                </div>
                <div>
                    <Text className={s.InfoRowLabel} weight="bold" size="m">
                        {tr('Comment (optional)')}:
                    </Text>
                    <Textarea height={120} onChange={handleChangeComment} />
                </div>
                <div className={s.ModalContentActions}>
                    <Button text={tr('Decline')} view="danger" onClick={handleSubmit(declineUserRequest)(request.id)} />
                    <Button text={tr('Accept')} view="primary" onClick={handleSubmit(acceptUserRequest)(request.id)} />
                </div>
            </ModalContent>
        </Modal>
    );
};
