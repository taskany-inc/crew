import { IconPlusCircleOutline } from '@taskany/icons';
import { forwardRef } from 'react';
import cn from 'classnames';
import { Badge, Text } from '@taskany/bricks/harmony';

import s from './AddInlineTrigger.module.css';

interface AddInlineTriggerProps {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
    centered?: boolean;
}

export const AddInlineTrigger = forwardRef<HTMLDivElement, AddInlineTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick, centered = true, ...attrs }, ref) => (
        <Badge
            ref={ref}
            iconLeft={icon}
            weight="regular"
            text={<Text className={s.Text}>{text}</Text>}
            onClick={onClick}
            className={cn(s.InlineTrigger, { [s.InlineTrigger_centered]: centered })}
            view="secondary"
            {...attrs}
        />
    ),
);
