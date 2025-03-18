import { useRef, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { UserCreationRequestStatus } from 'prisma/prisma-client';
import { z } from 'zod';

import {
    CreateUserCreationRequestInternalEmployee,
    getCreateUserCreationRequestInternalEmployeeSchema,
} from '../../modules/userCreationRequestSchemas';
import { UserFormRegistrationBlock } from '../UserFormRegistrationBlock/UserFormRegistrationBlock';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { UserFormWorkSpaceBlock } from '../UserFormWorkSpaceBlock/UserFormWorkSpaceBlock';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { useRouter } from '../../hooks/useRouter';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';
import { UserFormTeamBlock } from '../UserFormTeamBlock/UserFormTeamBlock';
import { UserFormCommentsBlock } from '../UserFormCommentsBlock/UserFormCommentsBlock';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { useUserMutations } from '../../modules/userHooks';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import s from './InternalUserCreationRequestPage.module.css';
import { tr } from './InternalUserCreationRequestPage.i18n';

interface InternalUserCreationRequestPageProps {
    request?: CreateUserCreationRequestInternalEmployee;
    requestId?: string;
    requestStatus?: UserCreationRequestStatus;
    type?: 'new' | 'readOnly' | 'edit';
}

const internalUserRequestSchema = (isloginUnique: (login: string) => Promise<boolean>, editFormLogin?: string) =>
    getCreateUserCreationRequestInternalEmployeeSchema()
        .refine(({ workEmail, personalEmail }) => workEmail !== '' || personalEmail !== '', {
            message: tr('Enter Email'),
            path: ['workEmail'],
        })
        .refine(({ workEmail, personalEmail }) => workEmail !== '' || personalEmail !== '', {
            message: tr('Enter Email'),
            path: ['personalEmail'],
        })
        .superRefine(async ({ login, status, equipment, workMode }, ctx) => {
            if (status !== UserCreationRequestStatus.Draft) {
                if (equipment === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr('Required field'),
                        path: ['equipment'],
                    });
                }

                if (workMode === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: tr('Required field'),
                        path: ['workMode'],
                    });
                }
            }

            if (login === editFormLogin) return;

            const unique = await isloginUnique(login);
            if (!unique) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: tr('User with login already exist'),
                    path: ['login'],
                });
            }
        });

export const InternalUserCreationRequestPage = ({
    requestId,
    type = 'new',
    requestStatus,
    request,
}: InternalUserCreationRequestPageProps) => {
    const { createUserCreationRequest, editUserCreationRequest } = useUserCreationRequestMutations();

    const defaultValues: Partial<CreateUserCreationRequestInternalEmployee> = useMemo(
        () => ({
            type: UserCreationRequestType.internalEmployee,
            status: request?.status,
            creationCause: request?.creationCause || 'start',
            percentage: request ? request?.percentage : 1,
            surname: request?.surname || '',
            firstName: request?.firstName || '',
            middleName: request?.middleName || '',
            login: request?.login || '',
            comment: request?.comment || '',
            workSpace: request?.workSpace || '',
            phone: request?.phone || '',
            email: request?.email || '',
            workEmail: request?.workEmail || '',
            personalEmail: request?.personalEmail || '',
            corporateEmail: request?.corporateEmail || '',
            workModeComment: request?.workModeComment || '',
            equipment: request?.equipment || '',
            extraEquipment: request?.extraEquipment || '',
            location: request?.location || '',
            unitId: request?.unitId || '',
            title: request?.title || '',
            supervisorId: request?.supervisorId || '',
            recruiterId: request?.recruiterId || '',
            buddyId: request?.buddyId || '',
            workMode: request?.workMode || '',
            organizationUnitId: request?.organizationUnitId || '',
            lineManagerIds: request?.lineManagerIds || [],
            coordinatorIds: request?.coordinatorIds || [],
            date: request?.date || null,
            groupId: request?.groupId || '',
            supplementalPositions: request?.supplementalPositions || [],
            intern: !!request?.intern,
            transferFromGroup: request?.transferFromGroup,
            createExternalAccount: true,
        }),
        [request],
    );

    const router = useRouter();

    const rootRef = useRef<HTMLDivElement>(null);

    const { isLoginUnique } = useUserMutations();

    const methods = useForm<CreateUserCreationRequestInternalEmployee>({
        resolver: zodResolver(internalUserRequestSchema(isLoginUnique, request?.login)),
        defaultValues,
    });

    const {
        handleSubmit,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const onFormSubmit = handleSubmit(async (data) => {
        if (type === 'edit' && requestId) {
            await editUserCreationRequest({ id: requestId, data });
            return router.userRequests();
        }

        await createUserCreationRequest(data);
        reset(defaultValues);
        return router.userRequests();
    });

    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

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
                            {nullable(
                                type === 'readOnly' && requestId,
                                (requestId) => (
                                    <RequestFormActions
                                        requestStatus={requestStatus}
                                        requestType={UserCreationRequestType.internalEmployee}
                                        requestId={requestId}
                                        onDecide={router.userRequests}
                                        onEdit={() => router.internalUserRequestEdit(requestId)}
                                    />
                                ),
                                <UserFormFormActions
                                    submitDisabled={isSubmitting || isSubmitSuccessful}
                                    onCancel={router.userRequests}
                                    onReset={type === 'new' ? () => reset(defaultValues) : undefined}
                                />,
                            )}
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type="internal"
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <UserFormRegistrationBlock
                                    edit={type === 'edit'}
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="registration"
                                    type="internal"
                                />

                                <UserFormTeamBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="team"
                                    type="internal"
                                />

                                <UserFormWorkSpaceBlock type={type} id="work-space" className={s.FormBlock} />

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
