import styled from 'styled-components';
import { gapS, gray10 } from '@taskany/colors';
import { ExternalService, UserServices } from 'prisma/prisma-client';

import { getDynamicIcon } from '../utils/getDynamicIcon';

import { Link } from './Link';

type UserServiceListItemProps = {
    userService: UserServices & { service: ExternalService };
};

const StyledWrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: ${gapS};
`;

export const UserServiceListItem = (props: UserServiceListItemProps) => {
    const Icon = getDynamicIcon(props.userService.service.icon);

    return (
        <StyledWrapper>
            <Icon size="s" color={gray10} />
            <Link href={`${props.userService.service.linkPrefix}${props.userService.serviceId}`}>
                {props.userService.serviceId}
            </Link>
        </StyledWrapper>
    );
};
