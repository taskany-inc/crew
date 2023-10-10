import React from 'react';
import NextLink from 'next/link';
import { Link as LinkBricks } from '@taskany/bricks';

export const Link = (props: React.ComponentProps<typeof LinkBricks>) => {
    if (!props.href) {
        return <LinkBricks inline {...props} />;
    }

    return <LinkBricks as={NextLink} inline {...props} />;
};
