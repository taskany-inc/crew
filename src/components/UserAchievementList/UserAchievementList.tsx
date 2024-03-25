import { User } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { IconEditSolid } from '@taskany/icons';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { UserAchievements, UserMeta } from '../../modules/userTypes';
import { useBoolean } from '../../hooks/useBoolean';
import { AddAchievementModal } from '../AddAchievementModal/AddAchievementModal';
import { AchievementListItem } from '../AchievementListItem';

import { tr } from './UserAchievementList.i18n';

interface UserAchievementListProps {
    user: User & UserMeta & UserAchievements;
    isEditable: boolean;
}

export const UserAchievementList = ({ user, isEditable }: UserAchievementListProps) => {
    const modalAchievementVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Achievements')}>
            {user.achievements?.map(({ achievement }) => (
                <AchievementListItem key={`achievement-${achievement.id}`} achievement={achievement} />
            ))}
            {nullable(isEditable, () => (
                <>
                    <InlineTrigger
                        text={tr('New crew achievement')}
                        icon={<IconEditSolid size="s" />}
                        onClick={modalAchievementVisibility.setTrue}
                    />
                    <AddAchievementModal
                        userId={user.id}
                        onClose={modalAchievementVisibility.setFalse}
                        visible={modalAchievementVisibility.value}
                    />
                </>
            ))}
        </NarrowSection>
    );
};
