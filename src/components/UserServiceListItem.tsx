import styled from 'styled-components';
import { gapS, gray10 } from '@taskany/colors';

import { getDynamicIcon } from '../utils/getDynamicIcon';

import { Link } from './Link';

type UserServiceListItemProps = {
    serviceId: string;
    serviceName: string;
    icon: string;
    linkPrefix: string | null;
};

const StyledLink = styled(Link)`
    margin-left: ${gapS};
`;

export const UserServiceListItem = (props: UserServiceListItemProps) => {
    const Icon = getDynamicIcon(props.icon);

    return (
        <div>
            <Icon size={13} color={gray10} />
            <StyledLink href={`${props.linkPrefix}${props.serviceId}`}>{props.serviceName}</StyledLink>
        </div>
    );
};
