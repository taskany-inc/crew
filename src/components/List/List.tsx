import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';

import s from './List.module.css';

interface ListProps extends HTMLAttributes<HTMLDivElement> {}

export const List: FC<ListProps> = ({ className, children, ...props }) => (
    <div className={cn(s.List, className)} {...props}>
        {children}
    </div>
);

interface ListItemProps extends HTMLAttributes<HTMLDivElement> {}

export const ListItem: FC<ListItemProps> = ({ className, children, ...props }) => (
    <div className={cn(s.ListItem, className)} {...props}>
        {children}
    </div>
);
