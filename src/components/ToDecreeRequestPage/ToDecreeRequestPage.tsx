import { ComponentProps, FC, useCallback, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'prisma/prisma-client';
import { Text } from '@taskany/bricks/harmony';

import { useRouter } from '../../hooks/useRouter';
import {
    UserAchievements,
    UserMemberships,
    UserMeta,
    UserNames,
    UserOrganizationUnit,
    UserRoleData,
    UserScheduledDeactivations,
    UserServices,
    UserSupervisor,
    UserSupervisorIn,
    UserSupervisorOf,
    UserSupplementalPositions,
} from '../../modules/userTypes';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { UserToDecreeSchema, userToDecreeSchema } from '../../modules/userDecreeRequestSchemas';
import { UserFormPositionsBlock } from '../UserFormPositionsBlock/UserFormPositionsBlock';
import { percentageMultiply } from '../../utils/suplementPosition';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { useUserMutations } from '../../modules/userHooks';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';

import s from './ToDecreeRequestPage.module.css';
import { tr } from './ToDecreeRequestPage.i18n';

interface ToDecreeRequestFormProps {
    user: NonNullable<
        User &
            UserMeta &
            UserNames &
            UserMemberships &
            UserOrganizationUnit &
            UserSupervisor &
            UserRoleData &
            UserAchievements &
            UserSupervisorOf &
            UserSupervisorIn &
            UserScheduledDeactivations &
            UserSupplementalPositions &
            UserServices
    >;
}

const personalInfoReadOnly: ComponentProps<typeof UserFormPersonalDataBlock>['readOnly'] = {
    firstName: true,
    surname: true,
    middleName: true,
    login: true,
    corporateEmail: true,
    email: true,
    workEmail: true,
    personalEmail: true,
    phone: true,
    createExternalAccount: true,
    accountingId: true,
};

const ToDecreeRequestForm: FC<ToDecreeRequestFormProps> = ({ user }) => {
    const router = useRouter();

    const { toDecree } = useUserMutations();

    const defaultValues: Partial<UserToDecreeSchema> = useMemo(() => {
        const [surname = '', firstName = '', middleName = ''] = (user.name ?? '').split(' ');
        const { personalEmail, phone } = user.services.reduce<{ personalEmail: string; phone: string }>(
            (acum, item) => {
                if (!item.active) {
                    return acum;
                }

                if (item.serviceName === 'Phone' && !acum.phone) {
                    acum.phone = item.serviceId;
                }
                if (item.serviceName === 'Email' && !acum.personalEmail) {
                    acum.personalEmail = item.serviceId;
                }

                return acum;
            },
            {
                personalEmail: '',
                phone: '',
            },
        );

        const role = user.supplementalPositions.find((item) => item.status === 'ACTIVE')?.role ?? '';

        return {
            userId: user.id,
            surname,
            firstName,
            middleName,
            phone,
            personalEmail,
            login: user.login ?? '',
            title: role,
            workEmail: user.email ?? '',
        };
    }, [user]);

    const methods = useForm<UserToDecreeSchema>({
        resolver: zodResolver(userToDecreeSchema),
        defaultValues,
    });

    const {
        handleSubmit,
        setValue,
        trigger,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const onOrganizationChange = useCallback(
        (organizationUnitId: string, index: number) => {
            const position = user.supplementalPositions.find(
                (item) => item.organizationUnitId === organizationUnitId && item.status === 'ACTIVE',
            );

            if (!position || index < 0) {
                return;
            }

            setValue(`positions.${index}.unitId`, position.unitId ?? '');
            setValue(`positions.${index}.percentage`, position.percentage / percentageMultiply || 0);

            trigger(`positions.${index}.unitId`);
            trigger(`positions.${index}.percentage`);
        },
        [user],
    );

    const onFormSubmit = handleSubmit(async (data) => {
        await toDecree(data);
        reset(defaultValues);
        return router.user(user.id);
    });

    const organizationUnits = useMemo(() => user.supplementalPositions.map((p) => p.organizationUnit), [user]);

    const rootRef = useRef<HTMLDivElement>(null);
    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <FormProvider {...methods}>
                    <form onSubmit={onFormSubmit}>
                        <div className={s.Header}>
                            <Text as="h2">{tr('Create decree')}</Text>
                            <UserFormFormActions
                                submitDisabled={isSubmitting || isSubmitSuccessful}
                                onCancel={() => router.user(user.id)}
                                onReset={() => reset(defaultValues)}
                            />
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type="internal"
                                    className={s.FormBlock}
                                    id="personal-data"
                                    readOnly={personalInfoReadOnly}
                                />

                                <UserFormPositionsBlock
                                    className={s.FormBlock}
                                    id="registration"
                                    organizationUnits={organizationUnits}
                                    onChange={onOrganizationChange}
                                />
                            </div>

                            <NavMenu
                                active={activeId}
                                onClick={onClick}
                                navMenu={[
                                    {
                                        title: tr('Personal data'),
                                        id: 'personal-data',
                                    },
                                    {
                                        title: tr('Registration'),
                                        id: 'registration',
                                    },
                                ]}
                            />
                        </div>
                    </form>
                </FormProvider>
            </div>
        </LayoutMain>
    );
};

interface ToDecreeRequestPageProps {
    userId: string;
}

export const ToDecreeRequestPage: FC<ToDecreeRequestPageProps> = ({ userId }) => {
    const { data: user } = trpc.user.getById.useQuery(userId, {
        enabled: Boolean(userId),
    });

    if (!user) {
        return null;
    }

    return <ToDecreeRequestForm user={user} />;
};
