import { nullable } from '@taskany/bricks';
import { gapM, gapS } from '@taskany/colors';
import { User } from 'prisma/prisma-client';
import styled from 'styled-components';

import { NarrowSection } from '../NarrowSection';
import { AddDeviceToUserForm } from '../AddDeviceToUserForm/AddDeviceToUserForm';
import { UserMeta } from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';
import { UserDeviceListItem } from '../UserDeviceListItem';

import { tr } from './UserDevices.i18n';

const StyleDevicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type UserDevicesProps = {
    user: User & UserMeta;
};

export const UserDevices = ({ user }: UserDevicesProps) => {
    const userDeviceQuery = trpc.device.getUserDevices.useQuery(user.id);

    return (
        <NarrowSection title={tr('Corporate devices')}>
            <StyleDevicesList>
                {userDeviceQuery.data?.map((userDevices) => (
                    <UserDeviceListItem
                        key={`${userDevices.deviceName}-${userDevices.userId}`}
                        userDevice={userDevices}
                    />
                ))}
            </StyleDevicesList>
            {nullable(user.meta.isEditable, () => (
                <AddDeviceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
