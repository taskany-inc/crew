import { Text } from '@taskany/bricks';
import { gray8, textColor } from '@taskany/colors';
import { forwardRef } from 'react';
import styled from 'styled-components';

interface InlineTriggerProps {
    text: React.ReactNode;
    /** recommended props: size="xs" */
    icon: React.ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

const StyledInlineTrigger = styled(Text)<{ disabled?: boolean }>`
    display: flex;
    align-items: center;

    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color;

    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

    color: ${gray8};

    &:hover {
        color: ${({ disabled }) => (disabled ? 'auto' : textColor)};
    }
`;

const StyledInlineTriggerText = styled.span`
    display: inline-block;
    padding-left: 0.5rem;
`;

export const InlineTrigger = forwardRef<HTMLDivElement, InlineTriggerProps>(
    ({ text, icon, className, onClick, disabled }, ref) => {
        return (
            <StyledInlineTrigger forwardRef={ref} size="s" className={className} onClick={onClick} disabled={disabled}>
                {icon}
                <StyledInlineTriggerText>{text}</StyledInlineTriggerText>
            </StyledInlineTrigger>
        );
    },
);
