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

interface UserFormPersonalDataBlockProps {
    className: string;
    id: string;
    onIsLoginUniqueChange?: (arg: string) => void;
    type: 'internal' | 'existing' | 'externalEmployee' | 'externalFromMainOrgEmployee';
    readOnly?: boolean;
    defaultValue?: UserFormPersonalDataBlockType;
}

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
    accountingId?: string;
}

export const UserFormPersonalDataBlock = ({
    className,
    id,
    onIsLoginUniqueChange,
    type,
    readOnly,
}: UserFormPersonalDataBlockProps) => {
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
    const onNameChange = () => {
        const login = loginAuto({
            firstName: getValues('firstName'),
            middleName: getValues('middleName'),
            surname: getValues('surname'),
        });
        onIsLoginUniqueChange && onIsLoginUniqueChange(login);
        setValue('login', login);
        setValue('corporateEmail', getCorporateEmail(login));
        setValue('email', getCorporateEmail(login));
    };

    const onLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
        onIsLoginUniqueChange && onIsLoginUniqueChange(e.target.value);
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

    const emailDomainSelectRef = useRef(null);

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Personal data')}
            </Text>
            {nullable(type === 'existing', () => (
                <div className={s.Checkbox}>
                    <Checkbox
                        readOnly={readOnly}
                        label={tr('Create external account')}
                        checked={createExternalAccount}
                        onChange={onCreateExternalAccountClick}
                    />
                </div>
            ))}
            <div className={s.ThreeInputsRow}>
                <FormControl label={tr('Surname')} required error={errors.surname}>
                    <FormControlInput
                        readOnly={readOnly}
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
                        readOnly={readOnly}
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
                        readOnly={readOnly}
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write second name')}
                        outline
                        value={readOnly && !watch('middleName') ? tr('Not specified') : undefined}
                        {...register('middleName', {
                            required: tr('Required field'),
                            onChange: onNameChange,
                        })}
                    />
                </FormControl>
                <FormControl label={tr('Role')} required>
                    <RoleSelect
                        readOnly={readOnly}
                        onChange={onRoleChange}
                        roleName={watch('title')}
                        error={errors.title}
                    />
                </FormControl>
                <FormControl label={tr('Phone')} required error={errors.phone}>
                    <FormControlInput
                        readOnly={readOnly}
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
                        readOnly={readOnly}
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
                            readOnly={readOnly}
                            autoComplete="off"
                            size="m"
                            placeholder={tr('Enter ID')}
                            outline
                            {...register('accountingId')}
                        />
                    </FormControl>
                ))}
            </div>
            {nullable(type === 'internal' || type === 'existing', () => (
                <Text as="h3">
                    {tr('Email')}{' '}
                    <Text as="span" className={s.Required}>
                        *
                    </Text>
                </Text>
            ))}
            <div className={s.TwoInputsRow}>
                {nullable(type === 'internal' || type === 'externalEmployee' || type === 'existing', () => (
                    <FormControl
                        label={type === 'internal' || type === 'existing' ? tr('Personal') : tr('Personal email')}
                        error={errors.personalEmail}
                        required={type === 'externalEmployee'}
                    >
                        <FormControlInput
                            readOnly={readOnly}
                            value={readOnly && !watch('personalEmail') ? tr('Not specified') : undefined}
                            autoComplete="off"
                            size="m"
                            placeholder="name@mail.com"
                            outline
                            {...register('personalEmail', { onChange: onEmailChange })}
                        />
                    </FormControl>
                ))}
                {nullable(type === 'internal' || type === 'externalFromMainOrgEmployee' || type === 'existing', () => (
                    <FormControl
                        label={type === 'internal' || type === 'existing' ? tr('Work') : tr('Work email')}
                        error={errors.workEmail}
                        required={type === 'externalFromMainOrgEmployee'}
                    >
                        <FormControlInput
                            readOnly={readOnly}
                            value={readOnly && !watch('workEmail') ? tr('Not specified') : undefined}
                            autoComplete="off"
                            size="m"
                            placeholder="email@example.com"
                            outline
                            {...register('workEmail', { onChange: onEmailChange })}
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
