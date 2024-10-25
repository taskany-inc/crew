import React, { ChangeEvent } from 'react';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { useFormContext } from 'react-hook-form';
import { Role } from 'prisma/prisma-client';
import { AsYouType } from 'libphonenumber-js';

import { FormControl } from '../FormControl/FormControl';
import { RoleSelect } from '../RoleSelect/RoleSelect';
import { loginAuto } from '../../utils/createUserCreationRequest';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { Nullish } from '../../utils/types';

import s from './UserFormPersonalDataBlock.module.css';
import { tr } from './UserFormPersonalDataBlock.i18n';

interface UserFormPersonalDataBlockProps {
    className: string;
    id: string;
    onIsLoginUniqueChange?: (arg: string) => void;
}

interface PersonalDataBlockType {
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
}

export const UserFormPersonalDataBlock = ({ className, id, onIsLoginUniqueChange }: UserFormPersonalDataBlockProps) => {
    const {
        register,
        setValue,
        getValues,
        trigger,
        watch,
        clearErrors,
        formState: { errors },
    } = useFormContext<PersonalDataBlockType>();

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

    return (
        <div className={className} id={id}>
            <Text className={s.SectionHeader} weight="bold" size="lg">
                {tr('Personal data')}
            </Text>
            <div className={s.ThreeInputsRow}>
                <FormControl label={tr('Surname')} required error={errors.surname}>
                    <FormControlInput
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
                        autoComplete="off"
                        size="m"
                        placeholder={tr('Write second name')}
                        outline
                        {...register('middleName', {
                            required: tr('Required field'),
                            onChange: onNameChange,
                        })}
                    />
                </FormControl>
                <FormControl label={tr('Role')} required>
                    <RoleSelect onChange={onRoleChange} roleName={watch('title')} error={errors.title} />
                </FormControl>
                <FormControl label={tr('Phone')} required error={errors.phone}>
                    <FormControlInput
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
                        size="m"
                        placeholder="name@mail.com"
                        outline
                        {...register('personalEmail', { onChange: onEmailChange })}
                    />
                </FormControl>
                <FormControl label={tr('Work')} error={errors.workEmail}>
                    <FormControlInput
                        autoComplete="off"
                        size="m"
                        placeholder="email@example.com"
                        outline
                        {...register('workEmail', { onChange: onEmailChange })}
                    />
                </FormControl>
            </div>
        </div>
    );
};
