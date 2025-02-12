import { FC, HTMLAttributes, ReactNode } from 'react';
import cn from 'classnames';
import { Counter, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import s from './TeamPageSubtitle.module.css';

interface TeamPageSubtitleProps extends HTMLAttributes<HTMLDivElement> {
    counter?: number;
    action?: ReactNode;
    size?: 'l' | 'm';
}

export const TeamPageSubtitle: FC<TeamPageSubtitleProps> = ({
    children,
    className,
    counter,
    action,
    size = 'l',
    ...rest
}) => {
    return (
        <div className={cn(s.TeamPageSubtitle, className)} {...rest}>
            <div
                className={cn(s.TeamPageSubtitleContent, {
                    [s.TeamPageSubtitleContent_L]: size === 'l',
                    [s.TeamPageSubtitleContent_M]: size === 'm',
                })}
            >
                <Text size={size} weight="bold">
                    {children}
                </Text>
                {nullable(typeof counter === 'number', () => (
                    <Counter count={counter ?? 0} size="s" />
                ))}
            </div>

            {action}
        </div>
    );
};
