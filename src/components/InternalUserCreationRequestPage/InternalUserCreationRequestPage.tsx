import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Text,
    FormControlInput,
    Switch,
    SwitchControl,
    FormControlEditor,
    FormEditor,
} from '@taskany/bricks/harmony';
import { Group, OrganizationUnit, User, Role } from '@prisma/client';
import { debounce } from 'throttle-debounce';

import {
    CreateUserCreationRequestInternalEmployee,
    createUserCreationRequestInternalEmployeeSchema,
} from '../../modules/userCreationRequestSchemas';
import { UserSelect } from '../UserSelect/UserSelect';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { loginAuto } from '../../utils/createUserCreationRequest';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';
import { RoleSelect } from '../RoleSelect/RoleSelect';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { useRouter } from '../../hooks/useRouter';
import { FormControl } from '../FormControl/FormControl';
import { useBoolean } from '../../hooks/useBoolean';
import { WarningModal } from '../WarningModal/WarningModal';
import { NavMenu } from '../NavMenu/NavMenu';

import s from './InternalUserCreationRequestPage.module.css';
import { tr } from './InternalUserCreationRequestPage.i18n';

const defaultValues: Partial<CreateUserCreationRequestInternalEmployee> = {
    type: 'internalEmployee',
    createExternalAccount: true,
    creationCause: 'start',
    percentage: 1,
};

export const InternalUserCreationRequestPage = () => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const [coordinatorIds, setCoordinatorIds] = useState<string[]>([]);
    const [lineManagerIds, setLineManagerIds] = useState<string[]>([]);
    const [isLoginUniqueQuery, setIsLoginUniqueQuery] = useState('');

    const isLoginUnique = trpc.user.isLoginUnique.useQuery(isLoginUniqueQuery, {
        enabled: isLoginUniqueQuery.length > 1,
    });

    const router = useRouter();

    const cancelWarningVisible = useBoolean(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        trigger,
        getValues,
        setError,
        clearErrors,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateUserCreationRequestInternalEmployee>({
        resolver: zodResolver(createUserCreationRequestInternalEmployeeSchema),
        defaultValues,
    });

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

    useEffect(() => {
        if (isLoginUnique.data === false) {
            setError('login', { message: tr('User with login already exist') });
        } else clearErrors('login');
    }, [isLoginUnique.data, setError, clearErrors]);

    const debouncedSearchHandler = debounce(300, setIsLoginUniqueQuery);

    const onNameChange = () => {
        const login = loginAuto({
            firstName: getValues('firstName'),
            middleName: getValues('middleName'),
            surname: getValues('surname'),
        });
        debouncedSearchHandler(login);
        setValue('login', login);
        setValue('corporateEmail', getCorporateEmail(login));
        setValue('email', getCorporateEmail(login));
    };

    const onLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
        debouncedSearchHandler(e.target.value);
        setValue('corporateEmail', getCorporateEmail(e.target.value));
        setValue('email', getCorporateEmail(e.target.value));
    };

    const onRoleChange = (r: Nullish<Role>) => {
        r && setValue('title', r.name);
        trigger('title');
    };

    const onOrganizationChange = (o: Nullish<OrganizationUnit>) => {
        o && setValue('organizationUnitId', o.id);
        trigger('organizationUnitId');
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const onWorkModeChange = (mode: string) => {
        setValue('workMode', mode);
        trigger('workMode');
    };

    const onUserChange = (user: Nullish<User>, type: keyof CreateUserCreationRequestInternalEmployee) => {
        user && setValue(type, user.id);
        trigger(type);
    };

    const selectedBuddyId = watch('buddyId');

    const selectedReqruiterId = watch('recruiterId');

    const onEmailChange = () => {
        clearErrors('workEmail');
        clearErrors('personalEmail');
    };
    const onPercentageChange = (percentage: number, type: 'percentage' | 'supplementalPositions.0.percentage') => {
        if (percentage > 1 || percentage < 0.01) {
            setError(type, { message: tr('Please enter percentage from 0.01 to 1') });
        }
        trigger(type);
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <form onSubmit={onFormSubmit}>
                    <div className={s.Header}>
                        <Text as="h2">{tr('Create a planned newcommer')}</Text>
                        <div className={s.FormActions}>
                            <Button size="m" type="button" text={tr('Cancel')} onClick={cancelWarningVisible.setTrue} />
                            <Button
                                size="m"
                                type="submit"
                                text={tr('Create')}
                                view="primary"
                                disabled={isSubmitting || isSubmitSuccessful}
                            />
                        </div>
                    </div>
                    <WarningModal
                        visible={cancelWarningVisible.value}
                        onCancel={cancelWarningVisible.setFalse}
                        onConfirm={router.userRequests}
                        warningText={tr('cancel confirmation')}
                    />
                    <div className={s.Body}>
                        <div className={s.Form}>
                            <div className={s.FormBlock} id="personal-data">
                                <Text className={s.SectionHeader} weight="bold" size="l">
                                    {tr('Personal data')}
                                </Text>
                                <div className={s.ThreeInputsRow}>
                                    <FormControl label={tr('Surname')} required error={errors.surname}>
                                        <FormControlInput
                                            autoComplete="off"
                                            outline
                                            placeholder={tr('Write surname')}
                                            {...register('surname', {
                                                required: tr('Required field'),
                                                onChange: onNameChange,
                                            })}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('First name')} required error={errors.firstName}>
                                        <FormControlInput
                                            autoComplete="off"
                                            outline
                                            placeholder={tr('Write name')}
                                            {...register('firstName', {
                                                required: tr('Required field'),
                                                onChange: onNameChange,
                                            })}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Second name')} error={errors.middleName}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder={tr('Write second name')}
                                            outline
                                            {...register('middleName', {
                                                required: tr('Required field'),
                                                onChange: onNameChange,
                                            })}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Role')} required>
                                        <RoleSelect
                                            onChange={onRoleChange}
                                            roleName={watch('title')}
                                            error={errors.title}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Phone')} required error={errors.phone}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder="+7(___)__-__-___"
                                            outline
                                            {...register('phone', { required: tr('Required field') })}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Login')} required error={errors.login}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder={tr('In format vvivanov')}
                                            outline
                                            {...register('login', {
                                                required: tr('Required field'),
                                                onChange: onLoginChange,
                                            })}
                                        />
                                    </FormControl>
                                </div>
                                <Text as="h3">
                                    {tr('Email')}{' '}
                                    <Text as="span" className={s.Required}>
                                        *
                                    </Text>
                                </Text>
                                <div className={s.TwoInputsRow}>
                                    <FormControl label={tr('Personal')} error={errors.personalEmail}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder="name@mail.com"
                                            outline
                                            {...register('personalEmail', { onChange: onEmailChange })}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Work')} error={errors.workEmail}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder="email@example.com"
                                            outline
                                            {...register('workEmail', { onChange: onEmailChange })}
                                        />
                                    </FormControl>
                                </div>
                            </div>
                            <div className={s.FormBlock} id="registration">
                                <Text className={s.SectionHeader} weight="bold" size="l">
                                    {tr('Registration')}
                                </Text>
                                <div className={s.OrganizationCombobox}>
                                    <FormControl label={tr('Organization')} required>
                                        <OrganizationUnitComboBox
                                            organizationUnitId={watch('organizationUnitId')}
                                            onChange={onOrganizationChange}
                                            error={errors.organizationUnitId}
                                        />
                                    </FormControl>
                                </div>
                                <div className={s.TwoInputsRow}>
                                    <FormControl label={tr('Unit ID')} error={errors.unitId}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder={tr('Write unit ID')}
                                            outline
                                            {...register('unitId')}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Percentage')} error={errors.percentage}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder={tr('Write the percentage')}
                                            outline
                                            type="number"
                                            value={watch('percentage')}
                                            {...register('percentage', {
                                                valueAsNumber: true,
                                                onChange: (e) => onPercentageChange(+e.target.value, 'percentage'),
                                            })}
                                            step={0.01}
                                        />
                                    </FormControl>
                                    <FormControl required label={tr('Start date')} error={errors.date}>
                                        <FormControlInput
                                            outline
                                            autoComplete="off"
                                            type="date"
                                            {...register('date', { valueAsDate: true })}
                                        />
                                    </FormControl>

                                    <FormControl label={tr('Cause')} required error={errors.creationCause}>
                                        <Switch
                                            className={s.Switch}
                                            value={watch('creationCause')}
                                            onChange={(_e, a) => setValue('creationCause', a)}
                                        >
                                            <SwitchControl text={tr('Start')} value="start" />
                                            <SwitchControl text={tr('Transfer')} value="transfer" />
                                        </Switch>
                                    </FormControl>
                                </div>

                                <FormControl label={tr('Recruiter')}>
                                    <UserSelect
                                        mode="single"
                                        selectedUsers={selectedReqruiterId ? [selectedReqruiterId] : undefined}
                                        onChange={(users) => onUserChange(users[0], 'recruiterId')}
                                        onReset={() => setValue('recruiterId', undefined)}
                                    />
                                </FormControl>
                                <div className={s.AddSupplementalPosition}></div>
                                <AddSupplementalPosition
                                    onOrganizatioUnitChange={(id) =>
                                        id && setValue('supplementalPositions.0.organizationUnitId', id)
                                    }
                                    organizationUnitId={watch('supplementalPositions.0.organizationUnitId')}
                                    percentage={watch('supplementalPositions.0.percentage')}
                                    setPercentage={(percentage) => {
                                        percentage && setValue('supplementalPositions.0.percentage', percentage);
                                        percentage &&
                                            onPercentageChange(percentage, 'supplementalPositions.0.percentage');
                                    }}
                                    onClose={() => {
                                        setValue('supplementalPositions', undefined);
                                        trigger('supplementalPositions');
                                    }}
                                    unitId={watch('supplementalPositions.0.unitId')}
                                    setUnitId={(unitId) => unitId && setValue('supplementalPositions.0.unitId', unitId)}
                                    errors={errors.supplementalPositions && errors.supplementalPositions[0]}
                                />
                            </div>
                            <div className={s.FormBlock} id="team">
                                <Text className={s.SectionHeader} weight="bold" size="l">
                                    {tr('Team')}
                                </Text>
                                <div className={s.TwoInputsRow}>
                                    <FormControl label={tr('Supervisor')} required>
                                        <UserSelect
                                            mode="single"
                                            selectedUsers={watch('supervisorId') ? [watch('supervisorId')] : undefined}
                                            onChange={(users) => onUserChange(users[0], 'supervisorId')}
                                            error={errors.supervisorId}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Line managers')}>
                                        <UserSelect
                                            mode="multiple"
                                            selectedUsers={lineManagerIds}
                                            onChange={(users) => setLineManagerIds(users.map(({ id }) => id))}
                                        />
                                    </FormControl>
                                </div>

                                <div className={s.ThreeInputsRow}>
                                    <FormControl label="Buddy">
                                        <UserSelect
                                            mode="single"
                                            selectedUsers={selectedBuddyId ? [selectedBuddyId] : undefined}
                                            onChange={(users) => onUserChange(users[0], 'buddyId')}
                                            onReset={() => setValue('buddyId', undefined)}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('OrgGroup')}>
                                        <GroupComboBox
                                            defaultGroupId={watch('groupId')}
                                            onChange={onTeamChange}
                                            error={errors.groupId}
                                            onReset={() => setValue('groupId', undefined)}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Coordinators')}>
                                        <UserSelect
                                            mode="multiple"
                                            selectedUsers={coordinatorIds}
                                            onChange={(users) => setCoordinatorIds(users.map(({ id }) => id))}
                                        />
                                    </FormControl>
                                </div>
                            </div>
                            <div className={s.FormBlock} id="work-space">
                                <Text className={s.SectionHeader} weight="bold" size="l">
                                    {tr('Work space')}
                                </Text>
                                <FormControl label={tr('Equipment')} required error={errors.equipment}>
                                    <FormControlEditor
                                        className={s.FormEditor}
                                        outline
                                        disableAttaches
                                        onChange={(eq) => {
                                            eq && setValue('equipment', eq);
                                            trigger('equipment');
                                        }}
                                        placeholder={tr('Write equipment list')}
                                    />
                                </FormControl>
                                <FormControl label={tr('Extra equipment')} error={errors.extraEquipment}>
                                    <FormControlEditor
                                        className={s.FormEditor}
                                        outline
                                        disableAttaches
                                        onChange={(exEq) => exEq && setValue('extraEquipment', exEq)}
                                        placeholder={tr('Write equipment list')}
                                    />
                                </FormControl>
                                <div className={s.TwoInputsRow}>
                                    <FormControl label={tr('Work space application')} error={errors.workSpace}>
                                        <FormControlInput
                                            autoComplete="off"
                                            placeholder={tr('Write the application text')}
                                            outline
                                            {...register('workSpace')}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Location')} required error={errors.location}>
                                        <FormControlInput
                                            autoComplete="off"
                                            outline
                                            placeholder={tr('Write the location name')}
                                            {...register('location', { required: tr('Required field') })}
                                        />
                                    </FormControl>
                                    <FormControl label={tr('Work mode')} required>
                                        <WorkModeCombobox
                                            onChange={onWorkModeChange}
                                            value={watch('workMode')}
                                            error={errors.workMode}
                                        />
                                    </FormControl>

                                    <FormControl label={tr('Work mode comment')} error={errors.workModeComment}>
                                        <FormControlInput
                                            autoComplete="off"
                                            outline
                                            placeholder={tr('Write work mode comment')}
                                            {...register('workModeComment')}
                                        />
                                    </FormControl>
                                </div>
                            </div>
                            <div id="comments" className={s.FormBlock}>
                                <Text className={s.SectionHeader} weight="bold" size="l">
                                    {tr('Comments')}
                                </Text>

                                <FormEditor
                                    outline
                                    onChange={(comment) => comment && setValue('comment', comment)}
                                    placeholder={tr('Write some comments if needed')}
                                />
                            </div>
                        </div>
                        <NavMenu
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
            </div>
        </LayoutMain>
    );
};
