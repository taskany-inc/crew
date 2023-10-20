import { User } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import { nullable } from '@taskany/bricks';
import styled from 'styled-components';
import { useMemo } from 'react';

import { AddServiceToUserForm } from '../services/AddServiceToUserForm';
import { UserServiceListItem } from '../UserServiceListItem';
import { NarrowSection } from '../NarrowSection';
import { UserMeta } from '../../modules/user.types';
import { trpc } from '../../trpc/trpcClient';
import { UserServiceInfo } from '../../modules/service.types';

import { tr } from './users.i18n';

const StyledServicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type UserContactsProps = {
    user: User & UserMeta;
};

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
                    <UserServiceListItem
                        key={`${userServices.serviceName}-${userServices.userId}`}
                        userService={userServices}
                    />
                ))}
            </StyledServicesList>

            {nullable(user.meta.isEditable, () => (
                <AddServiceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
