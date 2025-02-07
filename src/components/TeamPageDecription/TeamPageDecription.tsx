import { ComponentProps, FC, HTMLAttributes } from 'react';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';

import { tr } from './TeamPageDecription.i18n';
import s from './TeamPageDecription.module.css';

type Size = NonNullable<ComponentProps<typeof TeamPageSubtitle>['size']>;

interface TeamPageDecriptionProps extends HTMLAttributes<HTMLDivElement> {
    value?: string;
    size?: Size;
}

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

export const TeamPageDecription: FC<TeamPageDecriptionProps> = ({ children, value, size = 'l', ...rest }) => {
    return (
        <div className={s.TeamPageDecription} {...rest}>
            <TeamPageSubtitle size={size}>{tr('Description')}</TeamPageSubtitle>
            {nullable(
                value,
                (t) => (
                    <Text size={textSizesMap[size]}>{t}</Text>
                ),
                <Text>{tr('Not provided')}</Text>,
            )}
        </div>
    );
};
