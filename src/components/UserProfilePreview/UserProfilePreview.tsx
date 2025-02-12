import { nullable } from '@taskany/bricks';
import { Drawer, DrawerHeader, TextSkeleton } from '@taskany/bricks/harmony';

import { trpc } from '../../trpc/trpcClient';
import { usePreviewContext } from '../../contexts/previewContext';
import { UserMembershipsList } from '../UserMembershipsListV2/UserMembershipsList';
import { UserProfilePreviewAvatar } from '../UserProfilePreviewAvatar/UserProfilePreviewAvatar';
import { UserEmploymentInfo } from '../UserEmploymentInfo/UserEmploymentInfo';
import { UserSupervisorSimple } from '../UserSupervisorSimple/UserSupervisorSimple';

import s from './UserProfilePreview.module.css';

interface UserProps {
    userId: string;
}

export const UserProfilePreview = ({ userId }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const userQuery = trpc.user.getById.useQuery(userId);

    return (
        <Drawer animated visible onClose={hidePreview}>
            <DrawerHeader>
                {nullable(userQuery.data, (user) => (
                    <UserProfilePreviewAvatar user={user} />
                ))}
            </DrawerHeader>
            {nullable(
                userQuery.data,
                (user) => (
                    <div className={s.UserProfilePreviewContent}>
                        <UserEmploymentInfo user={user} />

                        <UserSupervisorSimple
                            className={s.UserProfilePreviewSupervisor}
                            user={user.supervisor ?? undefined}
                        />

                        <UserMembershipsList user={user} />
                    </div>
                ),
                <TextSkeleton lines={6} />,
            )}
        </Drawer>
    );
};
