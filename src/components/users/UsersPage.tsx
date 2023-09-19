import { useState } from 'react';
import { User } from 'prisma/prisma-client';
import { ModalPreview, nullable } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { LayoutMain } from '../layout/LayoutMain';

import { tr } from './users.i18n';
import { UserProfilePreview } from './UserProfilePreview';

export const UsersPage = () => {
    const usersQuery = trpc.user.getList.useQuery();
    const [previewUser, setPreviewUser] = useState<User>();

    return (
        <LayoutMain pageTitle={tr('Users')}>
            {usersQuery.data?.map((user) => (
                <div key={user.id}>
                    <Link onClick={() => setPreviewUser(user)}>{user.name}</Link>
                </div>
            ))}

            <ModalPreview visible={!!previewUser} onClose={() => setPreviewUser(undefined)}>
                {nullable(previewUser, (user) => (
                    <UserProfilePreview user={user} groupName="Group placeholder" role="Role placeholder" />
                ))}
            </ModalPreview>
        </LayoutMain>
    );
};
