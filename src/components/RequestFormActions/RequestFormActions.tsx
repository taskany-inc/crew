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
import { useScheduledDeactivation } from '../../modules/scheduledDeactivationHooks';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import s from './RequestFormActions.module.css';
import { tr } from './RequestFormActions.i18n';

interface RequestFormActionsProps {
    requestId: string;
    onEdit?: () => void;
    onDecide?: () => void;
    onCancel?: () => void;
    requestStatus?: UserCreationRequestStatus;
    requestType?: 'decree' | 'creation' | 'deactivation' | UserCreationRequestType.transferInternToStaff;
    small?: boolean;
}

export const RequestFormActions = ({
    requestId,
    requestType,
    onDecide,
    requestStatus,
    small,
    onEdit,
    onCancel,
}: RequestFormActionsProps) => {
    const acceptWarningVisible = useBoolean(false);
    const declineWarningVisible = useBoolean(false);

    const cancelWarningVisible = useBoolean(false);

    const session = useSessionUser();

    const [comment, setComment] = useState<string | undefined>();

    const { declineUserRequest, acceptUserRequest, cancelUserRequest, cancelTransferInternToStaffRequest } =
        useUserCreationRequestMutations();
    const { cancelScheduledDeactivation } = useScheduledDeactivation();

    const commentRef = useLatest(comment);

    const handleCancelSubmit = useCallback(() => {
        onCancel && onCancel();
        if (requestType === 'deactivation') {
            return cancelScheduledDeactivation({ id: requestId, comment: commentRef.current });
        }

        if (requestType === UserCreationRequestType.transferInternToStaff) {
            return cancelTransferInternToStaffRequest({ id: requestId, comment: commentRef.current });
        }

        return cancelUserRequest({ id: requestId, comment: commentRef.current });
    }, [commentRef, requestType, onDecide]);

    const handleDeclineSubmit = useCallback(() => {
        onDecide && onDecide();

        return declineUserRequest({ id: requestId, comment: commentRef.current });
    }, [commentRef, requestType, onDecide]);

    const handleAcceptSubmit = useCallback(() => {
        onDecide && onDecide();

        return acceptUserRequest({ id: requestId, comment: commentRef.current });
    }, [commentRef, requestType, onDecide]);

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

    const canEditRequest =
        session.role?.editExternalFromMainUserRequest ||
        session.role?.editExternalFromMainUserRequest ||
        session.role?.editInternalUserRequest;

    const canDecideOnRequest = session.role?.decideOnUserCreationRequest;

    return (
        <div className={s.FormActions}>
            {nullable(canEditRequest, () => (
                <>
                    {nullable(onEdit, () => (
                        <div>
                            <Button
                                ref={editRef}
                                className={cn({ [s.EditButton]: !small })}
                                iconLeft={<IconEditOutline size="s" />}
                                size={small ? 's' : 'm'}
                                type="button"
                                text={small ? undefined : tr('Edit Form')}
                                view={small ? 'default' : 'ghost'}
                                onClick={onEdit}
                            />
                        </div>
                    ))}

                    {nullable(requestStatus !== 'Canceled', () => (
                        <Button
                            ref={cancelRef}
                            iconLeft={small && <IconDeniedOutline size="s" />}
                            size={small ? 's' : 'm'}
                            view={small ? 'default' : 'danger'}
                            type="button"
                            text={small ? undefined : tr('Cancel request')}
                            onClick={cancelWarningVisible.setTrue}
                        />
                    ))}
                    {nullable(requestStatus === 'Approved' || requestStatus === 'Denied', () => (
                        <Tooltip reference={tooltipRef} placement="bottom">
                            {tooltipText}
                        </Tooltip>
                    ))}
                    {nullable(small, () => (
                        <>
                            <Tooltip reference={editRef} placement="bottom">
                                {tr('Edit')}
                            </Tooltip>
                            <Tooltip reference={cancelRef} placement="bottom">
                                {tr('Cancel request')}
                            </Tooltip>
                        </>
                    ))}
                    <WarningModal
                        view="danger"
                        visible={cancelWarningVisible.value}
                        onCancel={onCancelCancel}
                        onInputChange={handleChangeComment}
                        onConfirm={handleCancelSubmit}
                        inputPlaceholder={tr('Enter comment if needed')}
                        warningText={tr('Are you sure you want to cancel this request?')}
                    />
                </>
            ))}
            {nullable(canDecideOnRequest && requestType === 'creation', () => (
                <div className={small && canEditRequest && canDecideOnRequest ? s.Separator : undefined}>
                    <div ref={tooltipRef} className={s.FormActions}>
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
                            <Tooltip reference={tooltipRef} placement="bottom">
                                {tooltipText}
                            </Tooltip>
                        ))}
                        {nullable(small, () => (
                            <>
                                <Tooltip reference={declineRef} placement="bottom">
                                    {tr('Decline')}
                                </Tooltip>
                                <Tooltip reference={acceptRef} placement="bottom">
                                    {tr('Accept')}
                                </Tooltip>
                            </>
                        ))}
                        <WarningModal
                            view="primary"
                            visible={acceptWarningVisible.value}
                            onCancel={onAcceptCancel}
                            onInputChange={handleChangeComment}
                            onConfirm={handleAcceptSubmit}
                            inputPlaceholder={tr('Enter comment if needed')}
                            warningText={tr('Are you sure you want to accept this request?')}
                        />
                        <WarningModal
                            view="danger"
                            visible={declineWarningVisible.value}
                            onCancel={onDeclineCancel}
                            onConfirm={handleDeclineSubmit}
                            onInputChange={handleChangeComment}
                            inputPlaceholder={tr('Enter comment if needed')}
                            warningText={tr('Are you sure you want to decline this request?')}
                        />
                    </div>

                    {nullable(requestStatus === 'Approved' || requestStatus === 'Denied', () => (
                        <Tooltip reference={tooltipRef} placement="bottom">
                            {tooltipText}
                        </Tooltip>
                    ))}
                    {nullable(small, () => (
                        <>
                            {' '}
                            <Tooltip reference={declineRef} placement="bottom">
                                {tr('Decline')}
                            </Tooltip>
                            <Tooltip reference={acceptRef} placement="bottom">
                                {tr('Accept')}
                            </Tooltip>
                        </>
                    ))}
                    <WarningModal
                        view="primary"
                        visible={acceptWarningVisible.value}
                        onCancel={onAcceptCancel}
                        onInputChange={handleChangeComment}
                        onConfirm={handleAcceptSubmit}
                        inputPlaceholder={tr('Enter comment if needed')}
                        warningText={tr('Are you sure you want to accept this request?')}
                    />
                    <WarningModal
                        view="danger"
                        visible={declineWarningVisible.value}
                        onCancel={onDeclineCancel}
                        onConfirm={handleDeclineSubmit}
                        onInputChange={handleChangeComment}
                        inputPlaceholder={tr('Enter comment if needed')}
                        warningText={tr('Are you sure you want to decline this request?')}
                    />
                </div>
            ))}
        </div>
    );
};
