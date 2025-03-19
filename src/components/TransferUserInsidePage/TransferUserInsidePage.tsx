import { useRef, useMemo, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { CreateTransferInside, createTransferInsideSchema } from '../../modules/userCreationRequestSchemas';
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
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { UserCreationRequestStatus } from '../../generated/kyselyTypes';
import { UserFormWorkSpaceBlock } from '../UserFormWorkSpaceBlock/UserFormWorkSpaceBlock';
import { UserFormTransferToForm } from '../UserFormTransferToForm/UserFormTransferToForm';

import s from './TransferUserInsidePage.module.css';
import { tr } from './TransferUserInsidePage.i18n';

interface TransferUserInsidePageProps {
    user: User;
    request?: CreateTransferInside;
    requestId?: string;
    phone?: string;
    type?: 'new' | 'readOnly' | 'edit';
    userDevices: UserDevices;
    personalEmail?: string;
    workEmail?: string;
    requestStatus?: UserCreationRequestStatus;
}

export const TransferUserInsidePage = ({
    requestId,
    user,
    type = 'new',
    phone,
    request,
    workEmail,
    personalEmail,
    requestStatus,
}: TransferUserInsidePageProps) => {
    const { createTransferInsideRequest } = useUserCreationRequestMutations();

    const orgMembership = user?.memberships.find((m) => m.group.organizational);

    const [surname = '', firstName = '', middleName = ''] = (user.name ?? '').split(' ');

    const mainPosition = user.supplementalPositions.find((s) => s.main && s.status === 'ACTIVE');

    const defaultValues: Partial<CreateTransferInside> = useMemo(
        () => ({
            type: UserCreationRequestType.transferInside,
            disableAccount: request?.disableAccount,
            userId: user.id,
            email: user.email,
            login: user.login || '',
            title: request?.title || orgMembership?.roles.map(({ name }) => name).join(', ') || user.title || undefined,
            groupId: request?.groupId || orgMembership?.groupId,
            surname,
            firstName,
            middleName,
            percentage:
                request?.percentage || (mainPosition?.percentage ? mainPosition.percentage / percentageMultiply : 1),
            comment: request?.comment || '',
            workSpace: request?.workSpace || '',
            phone: request?.phone || phone,
            workEmail: request?.workEmail || workEmail,
            personalEmail: request?.personalEmail || personalEmail,
            corporateEmail: request?.corporateEmail || user.email,
            location: request?.location || user.location?.name,
            unitId: request?.unitId || mainPosition?.unitId || '',
            supervisorId: request?.supervisorId || user.supervisorId || undefined,
            workMode: request?.workMode || '',
            organizationUnitId: request?.organizationUnitId || mainPosition?.organizationUnitId || '',
            lineManagerIds: request?.lineManagerIds || [],
            date: request?.date || null,
            coordinatorIds: request?.coordinatorIds || [],
            supplementalPositions:
                request?.supplementalPositions ||
                user.supplementalPositions
                    .filter((s) => !s.main && s.status !== 'FIRED')
                    .map((s) => ({
                        organizationUnitId: s.organizationUnitId,
                        percentage: s.percentage / percentageMultiply,
                        unitId: s.unitId || undefined,
                    })),
            equipment: request?.equipment,
            extraEquipment: request?.extraEquipment,
            transferToDate: request?.transferToDate,
            transferToGroupId: request?.transferToGroupId,
            transferToOrganizationUnitId: request?.transferToOrganizationUnitId,
            transferToPercentage: request?.transferToPercentage,
            transferToSupervisorId: request?.transferToSupervisorId,
            transferToSupplementalPositions: request?.transferToSupplementalPositions || [],
            transferToTitle: request?.transferToTitle,
            transferToUnitId: request?.transferToUnitId,
        }),
        [request],
    );

    const router = useRouter();

    const rootRef = useRef<HTMLDivElement>(null);

    const methods = useForm<CreateTransferInside>({
        resolver: zodResolver(createTransferInsideSchema()),
        defaultValues,
    });

    const {
        handleSubmit,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    useEffect(() => reset(defaultValues), []);

    const onFormSubmit = handleSubmit(async (data) => {
        await createTransferInsideRequest(data);

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
        workEmail: !!defaultValues.workEmail || type === 'readOnly',
        personalEmail: !!defaultValues.personalEmail || type === 'readOnly',
        phone: !!phone || type === 'readOnly',
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <FormProvider {...methods}>
                    <form onSubmit={onFormSubmit}>
                        <div className={s.Header}>
                            <Text as="h2">
                                {type === 'new'
                                    ? tr('Create a planned transfer of employee')
                                    : tr('Request for a planned transfer of employee')}
                            </Text>
                            {nullable(
                                type === 'readOnly' && requestId,
                                (requestId) => {
                                    return (
                                        <RequestFormActions
                                            requestStatus={requestStatus}
                                            requestType={UserCreationRequestType.transferInternToStaff}
                                            requestId={requestId}
                                            onEdit={() => router.editTransferInternToStaff(requestId)}
                                        />
                                    );
                                },
                                <UserFormFormActions
                                    submitDisabled={isSubmitting || isSubmitSuccessful}
                                    onCancel={() => (type === 'new' ? router.user(user.id) : router.userRequests)}
                                    onReset={type === 'new' ? () => reset(defaultValues) : undefined}
                                />,
                            )}
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type={UserCreationRequestType.transferInside}
                                    readOnly={personalInfoReadOnly}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <UserFormRegistrationBlock
                                    edit={type === 'edit'}
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="registration"
                                    type={UserCreationRequestType.transferInside}
                                />

                                <UserFormTeamBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="team"
                                    userId={user.id}
                                    type={UserCreationRequestType.transferInside}
                                    requestId={requestId}
                                />

                                <UserFormWorkSpaceBlock
                                    type={type}
                                    className={s.FormBlock}
                                    id="work-space"
                                    requestId={requestId}
                                    requestType={UserCreationRequestType.transferInside}
                                />

                                <UserFormTransferToForm
                                    edit={type === 'edit'}
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="transfer"
                                    excludedUsers={[user.id]}
                                />

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
