import { FC, HTMLAttributes, ReactNode } from 'react';
import cn from 'classnames';

import s from './TeamPageLayout.module.css';

interface TeamPageLayout extends HTMLAttributes<HTMLDivElement> {
    sidebar?: ReactNode;
}

export const TeamPageLayout: FC<TeamPageLayout> = ({ className, children, sidebar, ...props }) => {
    return (
        <div className={cn(s.TeamPageLayout, className)} {...props}>
            <div className={s.TeamPageLayoutContent}>{children}</div>
            <aside className={s.TeamPageLayoutAside}>
                <div className={s.TeamPageLayoutAsideContent}>{sidebar}</div>
            </aside>
        </div>
    );
};
