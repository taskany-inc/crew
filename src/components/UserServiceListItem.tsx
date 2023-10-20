import { useRef } from 'react';
import styled from 'styled-components';
import { Popup, Text } from '@taskany/bricks';
import { gapS, gray10 } from '@taskany/colors';

import { getDynamicIcon } from '../utils/getDynamicIcon';
import { UserServiceInfo } from '../modules/service.types';

import { Link } from './Link';

type UserServiceListItemProps = {
    userService: UserServiceInfo;
};

const StyledWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    width: max-content;
    gap: ${gapS};
`;

export const UserServiceListItem = ({ userService }: UserServiceListItemProps) => {
    const Icon = getDynamicIcon(userService.service.icon);
    const ref = useRef<HTMLDivElement>(null);

    return (
        <>
            <StyledWrapper ref={ref}>
                <Icon size="s" color={gray10} />
                {userService.service.linkPrefix ? (
                    <Link href={encodeURIComponent(`${userService.service.linkPrefix}${userService.serviceId}`)}>
                        {userService.serviceId}
                    </Link>
                ) : (
                    <Text>{userService.serviceId}</Text>
                )}
            </StyledWrapper>

            <Popup reference={ref} placement="top">
                <Text>{userService.service.name}</Text>
            </Popup>
        </>
    );
};
