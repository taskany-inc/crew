import { useRef, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { UserFormRegistrationBlock } from '../UserFormRegistrationBlock/UserFormRegistrationBlock';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { useRouter } from '../../hooks/useRouter';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';
import { UserFormTeamBlock } from '../UserFormTeamBlock/UserFormTeamBlock';
import { UserFormCommentsBlock } from '../UserFormCommentsBlock/UserFormCommentsBlock';
import { User } from '../../trpc/inferredTypes';
import { UserCreationRequestType, UserCreationRequestWithRelations } from '../../modules/userCreationRequestTypes';
import { percentageMultiply } from '../../utils/suplementPosition';
import { UserFormWorkSpaceBlock } from '../UserFormWorkSpaceBlock/UserFormWorkSpaceBlock';
import {
    CreateSupplementalPositionRequest,
    createSupplementalPositionRequestSchema,
} from '../../modules/supplementalPositionSchema';
import { useSupplementalPositionMutations } from '../../modules/supplementalPositionHooks';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';

import s from './SupplementalPositionRequest.module.css';
import { tr } from './SupplementalPositionRequest.i18n';

interface SupplementalPositionRequestProps {
    user: User;
    request?: UserCreationRequestWithRelations;
    phone?: string;
    type?: 'new' | 'readOnly' | 'edit';
    personalEmail?: string;
    workEmail?: string;
}

export const SupplementalPositionRequest = ({
    user,
    request,
    type = 'new',
    phone,
    workEmail,
    personalEmail,
}: SupplementalPositionRequestProps) => {
    const { createSupplementalPositionRequest, updateSupplementalPositionRequest } = useSupplementalPositionMutations();

    const orgMembership = user?.memberships.find((m) => m.group.organizational);

    const [surname = '', firstName = '', middleName = ''] = (user.name ?? '').split(' ');

    const mainPosition = user.supplementalPositions.find((s) => s.main && s.status === 'ACTIVE');

    const defaultValues: Partial<CreateSupplementalPositionRequest> = {
        type: UserCreationRequestType.createSuppementalPosition,
        userTargetId: user.id,
        email: user.email,
        login: user.login || '',
        title: request?.title || orgMembership?.roles.map(({ name }) => name).join(', ') || user.title || undefined,
        groupId: request?.groupId || orgMembership?.groupId,
        surname,
        firstName,
        middleName,
        percentage: mainPosition?.percentage ? mainPosition.percentage / percentageMultiply : 1,
        phone,
        workEmail,
        personalEmail,
        location: request?.location || user.location?.name,
        unitId: mainPosition?.unitId || undefined,
        supervisorId: request?.supervisorId || user.supervisorId || undefined,
        organizationUnitId: mainPosition?.organizationUnitId || undefined,
        supplementalPositions: request?.supplementalPositions.map((s) => ({
            ...s,
            unitId: s.unitId || undefined,
            percentage: s.percentage / percentageMultiply,
        })) || [
            {
                organizationUnitId: '',
                percentage: 0.01,
                unitId: undefined,
                workStartDate: null,
            },
        ],
        recruiterId: request?.recruiterId || undefined,
        comment: request?.comment || undefined,
        workMode: request?.workMode || undefined,
        equipment: request?.equipment || undefined,
        extraEquipment: request?.extraEquipment || undefined,
        workSpace: request?.workSpace || undefined,
        buddyId: request?.buddyId || undefined,
        lineManagerIds: request?.lineManagers?.map(({ id }) => id) || [],
    };

    const router = useRouter();

    const rootRef = useRef<HTMLDivElement>(null);

    const methods = useForm<CreateSupplementalPositionRequest>({
        resolver: zodResolver(createSupplementalPositionRequestSchema()),
        defaultValues,
    });

    const {
        handleSubmit,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    useEffect(() => reset(defaultValues), []);

    const onFormSubmit = handleSubmit(async (data) => {
        if (type === 'edit' && request) {
            updateSupplementalPositionRequest({ id: request.id, ...data });
            return router.userRequests();
        }
        await createSupplementalPositionRequest(data);

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
                                    ? tr('Create a supplemental position for employee')
                                    : tr('Request supplemental position for employee')}
                            </Text>
                            {nullable(
                                type === 'readOnly' && request,
                                (request) => {
                                    return (
                                        <RequestFormActions
                                            requestStatus={request.status}
                                            requestType={UserCreationRequestType.createSuppementalPosition}
                                            requestId={request.id}
                                            onCancel={() => router.userRequests()}
                                            onEdit={() => router.updateSupplementalPositionRequest(request.id)}
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
                                    type={UserCreationRequestType.createSuppementalPosition}
                                    readOnly={{
                                        firstName: true,
                                        surname: true,
                                        middleName: true,
                                        login: true,
                                        corporateEmail: true,
                                        email: true,
                                        title: !!defaultValues.title || type === 'readOnly',
                                        workEmail: !!defaultValues.workEmail || type === 'readOnly',
                                        personalEmail: !!defaultValues.personalEmail || type === 'readOnly',
                                        phone: !!phone || type === 'readOnly',
                                    }}
                                    className={s.FormBlock}
                                    id="personal-data"
                                />

                                <UserFormRegistrationBlock
                                    edit={type === 'edit'}
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="registration"
                                    type={UserCreationRequestType.createSuppementalPosition}
                                />

                                <UserFormTeamBlock
                                    readOnly={type === 'readOnly'}
                                    className={s.FormBlock}
                                    id="team"
                                    userId={user.id}
                                    type={UserCreationRequestType.createSuppementalPosition}
                                />

                                <UserFormWorkSpaceBlock
                                    type={type}
                                    className={s.FormBlock}
                                    id="work-space"
                                    requestType={UserCreationRequestType.createSuppementalPosition}
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
