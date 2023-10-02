import { nullable } from '@taskany/bricks';

import { usePreviewContext } from '../context/preview-context';

import TeamProfilePreview from './groups/TeamProfilePreview';
import UserProfilePreview from './users/UserProfilePreview';

export const Previews = () => {
    const { userId, group } = usePreviewContext();
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
