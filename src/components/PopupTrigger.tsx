import { ComponentProps, MutableRefObject, ReactNode, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { KeyCode, Popup, nullable, useKeyboard } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';

interface PopupTriggerProps {
    children: ReactNode;
    renderTrigger: (props: { onClick: () => void; ref: MutableRefObject<HTMLDivElement | null> }) => ReactNode;
    placement?: ComponentProps<typeof Popup>['placement'];
    width?: number;
    onCancel?: VoidFunction;
}

const StyledWrapper = styled.div`
    padding: ${gapXs};
`;

export const PopupTrigger = ({ children, renderTrigger, placement, width, onCancel }: PopupTriggerProps) => {
    const [visible, setVisible] = useState(false);

    const onClickOutside = useCallback(() => {
        setVisible(false);
        onCancel?.();
    }, [onCancel]);

    const popupRef = useRef<HTMLDivElement>(null);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        if (visible) onClickOutside();
    });

    return (
        <>
            {renderTrigger({ onClick: () => setVisible(true), ref: popupRef })}
            <Popup
                visible={visible}
                reference={popupRef}
                placement={placement}
                onClickOutside={onClickOutside}
                minWidth={width}
                maxWidth={width}
                interactive
                arrow
                {...onESC}
            >
                {nullable(visible, () => (
                    <StyledWrapper>{children}</StyledWrapper>
                ))}
            </Popup>
        </>
    );
};
