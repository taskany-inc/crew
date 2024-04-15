import { User } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import { nullable } from '@taskany/bricks';
import styled from 'styled-components';
import { useMemo } from 'react';

import { AddServiceToUserForm } from '../AddServiceToUserForm/AddServiceToUserForm';
import { UserServiceListItem } from '../UserServiceListItem';
import { NarrowSection } from '../NarrowSection';
import { UserMeta } from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';
import { UserServiceInfo } from '../../modules/serviceTypes';
import { UserServiceMenu } from '../UserServiceMenu/UserServiceMenu';
import { Restricted } from '../Restricted';

import { tr } from './UserContacts.i18n';

const StyledServicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px 28px;
`;

interface UserContactsProps {
    user: User & UserMeta;
}

export const UserContacts = ({ user }: UserContactsProps) => {
    const userServiceQuery = trpc.service.getUserServices.useQuery(user.id);

    const emailStubService = useMemo<UserServiceInfo>(() => {
        const item = {
            userId: user.id,
            serviceName: 'Email',
            serviceId: user.email,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            service: {
                name: 'Email',
                displayName: null,
                icon: 'IconEnvelopeOutline',
                linkPrefix: 'mailto:',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        };
        return item;
    }, [user.email, user.id]);

    return (
        <NarrowSection title={tr('Contacts')}>
            <StyledServicesList>
                <UserServiceListItem userService={emailStubService} />

                {userServiceQuery.data?.map((userServices) => (
                    <StyledRow key={`${userServices.serviceName}-${userServices.serviceId}-${userServices.userId}`}>
                        <UserServiceListItem userService={userServices} />

                        <Restricted visible={user.meta.isEditable}>
                            <UserServiceMenu service={userServices} />
                        </Restricted>
                    </StyledRow>
                ))}
            </StyledServicesList>

            {nullable(user.meta.isEditable, () => (
                <AddServiceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
