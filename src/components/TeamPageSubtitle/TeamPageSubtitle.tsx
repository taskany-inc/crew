import { FC, HTMLAttributes, ReactNode } from 'react';
import cn from 'classnames';
import { Counter, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import s from './TeamPageSubtitle.module.css';

interface TeamPageSubtitleProps extends HTMLAttributes<HTMLDivElement> {
    counter?: number;
    action?: ReactNode;
}

export const TeamPageSubtitle: FC<TeamPageSubtitleProps> = ({ children, className, counter, action, ...rest }) => {
    return (
        <div className={cn(s.TeamPageSubtitle, className)} {...rest}>
            <div className={s.TeamPageSubtitleContent}>
                <Text size="l" weight="bold">
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
