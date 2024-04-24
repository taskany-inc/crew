import { useRef } from 'react';
import styled from 'styled-components';
import { Popup, Text } from '@taskany/bricks';
import { gapSm, gray10 } from '@taskany/colors';

import { UserDeviceInfo } from '../modules/deviceTypes';

interface UserDeviceListItemProps {
    deviceName: UserDeviceInfo['deviceName'];
}

const StyledWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapSm};
    white-space: nowrap;
    max-width: 100%;
    overflow: auto;
`;

export const UserDeviceListItem = ({ deviceName }: UserDeviceListItemProps) => {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <>
            <StyledWrapper ref={ref}>
                <Text color={gray10} ellipsis>
                    {deviceName}
                </Text>
            </StyledWrapper>

            <Popup reference={ref} placement="top">
                <Text>{deviceName}</Text>
            </Popup>
        </>
    );
};
