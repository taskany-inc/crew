import { ExternalService, User, UserServices } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import { nullable } from '@taskany/bricks';
import styled from 'styled-components';

import { AddServiceToUserForm } from '../services/AddServiceToUserForm';
import { UserServiceListItem } from '../UserServiceListItem';
import { NarrowSection } from '../NarrowSection';
import { UserMeta } from '../../modules/user.types';

import { tr } from './users.i18n';

const StyledServicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type UserContactsProps = {
    user: User & UserMeta;
    userServices: (UserServices & { service: ExternalService })[];
};

export const UserContacts = ({ user, userServices }: UserContactsProps) => {
    return (
        <NarrowSection title={tr('Contacts')}>
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

            {nullable(user.meta.isEditable, () => (
                <AddServiceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
