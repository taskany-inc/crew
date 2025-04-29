import { ComponentProps, FC, HTMLAttributes, ReactNode } from 'react';
import cn from 'classnames';
import { Button, Counter, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { Link } from '../Link';
import { config } from '../../config';

import s from './TeamPageTitle.module.css';

type Size = 'm' | 'l';

interface redirectActions {
    goals: {
        id?: string;
        text?: string;
    };
}

interface TeamPageTitleProps extends HTMLAttributes<HTMLDivElement> {
    redirectActions: redirectActions;
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
    redirectActions,
    action,
    size = 'l',
    ...props
}) => {
    const { goals } = redirectActions;

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
            <div className={s.TeamPageSubtitleWrapper}>
                {nullable(goals.id, (id) => (
                    <Link href={`${config.goals.url}/team/${id}`} target="_blank">
                        <Button view="ghost" text={goals.text} iconLeft={<img src={config.goals.icon} width={24} />} />
                    </Link>
                ))}
                {action}
            </div>
        </div>
    );
};
