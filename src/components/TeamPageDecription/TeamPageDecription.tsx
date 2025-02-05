import { FC, HTMLAttributes } from 'react';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';

import { tr } from './TeamPageDecription.i18n';
import s from './TeamPageDecription.module.css';

interface TeamPageDecriptionProps extends HTMLAttributes<HTMLDivElement> {
    value?: string;
}

export const TeamPageDecription: FC<TeamPageDecriptionProps> = ({ children, value, ...rest }) => {
    return (
        <div className={s.TeamPageDecription} {...rest}>
            <TeamPageSubtitle>{tr('Description')}</TeamPageSubtitle>
            {nullable(
                value,
                (t) => (
                    <Text size="sm">{t}</Text>
                ),
                <Text>{tr('Not provided')}</Text>,
            )}
        </div>
    );
};
