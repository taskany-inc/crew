import { Button, Tooltip } from '@taskany/bricks/harmony';
import { nullable, useLatest } from '@taskany/bricks';
import { useCallback, useRef, useState } from 'react';
import { UserCreationRequestStatus } from 'prisma/prisma-client';
import { IconEditOutline, IconTickOutline, IconDeniedOutline, IconXOutline } from '@taskany/icons';
import cn from 'classnames';

import { WarningModal } from '../WarningModal/WarningModal';
import { useBoolean } from '../../hooks/useBoolean';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';

import s from './RequestFormActions.module.css';
import { tr } from './RequestFormActions.i18n';

interface RequestFormActionsProps {
    requestId: string;
    onEdit?: () => void;
    onDecide?: () => void;
    requestStatus?: UserCreationRequestStatus;
    requestType?: 'decree' | 'creation';
    small?: boolean;
}

export const RequestFormActions = ({
    requestId,
    requestType,
    onDecide,
    requestStatus,
    small,
    onEdit,
}: RequestFormActionsProps) => {
    const acceptWarningVisible = useBoolean(false);
    const declineWarningVisible = useBoolean(false);

    const cancelWarningVisible = useBoolean(false);

    const session = useSessionUser();

    const [comment, setComment] = useState<string | undefined>();

    const { declineUserRequest, acceptUserRequest, cancelUserRequest } = useUserCreationRequestMutations();
    const commentRef = useLatest(comment);

    const handleSubmit = useCallback(
        (callbackUserRequest: (data: { id: string; comment?: string }, type?: string) => void) =>
            (id: string) =>
            () => {
                callbackUserRequest({ id, comment: commentRef.current }, requestType);
                onDecide && onDecide();
            },
        [commentRef, requestType, onDecide],
    );

    const handleChangeComment = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setComment(event.target.value);
    }, []);

    const onAcceptCancel = () => {
        acceptWarningVisible.setFalse();
        setComment(undefined);
    };

    const onCancelCancel = () => {
        cancelWarningVisible.setFalse();
        setComment(undefined);
    };
    const onDeclineCancel = () => {
        declineWarningVisible.setFalse();
        setComment(undefined);
    };
    const tooltipRef = useRef(null);

    const acceptRef = useRef(null);
    const declineRef = useRef(null);
    const editRef = useRef(null);
    const cancelRef = useRef(null);
    let tooltipText = '';

    if (requestStatus === 'Approved') tooltipText = tr('Request already approved');

    if (requestStatus === 'Denied') tooltipText = tr('Request already denied');

    return (
        <div className={s.FormActions}>
            {nullable(session.role?.editUserCreationRequests && requestType !== 'decree', () => (
                <div
                    className={cn(s.FormActions, {
                        [s.Separator]: small && session.role?.editUserCreationRequests && session.role?.createUser,
                    })}
                >
                    <div ref={tooltipRef}>
                        <Button
                            ref={declineRef}
                            iconLeft={small && <IconXOutline size="s" />}
                            size={small ? 's' : 'm'}
                            view={small ? 'default' : 'danger'}
                            type="button"
                            text={small ? undefined : tr('Decline')}
                            onClick={declineWarningVisible.setTrue}
                            disabled={requestStatus === 'Approved' || requestStatus === 'Denied'}
                        />
                    </div>

                    <Button
                        ref={acceptRef}
                        iconLeft={small && <IconTickOutline size="s" />}
                        size={small ? 's' : 'm'}
                        type="button"
                        text={small ? undefined : tr('Accept')}
                        view={small ? 'default' : 'primary'}
                        onClick={acceptWarningVisible.setTrue}
                        disabled={requestStatus === 'Approved' || requestStatus === 'Denied'}
                    />

                    {nullable(requestStatus === 'Approved' || requestStatus === 'Denied', () => (
                        <Tooltip reference={tooltipRef} placement="bottom" arrow={false}>
                            {tooltipText}
                        </Tooltip>
                    ))}
                    {nullable(small, () => (
                        <>
                            <Tooltip reference={declineRef} placement="bottom" arrow={false}>
                                {tr('Decline')}
                            </Tooltip>
                            <Tooltip reference={acceptRef} placement="bottom" arrow={false}>
                                {tr('Accept')}
                            </Tooltip>
                        </>
                    ))}
                    <WarningModal
                        view="primary"
                        visible={acceptWarningVisible.value}
                        onCancel={onAcceptCancel}
                        onInputChange={handleChangeComment}
                        onConfirm={handleSubmit(acceptUserRequest)(requestId)}
                        inputPlaceholder={tr('Enter comment if needed')}
                        warningText={tr('Are you sure you want to accept this request?')}
                    />
                    <WarningModal
                        view="danger"
                        visible={declineWarningVisible.value}
                        onCancel={onDeclineCancel}
                        onConfirm={handleSubmit(declineUserRequest)(requestId)}
                        onInputChange={handleChangeComment}
                        inputPlaceholder={tr('Enter comment if needed')}
                        warningText={tr('Are you sure you want to decline this request?')}
                    />
                </div>
            ))}
            {nullable(session.role?.createUser, () => (
                <>
                    {nullable(onEdit, () => (
                        <Button
                            ref={editRef}
                            className={cn({ [s.EditButton]: !small })}
                            iconLeft={<IconEditOutline size="s" />}
                            size={small ? 's' : 'm'}
                            type="button"
                            text={small ? undefined : tr('Edit Form')}
                            view={small ? 'default' : 'ghost'}
                            onClick={onEdit}
                            disabled={requestStatus === 'Approved' || requestStatus === 'Denied'}
                        />
                    ))}

                    <div ref={tooltipRef}>
                        <Button
                            ref={cancelRef}
                            iconLeft={small && <IconDeniedOutline size="s" />}
                            size={small ? 's' : 'm'}
                            view={small ? 'default' : 'danger'}
                            type="button"
                            text={small ? undefined : tr('Cancel request')}
                            onClick={cancelWarningVisible.setTrue}
                            disabled={requestStatus === 'Approved' || requestStatus === 'Denied'}
                        />
                    </div>
                    {nullable(requestStatus === 'Approved' || requestStatus === 'Denied', () => (
                        <Tooltip reference={tooltipRef} placement="bottom" arrow={false}>
                            {tooltipText}
                        </Tooltip>
                    ))}
                    {nullable(small, () => (
                        <>
                            <Tooltip reference={cancelRef} placement="bottom" arrow={false}>
                                {tr('Cancel request')}
                            </Tooltip>
                            <Tooltip reference={editRef} placement="bottom" arrow={false}>
                                {tr('Edit Form')}
                            </Tooltip>
                        </>
                    ))}
                    <WarningModal
                        view="danger"
                        visible={cancelWarningVisible.value}
                        onCancel={onCancelCancel}
                        onInputChange={handleChangeComment}
                        onConfirm={handleSubmit(cancelUserRequest)(requestId)}
                        inputPlaceholder={tr('Enter comment if needed')}
                        warningText={tr('Are you sure you want to cancel this request?')}
                    />
                </>
            ))}
        </div>
    );
};
