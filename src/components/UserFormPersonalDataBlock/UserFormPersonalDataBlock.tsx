import React, { ChangeEvent, useRef } from 'react';
import { Checkbox, FormControlInput, SelectTrigger, Text, Tooltip } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { Role } from 'prisma/prisma-client';
import { AsYouType } from 'libphonenumber-js';
import { nullable } from '@taskany/bricks';

import { FormControl } from '../FormControl/FormControl';
import { RoleSelect } from '../RoleSelect/RoleSelect';
import { loginAuto } from '../../utils/createUserCreationRequest';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { Nullish } from '../../utils/types';
import { config } from '../../config';

import s from './UserFormPersonalDataBlock.module.css';
import { tr } from './UserFormPersonalDataBlock.i18n';

interface UserFormPersonalDataBlockType {
    firstName: string;
    surname: string;
    middleName?: string;
    login: string;
    corporateEmail: string;
    email: string;
    title: string;
    workEmail?: string;
    personalEmail?: string;
    phone: string;
    createExternalAccount?: boolean;
    disableAccount?: boolean;
    accountingId?: string;
    intern: boolean;
}

type ReadOnlyMap = Partial<Record<keyof UserFormPersonalDataBlockType, boolean>>;

interface UserFormPersonalDataBlockProps {
    className: string;
    id: string;
    type:
        | 'internal'
        | 'existing'
        | 'externalEmployee'
        | 'externalFromMainOrgEmployee'
        | 'toDecree'
        | 'fromDecree'
        | 'dismissal'
        | 'transferInternToStaff';
    readOnly?: boolean | ReadOnlyMap;
    defaultValue?: UserFormPersonalDataBlockType;
}

export const UserFormPersonalDataBlock = ({ className, id, type, readOnly = true }: UserFormPersonalDataBlockProps) => {
    const {
        register,
        setValue,
        getValues,
        trigger,
        watch,
        clearErrors,
        formState: { errors },
    } = useFormContext<UserFormPersonalDataBlockType>();

    const createExternalAccount = watch('createExternalAccount');

    const onCreateExternalAccountClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('createExternalAccount', e.target.checked);
    };

    const intern = watch('intern');

    const onInternClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('intern', e.target.checked);
    };

    const disableAccount = watch('disableAccount');

    const onDisableAccountClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('disableAccount', e.target.checked);
    };
    const onNameChange = () => {
        const login = loginAuto({
            firstName: getValues('firstName'),
            middleName: getValues('middleName'),
            surname: getValues('surname'),
        });
        setValue('login', login);
        setValue('corporateEmail', getCorporateEmail(login));
        setValue('email', getCorporateEmail(login));
    };

    const onLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('corporateEmail', getCorporateEmail(e.target.value));
        setValue('email', getCorporateEmail(e.target.value));
    };

    const onRoleChange = (r: Nullish<Role>) => {
        r && setValue('title', r.name);
        trigger('title');
    };

    const onEmailChange = () => {
        clearErrors('workEmail');
        clearErrors('personalEmail');
    };

    const onPhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        const asYouType = new AsYouType('RU');

        setValue('phone', asYouType.input(e.target.value));

        errors.phone && trigger('phone');
    };

    const getReadOnly = (key: keyof ReadOnlyMap) => {
        if (typeof readOnly === 'boolean') {
            return readOnly;
        }
        return Boolean(readOnly[key]);
    };

    const emailDomainSelectRef = useRef(null);

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Personal data')}
            </Text>
            {nullable(type === 'existing', () => (
                <div className={s.Checkbox}>
                    <Checkbox
                        readOnly={getReadOnly('createExternalAccount')}
                        label={tr('Create external account')}
                        checked={createExternalAccount}
                        onChange={onCreateExternalAccountClick}
                        className={s.CheckboxInput}
                    />
                </div>
            ))}
            {nullable(
                type === 'internal' ||
                    type === 'existing' ||
                    type === 'externalEmployee' ||
                    type === 'externalFromMainOrgEmployee',
                () => (
                    <div className={s.Checkbox}>
                        <Checkbox
                            readOnly={getReadOnly('intern')}
                            label={tr('Intern')}
                            checked={intern}
                            onChange={onInternClick}
                            className={s.CheckboxInput}
                        />
                    </div>
                ),
            )}
            {nullable(type === 'toDecree' || type === 'dismissal', () => (
                <div className={s.Checkbox}>
                    <Checkbox
                        readOnly={getReadOnly('disableAccount')}
                        label={tr('Disable account')}
                        checked={disableAccount}
                        onChange={onDisableAccountClick}
                        className={s.CheckboxInput}
                    />
                </div>
            ))}

            <div className={s.ThreeInputsRow}>
                <FormControl label={tr('Surname')} required error={errors.surname}>
                    <FormControlInput
                        readOnly={getReadOnly('surname')}
                        autoComplete="off"
                        size="m"
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
                        readOnly={getReadOnly('firstName')}
                        autoComplete="off"
                        size="m"
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
                        readOnly={getReadOnly('middleName')}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write second name')}
                        outline
                        value={getReadOnly('middleName') && !watch('middleName') ? tr('Not specified') : undefined}
                        {...register('middleName', {
                            required: tr('Required field'),
                            onChange: onNameChange,
                        })}
                    />
                </FormControl>
                <FormControl label={tr('Role')} required>
                    <RoleSelect
                        readOnly={getReadOnly('title')}
                        onChange={onRoleChange}
                        roleName={watch('title')}
                        error={errors.title}
                    />
                </FormControl>
                <FormControl label={tr('Phone')} required error={errors.phone}>
                    <FormControlInput
                        readOnly={getReadOnly('phone')}
                        autoComplete="off"
                        size="m"
                        placeholder="+7(___)__-__-___"
                        outline
                        {...register('phone', {
                            required: tr('Required field'),
                            onChange: onPhoneChange,
                            onBlur: () => trigger('phone'),
                        })}
                    />
                </FormControl>
                <FormControl label={tr('Login')} required error={errors.login}>
                    <FormControlInput
                        readOnly={getReadOnly('login')}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('In format vvivanov')}
                        outline
                        {...register('login', {
                            required: tr('Required field'),
                            onChange: onLoginChange,
                        })}
                    />
                </FormControl>
                {nullable(type === 'existing', () => (
                    <FormControl label={tr('Accouting ID')} error={errors.accountingId}>
                        <FormControlInput
                            readOnly={getReadOnly('accountingId')}
                            autoComplete="off"
                            size="m"
                            placeholder={tr('Enter ID')}
                            outline
                            {...register('accountingId')}
                        />
                    </FormControl>
                ))}
            </div>
            {nullable(
                type === 'internal' ||
                    type === 'existing' ||
                    type === 'fromDecree' ||
                    type === 'toDecree' ||
                    type === 'dismissal' ||
                    type === 'transferInternToStaff',
                () => (
                    <Text as="h3">
                        {tr('Email')}{' '}
                        <Text as="span" className={s.Required}>
                            *
                        </Text>
                    </Text>
                ),
            )}
            <div
                className={type === 'dismissal' || type === 'transferInternToStaff' ? s.ThreeInputsRow : s.TwoInputsRow}
            >
                {nullable(
                    type === 'internal' ||
                        type === 'externalEmployee' ||
                        type === 'existing' ||
                        type === 'fromDecree' ||
                        type === 'toDecree' ||
                        type === 'dismissal' ||
                        type === 'transferInternToStaff',
                    () => (
                        <FormControl
                            label={type === 'externalEmployee' ? tr('Personal email') : tr('Personal')}
                            error={errors.personalEmail}
                            required={type === 'externalEmployee'}
                        >
                            <FormControlInput
                                readOnly={getReadOnly('personalEmail')}
                                value={
                                    getReadOnly('personalEmail') && !watch('personalEmail')
                                        ? tr('Not specified')
                                        : undefined
                                }
                                autoComplete="off"
                                size="m"
                                placeholder="name@mail.com"
                                outline
                                {...register('personalEmail', { onChange: onEmailChange })}
                            />
                        </FormControl>
                    ),
                )}
                {nullable(
                    type === 'internal' ||
                        type === 'externalFromMainOrgEmployee' ||
                        type === 'existing' ||
                        type === 'fromDecree' ||
                        type === 'toDecree' ||
                        type === 'dismissal' ||
                        type === 'transferInternToStaff',
                    () => (
                        <FormControl
                            label={type === 'externalFromMainOrgEmployee' ? tr('Work email') : tr('Work')}
                            error={errors.workEmail}
                            required={type === 'externalFromMainOrgEmployee'}
                        >
                            <FormControlInput
                                readOnly={getReadOnly('workEmail')}
                                value={
                                    getReadOnly('workEmail') && !watch('workEmail') ? tr('Not specified') : undefined
                                }
                                autoComplete="off"
                                size="m"
                                placeholder="email@example.com"
                                outline
                                {...register('workEmail', { onChange: onEmailChange })}
                            />
                        </FormControl>
                    ),
                )}
                {nullable(type === 'dismissal' || type === 'transferInternToStaff', () => (
                    <FormControl label={tr('Corporate email')} error={errors.corporateEmail}>
                        <FormControlInput
                            readOnly={getReadOnly('corporateEmail')}
                            value={
                                getReadOnly('corporateEmail') && !watch('corporateEmail')
                                    ? tr('Not specified')
                                    : undefined
                            }
                            autoComplete="off"
                            size="m"
                            placeholder="email@example.com"
                            outline
                            {...register('corporateEmail')}
                        />
                    </FormControl>
                ))}
                {nullable(type === 'externalEmployee', () => (
                    <>
                        <div ref={emailDomainSelectRef}>
                            <FormControl label={tr('New email domain')} required>
                                <SelectTrigger size="m" view="outline" readOnly>
                                    {config.corporateEmailDomain}
                                </SelectTrigger>
                            </FormControl>
                        </div>
                        <Tooltip reference={emailDomainSelectRef} placement="bottom" arrow={false}>
                            {tr('This data cannot be edited')}
                        </Tooltip>
                    </>
                ))}
            </div>
        </div>
    );
};
