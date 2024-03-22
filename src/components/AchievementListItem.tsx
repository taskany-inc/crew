import { Achievement } from '@prisma/client';
import { useRef } from 'react';
import { Popup, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapS } from '@taskany/colors';

import { iconHeight } from '../utils';

interface AchievementListItemProps {
    achievement: Achievement;
}

const StyledAchievementWrap = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
`;

export const AchievementListItem = ({ achievement }: AchievementListItemProps) => {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <>
            <StyledAchievementWrap ref={ref}>
                <Text size="m" key={achievement.id}>
                    {achievement.title}
                </Text>
                <img height={iconHeight} src={achievement.icon} alt={achievement.title} />
            </StyledAchievementWrap>
            <Popup reference={ref} placement="top-start">
                <Text>{achievement.description}</Text>
            </Popup>
        </>
    );
};
