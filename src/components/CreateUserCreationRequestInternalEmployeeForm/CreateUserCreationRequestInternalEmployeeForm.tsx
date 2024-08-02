import { ChangeEvent, useEffect, useState } from 'react';
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
import { Checkbox, FormControl } from '@taskany/bricks/harmony';
import { Group, OrganizationUnit, User } from '@prisma/client';
import { debounce } from 'throttle-debounce';

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
        await createUserCreationRequest(data);
        reset(defaultValues);
        onSubmit();
    });

    const closeAndReset = () => {
        reset(defaultValues);
        onClose();
    };

    const createExternalAccount = watch('createExternalAccount');

    const onCreateExternalAccountClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('createExternalAccount', e.target.checked);
    };

    const createCorporateEmail = useBoolean(false);

    const onCreateCorporateEmailClick = (e: ChangeEvent<HTMLInputElement>) => {
        createCorporateEmail.setValue(e.target.checked);
        if (e.target.checked) {
            setValue('corporateEmail', getCorporateEmail(getValues('login')));
        } else {
            setValue('corporateEmail', undefined);
        }
    };

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

    const onOrganizationChange = (group: Nullish<OrganizationUnit>) => {
        group && setValue('organizationUnitId', group.id);
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
                <FormInput
                    label={tr('Surname')}
                    brick="right"
                    autoComplete="off"
                    {...register('surname', { required: tr('Required field') })}
                    error={errors.surname}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('First name')}
                    brick="right"
                    autoComplete="off"
                    {...register('firstName', { required: tr('Required field') })}
                    error={errors.firstName}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Middle name')}
                    brick="right"
                    autoComplete="off"
                    {...register('middleName')}
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
                    label={tr('Email')}
                    brick="right"
                    autoComplete="off"
                    {...register('email', { required: tr('Required field') })}
                    error={errors.email}
                    className={s.FormInput}
                />
                <FormInput
                    label={tr('Login')}
                    brick="right"
                    autoComplete="off"
                    {...register('login', { required: tr('Required field'), onChange: onLoginChange })}
                    error={errors.login}
                    className={s.FormInput}
                />

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Create corporate email:')}
                    </Text>
                    <Checkbox checked={createCorporateEmail.value} onChange={onCreateCorporateEmailClick} />
                </div>

                {nullable(createCorporateEmail.value, () => (
                    <FormInput
                        label={tr('Corporate email')}
                        brick="right"
                        autoComplete="off"
                        {...register('corporateEmail')}
                        error={errors.corporateEmail}
                        className={s.FormInput}
                    />
                ))}
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
                    <UserComboBox onChange={(user) => onUserChange(user, 'supervisorId')} />
                    {nullable(errors.supervisorId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Buddy:')}
                    </Text>
                    <UserComboBox onChange={(user) => onUserChange(user, 'buddyId')} />
                    {nullable(errors.buddyId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Coordinator:')}
                    </Text>
                    <UserComboBox onChange={(user) => onUserChange(user, 'coordinatorId')} />
                    {nullable(errors.coordinatorId, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
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
                    label={tr('Unit id')}
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
                    <UserComboBox onChange={(user) => onUserChange(user, 'recruiterId')} />
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
                        {tr('Create external account:')}
                    </Text>
                    <Checkbox checked={createExternalAccount} onChange={onCreateExternalAccountClick} />
                </div>

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
            <div className={s.FormActionWrap}>
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
