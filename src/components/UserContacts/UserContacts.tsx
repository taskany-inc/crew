import { User } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import { nullable } from '@taskany/bricks';
import styled from 'styled-components';
import { useMemo } from 'react';

import { AddServiceToUserForm } from '../AddServiceToUserForm/AddServiceToUserForm';
import { UserServiceListItem } from '../UserServiceListItem';
import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { UserServiceInfo } from '../../modules/serviceTypes';
import { UserServiceMenu } from '../UserServiceMenu/UserServiceMenu';
import { Restricted } from '../Restricted';
import { useSessionUser } from '../../hooks/useSessionUser';

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
    user: User;
}

const getStubData = (userId: string) => {
    return {
        userId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationUnitId: null,
        service: {
            displayName: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    };
};

export const UserContacts = ({ user }: UserContactsProps) => {
    const userServiceQuery = trpc.service.getUserServices.useQuery(user.id);
    const sessionUser = useSessionUser();

    const [emailStubService, loginStubService] = useMemo<UserServiceInfo[]>(() => {
        const data = getStubData(user.id);

        const emailService = {
            ...data,
            serviceName: 'Email',
            serviceId: user.email,
            service: {
                ...data.service,
                name: 'Email',
                icon: 'IconEnvelopeOutline',
                linkPrefix: 'mailto:',
            },
        };

        const loginService = {
            ...data,
            serviceName: 'Login',
            serviceId: user.login || '',
            service: {
                ...data.service,
                name: 'Login',
                icon: 'IconUserSquareOutline',
                linkPrefix: null,
            },
        };

        return [emailService, loginService];
    }, [user]);

    return (
        <NarrowSection title={tr('Contacts')}>
            <StyledServicesList>
                {nullable(user.login, () => (
                    <UserServiceListItem userService={loginStubService} />
                ))}
                <UserServiceListItem userService={emailStubService} />

                {userServiceQuery.data?.map((userServices) => (
                    <StyledRow key={`${userServices.serviceName}-${userServices.serviceId}-${userServices.userId}`}>
                        <UserServiceListItem userService={userServices} />

                        <Restricted visible={!!sessionUser.role?.editUser}>
                            <UserServiceMenu service={userServices} />
                        </Restricted>
                    </StyledRow>
                ))}
            </StyledServicesList>

            {nullable(sessionUser.role?.editUser, () => (
                <AddServiceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
