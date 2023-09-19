import React from 'react';
import NextLink from 'next/link';
import { Link as LinkBricks } from '@taskany/bricks';

interface LinkProps {
    href?: string;
    target?: React.ComponentProps<typeof LinkBricks>['target'];
    onClick?: VoidFunction;
    className?: string;
    children?: React.ReactNode;
}

export const Link = ({ href, target, onClick, className, children }: LinkProps) => {
    if (!href) {
        return (
            <LinkBricks inline onClick={onClick} className={className}>
                {children}
            </LinkBricks>
        );
    }

    return (
        <NextLink href={href} onClick={onClick} passHref legacyBehavior>
            <LinkBricks inline target={target} className={className}>
                {children}
            </LinkBricks>
        </NextLink>
    );
};
