import { useRef } from 'react';
import styled from 'styled-components';
import { Popup, Text } from '@taskany/bricks';
import { gapSm, gray10 } from '@taskany/colors';

import { UserDeviceInfo } from '../modules/deviceTypes';

interface UserDeviceListItemProps {
    userDevice: UserDeviceInfo;
}

const StyledWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapSm};
    white-space: nowrap;
    max-width: 100%;
    overflow: auto;
`;

export const UserDeviceListItem = ({ userDevice }: UserDeviceListItemProps) => {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <>
            <StyledWrapper ref={ref}>
                <Text color={gray10} ellipsis>
                    {userDevice.deviceName} {userDevice.deviceId}
                </Text>
            </StyledWrapper>

            <Popup reference={ref} placement="top">
                <Text>
                    {userDevice.deviceName} {userDevice.deviceId}
                </Text>
            </Popup>
        </>
    );
};
