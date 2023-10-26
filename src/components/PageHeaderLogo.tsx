import { TaskanyLogo } from '@taskany/bricks';

import { pages } from '../hooks/useRouter';

import { Link } from './Link';

export const PageHeaderLogo: React.FC = () => {
    // TODO: resolve custom logo from settings in db

    return (
        <Link href={pages.home}>
            <TaskanyLogo />
        </Link>
    );
};
