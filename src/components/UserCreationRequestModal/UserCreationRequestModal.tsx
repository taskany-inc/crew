import { Button, Modal, ModalContent, ModalCross, ModalHeader, Text, Textarea } from '@taskany/bricks/harmony';
import { ReactNode, useCallback, useState } from 'react';
import { nullable, useLatest } from '@taskany/bricks';

import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { UserRequest } from '../../trpc/inferredTypes';
import { UserListItem } from '../UserListItem/UserListItem';
import { useLocale } from '../../hooks/useLocale';
import { formatDate } from '../../utils/dateTime';
import { supplementPositionListToString } from '../../utils/suplementPosition';

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
    const { declineUserRequest, acceptUserRequest } = useUserCreationRequestMutations();
    const [comment, setComment] = useState<string | undefined>();
    const commentRef = useLatest(comment);

    const locale = useLocale();

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
                    <InfoRow
                        label={tr('Email')}
                        text={request.workEmail ? `${request.email} / ${request.workEmail}` : request.email}
                    />
                    {nullable(request.type, (t) => (
                        <InfoRow
                            label={tr('Type')}
                            text={t === 'externalEmployee' ? tr('External employee') : tr('Internal employee')}
                        />
                    ))}
                    {nullable(request.title, (r) => (
                        <InfoRow label={tr('Role')} text={r} />
                    ))}
                    {nullable(request.corporateEmail, (ce) => (
                        <InfoRow label={tr('Corporate email')} text={ce} />
                    ))}
                    {nullable(request.personalEmail, (pe) => (
                        <InfoRow label={tr('Personal email')} text={pe} />
                    ))}
                    {nullable(request.osPreference, (os) => (
                        <InfoRow label={tr('OS preference')} text={os} />
                    ))}
                    {nullable(request.group, (group) => (
                        <InfoRow label={tr('Group')} text={group.name} />
                    ))}
                    <InfoRow label={tr('Organization')} text={request.organization.name} />
                    {nullable(request.unitId, (u) => (
                        <InfoRow label={tr('Unit id')} text={u} />
                    ))}
                    {nullable(!!request.supplementalPositions.length, () => (
                        <InfoRow
                            label={tr('Supplement')}
                            text={supplementPositionListToString(request.supplementalPositions)}
                        />
                    ))}
                    {nullable(request.creator, (creator) => (
                        <InfoRow label={tr('Request author')}>
                            <UserListItem user={creator} />
                        </InfoRow>
                    ))}
                    {nullable(request.supervisor, (supervisor) => (
                        <InfoRow label={tr('Supervisor')}>
                            <UserListItem user={supervisor} />
                        </InfoRow>
                    ))}
                    {nullable(request.lineManagers.length, () => (
                        <InfoRow label={tr('Line managers')}>
                            {request.lineManagers.map((l) => (
                                <UserListItem user={l} key={`${l.id}lineManager`} />
                            ))}
                        </InfoRow>
                    ))}
                    {nullable(request.date, (d) => (
                        <InfoRow label={tr('Date')} text={formatDate(d, locale)} />
                    ))}
                    {nullable(request.externalOrganizationSupervisorLogin, (ex) => (
                        <InfoRow label={tr('External organization supervisor login')} text={ex} />
                    ))}
                    {nullable(request.buddy, (b) => (
                        <InfoRow label={tr('Buddy')}>
                            <UserListItem user={b} />
                        </InfoRow>
                    ))}
                    {nullable(request.coordinator, (c) => (
                        <InfoRow label={tr('Coordinator')}>
                            <UserListItem user={c} />
                        </InfoRow>
                    ))}
                    {nullable(request.coordinators.length, () => (
                        <InfoRow label={tr('Coordinators')}>
                            {request.coordinators.map((cs) => (
                                <UserListItem user={cs} key={`${cs.id}coordinator`} />
                            ))}
                        </InfoRow>
                    ))}
                    {nullable(request.recruiter, (rc) => (
                        <InfoRow label={tr('Recruiter')}>
                            <UserListItem user={rc} />
                        </InfoRow>
                    ))}
                    {nullable(request.workMode, (w) => (
                        <InfoRow label={tr('Work mode')} text={w} />
                    ))}
                    {nullable(request.workSpace, (ws) => (
                        <InfoRow label={tr('Work space application')} text={ws} />
                    ))}
                    {nullable(request.comment, (c) => (
                        <InfoRow label={tr('Comment')} text={c} />
                    ))}
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
