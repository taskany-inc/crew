import { FiltersCounter, Popup, Text, nullable } from '@taskany/bricks';
import { Achievement } from '@prisma/client';
import styled from 'styled-components';
import { gapXs, gray10, gray9, gray4 } from '@taskany/colors';
import { useRef } from 'react';

interface AchievementGridItemProps {
    achievement: Achievement;
    onClick?: (arg: Achievement) => void;
    counter?: number;
}

const GridItem = styled.div<{ onClick?: () => void }>`
    padding: ${gapXs};
    box-sizing: border-box;
    text-align: center;
    cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
    color: ${gray9};
    position: relative;

    &:hover {
        color: ${gray10};
    }
`;

const StyledText = styled(Text)`
    color: inherit;
`;

const StyledCounter = styled(FiltersCounter)`
    position: absolute;
    top: 50px;
    left: 45px;
`;

const StyledPopup = styled(Popup)`
    background-color: ${gray4};
`;

export const AchievementGridItem = ({ achievement, onClick, counter = 1 }: AchievementGridItemProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const onItemClick = onClick ? () => onClick(achievement) : undefined;

    return (
        <>
            <GridItem ref={ref} onClick={onItemClick}>
                <img height={60} src={achievement.icon} alt={achievement.title} />
                {nullable(counter > 1, () => (
                    <StyledCounter total={counter} />
                ))}

                <StyledText size="xs">{achievement.title}</StyledText>
            </GridItem>
            <StyledPopup reference={ref} placement="left" minWidth={200} maxWidth={250}>
                <Text weight="bold" size="s">
                    {achievement.nomination}
                </Text>
                <Text color={gray9} size="xs">
                    {achievement.description}
                </Text>
            </StyledPopup>
        </>
    );
};
