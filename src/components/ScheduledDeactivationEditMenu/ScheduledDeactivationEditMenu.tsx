import { useRef } from 'react';
import { Button, Tooltip } from '@taskany/bricks/harmony';
import { IconDeniedOutline, IconEditOutline } from '@taskany/icons';

import s from './ScheduledDeactivationEditMenu.module.css';
import { tr } from './ScheduledDeactivationEditMenu.i18n';

interface ScheduledDeactivationEditMenuProps {
    onEditClick: () => void;
    onCancelClick: () => void;
}

export const ScheduledDeactivationEditMenu = ({ onEditClick, onCancelClick }: ScheduledDeactivationEditMenuProps) => {
    const editRef = useRef(null);
    const cancelRef = useRef(null);

    return (
        <>
            <div className={s.MenuButtons}>
                <Button
                    ref={editRef}
                    iconLeft={<IconEditOutline size="s" />}
                    size="s"
                    type="button"
                    onClick={onEditClick}
                />
                <Button
                    ref={cancelRef}
                    iconLeft={<IconDeniedOutline size="s" />}
                    size="s"
                    type="button"
                    onClick={onCancelClick}
                />
            </div>
            <Tooltip reference={cancelRef} placement="bottom">
                {tr('Cancel')}
            </Tooltip>
            <Tooltip reference={editRef} placement="bottom">
                {tr('Edit')}
            </Tooltip>
        </>
    );
};
