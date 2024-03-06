import { nullable } from '@taskany/bricks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { usePreviewContext } from '../contexts/previewContext';

import { TeamProfilePreview } from './TeamProfilePreview/TeamProfilePreview';
import { UserProfilePreview } from './UserProfilePreview';

export const Previews = () => {
    const { userId, groupId, hidePreview } = usePreviewContext();
    const router = useRouter();
    const { pathname } = router;

    useEffect(() => {
        hidePreview();
    }, [pathname, hidePreview]);

    return (
        <>
            {nullable(groupId, (g) => (
                <TeamProfilePreview groupId={g} />
            ))}
            {nullable(userId, (u) => (
                <UserProfilePreview userId={u} />
            ))}
        </>
    );
};
