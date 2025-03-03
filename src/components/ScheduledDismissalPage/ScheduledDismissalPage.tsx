import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef } from 'react';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { AdditionalDevice } from '../../modules/scheduledDeactivationTypes';
import {
    CreateScheduledDeactivation,
    createScheduledDeactivationSchema,
} from '../../modules/scheduledDeactivationSchemas';
import { useScheduledDeactivation } from '../../modules/scheduledDeactivationHooks';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { useSpyNav } from '../../hooks/useSpyNav';
import { NavMenu } from '../NavMenu/NavMenu';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { UserFormTeamBlock } from '../UserFormTeamBlock/UserFormTeamBlock';
import { UserFormCommentsBlock } from '../UserFormCommentsBlock/UserFormCommentsBlock';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { useRouter } from '../../hooks/useRouter';
import { UserFormSupplementalPositionsBlock } from '../UserFormSupplementalPositionsBlock/UserFormSupplementalPositionsBlock';
import { ScheduledDeactivation, User, UserDevices } from '../../trpc/inferredTypes';
import { percentageMultiply } from '../../utils/suplementPosition';
import { UserFormDevicesBlock } from '../UserFormDevicesBlock/UserFormDevicesBlock';
import { UserFormWorkSpaceDismissalFormBlock } from '../UserFormWorkSpaceDismissalFormBlock/UserFormWorkSpaceDismissalFormBlock';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { UserFormNewOrganizationTransfer } from '../UserFormNewOrganizationTransfer/UserFormNewOrganizationTransfer';

import { tr } from './ScheduledDismissalPage.i18n';
import s from './ScheduledDismissalPage.module.css';

interface ScheduledDismissalPageProps {
    user: User;
    userDevices: UserDevices;
    personalEmail?: string;
    workEmail?: string;
    phone?: string;
    type?: 'new' | 'edit' | 'readOnly';
    scheduledDeactivation?: ScheduledDeactivation;
    transfer?: boolean;
}

export const ScheduledDismissalPage = ({
    user,
    type = 'new',
    phone,
    userDevices,
    personalEmail,
    workEmail,
    scheduledDeactivation,
    transfer,
}: ScheduledDismissalPageProps) => {
    const { createScheduledDeactivation, editScheduledDeactivation } = useScheduledDeactivation();

    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);

    const mainSupplementalPosition =
        type === 'new'
            ? user.supplementalPositions.find((s) => s.main && s.status === 'ACTIVE')
            : scheduledDeactivation?.supplementalPositions.find((s) => s.main);

    const supplementalPositions: Array<{
        id: string;
        organizationUnitId: string;
        percentage: number;
        unitId?: string;
        workEndDate?: Date | null;
    }> = [];

    supplementalPositions.push({
        id: mainSupplementalPosition?.id || '',
        organizationUnitId: mainSupplementalPosition?.organizationUnitId || '',
        percentage:
            mainSupplementalPosition?.percentage && !Number.isNaN(mainSupplementalPosition.percentage)
                ? mainSupplementalPosition.percentage / percentageMultiply
                : 1,
        unitId: mainSupplementalPosition?.unitId || undefined,
        workEndDate: mainSupplementalPosition?.workEndDate,
    });

    scheduledDeactivation
        ? supplementalPositions.push(
              ...scheduledDeactivation.supplementalPositions
                  .filter((s) => !s.main)
                  .map(({ percentage, organizationUnitId, unitId, workEndDate, id }) => ({
                      id,
                      organizationUnitId,
                      percentage: percentage / percentageMultiply,
                      unitId: unitId || undefined,
                      workEndDate,
                  })),
          )
        : supplementalPositions.push(
              ...user.supplementalPositions
                  .filter((s) => s.status === 'ACTIVE' && !s.main)
                  .map(({ percentage, organizationUnitId, unitId, workEndDate, id }) => ({
                      id,
                      organizationUnitId,
                      percentage: percentage / percentageMultiply,
                      unitId: unitId || undefined,
                      workEndDate,
                  })),
          );

    const orgMembership = user?.memberships.find((m) => m.group.organizational);

    const initTestingDevices: AdditionalDevice[] = scheduledDeactivation?.testingDevices
        ? (scheduledDeactivation.testingDevices as Record<'name' | 'id', string>[])
        : userDevices.map((device) => ({ name: device.deviceName, id: device.deviceId }));

    const initDevices: AdditionalDevice[] = (scheduledDeactivation?.devices &&
        (scheduledDeactivation.devices as Record<'name' | 'id', string>[])) || [{ name: '', id: '' }];

    const [surname = '', firstName = '', middleName = ''] = (user.name ?? '').split(' ');

    const defaultValues: Partial<CreateScheduledDeactivation> = useMemo(
        () => ({
            type: transfer ? 'transfer' : 'retirement',
            userId: user.id,
            email: user.email,
            login: user.login,
            title:
                orgMembership?.roles.map(({ name }) => name).join(', ') ||
                user.title ||
                mainSupplementalPosition?.role ||
                undefined,
            groupId: orgMembership?.groupId,
            surname,
            firstName,
            middleName,
            deactivateDate: scheduledDeactivation?.deactivateDate || undefined,
            corporateEmail: scheduledDeactivation?.email || user?.email,
            supervisorId: scheduledDeactivation?.teamLeadId || user?.supervisor?.id || undefined,
            coordinatorIds: scheduledDeactivation?.coordinatorIds || [],
            phone,
            workMode: scheduledDeactivation?.workMode || undefined,
            workSpace: scheduledDeactivation?.workPlace || undefined,
            comment: scheduledDeactivation?.comments || undefined,
            location: scheduledDeactivation?.location || user?.location?.name || undefined,
            devices: initDevices,
            testingDevices: initTestingDevices,
            disableAccount: scheduledDeactivation?.disableAccount ?? true,
            supplementalPositions,
            personalEmail,
            workEmail,
            lineManagerIds: scheduledDeactivation?.lineManagerIds || [],
            applicationForReturnOfEquipment: scheduledDeactivation?.applicationForReturnOfEquipment || undefined,
            newOrganizationUnitId: scheduledDeactivation?.newOrganizationUnitId || undefined,
            newOrganizationRole: scheduledDeactivation?.newOrganizationRole || undefined,
            newTeamLead: scheduledDeactivation?.newTeamLead || undefined,
            newOrganizationalGroup: scheduledDeactivation?.newOrganizationalGroup || undefined,
        }),
        [
            mainSupplementalPosition?.organizationUnitId,
            mainSupplementalPosition?.role,
            user,
            scheduledDeactivation,
            firstName,
            middleName,
            orgMembership,
            personalEmail,
            phone,
            supplementalPositions,
            surname,
            workEmail,
            initDevices,
            initTestingDevices,
        ],
    );

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

    const methods = useForm<CreateScheduledDeactivation>({
        resolver: zodResolver(createScheduledDeactivationSchema()),
        defaultValues,
    });

    const {
        handleSubmit,
        reset,
        setValue,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    useEffect(() => reset(defaultValues), []);

    useEffect(() => {
        setValue(
            'testingDevices',
            userDevices.map((d) => ({ id: d.deviceId, name: d.deviceName })),
        );
        phone && setValue('phone', phone);
        workEmail && setValue('workEmail', workEmail);
        personalEmail && setValue('personalEmail', personalEmail);
    }, [userDevices, phone, workEmail, personalEmail, setValue]);

    const onSubmit = handleSubmit(async (data) => {
        scheduledDeactivation
            ? await editScheduledDeactivation({
                  id: scheduledDeactivation.id,
                  ...data,
                  workEmail: data.workEmail === tr('Not specified') ? undefined : data.workEmail,
              })
            : await createScheduledDeactivation(data);
        return router.scheduledDeactivations();
    });

    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    const readOnly = type !== 'edit' && !!scheduledDeactivation;

    const title = transfer ? tr('Create a planned transfer of employee') : tr('Create a planned dismissal of employee');

    const navMenu = useMemo(() => {
        const navMenuInit = [
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
                title: tr('Comments'),
                id: 'comments',
            },
        ];

        if (!transfer) return navMenuInit;

        navMenuInit.splice(navMenuInit.length - 1, 0, { id: 'new-organization', title: tr('Transfer') });
        return navMenuInit;
    }, [transfer]);

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <FormProvider {...methods}>
                    <form onSubmit={onSubmit}>
                        <div className={s.Header}>
                            <Text as="h2">{title}</Text>
                            {nullable(
                                type !== 'edit' && scheduledDeactivation,
                                (s) => (
                                    <RequestFormActions
                                        requestType="deactivation"
                                        requestId={s.id}
                                        onEdit={() =>
                                            transfer ? router.userTransferEdit(s.id) : router.userDismissEdit(s.id)
                                        }
                                        onCancel={router.scheduledDeactivations}
                                    />
                                ),
                                <UserFormFormActions
                                    cancelConfirmation={type === 'new' ? tr('cancel confirmation') : undefined}
                                    submitDisabled={isSubmitting || isSubmitSuccessful}
                                    onCancel={() =>
                                        type === 'new' ? router.user(user.id) : router.scheduledDeactivations()
                                    }
                                    onReset={type === 'new' ? () => reset(defaultValues) : undefined}
                                />,
                            )}
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type="dismissal"
                                    readOnly={readOnly ? true : personalInfoReadOnly}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <UserFormSupplementalPositionsBlock
                                    id="registration"
                                    className={s.FormBlock}
                                    readOnly={readOnly}
                                    edit={!!scheduledDeactivation}
                                    workEndDateTitle={transfer ? tr('Transfer date') : tr('Dismsissal date')}
                                />

                                <UserFormTeamBlock
                                    userId={user.id}
                                    readOnly={readOnly}
                                    className={s.FormBlock}
                                    id="team"
                                    type={transfer ? 'transfer' : 'dismissal'}
                                    defaultGroupId={defaultValues.groupId}
                                />

                                <UserFormWorkSpaceDismissalFormBlock
                                    type={type}
                                    id="work-space"
                                    className={s.FormBlock}
                                    requestId={scheduledDeactivation?.id}
                                    requestType={transfer ? 'transfer' : 'dismiss'}
                                />

                                <UserFormDevicesBlock className={s.FormBlock} readOnly={readOnly} />

                                {nullable(transfer, () => (
                                    <UserFormNewOrganizationTransfer
                                        readOnly={type === 'readOnly'}
                                        className={s.FormBlock}
                                        id="new-organization"
                                    />
                                ))}

                                <UserFormCommentsBlock readOnly={readOnly} id="comments" className={s.FormBlock} />
                            </div>

                            <NavMenu active={activeId} onClick={onClick} navMenu={navMenu} />
                        </div>
                    </form>
                </FormProvider>
            </div>
        </LayoutMain>
    );
};
