import { ComponentProps, FC, HTMLAttributes, ReactNode } from 'react';
import cn from 'classnames';
import { Counter, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import s from './TeamPageTitle.module.css';

type Size = 'm' | 'l';

interface TeamPageTitleProps extends HTMLAttributes<HTMLDivElement> {
    counter?: number;
    action?: ReactNode;
    size?: Size;
}

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 'lg',
    l: 'xl',
};

export const TeamPageTitle: FC<TeamPageTitleProps> = ({
    className,
    counter,
    children,
    action,
    size = 'l',
    ...props
}) => {
    return (
        <div className={cn(s.TeamPageTitle, className)}>
            <div className={s.TeamPageTitleWrapper}>
                <Text weight="bold" size={textSizesMap[size]} {...props}>
                    {children}
                </Text>
                {nullable(counter, (c) => (
                    <Counter size="m" count={c} />
                ))}
            </div>
            {action}
        </div>
    );
};
