import { useEffect, useRef, useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { debounce } from 'throttle-debounce';
import { UserCreationRequestStatus } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';

import {
    CreateUserCreationRequestexternalFromMainOrgEmployee,
    getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema,
} from '../../modules/userCreationRequestSchemas';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { useRouter } from '../../hooks/useRouter';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { NavMenu } from '../NavMenu/NavMenu';
import { trpc } from '../../trpc/trpcClient';
import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { config } from '../../config';
import { UserFormExternalTeamBlock } from '../UserFormExternalTeamBlock/UserFormExternalTeamBlock';
import { UserFormExternalExtraInfoBlock } from '../UserFormExternalExtraInfoBlock/UserFormExternalExtraInfoBlock';
import { useSpyNav } from '../../hooks/useSpyNav';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';

import s from './ExternalFromMainOrgUserCreationRequestPage.module.css';
import { tr } from './ExternalFromMainOrgUserCreationRequestPage.i18n';

interface ExternalUserCreationRequestPageProps {
    request?: CreateUserCreationRequestexternalFromMainOrgEmployee;
    type?: 'readOnly' | 'edit' | 'new';
    requestId?: string;
    requestStatus?: UserCreationRequestStatus;
}

export const ExternalFromMainOrgUserCreationRequestPage = ({
    request,
    type = 'new',
    requestId,
    requestStatus,
}: ExternalUserCreationRequestPageProps) => {
    const { createUserCreationRequest, editUserCreationRequest } = useUserCreationRequestMutations();

    const router = useRouter();

    const defaultValues: Partial<CreateUserCreationRequestexternalFromMainOrgEmployee> = useMemo(
        () => ({
            type: 'externalFromMainOrgEmployee',
            organizationUnitId: config.mainOrganizationId || '',
            surname: request?.surname || '',
            firstName: request?.firstName || '',
            middleName: request?.middleName || '',
            login: request?.login || '',
            createExternalAccount: true,
            phone: request?.phone || '',
            email: request?.email || '',
            workEmail: request?.workEmail || '',
            corporateEmail: request?.corporateEmail || '',
            curatorIds: request?.curatorIds || [],
            lineManagerIds: request?.lineManagerIds || [],
            title: request?.title || '',
            groupId: request?.groupId || '',
            permissionToServices: request?.permissionToServices || [],
            reason: request?.reason || '',
        }),
        [request],
    );

    const methods = useForm<CreateUserCreationRequestexternalFromMainOrgEmployee>({
        resolver: zodResolver(getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema()),
        defaultValues,
    });

    const rootRef = useRef<HTMLDivElement>(null);

    const {
        handleSubmit,
        reset,
        setError,
        trigger,
        getValues,
        watch,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const [isLoginUniqueQuery, setIsLoginUniqueQuery] = useState('');

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
        if (isLoginUnique.data === false && data.login !== request?.login) {
            setError('login', { message: tr('User with login already exist') });
            return;
        }

        if (type === 'edit' && requestId) {
            await editUserCreationRequest({ id: requestId, data });
            return router.accessCoordination();
        }

        await createUserCreationRequest(data);
        reset(defaultValues);
        return router.accessCoordination();
    });

    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <FormProvider {...methods}>
                    <form onSubmit={onFormSubmit}>
                        <div className={s.Header}>
                            <Text as="h2">
                                {tr('Create access to employee from {mainOrgName} (external)', {
                                    mainOrgName: config.mainOrganizationName || 'Main',
                                })}
                            </Text>
                            {nullable(
                                type === 'readOnly' && requestId,
                                (requestId) => (
                                    <RequestFormActions
                                        onEdit={() => router.externalUserFromMainOrgRequestEdit(requestId)}
                                        requestStatus={requestStatus}
                                        requestId={requestId}
                                        onDecide={router.accessCoordination}
                                    />
                                ),
                                <UserFormFormActions
                                    submitDisabled={isSubmitting || isSubmitSuccessful}
                                    onCancel={router.accessCoordination}
                                    onReset={type === 'new' ? () => reset(defaultValues) : undefined}
                                />,
                            )}
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    readOnly={type === 'readOnly'}
                                    type="externalFromMainOrgEmployee"
                                    onIsLoginUniqueChange={debouncedLoginSearchHandler}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <div className={s.FormBlock} id="registration">
                                    <Text className={s.SectionHeader} weight="bold" size="lg">
                                        {tr('Registration')}
                                    </Text>
                                    <div className={s.OrganizationCombobox}>
                                        <div className={s.TwoInputsRow}>
                                            <FormControl label={tr('Organization')} required>
                                                <OrganizationUnitComboBox
                                                    readOnly
                                                    organizationUnitId={watch('organizationUnitId')}
                                                />
                                            </FormControl>
                                        </div>
                                    </div>
                                </div>

                                <UserFormExternalTeamBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="team"
                                />

                                <UserFormExternalExtraInfoBlock
                                    readOnly={type === 'readOnly'}
                                    type="externalFromMain"
                                    className={s.FormBlock}
                                    id="extra-info"
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
                                        title: tr('Extra information'),
                                        id: 'extra-info',
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
