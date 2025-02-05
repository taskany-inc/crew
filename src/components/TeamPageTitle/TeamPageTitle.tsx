import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Button, Counter, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconEdit1Outline } from '@taskany/icons';

import { useRouter } from '../../hooks/useRouter';

import s from './TeamPageTitle.module.css';
import { tr } from './TeamPageTitle.i18n';

interface TeamPageTitleProps extends HTMLAttributes<HTMLDivElement> {
    counter?: number;
    groupId: string;
    editable?: boolean;
}

export const TeamPageTitle: FC<TeamPageTitleProps> = ({
    className,
    counter,
    groupId,
    editable,
    children,
    ...props
}) => {
    const { teamSettings } = useRouter();

    return (
        <div className={cn(s.TeamPageTitle, className)}>
            <div className={s.TeamPageTitleWrapper}>
                <Text weight="bold" size="xl" {...props}>
                    {children}
                </Text>
                {nullable(counter, (c) => (
                    <Counter size="m" count={c} />
                ))}
            </div>
            {nullable(editable, () => (
                <Button
                    iconLeft={<IconEdit1Outline size="s" />}
                    text={tr('Edit')}
                    onClick={() => teamSettings(groupId)}
                />
            ))}
        </div>
    );
};
