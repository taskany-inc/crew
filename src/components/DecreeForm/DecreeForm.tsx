import { ComponentProps, FC, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { UserSupplementalPositions } from '../../modules/userTypes';
import { UserFormPersonalDataBlock } from '../UserFormPersonalDataBlock/UserFormPersonalDataBlock';
import { userDecreeSchema, UserDecreeSchema } from '../../modules/userCreationRequestSchemas';
import { percentageMultiply } from '../../utils/suplementPosition';
import { UserFormFormActions } from '../UserFormFormActions/UserFormFormActions';
import { UserFormTeamBlock } from '../UserFormTeamBlock/UserFormTeamBlock';
import { NavMenu } from '../NavMenu/NavMenu';
import { useSpyNav } from '../../hooks/useSpyNav';
import { UserFormRegistrationBlock } from '../UserFormRegistrationBlock/UserFormRegistrationBlock';
import { UserFormWorkSpaceBlock } from '../UserFormWorkSpaceBlock/UserFormWorkSpaceBlock';
import { UserFormCommentsBlock } from '../UserFormCommentsBlock/UserFormCommentsBlock';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { useRouter } from '../../hooks/useRouter';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import { tr } from './DecreeForm.i18n';
import s from './DecreeForm.module.css';

interface DecreeFormProps {
    defaultValues: Partial<UserDecreeSchema>;
    type: UserCreationRequestType.toDecree | UserCreationRequestType.fromDecree;
    mode: 'read' | 'edit';
    onSubmit: (data: UserDecreeSchema) => Promise<void>;
    onCancel: () => void;
    supplementalPositions?: UserSupplementalPositions['supplementalPositions'];
}

const personalInfoReadOnly: ComponentProps<typeof UserFormPersonalDataBlock>['readOnly'] = {
    firstName: true,
    surname: true,
    middleName: true,
    login: true,
    corporateEmail: true,
    email: true,
    workEmail: true,
    personalEmail: true,
    phone: true,
    accountingId: true,
};

export const DecreeForm: FC<DecreeFormProps> = ({
    mode,
    defaultValues,
    supplementalPositions,
    type,
    onSubmit,
    onCancel,
}) => {
    const router = useRouter();
    const methods = useForm<UserDecreeSchema>({
        resolver: zodResolver(userDecreeSchema),
        defaultValues,
    });
    const {
        handleSubmit,
        setValue,
        trigger,
        watch,
        reset,
        formState: { isSubmitting, isSubmitSuccessful },
    } = methods;

    const requestId = defaultValues.id;

    const organizationUnits = useMemo(
        () =>
            supplementalPositions
                ? supplementalPositions.reduce<{
                      organizationUnitIds: Set<string>;
                      organizationUnits: NonNullable<
                          ComponentProps<typeof UserFormRegistrationBlock>['organizationUnits']
                      >;
                  }>(
                      (acum, p) => {
                          if (!acum.organizationUnitIds.has(p.organizationUnitId)) {
                              acum.organizationUnits.push(p.organizationUnit);
                              acum.organizationUnitIds.add(p.organizationUnitId);
                          }

                          return acum;
                      },
                      {
                          organizationUnits: [],
                          organizationUnitIds: new Set(),
                      },
                  ).organizationUnits
                : undefined,
        [supplementalPositions],
    );

    const organizationUnitId = watch('organizationUnitId');
    const firedOrganizationUnitId = watch('firedOrganizationUnitId');
    const supplementalPositionsOrganizationUnitId = watch('supplementalPositions.0.organizationUnitId');

    const setOrgUnit = (orgId: string, target: 'main' | 'supplemental') => {
        if (supplementalPositions) {
            const position = supplementalPositions.find(
                (item) =>
                    item.organizationUnitId === orgId &&
                    (type === 'toDecree' ? item.status === 'ACTIVE' : item.status !== 'ACTIVE'),
            );

            const key = target === 'main' ? '' : 'supplementalPositions.0.';

            setValue(`${key}unitId`, position?.unitId ?? '');
            setValue(`${key}percentage`, position ? position.percentage / percentageMultiply : 0.01);

            trigger(`${key}unitId`);
            trigger(`${key}percentage`);
        }
    };

    const onOrganistaionUnitChange = (orgId: string) => {
        if (firedOrganizationUnitId === orgId) {
            setValue('firedOrganizationUnitId', '');
            trigger('firedOrganizationUnitId');
        }
        if (supplementalPositionsOrganizationUnitId === orgId) {
            setValue('supplementalPositions.0.organizationUnitId', '');
            trigger('supplementalPositions.0.organizationUnitId');
        }

        setOrgUnit(orgId, 'main');
    };

    const onFiredOrganizationUnitChange = (orgId: string) => {
        if (organizationUnitId === orgId) {
            setValue('organizationUnitId', '');
            trigger('organizationUnitId');
        }
        if (supplementalPositionsOrganizationUnitId === orgId) {
            setValue('supplementalPositions.0.organizationUnitId', '');
            trigger('supplementalPositions.0.organizationUnitId');
        }
    };

    const onSuplementalPositionUnitChange = (orgId: string) => {
        if (firedOrganizationUnitId === orgId) {
            setValue('firedOrganizationUnitId', '');
            trigger('firedOrganizationUnitId');
        }
        if (organizationUnitId === orgId) {
            setValue('organizationUnitId', '');
            trigger('organizationUnitId');
        }

        setOrgUnit(orgId, 'supplemental');
    };

    const onFormSubmit = handleSubmit(onSubmit);

    const rootRef = useRef<HTMLDivElement>(null);
    const { activeId, onClick, onScroll } = useSpyNav(rootRef);

    return (
        <FormProvider {...methods}>
            <form onSubmit={onFormSubmit}>
                <div className={s.Header}>
                    <Text as="h2">
                        {nullable(type === 'toDecree', () => tr('Create decree'), tr('Exit from decree'))}
                    </Text>
                    {nullable(
                        mode === 'read' && requestId,
                        (rId) => (
                            <RequestFormActions
                                onEdit={() => router.decreeRequestEdit(rId)}
                                onCancel={onCancel}
                                requestId={rId}
                                requestType={type}
                            />
                        ),
                        <UserFormFormActions
                            submitDisabled={isSubmitting || isSubmitSuccessful}
                            onCancel={onCancel}
                            onReset={() => reset(defaultValues)}
                        />,
                    )}
                </div>
                <div className={s.Body} onScroll={onScroll}>
                    <div className={s.Form} ref={rootRef}>
                        <UserFormPersonalDataBlock
                            type={type}
                            className={s.FormBlock}
                            id="personal-data"
                            readOnly={mode === 'edit' ? personalInfoReadOnly : true}
                        />

                        <UserFormRegistrationBlock
                            className={s.FormBlock}
                            onOrganistaionUnitChange={onOrganistaionUnitChange}
                            onFiredOrganizationUnitChange={onFiredOrganizationUnitChange}
                            onSupplementalOrganistaionUnitChange={onSuplementalPositionUnitChange}
                            organizationUnits={organizationUnits}
                            id="registration"
                            readOnly={mode === 'read'}
                            edit={mode === 'edit'}
                            type={type}
                        />

                        <UserFormTeamBlock
                            className={s.FormBlock}
                            id="team"
                            type="internal"
                            readOnly={mode === 'read'}
                        />

                        <UserFormWorkSpaceBlock
                            id="work-space"
                            className={s.FormBlock}
                            requestType={type}
                            type={mode === 'read' ? 'readOnly' : 'edit'}
                        />

                        <UserFormCommentsBlock
                            id="comments"
                            requestType={type}
                            requestId={requestId}
                            className={s.FormBlock}
                            readOnly={mode === 'read'}
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
    );
};
