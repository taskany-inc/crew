import NextLink from 'next/link';
import { TaskanyLogo } from '@taskany/bricks';

export const PageHeaderLogo: React.FC = () => {
    // TODO: resolve custom logo from settings in db

    return (
        <NextLink href={''} passHref>
            <TaskanyLogo />
        </NextLink>
    );
};
