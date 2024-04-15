import { User } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import styled from 'styled-components';
import { IconEditSolid } from '@taskany/icons';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { UserAchievements } from '../../modules/userTypes';
import { useBoolean } from '../../hooks/useBoolean';
import { AddAchievementModal } from '../AddAchievementModal/AddAchievementModal';
import { AchievementGridItem } from '../AchievementGridItem';

import { tr } from './UserAchievementList.i18n';

interface UserAchievementListProps {
    user: User & UserAchievements;
    isEditable: boolean;
}

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    max-width: 270px;
    max-height: 270px;
    overflow-y: auto;
`;

export const UserAchievementList = ({ user, isEditable }: UserAchievementListProps) => {
    const modalAchievementVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Achievements')}>
            <Grid>
                {user.achievements?.map((achievement) => (
                    <AchievementGridItem
                        key={`achievement-${achievement.id}`}
                        achievement={achievement.achievement}
                        counter={achievement.count}
                    />
                ))}
            </Grid>
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
