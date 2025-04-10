import { ComponentProps, FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';

import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { TeamItem } from '../TeamItem/TeamItem';
import { List, ListItem } from '../List/List';
import { Link } from '../Link';

import { tr } from './TeamChildren.i18n';
import s from './TeamChildren.module.css';

interface TeamChildrenProps extends HTMLAttributes<HTMLDivElement> {
    items: ComponentProps<typeof TeamItem>['item'][];
    size?: ComponentProps<typeof TeamPageSubtitle>['size'];
}

export const TeamChildren: FC<TeamChildrenProps> = ({ className, children, items, size = 'l', ...props }) => {
    const { showGroupPreview } = usePreviewContext();

    return (
        <div className={cn(s.TeamChildren, className)} {...props}>
            <TeamPageSubtitle size={size} counter={items.length}>
                {tr('Teams')}
            </TeamPageSubtitle>
            {nullable(
                items,
                () => (
                    <List>
                        {items.map((g, index) => (
                            <ListItem key={index}>
                                <Link
                                    className={s.TeamChildrenLink}
                                    onClick={() => showGroupPreview(g.id)}
                                    href={pages.team(g.id)}
                                >
                                    <TeamItem size={size} item={g} />
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                ),
                <Text className={s.Empty}>{tr('Not provided')}</Text>,
            )}
        </div>
    );
};
