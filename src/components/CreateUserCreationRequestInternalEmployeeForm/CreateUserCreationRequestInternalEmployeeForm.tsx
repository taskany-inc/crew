import { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Dropdown,
    Form,
    FormAction,
    FormActions,
    FormInput,
    FormRadio,
    FormRadioInput,
    MenuItem,
    Text,
    nullable,
} from '@taskany/bricks';
import { danger0, gray8 } from '@taskany/colors';
import { Checkbox, FormEditor } from '@taskany/bricks/harmony';

import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import {
    CreateUserCreationRequestInternalEmployee,
    createUserCreationRequestInternalEmployeeSchema,
} from '../../modules/userCreationRequestSchemas';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { useBoolean } from '../../hooks/useBoolean';

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

    const onLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (createCorporateEmail.value) {
            setValue('corporateEmail', getCorporateEmail(e.target.value));
        }
    };
    const workModeItems = [tr('Office'), tr('Mixed'), tr('Remote')].map((m) => ({
        title: m,
        action: () => setValue('workMode', m),
    }));

    const creationCauseRadioValues = [
        { label: tr('Start'), value: 'start' },
        { label: tr('Transfer'), value: 'transfer' },
    ];

    return (
        <Form onSubmit={onFormSubmit}>
            <div className={s.NoWrap}>
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Organization:')}
                    </Text>

                    <OrganizationUnitComboBox onChange={(group) => group && setValue('organizationUnitId', group.id)} />
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
                    <UserComboBox onChange={(user) => user && setValue('supervisorId', user.id)} />
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
                    <UserComboBox onChange={(user) => user && setValue('buddyId', user.id)} />
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
                    <UserComboBox onChange={(user) => user && setValue('coordinatorId', user.id)} />
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
                    <GroupComboBox onChange={(group) => group && setValue('groupId', group.id)} />
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
                    onChange={(e) => e.target.valueAsDate && setValue('date', e.target.valueAsDate)}
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
                <Dropdown
                    className={s.FormInput}
                    onChange={(item) => item.action()}
                    text="Work mode"
                    items={workModeItems}
                    renderTrigger={(props) => (
                        <FormInput
                            label={tr('Work mode')}
                            defaultValue={watch('workMode')}
                            disabled={props.disabled}
                            onClick={props.onClick}
                            error={errors.workMode}
                        />
                    )}
                    renderItem={(props) => (
                        <MenuItem
                            key={props.item.title}
                            focused={props.cursor === props.index}
                            onClick={props.onClick}
                            view="primary"
                            ghost
                        >
                            {props.item.title}
                        </MenuItem>
                    )}
                />
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
                    <UserComboBox onChange={(user) => user && setValue('recruiterId', user.id)} />
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

                <FormEditor
                    className={s.FormInput}
                    placeholder={tr('Comments')}
                    disableAttaches
                    onChange={(e) => setValue('comment', e)}
                />
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
