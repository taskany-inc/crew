import { Popup, Text } from '@taskany/bricks';
import { Achievement } from '@prisma/client';
import styled from 'styled-components';
import { gray10, gray9 } from '@taskany/colors';
import { useRef } from 'react';

import { iconHeight } from '../utils';

interface AchievementGridItemProps {
    achievement: Achievement;
    onClick: (arg: Achievement) => void;
}

const GridItem = styled.div`
    padding: 10px;
    box-sizing: border-box;
    text-align: center;
    cursor: pointer;
    color: ${gray9};

    &:hover {
        color: ${gray10};
    }
`;

const StyledText = styled(Text)`
    color: inherit;
`;

export const AchievementGridItem = ({ achievement, onClick }: AchievementGridItemProps) => {
    const ref = useRef<HTMLDivElement>(null);
    return (
        <>
            <GridItem ref={ref} onClick={() => onClick(achievement)}>
                <img height={iconHeight} src={achievement.icon} alt={achievement.title} />
                <StyledText>{achievement.title}</StyledText>
            </GridItem>
            <Popup reference={ref} placement="top-start">
                <Text>{achievement.description}</Text>
            </Popup>
        </>
    );
};
