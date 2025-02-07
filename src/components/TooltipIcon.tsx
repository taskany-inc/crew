import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from '@taskany/bricks/harmony';

export interface TootipIconProps {
    text: React.ReactNode;
    /** in millis */
    delay?: number;
    placement?: React.ComponentProps<typeof Tooltip>['placement'];
    offset?: React.ComponentProps<typeof Tooltip>['offset'];
}

export const TooltipIcon: React.FC<React.PropsWithChildren<TootipIconProps>> = ({
    children,
    text,
    delay = 750,
    placement = 'left',
    offset = [0, 10],
}) => {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<number>();

    const reset = useCallback(() => window.clearTimeout(timerRef.current), []);

    const debouncedEnterHandler = useCallback(() => {
        reset();
        timerRef.current = window.setTimeout(() => {
            setTooltipVisible(true);
        }, delay);
    }, [delay, reset]);

    const onMouseLeave = useCallback(() => {
        reset();
        setTooltipVisible(false);
    }, [reset]);

    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    return (
        <>
            <span onMouseEnter={debouncedEnterHandler} onMouseLeave={onMouseLeave} ref={ref}>
                {children}
            </span>
            <Tooltip visible={tooltipVisible} reference={ref} placement={placement} offset={offset} arrow={false}>
                {text}
            </Tooltip>
        </>
    );
};
