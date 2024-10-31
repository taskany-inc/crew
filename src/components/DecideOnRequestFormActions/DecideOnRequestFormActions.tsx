import { Button, Tooltip } from '@taskany/bricks/harmony';
import { nullable, useLatest } from '@taskany/bricks';
import { useCallback, useRef, useState } from 'react';
import { UserCreationRequestStatus } from 'prisma/prisma-client';

import { WarningModal } from '../WarningModal/WarningModal';
import { useBoolean } from '../../hooks/useBoolean';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';

import s from './DecideOnRequestFormActions.module.css';
import { tr } from './DecideOnRequestFormActions.i18n';

interface DecideOnRequestFormActionsProps {
    requestId: string;
    onDecide: () => void;
    requestStatus?: UserCreationRequestStatus;
}

export const DecideOnRequestFormActions = ({ requestId, onDecide, requestStatus }: DecideOnRequestFormActionsProps) => {
    const acceptWarningVisible = useBoolean(false);
    const declineWarningVisible = useBoolean(false);

    const session = useSessionUser();

    const [comment, setComment] = useState<string | undefined>();

    const { declineUserRequest, acceptUserRequest } = useUserCreationRequestMutations();
    const commentRef = useLatest(comment);

    const handleSubmit = useCallback(
        (callbackUserRequest: (data: { id: string; comment?: string }) => void) => (id: string) => () => {
            callbackUserRequest({ id, comment: commentRef.current });
            onDecide();
        },
        [commentRef, acceptWarningVisible, declineWarningVisible],
    );

    const handleChangeComment = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setComment(event.target.value);
    }, []);

    const onAcceptCancel = () => {
        acceptWarningVisible.setFalse();
        setComment(undefined);
    };

    const onDeclineCancel = () => {
        declineWarningVisible.setFalse();
        setComment(undefined);
    };
    const tooltipRef = useRef(null);

    let tooltipText = '';

    if (requestStatus === 'Approved') tooltipText = tr('Request already approved');

    if (requestStatus === 'Denied') tooltipText = tr('Request already denied');

    return (
        <div className={s.FormActions}>
            {nullable(session.role?.editUserCreationRequests, () => (
                <>
                    <div ref={tooltipRef}>
                        <Button
                            size="m"
                            view="danger"
                            type="button"
                            text={tr('Decline')}
                            onClick={declineWarningVisible.setTrue}
                            disabled={requestStatus === 'Approved' || requestStatus === 'Denied'}
                        />
                    </div>
                    <Button
                        size="m"
                        type="button"
                        text={tr('Accept')}
                        view="primary"
                        onClick={acceptWarningVisible.setTrue}
                        disabled={requestStatus === 'Approved' || requestStatus === 'Denied'}
                    />
                    {nullable(requestStatus === 'Approved' || requestStatus === 'Denied', () => (
                        <Tooltip reference={tooltipRef} placement="bottom" arrow={false}>
                            {tooltipText}
                        </Tooltip>
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
                </>
            ))}
            {/* Here will be button edit with another role check */}
        </div>
    );
};
