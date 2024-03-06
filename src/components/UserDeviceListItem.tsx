import { useRef } from 'react';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapSm, gray10 } from '@taskany/colors';

import { UserDeviceInfo } from '../modules/deviceTypes';

interface UserDeviceListItemProps {
    userDevice: UserDeviceInfo;
}

const StyledWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    width: max-content;
    gap: ${gapSm};
`;

export const UserDeviceListItem = ({ userDevice }: UserDeviceListItemProps) => {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <>
            <StyledWrapper ref={ref}>
                <Text color={gray10}>{userDevice.deviceName}</Text>
                <Text color={gray10}>{userDevice.deviceId}</Text>
            </StyledWrapper>
        </>
    );
};
