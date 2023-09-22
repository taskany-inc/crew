import { ExternalService, User, UserServices } from 'prisma/prisma-client';
import { gapM, gapS, gapXl, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';

import { PageSep } from '../PageSep';
import { UserServiceListItem } from '../UserServiceListItem';
import { AddServiceToUserForm } from '../services/AddServiceToUserForm';

import { tr } from './users.i18n';

const StyledUserServices = styled.div`
    margin: 0 ${gapM} 0;
`;

const StyledServicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type UserContactsProps = {
    user: User;
    userServices: (UserServices & { service: ExternalService })[];
};

export const UserContacts = ({ user, userServices }: UserContactsProps) => {
    return (
        <StyledUserServices>
            <Text size="m" color={gray9} weight="bold">
                {tr('Contacts')}
                <PageSep width={300} margins={5} />
            </Text>

            <StyledServicesList>
                <UserServiceListItem
                    serviceId={user.email}
                    icon="IconEnvelopeOutline"
                    linkPrefix="mailto:"
                    serviceName={user.email}
                />

                {userServices.map((userService) => (
                    <UserServiceListItem
                        key={userService.serviceId}
                        serviceId={userService.serviceId}
                        icon={userService.service.icon}
                        linkPrefix={userService.service.linkPrefix}
                        serviceName={userService.serviceName}
                    />
                ))}
            </StyledServicesList>

            <AddServiceToUserForm userId={user.id} />
        </StyledUserServices>
    );
};
