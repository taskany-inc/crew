import { useEffect, useRef, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { OrganizationUnit, UserCreationRequestStatus } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { z } from 'zod';

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
import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { UserFormExternalTeamBlock } from '../UserFormExternalTeamBlock/UserFormExternalTeamBlock';
import { UserFormExternalExtraInfoBlock } from '../UserFormExternalExtraInfoBlock/UserFormExternalExtraInfoBlock';
import { useSpyNav } from '../../hooks/useSpyNav';
import { Nullish } from '../../utils/types';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { useUserMutations } from '../../modules/userHooks';

import s from './ExternalUserCreationRequestPage.module.css';
import { tr } from './ExternalUserCreationRequestPage.i18n';

interface ExternalUserCreationRequestPageProps {
    request?: CreateUserCreationRequestExternalEmployee;
    type?: 'readOnly' | 'edit' | 'new';
    requestId?: string;
    requestStatus?: UserCreationRequestStatus;
}

const externalUserRequestSchema = (isloginUnique: (login: string) => Promise<boolean>, editFormLogin?: string) =>
    getCreateUserCreationRequestExternalEmployeeSchema().superRefine(async ({ login }, ctx) => {
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

export const ExternalUserCreationRequestPage = ({
    request,
    type = 'new',
    requestId,
    requestStatus,
}: ExternalUserCreationRequestPageProps) => {
    const { createUserCreationRequest, editUserCreationRequest } = useUserCreationRequestMutations();

    const router = useRouter();

    const defaultValues: Partial<CreateUserCreationRequestExternalEmployee> = useMemo(
        () => ({
            type: 'externalEmployee',
            organizationUnitId: request?.organizationUnitId,
            surname: request?.surname || '',
            firstName: request?.firstName || '',
            middleName: request?.middleName || '',
            login: request?.login || '',
            createExternalAccount: request?.createExternalAccount ?? true,
            phone: request?.phone || '',
            email: request?.email || '',
            personalEmail: request?.personalEmail || '',
            corporateEmail: request?.corporateEmail || '',
            curatorIds: request?.curatorIds || [],
            lineManagerIds: request?.lineManagerIds || [],
            title: request?.title || '',
            groupId: request?.groupId,
            permissionToServices: request?.permissionToServices || [],
            reason: request?.reason || '',
            accessToInternalSystems: request?.accessToInternalSystems ?? true,
            date: request?.date || null,
            osPreference: request?.osPreference || '',
            attachIds: request?.attachIds,
            intern: !!request?.intern,
        }),
        [request],
    );

    const { isLoginUnique } = useUserMutations();

    const methods = useForm<CreateUserCreationRequestExternalEmployee>({
        resolver: zodResolver(externalUserRequestSchema(isLoginUnique, request?.login)),
        defaultValues,
    });

    const rootRef = useRef<HTMLDivElement>(null);

    const {
        handleSubmit,
        reset,
        trigger,
        watch,
        setValue,
        register,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = methods;

    useEffect(() => {
        if (defaultValues.attachIds?.length && !watch('attachIds').length) {
            setValue('attachIds', defaultValues.attachIds);
        }
    });

    const onFormSubmit = handleSubmit(async (data) => {
        if (type === 'edit' && requestId) {
            await editUserCreationRequest({ id: requestId, data });
            return router.accessCoordination();
        }
        await createUserCreationRequest(data);
        reset(defaultValues);
        return router.accessCoordination();
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
                            {nullable(
                                type === 'readOnly' && requestId,
                                (requestId) => (
                                    <RequestFormActions
                                        requestType="creation"
                                        onEdit={() => router.externalUserRequestEdit(requestId)}
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
                                    type="externalEmployee"
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
                                                    error={errors.organizationUnitId}
                                                    readOnly={type === 'readOnly'}
                                                    searchType="external"
                                                    onChange={onOrganizationChange}
                                                    organizationUnitId={watch('organizationUnitId')}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormControl required label={tr('Start date')} error={errors.date}>
                                            <FormControlInput
                                                readOnly={type === 'readOnly'}
                                                outline
                                                autoComplete="off"
                                                size="m"
                                                value={
                                                    type !== 'new'
                                                        ? watch('date')?.toISOString().substring(0, 10)
                                                        : undefined
                                                }
                                                type="date"
                                                {...register('date', {
                                                    valueAsDate: true,
                                                })}
                                            />
                                        </FormControl>
                                        <FormControl required label={tr('OS preference')} error={errors.osPreference}>
                                            <FormControlInput
                                                readOnly={type === 'readOnly'}
                                                outline
                                                placeholder={tr('Enter OS name')}
                                                autoComplete="off"
                                                size="m"
                                                {...register('osPreference')}
                                            />
                                        </FormControl>
                                    </div>
                                </div>

                                <UserFormExternalTeamBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="team"
                                />

                                <UserFormExternalExtraInfoBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="extra-info"
                                    type="externalEmployee"
                                    requestId={requestId}
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
