import styled from 'styled-components';
import { gapL, gapM, gapXs, gray10, gray6 } from '@taskany/colors';
import { Text, UserPic, nullable } from '@taskany/bricks';

interface CommonHeaderPreviewProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    preTitle?: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
    avatar?: string;
}

const StyledCommonHeaderPreview = styled.div`
    display: flex;
    grid-template-columns: 4fr, 8fr 4fr;
    padding: ${gapXs} ${gapL} 0 ${gapM};
`;

const StyledCommonHeaderPreviewInfo = styled.div<{ align: 'left' | 'right' }>`
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

const StyledCommonHeaderTitle = styled(Text)`
    width: 850px;
`;

const StyledCommonHeaderPreviewSubitle = styled(Text)`
    display: grid;
    grid-template-columns: 8fr;
    transition: color 200ms ease-in-out;
`;

export const CommonHeaderPreview: React.FC<CommonHeaderPreviewProps> = ({
    preTitle,
    title,
    subtitle,
    children,
    onClick,
    avatar,
}) => {
    return (
        <StyledCommonHeaderPreview>
            {avatar && (
                <StyledCommonHeaderPreviewInfo align="right" style={{ marginRight: gapM }}>
                    {avatar && <UserPic size={75} src={avatar} />}
                </StyledCommonHeaderPreviewInfo>
            )}
            <StyledCommonHeaderPreviewInfo align="left">
                {nullable(preTitle, (pT) => (
                    <Text size="s" weight="bold" color={gray6}>
                        {pT}
                    </Text>
                ))}

                <StyledCommonHeaderPreviewSubitle as="span" size="m" weight="bold" color={gray10} onClick={onClick}>
                    {subtitle}
                </StyledCommonHeaderPreviewSubitle>
                <StyledCommonHeaderTitle size="xl" weight="bold">
                    {title}
                </StyledCommonHeaderTitle>
            </StyledCommonHeaderPreviewInfo>

            {children}
        </StyledCommonHeaderPreview>
    );
};
