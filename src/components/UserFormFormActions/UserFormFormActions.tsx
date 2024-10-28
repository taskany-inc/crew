import { Button } from '@taskany/bricks/harmony';
import { IconAntiClockwiseOutline } from '@taskany/icons';

import { WarningModal } from '../WarningModal/WarningModal';
import { useBoolean } from '../../hooks/useBoolean';

import s from './UserFormFormActions.module.css';
import { tr } from './UserFormFormActions.i18n';

interface UserFormFormActionsProps {
    submitDisabled: boolean;
    onCancel: () => void;
    onReset: () => void;
}

export const UserFormFormActions = ({ submitDisabled, onReset, onCancel }: UserFormFormActionsProps) => {
    const cancelWarningVisible = useBoolean(false);
    const resetWarningVisible = useBoolean(false);

    return (
        <div className={s.FormActions}>
            <Button
                iconLeft={<IconAntiClockwiseOutline size="s" />}
                className={s.ResetButton}
                size="m"
                view="ghost"
                type="button"
                text={tr('Reset form')}
                onClick={resetWarningVisible.setTrue}
            />
            <Button size="m" type="button" text={tr('Cancel')} onClick={cancelWarningVisible.setTrue} />
            <Button size="m" type="submit" text={tr('Create')} view="primary" disabled={submitDisabled} />
            <WarningModal
                visible={cancelWarningVisible.value}
                onCancel={cancelWarningVisible.setFalse}
                onConfirm={onCancel}
                warningText={tr('cancel confirmation')}
            />
            <WarningModal
                visible={resetWarningVisible.value}
                onCancel={resetWarningVisible.setFalse}
                onConfirm={() => {
                    onReset();
                    resetWarningVisible.setFalse();
                }}
                warningText={tr('reset confirmation')}
            />
        </div>
    );
};