import { onlineManager } from '@tanstack/react-query';
import styled from 'styled-components';
import { nullable, useOfflineDetector, Text } from '@taskany/bricks';
import { gapS } from '@taskany/colors';
import { IconExclamationCircleOutline } from '@taskany/icons';

import { tr } from './OfflineBanner.i18n';

const StyledBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    background-color: #462322;
    text-align: center;
    gap: ${gapS};
    bottom: 0;
`;

export const OfflineBanner = () => {
    const [globalOnlineStatus, remoteServerStatus] = useOfflineDetector({
        setStatus: () => {
            onlineManager.setOnline(globalOnlineStatus || remoteServerStatus);
        },
        remoteServerUrl: '/api/health',
    });
    return nullable(!globalOnlineStatus || !remoteServerStatus, () => (
        <StyledBanner>
            <IconExclamationCircleOutline size="s" color="#f7c0be" />
            <Text as="span" color="#f7c0be">
                {tr('You are currently offline. Check connection.')}
            </Text>
        </StyledBanner>
    ));
};
