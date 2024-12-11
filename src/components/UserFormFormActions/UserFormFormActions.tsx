import { Button } from '@taskany/bricks/harmony';
import { IconAntiClockwiseOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { WarningModal } from '../WarningModal/WarningModal';
import { useBoolean } from '../../hooks/useBoolean';

import s from './UserFormFormActions.module.css';
import { tr } from './UserFormFormActions.i18n';

interface UserFormFormActionsProps {
    submitDisabled: boolean;
    onCancel: () => void;
    onReset?: () => void;
    cancelConfirmation?: string;
}

export const UserFormFormActions = ({
    submitDisabled,
    onReset,
    onCancel,
    cancelConfirmation = tr('cancel confirmation'),
}: UserFormFormActionsProps) => {
    const cancelWarningVisible = useBoolean(false);
    const resetWarningVisible = useBoolean(false);

    return (
        <div className={s.FormActions}>
            {nullable(onReset, () => (
                <Button
                    iconLeft={<IconAntiClockwiseOutline size="s" />}
                    className={s.ResetButton}
                    size="m"
                    view="ghost"
                    type="button"
                    text={tr('Reset form')}
                    onClick={resetWarningVisible.setTrue}
                />
            ))}

            <Button size="m" type="button" text={tr('Cancel')} onClick={cancelWarningVisible.setTrue} />
            <Button size="m" type="submit" text={tr('Create')} view="primary" disabled={submitDisabled} />
            <WarningModal
                view="warning"
                visible={cancelWarningVisible.value}
                onCancel={cancelWarningVisible.setFalse}
                onConfirm={onCancel}
                warningText={cancelConfirmation}
            />
            <WarningModal
                view="warning"
                visible={resetWarningVisible.value}
                onCancel={resetWarningVisible.setFalse}
                onConfirm={() => {
                    onReset && onReset();
                    resetWarningVisible.setFalse();
                }}
                warningText={tr('reset confirmation')}
            />
        </div>
    );
};
