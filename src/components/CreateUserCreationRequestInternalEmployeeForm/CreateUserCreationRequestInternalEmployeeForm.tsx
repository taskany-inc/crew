import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormInput,
    FormRadio,
    FormRadioInput,
    Text,
    nullable,
} from '@taskany/bricks';
import { danger0, gray8 } from '@taskany/colors';
import { FormControl, Tooltip, User as HarmonyUser } from '@taskany/bricks/harmony';
import { Group, OrganizationUnit, User } from '@prisma/client';
import { debounce } from 'throttle-debounce';
import { IconBulbOnOutline } from '@taskany/icons';

import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import {
    CreateUserCreationRequestInternalEmployee,
    createUserCreationRequestInternalEmployeeSchema,
} from '../../modules/userCreationRequestSchemas';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { useBoolean } from '../../hooks/useBoolean';
import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { FormControlEditor } from '../FormControlEditorForm/FormControlEditorForm';
import { AddSupplementalPositionType } from '../../modules/organizationUnitSchemas';
import { AddSupplementalPosition } from '../AddSupplementalPosition/AddSupplementalPosition';
import { loginAuto } from '../../utils/createUserCreationRequest';
import { SupplementalPositionItem } from '../SupplementalPositionItem/SupplementalPositionItem';

import { tr } from './CreateUserCreationRequestInternalEmployeeForm.i18n';
import s from './CreateUserCreationRequestInternalEmployeeForm.module.css';

interface CreateUserCreationRequestInternalEmployeeFormProps {
    onClose: VoidFunction;
    onSubmit: VoidFunction;
}

const defaultValues: Partial<CreateUserCreationRequestInternalEmployee> = {
    type: 'internalEmployee',
    createExternalAccount: true,
    creationCause: 'start',
};

export const CreateUserCreationRequestInternalEmployeeForm = ({
    onClose,
    onSubmit,
}: CreateUserCreationRequestInternalEmployeeFormProps) => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const [supplementalPositions, setSupplementalPositions] = useState<AddSupplementalPositionType[]>([]);
    const [coordinators, setCoordinators] = useState<User[]>([]);
    const [lineManagers, setLineManagers] = useState<User[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        reset,
        trigger,
        setError,
        clearErrors,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateUserCreationRequestInternalEmployee>({
        resolver: zodResolver(createUserCreationRequestInternalEmployeeSchema),
        defaultValues,
    });

    const onFormSubmit = handleSubmit(async (data) => {
        await createUserCreationRequest({
            ...data,
            supplementalPositions: supplementalPositions.map(({ percentage, organizationUnit, unitId }) => ({
                percentage,
                organizationUnitId: organizationUnit.id,
                unitId: unitId || '',
            })),
            corporateEmail: getCorporateEmail(getValues('login')),
            email: getCorporateEmail(getValues('login')),
            lineManagerIds: lineManagers.map(({ id }) => id),
            coordinatorIds: coordinators.map(({ id }) => id),
        });
        reset(defaultValues);
        onSubmit();
    });

    const closeAndReset = () => {
        reset(defaultValues);
        onClose();
    };

    const addSupplementalPosition = (data: AddSupplementalPositionType) =>
        setSupplementalPositions((prev) => [...prev, data]);

    const removeSupplementalPosition = (id: string) =>
        setSupplementalPositions(supplementalPositions.filter((sp) => sp.organizationUnit.id !== id));

    const createCorporateEmail = useBoolean(false);

    const [isLoginUniqueQuery, setIsLoginUniqueQuery] = useState('');

    const isLoginUnique = trpc.user.isLoginUnique.useQuery(isLoginUniqueQuery, {
        enabled: isLoginUniqueQuery.length > 1,
    });

    useEffect(() => {
        if (isLoginUnique.data === false) {
            setError('login', { message: tr('User with login already exist') });
        } else clearErrors('login');
    }, [isLoginUnique.data, setError, clearErrors]);

    const debouncedSearchHandler = debounce(300, setIsLoginUniqueQuery);

    const onNameChange = () => {
        const login = loginAuto({
            firstName: watch('firstName'),
            middleName: watch('middleName'),
            surname: watch('surname'),
        });
        debouncedSearchHandler(login);
        setValue('login', login);
    };

    const onLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
        debouncedSearchHandler(e.currentTarget.value);
        if (createCorporateEmail.value) {
            setValue('corporateEmail', getCorporateEmail(e.target.value));
        }
    };

    const creationCauseRadioValues = [
        { label: tr('Start'), value: 'start' },
        { label: tr('Transfer'), value: 'transfer' },
    ];

    const [mainOrganisationName, setMainOrganisationName] = useState('');

    const onOrganizationChange = (group: Nullish<OrganizationUnit>) => {
        group && setValue('organizationUnitId', group.id);
        group && setMainOrganisationName(group.name);
        trigger('organizationUnitId');
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const onUserChange = (user: Nullish<User>, type: keyof CreateUserCreationRequestInternalEmployee) => {
        user && setValue(type, user.id);
        trigger(type);
    };

    const onDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.target.valueAsDate && setValue('date', e.target.valueAsDate);
        trigger('date');
    };

    const loginTooltipRef = useRef(null);

    return (
        <Form onSubmit={onFormSubmit}>
            <div className={s.NoWrap}>
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Organization:')}
                    </Text>
                    <OrganizationUnitComboBox onChange={onOrganizationChange} searchType="internal" />
                    {nullable(errors.organizationUnitId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>
                <div className={s.BadgeWrapper}>
                    {nullable(!!supplementalPositions.length, () => (
                        <>
                            <div className={s.InputContainer}>
                                <Text weight="bold" color={gray8}>
                                    {tr('Supplemental positions:')}
                                </Text>
                            </div>
                            <div className={s.BadgeWrapperList}>
                                {supplementalPositions.map((position) => (
                                    <SupplementalPositionItem
                                        key={position.organizationUnit.id}
                                        supplementalPosition={position}
                                        removeSupplementalPosition={removeSupplementalPosition}
                                    />
                                ))}
                            </div>
                        </>
                    ))}
                    <AddSupplementalPosition onSubmit={addSupplementalPosition} />
                </div>
                <FormInput
                    label={tr('Surname')}
                    brick="right"
                    autoComplete="off"
                    {...register('surname', { required: tr('Required field'), onChange: onNameChange })}
                    error={errors.surname}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('First name')}
                    brick="right"
                    autoComplete="off"
                    {...register('firstName', { required: tr('Required field'), onChange: onNameChange })}
                    error={errors.firstName}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Middle name')}
                    brick="right"
                    autoComplete="off"
                    {...register('middleName', { onChange: onNameChange })}
                    error={errors.middleName}
                    className={s.FormInput}
                />

                <FormInput
                    label={tr('Role')}
                    error={errors.title}
                    autoComplete="off"
                    {...register('title')}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Personal email')}
                    brick="right"
                    autoComplete="off"
                    {...register('personalEmail')}
                    error={errors.personalEmail}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Work email')}
                    brick="right"
                    autoComplete="off"
                    {...register('workEmail')}
                    error={errors.workEmail}
                    className={s.FormInput}
                />
                <div className={s.LoginInput}>
                    <FormInput
                        label={tr('Login')}
                        brick="right"
                        autoComplete="off"
                        {...register('login', { required: tr('Required field'), onChange: onLoginChange })}
                        error={errors.login}
                        className={s.FormInput}
                    />
                    <IconBulbOnOutline ref={loginTooltipRef} size="s" />
                    <Tooltip reference={loginTooltipRef} placement="bottom-start" arrow={false} maxWidth={250}>
                        {tr(
                            'The login can be changed manually if the resulting one is already taken or is completely discordant',
                        )}
                    </Tooltip>
                </div>

                <FormInput
                    label={tr('Phone')}
                    brick="right"
                    autoComplete="off"
                    {...register('phone')}
                    error={errors.phone}
                    className={s.FormInput}
                />
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Supervisor:')}
                    </Text>
                    <UserComboBox
                        placeholder={tr('Add supervisor')}
                        onChange={(user) => onUserChange(user, 'supervisorId')}
                    />
                    {nullable(errors.supervisorId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8} className={s.LineManagersTitle}>
                        {tr('Line managers:')}
                    </Text>
                    <div className={s.LineManagers}>
                        {lineManagers?.map((manager) => (
                            <HarmonyUser
                                key={`${manager.id}lineManager`}
                                name={manager.name}
                                email={manager.email}
                                onClick={() => setLineManagers(lineManagers.filter(({ id }) => manager.id !== id))}
                            />
                        ))}
                        {nullable(lineManagers.length < 3, () => (
                            <UserComboBox
                                blank
                                placeholder={tr('Add line manager')}
                                onChange={(user) => user && setLineManagers((prev) => [...prev, user])}
                            />
                        ))}
                    </div>
                </div>

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Buddy:')}
                    </Text>
                    <UserComboBox placeholder={tr('Add buddy')} onChange={(user) => onUserChange(user, 'buddyId')} />
                    {nullable(errors.buddyId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8} className={s.LineManagersTitle}>
                        {tr('Coordinators:')}
                    </Text>
                    <div className={s.LineManagers}>
                        {coordinators?.map((c) => (
                            <HarmonyUser
                                key={`${c.id}coordinators`}
                                name={c.name}
                                email={c.email}
                                onClick={() => setCoordinators(coordinators.filter(({ id }) => c.id !== id))}
                            />
                        ))}
                        <UserComboBox
                            blank
                            placeholder={tr('Add coordinator')}
                            onChange={(user) => user && setCoordinators((prev) => [...prev, user])}
                        />
                    </div>
                </div>

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Team:')}
                    </Text>
                    <GroupComboBox onChange={onTeamChange} />
                    {nullable(errors.groupId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>
                <FormInput
                    label={tr('Start date')}
                    type="date"
                    autoComplete="off"
                    error={errors.date}
                    onChange={onDateChange}
                    className={s.FormInputDate}
                />
                <FormInput
                    label={`${tr('Unit id')} ${mainOrganisationName}`}
                    brick="right"
                    autoComplete="off"
                    {...register('unitId')}
                    error={errors.unitId}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Equipment needed')}
                    brick="right"
                    autoComplete="off"
                    {...register('equipment')}
                    error={errors.equipment}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Extra equipment needed')}
                    brick="right"
                    autoComplete="off"
                    {...register('extraEquipment')}
                    error={errors.extraEquipment}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Work space application')}
                    brick="right"
                    autoComplete="off"
                    {...register('workSpace')}
                    error={errors.workSpace}
                    className={s.FormInput}
                />

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Work mode')}
                    </Text>

                    <WorkModeCombobox value={watch('workMode')} onChange={(mode) => setValue('workMode', mode)} />

                    {nullable(errors.workMode, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>

                <FormInput
                    label={tr('Work mode comment')}
                    autoComplete="off"
                    {...register('workModeComment')}
                    error={errors.workModeComment}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Location')}
                    brick="right"
                    autoComplete="off"
                    {...register('location')}
                    error={errors.location}
                    className={s.FormInput}
                />
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Recruiter:')}
                    </Text>
                    <UserComboBox
                        placeholder={tr('Add reqruiter')}
                        onChange={(user) => onUserChange(user, 'recruiterId')}
                    />
                    {nullable(errors.recruiterId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>

                <FormRadio
                    label={tr('Creation cause')}
                    name="type"
                    value={watch('creationCause')}
                    onChange={(v) => setValue('creationCause', v)}
                >
                    {creationCauseRadioValues.map(({ value, label }) => (
                        <FormRadioInput key={value} value={value} label={label} />
                    ))}
                </FormRadio>

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Comment:')}
                    </Text>
                </div>

                <FormControl className={s.InputContainer}>
                    <FormControlEditor
                        placeholder={tr('Enter your comment')}
                        disableAttaches
                        onChange={(e) => setValue('comment', e)}
                    />
                </FormControl>
            </div>
            <div>
                <FormActions>
                    <FormAction left />
                    <FormAction right inline>
                        <Button type="button" text={tr('Cancel')} onClick={closeAndReset} />
                        <Button
                            type="submit"
                            text={tr('Create')}
                            view="primary"
                            size="m"
                            outline
                            disabled={isSubmitting || isSubmitSuccessful}
                        />
                    </FormAction>
                </FormActions>
            </div>
        </Form>
    );
};
