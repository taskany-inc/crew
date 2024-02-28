import { TaskanyLogo } from '@taskany/bricks/harmony';

import { pages } from '../hooks/useRouter';

import { Link } from './Link';

export const PageHeaderLogo: React.FC<{ logo?: string }> = ({ logo }) => (
    <Link href={pages.home}>
        <TaskanyLogo src={logo} />
    </Link>
);
