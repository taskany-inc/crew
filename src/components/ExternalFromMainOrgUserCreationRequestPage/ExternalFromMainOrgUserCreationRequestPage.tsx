import { useRef, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { UserCreationRequestStatus } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { z } from 'zod';

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
import { FormControl } from '../FormControl/FormControl';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { config } from '../../config';
import { UserFormExternalTeamBlock } from '../UserFormExternalTeamBlock/UserFormExternalTeamBlock';
import { UserFormExternalExtraInfoBlock } from '../UserFormExternalExtraInfoBlock/UserFormExternalExtraInfoBlock';
import { useSpyNav } from '../../hooks/useSpyNav';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { useUserMutations } from '../../modules/userHooks';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import s from './ExternalFromMainOrgUserCreationRequestPage.module.css';
import { tr } from './ExternalFromMainOrgUserCreationRequestPage.i18n';

interface ExternalUserCreationRequestPageProps {
    request?: CreateUserCreationRequestexternalFromMainOrgEmployee;
    type?: 'readOnly' | 'edit' | 'new';
    requestId?: string;
    requestStatus?: UserCreationRequestStatus;
}

const externaFromMainlUserRequestSchema = (
    isloginUnique: (login: string) => Promise<boolean>,
    editFormLogin?: string,
) =>
    getCreateUserCreationRequestExternalFromMainOrgEmployeeSchema().superRefine(async ({ login }, ctx) => {
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
            type: UserCreationRequestType.externalFromMainOrgEmployee,
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
            date: request?.date || null,
            intern: !!request?.intern,
        }),
        [request],
    );

    const { isLoginUnique } = useUserMutations();

    const methods = useForm<CreateUserCreationRequestexternalFromMainOrgEmployee>({
        resolver: zodResolver(externaFromMainlUserRequestSchema(isLoginUnique, request?.login)),
        defaultValues,
    });

    const rootRef = useRef<HTMLDivElement>(null);

    const {
        handleSubmit,
        reset,
        watch,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const onFormSubmit = handleSubmit(async (data) => {
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
                                        requestType={UserCreationRequestType.externalFromMainOrgEmployee}
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
