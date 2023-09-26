import { usePreviewContext } from '../../context/preview-context';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { LayoutMain } from '../layout/LayoutMain';

import { tr } from './users.i18n';

export const UsersPage = () => {
    const usersQuery = trpc.user.getList.useQuery();
    const { showUserPreview } = usePreviewContext();

    return (
        <LayoutMain pageTitle={tr('Users')}>
            {usersQuery.data?.map((user) => (
                <div key={user.id}>
                    <Link onClick={() => showUserPreview(user)} href={pages.user(user.id)}>
                        {user.name}
                    </Link>
                </div>
            ))}
        </LayoutMain>
    );
};
