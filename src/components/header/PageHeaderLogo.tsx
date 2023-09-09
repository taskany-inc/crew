import { TaskanyLogo } from '@taskany/bricks';

import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';

export const PageHeaderLogo: React.FC = () => {
    // TODO: resolve custom logo from settings in db

    return (
        <Link href={pages.home}>
            <TaskanyLogo />
        </Link>
    );
};
