import { nullable } from '@taskany/bricks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { usePreviewContext } from '../context/preview-context';

import TeamProfilePreview from './groups/TeamProfilePreview';
import UserProfilePreview from './users/UserProfilePreview';

export const Previews = () => {
    const { userId, group, hidePreview } = usePreviewContext();
    const router = useRouter();
    const { pathname } = router;

    useEffect(() => {
        hidePreview();
    }, [pathname]);

    return (
        <>
            {nullable(group, (g) => (
                <TeamProfilePreview group={g} />
            ))}
            {nullable(userId, (u) => (
                <UserProfilePreview userId={u} />
            ))}
        </>
    );
};
