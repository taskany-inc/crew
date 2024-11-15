import { ComponentProps, FC, useCallback, useMemo, useRef } from 'react';
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
import { DecreeSchema, decreeSchema } from '../../modules/userDecreeRequestSchemas';
import { UserFormPositionsBlock } from '../UserFormPositionsBlock/UserFormPositionsBlock';
import { percentageMultiply } from '../../utils/suplementPosition';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';

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
    type: 'from' | 'to';
    onSubmit: (data: DecreeSchema) => Promise<void>;
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
            if (type === 'to') {
                return p.status === 'ACTIVE';
            }
            return p.status !== 'ACTIVE';
        });

        const organizationUnits = positions.map((p) => p.organizationUnit);

        return [positions, organizationUnits];
    }, [user, type]);

    const role = positions[0]?.role ?? '';

    const defaultValues: Partial<DecreeSchema> = useMemo(() => {
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
    }, [user, role]);

    const methods = useForm<DecreeSchema>({
        resolver: zodResolver(decreeSchema),
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
                (item) =>
                    item.organizationUnitId === organizationUnitId &&
                    (type === 'to' ? item.status === 'ACTIVE' : item.status !== 'ACTIVE'),
            );

            if (!position || index < 0) {
                return;
            }

            setValue(`positions.${index}.unitId`, position.unitId ?? '');
            setValue(`positions.${index}.percentage`, position.percentage / percentageMultiply || 0);

            trigger(`positions.${index}.unitId`);
            trigger(`positions.${index}.percentage`);
        },
        [user, type, setValue, trigger],
    );

    const onFormSubmit = handleSubmit(onSubmit);

    const rootRef = useRef<HTMLDivElement>(null);
    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    return (
        <FormProvider {...methods}>
            <form onSubmit={onFormSubmit}>
                <div className={s.Header}>
                    <Text as="h2">{nullable(type === 'to', () => tr('Create decree'), tr('Exit from decree'))}</Text>
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
                            firedUnitEnable={type === 'to'}
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
    );
};
