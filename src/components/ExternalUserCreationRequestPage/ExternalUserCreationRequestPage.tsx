import { useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { debounce } from 'throttle-debounce';
import { OrganizationUnit } from 'prisma/prisma-client';

import {
    CreateUserCreationRequestExternalEmployee,
    getCreateUserCreationRequestExternalEmployeeSchema,
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
import { UserFormExternalTeamBlock } from '../UserFormExternalTeamBlock/UserFormExternalTeamBlock';
import { UserFormExternalExtraInfoBlock } from '../UserFormExternalExtraInfoBlock/UserFormExternalExtraInfoBlock';
import { useSpyNav } from '../../hooks/useSpyNav';
import { Nullish } from '../../utils/types';

import s from './ExternalUserCreationRequestPage.module.css';
import { tr } from './ExternalUserCreationRequestPage.i18n';

const defaultValues: Partial<CreateUserCreationRequestExternalEmployee> = {
    type: 'externalEmployee',
    organizationUnitId: '',
    surname: '',
    firstName: '',
    middleName: '',
    login: '',
    createExternalAccount: true,
    phone: '',
    email: '',
    personalEmail: '',
    corporateEmail: '',
    curatorIds: [],
    lineManagerIds: [],
    title: '',
    groupId: '',
    permissionToServices: [],
    reason: '',
    accessToInternalSystems: true,
    attachIds: undefined,
};

export const ExternalUserCreationRequestPage = () => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const router = useRouter();

    const methods = useForm<CreateUserCreationRequestExternalEmployee>({
        resolver: zodResolver(getCreateUserCreationRequestExternalEmployeeSchema()),
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
        setValue,
        register,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = methods;

    const [isLoginUniqueQuery, setIsLoginUniqueQuery] = useState('');

    const isLoginUnique = trpc.user.isLoginUnique.useQuery(isLoginUniqueQuery, {
        enabled: isLoginUniqueQuery.length > 1,
    });

    useEffect(() => {
        if (getValues('login') && isLoginUnique.data === false) {
            setError('login', { message: tr('User with login already exist') });
        } else if (getValues('login')) trigger('login');
    }, [isLoginUnique.data, setError, trigger, getValues]);

    const debouncedLoginSearchHandler = debounce(300, setIsLoginUniqueQuery);

    const onFormSubmit = handleSubmit(async (data) => {
        if (isLoginUnique.data === false) {
            setError('login', { message: tr('User with login already exist') });
            return;
        }
        await createUserCreationRequest(data);
        reset(defaultValues);
        return router.userRequests();
    });

    const onOrganizationChange = (group: Nullish<OrganizationUnit>) => {
        group && setValue('organizationUnitId', group.id);
        trigger('organizationUnitId');
    };

    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <FormProvider {...methods}>
                    <form onSubmit={onFormSubmit}>
                        <div className={s.Header}>
                            <Text as="h2">{tr('Create access to external employee')}</Text>
                            <UserFormFormActions
                                submitDisabled={isSubmitting || isSubmitSuccessful}
                                onCancel={router.userRequests}
                                onReset={() => reset(defaultValues)}
                            />
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type="externalEmployee"
                                    onIsLoginUniqueChange={debouncedLoginSearchHandler}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <div className={s.FormBlock} id="registration">
                                    <Text className={s.SectionHeader} weight="bold" size="lg">
                                        {tr('Registration')}
                                    </Text>
                                    <div className={s.TwoInputsRow}>
                                        <div className={s.OrganizationCombobox}>
                                            <FormControl label={tr('Organization')} required>
                                                <OrganizationUnitComboBox
                                                    searchType="external"
                                                    onChange={onOrganizationChange}
                                                    organizationUnitId={watch('organizationUnitId')}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormControl required label={tr('Start date')} error={errors.date}>
                                            <FormControlInput
                                                outline
                                                autoComplete="off"
                                                size="m"
                                                type="date"
                                                {...register('date', { valueAsDate: true })}
                                            />
                                        </FormControl>
                                        <FormControl required label={tr('OS preference')} error={errors.osPreference}>
                                            <FormControlInput
                                                outline
                                                placeholder={tr('Enter OS name')}
                                                autoComplete="off"
                                                size="m"
                                                {...register('osPreference')}
                                            />
                                        </FormControl>
                                    </div>
                                </div>

                                <UserFormExternalTeamBlock className={s.FormBlock} id="team" />

                                <UserFormExternalExtraInfoBlock
                                    className={s.FormBlock}
                                    id="extra-info"
                                    type="externalEmployee"
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
