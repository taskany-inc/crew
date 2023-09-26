import { nullable } from '@taskany/bricks';

import { usePreviewContext } from '../context/preview-context';

import TeamProfilePreview from './groups/TeamProfilePreview';
import UserProfilePreview from './users/UserProfilePreview';

export const Previews = () => {
    const { user, group } = usePreviewContext();
    return (
        <>
            {nullable(group, (g) => (
                <TeamProfilePreview group={g} />
            ))}
            {nullable(user, (u) => (
                <UserProfilePreview user={u} />
            ))}
        </>
    );
};
