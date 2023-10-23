import { nullable } from '@taskany/bricks';

import { NarrowSection } from '../NarrowSection';
import { User, UserMeta } from '../../modules/user.types';
import { AddDeviceToUserForm } from '../AddDeviceToUserForm/AddDeviceToUserForm';

import { tr } from './UserDevices.i18n';

type UserDevicesProps = {
    user: User & UserMeta;
};

export const UserDevices = ({ user }: UserDevicesProps) => {
    return (
        <NarrowSection title={tr('Corporate devices')}>
            {nullable(user.meta.isEditable, () => (
                <AddDeviceToUserForm userId={user.id} />
            ))}
        </NarrowSection>
    );
};
