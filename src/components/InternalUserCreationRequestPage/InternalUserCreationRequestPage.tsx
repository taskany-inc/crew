import { useEffect, useRef, useState, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { debounce } from 'throttle-debounce';
import { nullable } from '@taskany/bricks';
import { UserCreationRequestStatus } from 'prisma/prisma-client';

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
import { trpc } from '../../trpc/trpcClient';
import { UserFormTeamBlock } from '../UserFormTeamBlock/UserFormTeamBlock';
import { UserFormCommentsBlock } from '../UserFormCommentsBlock/UserFormCommentsBlock';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';

import s from './InternalUserCreationRequestPage.module.css';
import { tr } from './InternalUserCreationRequestPage.i18n';

interface InternalUserCreationRequestPageProps {
    request?: CreateUserCreationRequestInternalEmployee;
    requestId?: string;
    requestStatus?: UserCreationRequestStatus;
    type?: 'new' | 'readOnly' | 'edit';
}

export const InternalUserCreationRequestPage = ({
    requestId,
    type = 'new',
    requestStatus,
    request,
}: InternalUserCreationRequestPageProps) => {
    const { createUserCreationRequest, editUserCreationRequest } = useUserCreationRequestMutations();

    const defaultValues: Partial<CreateUserCreationRequestInternalEmployee> = useMemo(
        () => ({
            type: 'internalEmployee',
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
        }),
        [request],
    );

    const router = useRouter();

    const methods = useForm<CreateUserCreationRequestInternalEmployee>({
        resolver: zodResolver(getCreateUserCreationRequestInternalEmployeeSchema()),
        defaultValues,
    });

    const {
        handleSubmit,
        watch,
        reset,
        setError,
        trigger,
        getValues,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const [isLoginUniqueQuery, setIsLoginUniqueQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    const isLoginUnique = trpc.user.isLoginUnique.useQuery(isLoginUniqueQuery, {
        enabled: isLoginUniqueQuery.length > 1,
    });

    useEffect(() => {
        if (getValues('login') && isLoginUnique.data === false && getValues('login') !== request?.login) {
            setError('login', { message: tr('User with login already exist') });
        } else if (getValues('login')) trigger('login');
    }, [isLoginUnique.data, setError, trigger, getValues, request?.login]);

    const debouncedLoginSearchHandler = debounce(300, setIsLoginUniqueQuery);

    const onFormSubmit = handleSubmit(async (data) => {
        if (!watch('personalEmail') && !watch('workEmail')) {
            setError('personalEmail', { message: tr('Enter Email') });
            setError('workEmail', { message: tr('Enter Email') });
            return;
        }

        if (isLoginUnique.data === false && data.login !== request?.login) {
            setError('login', { message: tr('User with login already exist') });
            return;
        }

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
                                    onIsLoginUniqueChange={debouncedLoginSearchHandler}
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

                                <UserFormWorkSpaceBlock
                                    readOnly={type === 'readOnly'}
                                    id="work-space"
                                    className={s.FormBlock}
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
