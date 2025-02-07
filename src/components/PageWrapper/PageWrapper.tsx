import cn from 'classnames';

import s from './PageWrapper.module.css';

interface PageWrapperProps {
    className?: string;
    header?: React.ReactNode;
}

export const PageWrapper: React.FC<React.PropsWithChildren<PageWrapperProps>> = ({
    children,
    className,
    header,
    ...props
}) => {
    return (
        <main className={cn(s.PageWrapper, className)} {...props}>
            {header}
            <div className={cn(s.PageWrapper_Content)}>{children}</div>
        </main>
    );
};
