import { useReducer } from 'react';
import styled from 'styled-components';
import { gapS, gapXs, gray10, gray6 } from '@taskany/colors';
import { Text, nullable } from '@taskany/bricks';

interface CommonHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    preTitle?: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

const StyledCommonHeader = styled.div`
    padding: 10px 40px 0 40px;
`;

const StyledCommonHeaderSubtitle = styled(Text)`
    display: grid;
    justify-content: start;
    gap: ${gapXs};
    padding-top: ${gapS};
`;

const StyledDescription = styled(Text)<{ truncate: boolean }>`
    width: 850px;
    padding-top: ${gapS};

    ${({ truncate }) =>
        truncate &&
        `
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        `}
`;

export const CommonHeader: React.FC<CommonHeaderProps> = ({
    preTitle,
    title,
    subtitle,
    description,
    className,
    children,
}) => {
    const [truncateDescription, toggleDescription] = useReducer((v) => !v, true);

    return (
        <StyledCommonHeader className={className}>
            {nullable(preTitle, (pT) => (
                <Text size="m" weight="bold" color={gray6}>
                    {pT}
                </Text>
            ))}

            {nullable(subtitle, (sT) => (
                <StyledCommonHeaderSubtitle size="l" weight="bold" color={gray10}>
                    {sT}
                </StyledCommonHeaderSubtitle>
            ))}

            <Text size="xxl" weight="bolder">
                {title}
            </Text>

            {nullable(description, (d) => (
                <StyledDescription size="m" color={gray6} truncate={truncateDescription} onClick={toggleDescription}>
                    {d}
                </StyledDescription>
            ))}

            {children}
        </StyledCommonHeader>
    );
};
