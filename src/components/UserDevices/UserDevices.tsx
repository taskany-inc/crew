import { nullable } from '@taskany/bricks';
import { gapM, gapS } from '@taskany/colors';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';

import { NarrowSection } from '../NarrowSection';
import { AddDeviceToUserForm } from '../AddDeviceToUserForm/AddDeviceToUserForm';
import { UserMeta } from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';
import { UserDeviceListItem } from '../UserDeviceListItem';
import { UserDeviceMenu } from '../UserDeviceMenu/UserDeviceMenu';
import { Restricted } from '../Restricted';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './UserDevices.i18n';

const StyleDevicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 28px 28px;
`;

interface UserDevicesProps {
    user: User & UserMeta;
}

export const UserDevices = ({ user }: UserDevicesProps) => {
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(user.id);
    const sessionUser = useSessionUser();

    return (
        <NarrowSection title={tr('Corporate devices')}>
            <StyleDevicesList>
                {userDeviceQuery.data?.map((userDevices) => (
                    <StyledRow key={userDevices.deviceId}>
                        <UserDeviceListItem deviceName={userDevices.deviceName} />

                        <Restricted visible={!!sessionUser.role?.editUser}>
                            <UserDeviceMenu device={userDevices} />
                        </Restricted>
                    </StyledRow>
                ))}
            </StyleDevicesList>
            {nullable(user.meta.isEditable, () => (
                <AddDeviceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
