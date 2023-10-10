import styled from 'styled-components';
import { gapS, gray10 } from '@taskany/colors';
import { ExternalService, UserServices } from 'prisma/prisma-client';

import { getDynamicIcon } from '../utils/getDynamicIcon';

import { Link } from './Link';

type UserServiceListItemProps = {
    userService: UserServices & { service: ExternalService };
};

const StyledLink = styled(Link)`
    margin-left: ${gapS};
`;

export const UserServiceListItem = (props: UserServiceListItemProps) => {
    const Icon = getDynamicIcon(props.userService.service.icon);

    return (
        <div>
            <Icon size={13} color={gray10} />
            <StyledLink href={`${props.userService.service.linkPrefix}${props.userService.serviceId}`}>
                {props.userService.serviceId}
            </StyledLink>
        </div>
    );
};
