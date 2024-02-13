import { ComponentProps, MutableRefObject, ReactNode, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { KeyCode, Popup, nullable, useKeyboard } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';

interface PopupTriggerProps {
    children: ReactNode;
    renderTrigger: (props: { onClick: () => void; ref: MutableRefObject<HTMLDivElement | null> }) => ReactNode;
    visible: boolean;
    setVisible: (visible: boolean) => void;
    placement?: ComponentProps<typeof Popup>['placement'];
    width?: number;
    onCancel?: VoidFunction;
}

const StyledWrapper = styled.div`
    padding: ${gapXs};
`;

export const PopupTrigger = ({
    children,
    renderTrigger,
    visible,
    setVisible,
    placement,
    width,
    onCancel,
}: PopupTriggerProps) => {
    const onClickOutside = useCallback(() => {
        setVisible(false);
        onCancel?.();
    }, [onCancel, setVisible]);

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
