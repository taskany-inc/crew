import { useState } from 'react';

import { usePreviewContext } from '../../contexts/previewContext';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { LayoutMain, PageContent } from '../LayoutMain';
import { UsersPageFiltersPanel } from '../UsersPageFilterPanel/UsersPageFilterPanel';
import { CommonHeader } from '../CommonHeader';
import { UserFilterQuery } from '../../modules/userTypes';

import { tr } from './UsersPage.i18n';

export const UsersPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filtersQuery, setFiltersQuery] = useState<UserFilterQuery>({});
    const usersQuery = trpc.user.getList.useQuery({ search: searchQuery, ...filtersQuery });

    const { showUserPreview } = usePreviewContext();

    return (
        <LayoutMain pageTitle={tr('Users')}>
            <CommonHeader title={tr('Users')} />
            <UsersPageFiltersPanel
                filterState={filtersQuery}
                total={usersQuery.data?.total || 0}
                counter={usersQuery.data?.counter || 0}
                setSearchQuery={setSearchQuery}
                onFilterApply={setFiltersQuery}
            />
            <PageContent>
                {usersQuery.data?.users.map((user) => (
                    <div key={user.id}>
                        <Link onClick={() => showUserPreview(user.id)} href={pages.user(user.id)}>
                            {user.name}
                        </Link>
                    </div>
                ))}
            </PageContent>
        </LayoutMain>
    );
};
