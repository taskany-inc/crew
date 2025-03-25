import { ComponentProps, FC, useMemo } from 'react';
import { User } from 'prisma/prisma-client';

import {
    UserAchievements,
    UserLocation,
    UserMemberships,
    UserMeta,
    UserNames,
    UserRoleData,
    UserScheduledDeactivations,
    UserServices,
    UserSupervisorWithSupplementalPositions,
    UserSupervisorIn,
    UserSupervisorOf,
    UserSupplementalPositions,
} from '../../modules/userTypes';
import { DecreeForm } from '../DecreeForm/DecreeForm';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { trpc } from '../../trpc/trpcClient';
import { useRouter } from '../../hooks/useRouter';
import { ExternalServiceName } from '../../utils/externalServices';

interface CreateDecreeFormProps {
    user: NonNullable<
        User &
            UserMeta &
            UserNames &
            UserMemberships &
            UserSupervisorWithSupplementalPositions &
            UserRoleData &
            UserAchievements &
            UserSupervisorOf &
            UserSupervisorIn &
            UserScheduledDeactivations &
            UserSupplementalPositions &
            UserServices &
            UserLocation
    >;
    type: ComponentProps<typeof DecreeForm>['type'];
    onSubmit: ComponentProps<typeof DecreeForm>['onSubmit'];
}

export const CreateDecreeForm: FC<CreateDecreeFormProps> = ({ user, type, onSubmit }) => {
    const router = useRouter();
    const { data: devices = [] } = trpc.device.getUserDevices.useQuery(user.id);

    const positions = useMemo(() => {
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions;
    }, [user]);

    const role = positions[0]?.role ?? '';

    const defaultValues: Partial<ComponentProps<typeof DecreeForm>['defaultValues']> = useMemo(() => {
        const [surname = '', firstName = '', middleName = ''] = (user.name ?? '').split(' ');
        const { personalEmail, phone } = user.services.reduce<{ personalEmail: string; phone: string }>(
            (acum, item) => {
                if (!item.active) {
                    return acum;
                }

                if (item.serviceName === ExternalServiceName.Phone && !acum.phone) {
                    acum.phone = item.serviceId;
                }
                if (item.serviceName === ExternalServiceName.Email && !acum.personalEmail) {
                    acum.personalEmail = item.serviceId;
                }

                return acum;
            },
            {
                personalEmail: '',
                phone: '',
            },
        );

        const group = user?.memberships.find((m) => m.group.organizational)?.group;

        return {
            type,
            userTargetId: user.id,
            supervisorId: user.supervisorId ?? '',
            surname,
            firstName,
            middleName,
            phone,
            personalEmail,
            groupId: group?.id,
            percentage: 1,
            login: user.login ?? '',
            title: role,
            workEmail: user.email ?? '',
            equipment: devices.reduce((a, d) => (d.active ? `${a}${a.length > 0 ? ', ' : ''}${d.deviceName}` : a), ''),
            email: user.email,
            date: new Date(),
            location: user.location?.name,
        };
    }, [user, role, type, devices]);

    return (
        <DecreeForm
            onCancel={() => router.user(user.id)}
            type={type}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            supplementalPositions={type === 'toDecree' ? positions : undefined}
            mode="edit"
        />
    );
};
