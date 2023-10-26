import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { LayoutMain } from '../LayoutMain';

import { tr } from './UsersPage.i18n';

export const UsersPage = () => {
    const usersQuery = trpc.user.getList.useQuery({});
    const { showUserPreview } = usePreviewContext();

    return (
        <LayoutMain pageTitle={tr('Users')}>
            {usersQuery.data?.map((user) => (
                <div key={user.id}>
                    <Link onClick={() => showUserPreview(user.id)} href={pages.user(user.id)}>
                        {user.name}
                    </Link>
                </div>
            ))}
        </LayoutMain>
    );
};
