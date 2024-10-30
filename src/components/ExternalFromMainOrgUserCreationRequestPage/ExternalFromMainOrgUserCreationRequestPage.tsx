import { useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { debounce } from 'throttle-debounce';

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

import s from './ExternalFromMainOrgUserCreationRequestPage.module.css';
import { tr } from './ExternalFromMainOrgUserCreationRequestPage.i18n';

const defaultValues: Partial<CreateUserCreationRequestexternalFromMainOrgEmployee> = {
    type: 'externalFromMainOrgEmployee',
    organizationUnitId: config.mainOrganizationId,
    surname: '',
    firstName: '',
    middleName: '',
    login: '',
    createExternalAccount: true,
    phone: '',
    email: '',
    workEmail: '',
    corporateEmail: '',
    curatorIds: [],
    lineManagerIds: [],
    title: '',
    groupId: '',
    permissionToServices: [],
    reason: '',
};

export const ExternalFromMainOrgUserCreationRequestPage = () => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const router = useRouter();

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
                            <UserFormFormActions
                                submitDisabled={isSubmitting || isSubmitSuccessful}
                                onCancel={router.userRequests}
                                onReset={() => reset(defaultValues)}
                            />
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
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
                                        <FormControl label={tr('Organization')} required>
                                            <OrganizationUnitComboBox
                                                readOnly
                                                organizationUnitId={watch('organizationUnitId')}
                                            />
                                        </FormControl>
                                    </div>
                                </div>

                                <UserFormExternalTeamBlock className={s.FormBlock} id="team" />

                                <UserFormExternalExtraInfoBlock className={s.FormBlock} id="extra-info" />
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
