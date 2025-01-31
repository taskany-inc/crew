import { TaskanyLogo } from '@taskany/bricks/harmony';

import { pages } from '../hooks/useRouter';

import { Link } from './Link';
import s from './PageHeader/PageHeader.module.css';
import { TitleLogo } from './TitleLogo';

export const PageHeaderLogo: React.FC<{ logo?: string }> = ({ logo }) => (
    <Link href={pages.home} className={s.Link}>
        <TaskanyLogo src={logo} />
        <TitleLogo className={s.TitleLogo} />
    </Link>
);
