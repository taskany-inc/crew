import { useRef } from 'react';
import { nullable } from '@taskany/bricks';
import { Button, Tooltip } from '@taskany/bricks/harmony';
import { IconDeniedOutline, IconEditOutline } from '@taskany/icons';

import { useBoolean } from '../../hooks/useBoolean';
import { CancelScheduleDeactivation } from '../CancelScheduleDeactivation/CancelScheduleDeactivation';
import { ScheduleDeactivationForm } from '../ScheduleDeactivationForm/ScheduleDeactivationForm';
import { trpc } from '../../trpc/trpcClient';

import s from './ScheduledDeactivationEditMenu.module.css';
import { tr } from './ScheduledDeactivationEditMenu.i18n';

interface ScheduledDeactivationEditMenuProps {
    id: string;
}

export const ScheduledDeactivationEditMenu = ({ id }: ScheduledDeactivationEditMenuProps) => {
    const { data: scheduledDeactivation } = trpc.scheduledDeactivation.getById.useQuery(id);
    const editScheduledDeactivationVisible = useBoolean(false);
    const cancelScheduledDeactivationVisible = useBoolean(false);

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
                    onClick={editScheduledDeactivationVisible.setTrue}
                />
                <Button
                    ref={cancelRef}
                    iconLeft={<IconDeniedOutline size="s" />}
                    size="s"
                    type="button"
                    onClick={cancelScheduledDeactivationVisible.setTrue}
                />
            </div>
            <Tooltip reference={cancelRef} placement="bottom" arrow={false}>
                {tr('Cancel')}
            </Tooltip>
            <Tooltip reference={editRef} placement="bottom" arrow={false}>
                {tr('Edit')}
            </Tooltip>

            {nullable(scheduledDeactivation, (deactivation) => (
                <>
                    <ScheduleDeactivationForm
                        userId={deactivation.user.id}
                        visible={editScheduledDeactivationVisible.value}
                        scheduledDeactivation={deactivation}
                        onClose={editScheduledDeactivationVisible.setFalse}
                    />

                    <CancelScheduleDeactivation
                        visible={cancelScheduledDeactivationVisible.value}
                        scheduledDeactivation={deactivation}
                        onClose={cancelScheduledDeactivationVisible.setFalse}
                    />
                </>
            ))}
        </>
    );
};
