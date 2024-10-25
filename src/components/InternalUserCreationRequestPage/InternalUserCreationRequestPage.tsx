import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { debounce } from 'throttle-debounce';

import {
    CreateUserCreationRequestInternalEmployee,
    createUserCreationRequestInternalEmployeeSchema,
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

import s from './InternalUserCreationRequestPage.module.css';
import { tr } from './InternalUserCreationRequestPage.i18n';

const defaultValues: Partial<CreateUserCreationRequestInternalEmployee> = {
    type: 'internalEmployee',
    createExternalAccount: true,
    creationCause: 'start',
    percentage: 1,
    surname: '',
    firstName: '',
    middleName: '',
    login: '',
    comment: '',
    workSpace: '',
    phone: '',
    email: '',
    workEmail: '',
    personalEmail: '',
    corporateEmail: '',
    workModeComment: '',
    equipment: '',
    extraEquipment: '',
    location: '',
    unitId: '',
    // TODO reset date also maybe like this https://github.com/colinhacks/zod/issues/1206
};

export const InternalUserCreationRequestPage = () => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const router = useRouter();

    const methods = useForm<CreateUserCreationRequestInternalEmployee>({
        resolver: zodResolver(createUserCreationRequestInternalEmployeeSchema),
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
        if (getValues('login') && isLoginUnique.data === false) {
            setError('login', { message: tr('User with login already exist') });
        } else if (getValues('login')) trigger('login');
    }, [isLoginUnique.data, setError, trigger, getValues]);

    const debouncedLoginSearchHandler = debounce(300, setIsLoginUniqueQuery);

    const onFormSubmit = handleSubmit(async (data) => {
        if (!watch('personalEmail') && !watch('workEmail')) {
            setError('personalEmail', { message: tr('Enter Email') });
            setError('workEmail', { message: tr('Enter Email') });
            return;
        }

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
                            <Text as="h2">{tr('Create a planned newcommer')}</Text>
                            <UserFormFormActions
                                submitDisabled={isSubmitting || isSubmitSuccessful}
                                onCancel={router.userRequests}
                                onReset={() => reset(defaultValues)}
                            />
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    onIsLoginUniqueChange={debouncedLoginSearchHandler}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <UserFormRegistrationBlock className={s.FormBlock} id="registration" />

                                <UserFormTeamBlock className={s.FormBlock} id="team" />

                                <UserFormWorkSpaceBlock id="work-space" className={s.FormBlock} />

                                <UserFormCommentsBlock id="comments" className={s.FormBlock} />
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
