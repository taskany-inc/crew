import styled from 'styled-components';
import { gapM, gapS, gray10, gray6 } from '@taskany/colors';
import { Text, nullable } from '@taskany/bricks';
import { IconMoreHorizontalOutline } from '@taskany/icons';

interface CommonHeaderProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    preTitle?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
}

const StyledCommonHeader = styled.div`
    display: grid;
    grid-template-columns: 8fr 4fr;
    padding: 10px 40px 0 40px;
`;

const StyledCommonHeaderInfo = styled.div<{ align: 'left' | 'right' }>`
    ${({ align }) => `
        justify-self: ${align};
    `}

    ${({ align }) =>
        align === 'right' &&
        `
            display: grid;
            justify-items: end;
            align-content: space-between;
        `}
`;

const StyledMoreHorizontalIcon = styled(IconMoreHorizontalOutline)`
    margin-bottom: -0.5rem;
`;

const StyledCommonHeaderTitle = styled(Text)`
    width: 850px;
`;

const StyledCommonHeaderSubitle = styled(Text)`
    display: grid;
    grid-template-columns: 8fr;
    padding-top: ${gapM};
    transition: color 200ms ease-in-out;
`;

export const CommonHeader: React.FC<CommonHeaderProps> = ({
    preTitle,
    title,
    subtitle,
    description,
    children,
    onClick,
}) => {
    return (
        <StyledCommonHeader>
            <StyledCommonHeaderInfo align="left">
                {nullable(preTitle, (pT) => (
                    <Text size="m" weight="bold" color={gray6}>
                        {pT}
                    </Text>
                ))}

                <StyledCommonHeaderSubitle as="span" size="l" weight="bold" color={gray10} onClick={onClick}>
                    <StyledMoreHorizontalIcon size={15} />
                    {subtitle}
                </StyledCommonHeaderSubitle>
                <StyledCommonHeaderTitle size="xxl" weight="bolder">
                    {title}
                </StyledCommonHeaderTitle>

                {nullable(description, (d) => (
                    <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                        {d}
                    </Text>
                ))}
            </StyledCommonHeaderInfo>

            {children}
        </StyledCommonHeader>
    );
};
