import { ComponentProps, FC, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'prisma/prisma-client';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

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
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { userDecreeSchema, UserDecreeSchema } from '../../modules/userCreationRequestSchemas';
import { percentageMultiply } from '../../utils/suplementPosition';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';
import { UserFormRegistrationBlock } from '../UserFormRegistrationBlock/UserFormRegistrationBlock';

import s from './DecreeForm.module.css';
import { tr } from './DecreeForm.i18n';

interface DecreeFormProps {
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
    type: 'toDecree' | 'fromDecree';
    onSubmit: (data: UserDecreeSchema) => Promise<void>;
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

export const DecreeForm: FC<DecreeFormProps> = ({ user, type, onSubmit }) => {
    const router = useRouter();

    const [positions, organizationUnits] = useMemo(() => {
        const positions = user.supplementalPositions.filter((p) => {
            if (type === 'toDecree') {
                return p.status === 'ACTIVE';
            }
            return p.status !== 'ACTIVE';
        });

        const organizationUnits = positions.map((p) => p.organizationUnit);

        return [positions, organizationUnits];
    }, [user, type]);

    const role = positions[0]?.role ?? '';

    const defaultValues: Partial<UserDecreeSchema> = useMemo(() => {
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

        return {
            type,
            userTargetId: user.id,
            surname,
            firstName,
            middleName,
            phone,
            personalEmail,
            percentage: 1,
            login: user.login ?? '',
            title: role,
            workEmail: user.email ?? '',
            email: user.email,
        };
    }, [user, role, type]);

    const methods = useForm<UserDecreeSchema>({
        resolver: zodResolver(userDecreeSchema),
        defaultValues,
    });

    const {
        handleSubmit,
        setValue,
        trigger,
        watch,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const organizationUnitId = watch('organizationUnitId');
    const firedOrganizationUnitId = watch('firedOrganizationUnitId');
    const supplementalPositionsOrganizationUnitId = watch('supplementalPositions.0.organizationUnitId');

    const setOrgUnit = (orgId: string, target: 'main' | 'supplemental') => {
        const position = user.supplementalPositions.find(
            (item) =>
                item.organizationUnitId === orgId &&
                (type === 'toDecree' ? item.status === 'ACTIVE' : item.status !== 'ACTIVE'),
        );

        if (!position) {
            return;
        }

        const key = target === 'main' ? '' : 'supplementalPositions.0.';

        setValue(`${key}unitId`, position.unitId ?? '');
        setValue(`${key}percentage`, position.percentage / percentageMultiply || 0);

        trigger(`${key}unitId`);
        trigger(`${key}percentage`);
    };

    const onOrganistaionUnitChange = (orgId: string) => {
        if (firedOrganizationUnitId === orgId) {
            setValue('firedOrganizationUnitId', '');
            trigger('firedOrganizationUnitId');
        }
        if (supplementalPositionsOrganizationUnitId === orgId) {
            setValue('supplementalPositions.0.organizationUnitId', '');
            trigger('supplementalPositions.0.organizationUnitId');
        }

        setOrgUnit(orgId, 'main');
    };

    const onFiredOrganizationUnitChange = (orgId: string) => {
        if (organizationUnitId === orgId) {
            setValue('organizationUnitId', '');
            trigger('organizationUnitId');
        }
        if (supplementalPositionsOrganizationUnitId === orgId) {
            setValue('supplementalPositions.0.organizationUnitId', '');
            trigger('supplementalPositions.0.organizationUnitId');
        }
    };

    const onSuplementalPositionUnitChange = (orgId: string) => {
        if (firedOrganizationUnitId === orgId) {
            setValue('firedOrganizationUnitId', '');
            trigger('firedOrganizationUnitId');
        }
        if (organizationUnitId === orgId) {
            setValue('organizationUnitId', '');
            trigger('organizationUnitId');
        }

        setOrgUnit(orgId, 'supplemental');
    };

    const onFormSubmit = handleSubmit(onSubmit);

    const rootRef = useRef<HTMLDivElement>(null);
    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    return (
        <FormProvider {...methods}>
            <form onSubmit={onFormSubmit}>
                <div className={s.Header}>
                    <Text as="h2">
                        {nullable(type === 'toDecree', () => tr('Create decree'), tr('Exit from decree'))}
                    </Text>
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

                        <UserFormRegistrationBlock
                            className={s.FormBlock}
                            organizationUnits={organizationUnits}
                            onOrganistaionUnitChange={onOrganistaionUnitChange}
                            onFiredOrganizationUnitChange={onFiredOrganizationUnitChange}
                            onSupplementalOrganistaionUnitChange={onSuplementalPositionUnitChange}
                            id="registration"
                            type={type}
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
    );
};
