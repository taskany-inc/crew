import { useRef, useMemo, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { OrganizationUnit } from 'prisma/prisma-client';

import { TransferInternToStaff, transferInternToStaffSchema } from '../../modules/userCreationRequestSchemas';
import { UserFormRegistrationBlock } from '../UserFormRegistrationBlock/UserFormRegistrationBlock';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { useRouter } from '../../hooks/useRouter';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';
import { UserFormTeamBlock } from '../UserFormTeamBlock/UserFormTeamBlock';
import { UserFormCommentsBlock } from '../UserFormCommentsBlock/UserFormCommentsBlock';
import { User, UserDevices } from '../../trpc/inferredTypes';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';
import { percentageMultiply } from '../../utils/suplementPosition';
import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { UserFormWorkSpaceDismissalFormBlock } from '../UserFormWorkSpaceDismissalFormBlock/UserFormWorkSpaceDismissalFormBlock';
import { UserFormDevicesBlock } from '../UserFormDevicesBlock/UserFormDevicesBlock';
import { AdditionalDevice } from '../../modules/scheduledDeactivationTypes';
import { Nullish } from '../../utils/types';

import s from './TransferInternToStaffPage.module.css';
import { tr } from './TransferInternToStaffPage.i18n';

interface TransferInternToStaffPageProps {
    user: User;
    request?: TransferInternToStaff;
    requestId?: string;
    phone?: string;
    type?: 'new' | 'readOnly' | 'edit';
    userDevices: UserDevices;
}

export const TransferInternToStaffPage = ({
    requestId,
    user,
    type = 'new',
    userDevices,
    phone,
    request,
}: TransferInternToStaffPageProps) => {
    const { createTransferInternToStaffRequest } = useUserCreationRequestMutations();

    const orgMembership = user?.memberships.find((m) => m.group.organizational);

    const initTestingDevices: AdditionalDevice[] = request?.testingDevices
        ? (request.testingDevices as Record<'name' | 'id', string>[])
        : userDevices.map((device) => ({ name: device.deviceName, id: device.deviceId }));

    const initDevices: AdditionalDevice[] = (request?.devices &&
        (request.devices as Record<'name' | 'id', string>[])) || [{ name: '', id: '' }];

    const [surname = '', firstName = '', middleName = ''] = (user.name ?? '').split(' ');

    const mainPosition = user.supplementalPositions.find((s) => s.main && s.status !== 'FIRED');

    const defaultValues: Partial<TransferInternToStaff> = useMemo(
        () => ({
            type: UserCreationRequestType.transferInternToStaff,
            userId: user.id,
            email: user.email,
            login: user.login || '',
            title: orgMembership?.roles.map(({ name }) => name).join(', ') || user.title || undefined,
            groupId: request?.groupId || orgMembership?.groupId,
            surname,
            firstName,
            middleName,
            percentage:
                request?.percentage || (mainPosition?.percentage ? mainPosition.percentage * percentageMultiply : 1),
            comment: request?.comment || '',
            workSpace: request?.workSpace || '',
            phone: request?.phone || phone,
            workEmail: request?.workEmail || '',
            personalEmail: request?.personalEmail || '',
            corporateEmail: request?.corporateEmail || '',
            location: request?.location || user.location?.name,
            unitId: request?.unitId || mainPosition?.unitId || '',
            supervisorId: request?.supervisorId || user.supervisorId || undefined,
            workMode: request?.workMode || '',
            organizationUnitId: request?.organizationUnitId || '',
            lineManagerIds: request?.lineManagerIds || [],
            date: request?.date || null,
            supplementalPositions:
                request?.supplementalPositions ??
                user.supplementalPositions
                    .filter((s) => !s.main && s.status !== 'FIRED')
                    .map((s) => ({
                        organizationUnitId: s.organizationUnitId,
                        percentage: s.percentage * percentageMultiply,
                        unitId: s.unitId || undefined,
                    })),
            applicationForReturnOfEquipment: request?.applicationForReturnOfEquipment,
            devices: initDevices,
            testingDevices: initTestingDevices,
            internshipOrganizationId: request?.internshipOrganizationId,
            internshipRole: request?.internshipRole,
            internshipOrganizationGroup: request?.internshipOrganizationGroup,
            internshipSupervisor: request?.internshipSupervisor,
        }),
        [request],
    );

    const router = useRouter();

    const rootRef = useRef<HTMLDivElement>(null);

    const methods = useForm<TransferInternToStaff>({
        resolver: zodResolver(transferInternToStaffSchema()),
        defaultValues,
    });

    const {
        handleSubmit,
        reset,
        watch,
        register,
        setValue,
        trigger,
        formState: { isSubmitting, isSubmitSuccessful, errors },
    } = methods;

    useEffect(() => reset(defaultValues), []);

    const onFormSubmit = handleSubmit(async (data) => {
        await createTransferInternToStaffRequest(data);
        reset(defaultValues);
        return router.userRequests();
    });

    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    const personalInfoReadOnly: React.ComponentProps<typeof UserFormPersonalDataBlock>['readOnly'] = {
        firstName: true,
        surname: true,
        middleName: true,
        login: true,
        corporateEmail: true,
        email: true,
        workEmail: !!defaultValues.workEmail,
        personalEmail: !!defaultValues.personalEmail,
        phone: !!phone,
        title: true,
    };

    const onInternshipOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        if (o) {
            setValue('internshipOrganizationId', o.id);
            trigger('internshipOrganizationId');
        }
    };

    const internshipRole = watch('internshipRole');
    const internshipOrganizationGroup = watch('internshipOrganizationGroup');
    const internshipSupervisor = watch('internshipSupervisor');

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <FormProvider {...methods}>
                    <form onSubmit={onFormSubmit}>
                        <div className={s.Header}>
                            <Text as="h2">
                                {type === 'new'
                                    ? tr('Create a planned newcommer')
                                    : tr('Request for a planned employee work start')}
                            </Text>
                            <UserFormFormActions
                                submitDisabled={isSubmitting || isSubmitSuccessful}
                                onCancel={router.userRequests}
                                onReset={type === 'new' ? () => reset(defaultValues) : undefined}
                            />
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type="transferInternToStaff"
                                    readOnly={personalInfoReadOnly}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <UserFormRegistrationBlock
                                    edit={type === 'edit'}
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="registration"
                                    type="transferInternToStaff"
                                />

                                <UserFormTeamBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="team"
                                    type="transferInternToStaff"
                                />

                                <UserFormWorkSpaceDismissalFormBlock
                                    type={type}
                                    id="work-space"
                                    className={s.FormBlock}
                                    requestId={requestId}
                                    requestType="transferInternToStaff"
                                />

                                <UserFormDevicesBlock className={s.FormBlock} readOnly={type === 'readOnly'} />

                                <div className={s.FormBlock} id="transfer">
                                    <Text className={s.SectionHeader} weight="bold" size="lg">
                                        {tr('Transfer')}
                                    </Text>

                                    <div className={s.TwoInputsRow}>
                                        <FormControl label={tr('Organization')} required>
                                            <OrganizationUnitComboBox
                                                readOnly={type === 'readOnly'}
                                                searchType="internal"
                                                organizationUnitId={watch('internshipOrganizationId')}
                                                onChange={onInternshipOrganizationChange}
                                                error={errors.internshipOrganizationId}
                                            />
                                        </FormControl>
                                        <FormControl label={tr('New role')} error={errors.internshipRole}>
                                            <FormControlInput
                                                readOnly={type === 'readOnly'}
                                                autoComplete="off"
                                                size="m"
                                                placeholder={tr('Write new role')}
                                                value={
                                                    type === 'readOnly' && !internshipRole
                                                        ? tr('Not specified')
                                                        : internshipRole
                                                }
                                                outline
                                                {...register('internshipRole')}
                                            />
                                        </FormControl>
                                        <FormControl
                                            label={tr('New organizational group')}
                                            error={errors.internshipOrganizationGroup}
                                        >
                                            <FormControlInput
                                                readOnly={type === 'readOnly'}
                                                autoComplete="off"
                                                size="m"
                                                placeholder={tr('Write new organizational group name')}
                                                value={
                                                    type === 'readOnly' && !internshipOrganizationGroup
                                                        ? tr('Not specified')
                                                        : internshipOrganizationGroup
                                                }
                                                outline
                                                {...register('internshipOrganizationGroup')}
                                            />
                                        </FormControl>
                                        <FormControl label={tr('New supervisor')} error={errors.internshipSupervisor}>
                                            <FormControlInput
                                                readOnly={type === 'readOnly'}
                                                autoComplete="off"
                                                size="m"
                                                placeholder={tr('Write new supervisor full name')}
                                                value={
                                                    type === 'readOnly' && !internshipSupervisor
                                                        ? tr('Not specified')
                                                        : internshipSupervisor
                                                }
                                                outline
                                                {...register('internshipSupervisor')}
                                            />
                                        </FormControl>
                                    </div>
                                </div>

                                <UserFormCommentsBlock
                                    readOnly={type === 'readOnly'}
                                    id="comments"
                                    className={s.FormBlock}
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
                                    {
                                        title: tr('Team'),
                                        id: 'team',
                                    },
                                    {
                                        title: tr('Work space'),
                                        id: 'work-space',
                                    },
                                    {
                                        title: tr('Transfer'),
                                        id: 'transfer',
                                    },
                                    {
                                        title: tr('Comments'),
                                        id: 'comments',
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
