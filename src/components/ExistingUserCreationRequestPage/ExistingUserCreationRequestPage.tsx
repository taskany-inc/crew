import { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { z } from 'zod';

import {
    CreateUserCreationRequestBase,
    getCreateUserCreationRequestBaseSchema,
} from '../../modules/userCreationRequestSchemas';
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
import { useUserMutations } from '../../modules/userHooks';

import s from './ExistingUserCreationRequestPage.module.css';
import { tr } from './ExistingUserCreationRequestPage.i18n';

const defaultValues: Partial<CreateUserCreationRequestBase> = {
    type: 'existing',
    createExternalAccount: true,
    percentage: 1,
    surname: '',
    firstName: '',
    middleName: '',
    login: '',
    comment: '',
    phone: '',
    email: '',
    workEmail: '',
    personalEmail: '',
    corporateEmail: '',
    unitId: '',
    title: '',
    accountingId: '',
    osPreference: '',
    date: null,
};

const existingUserRequestSchema = (isloginUnique: (login: string) => Promise<boolean>) =>
    getCreateUserCreationRequestBaseSchema()
        .refine(({ workEmail, personalEmail }) => workEmail !== '' || personalEmail !== '', {
            message: tr('Enter Email'),
            path: ['workEmail'],
        })
        .refine(({ workEmail, personalEmail }) => workEmail !== '' || personalEmail !== '', {
            message: tr('Enter Email'),
            path: ['personalEmail'],
        })
        .superRefine(async (val, ctx) => {
            const unique = await isloginUnique(val.login);
            if (!unique) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: tr('User with login already exist'),
                    path: ['login'],
                });
            }
        });

export const ExistingUserCreationRequestPage = () => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const router = useRouter();

    const { isLoginUnique } = useUserMutations();

    const methods = useForm<CreateUserCreationRequestBase>({
        resolver: zodResolver(existingUserRequestSchema(isLoginUnique)),
        defaultValues,
    });

    const {
        handleSubmit,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const rootRef = useRef<HTMLDivElement>(null);

    const onFormSubmit = handleSubmit(async (data) => {
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
                            <Text as="h2">{tr('Create profile for internal employee')}</Text>
                            <UserFormFormActions
                                submitDisabled={isSubmitting || isSubmitSuccessful}
                                onCancel={router.userRequests}
                                onReset={() => reset(defaultValues)}
                            />
                        </div>
                        <div className={s.Body} onScroll={onScroll}>
                            <div className={s.Form} ref={rootRef}>
                                <UserFormPersonalDataBlock
                                    type="existing"
                                    className={s.FormBlock}
                                    readOnly={false}
                                    id="personal-data"
                                />

                                <UserFormRegistrationBlock className={s.FormBlock} id="registration" type="existing" />

                                <UserFormTeamBlock className={s.FormBlock} id="team" type="existing" />

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
