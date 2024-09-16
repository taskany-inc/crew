import { ChangeEvent, ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, FormAction, FormActions, FormInput, Text, nullable } from '@taskany/bricks';
import { Checkbox, FormControl, Tooltip } from '@taskany/bricks/harmony';
import { danger0, gray8 } from '@taskany/colors';
import { Group, OrganizationUnit, User } from '@prisma/client';
import { debounce } from 'throttle-debounce';
import { IconBulbOnOutline } from '@taskany/icons';

import {
    CreateUserCreationRequestExternalEmployee,
    createUserCreationRequestExternalEmployeeSchema,
} from '../../modules/userCreationRequestSchemas';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { useBoolean } from '../../hooks/useBoolean';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { File } from '../../modules/attachTypes';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { attachFormatter } from '../../utils/attachFormatter';
import { pages } from '../../hooks/useRouter';
import { AttachItem } from '../AttachItem/AttachItem';
import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { FormControlEditor } from '../FormControlEditorForm/FormControlEditorForm';
import { loginAuto } from '../../utils/createUserCreationRequest';

import s from './CreateUserCreationRequestExternalEmployeeForm.module.css';
import { tr } from './CreateUserCreationRequestExternalEmployeeForm.i18n';

interface CreateUserCreationRequestExternalEmployeeFormProps {
    onClose: VoidFunction;
    onSubmit: VoidFunction;
}

const defaultValues: Partial<CreateUserCreationRequestExternalEmployee> = {
    type: 'externalEmployee',
    attachIds: [] as unknown as [string, ...string[]],
    createExternalAccount: true,
    accessToInternalSystems: false,
};

export const CreateUserCreationRequestExternalEmployeeForm = ({
    onClose,
    onSubmit,
}: CreateUserCreationRequestExternalEmployeeFormProps) => {
    const { createUserCreationRequest } = useUserCreationRequestMutations();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        setError,
        clearErrors,
        trigger,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateUserCreationRequestExternalEmployee>({
        defaultValues,
        resolver: zodResolver(createUserCreationRequestExternalEmployeeSchema),
    });

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

    const [files, setFiles] = useState<File[]>([]);

    const onExternalOrganizationSupervisorSelect: ComponentProps<typeof UserComboBox>['onChange'] = (user) => {
        if (!user) return;
        if (user.login) {
            setValue('externalOrganizationSupervisorLogin', user.login);
            trigger('externalOrganizationSupervisorLogin');
        } else {
            setError('externalOrganizationSupervisorLogin', {
                message: tr('This user does not have a login defined'),
            });
        }
    };

    const accessToInternalSystems = watch('accessToInternalSystems');

    const onAccessToInternalSystemsClick = (e: ChangeEvent<HTMLInputElement>) => {
        setValue('accessToInternalSystems', e.target.checked);
    };

    const onFormSubmit = handleSubmit(async (data) => {
        await createUserCreationRequest(data);
        reset(defaultValues);
        onSubmit();
    });

    const closeAndReset = () => {
        reset(defaultValues);
        onClose();
    };

    const formatter = useCallback(
        (f: Array<{ filePath: string; name: string; type: string }>) =>
            attachFormatter(f, setFiles, (ids) => setValue('attachIds', ids as [string, ...string[]])),
        [],
    );

    const onOrganizationChange = (group: Nullish<OrganizationUnit>) => {
        group && setValue('organizationUnitId', group.id);
        trigger('organizationUnitId');
    };

    const onTeamChange = (group: Nullish<Group>) => {
        group && setValue('groupId', group.id);
        trigger('groupId');
    };

    const onSupervisorChange = (user: Nullish<User>) => {
        user && setValue('supervisorId', user.id);
        trigger('supervisorId');
    };

    const onAttachRemove = (file: File) => {
        setFiles(files.filter(({ id }) => id !== file.id));
        setValue('attachIds', files.filter(({ id }) => id !== file.id).map(({ id }) => id) as [string, ...string[]]);
    };

    const loginTooltipRef = useRef(null);

    return (
        <Form onSubmit={onFormSubmit}>
            <div className={s.NoWrap}>
                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Organization:')}
                    </Text>
                    <OrganizationUnitComboBox onChange={onOrganizationChange} searchType="external" />
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
                    {...register('surname', { required: tr('Required field'), onChange: onNameChange })}
                    error={errors.surname}
                />

                <FormInput
                    label={tr('First name')}
                    brick="right"
                    autoComplete="off"
                    {...register('firstName', { required: tr('Required field'), onChange: onNameChange })}
                    error={errors.firstName}
                />

                <FormInput
                    label={tr('Middle name')}
                    brick="right"
                    autoComplete="off"
                    {...register('middleName', { onChange: onNameChange })}
                />

                <FormInput
                    label={tr('Role')}
                    brick="right"
                    autoComplete="off"
                    {...register('title')}
                    error={errors.title}
                />

                <FormInput
                    label={tr('Email')}
                    brick="right"
                    autoComplete="off"
                    {...register('email', { required: tr('Required field') })}
                    error={errors.email}
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
                    />
                ))}

                <FormInput
                    label={tr('OS preference')}
                    brick="right"
                    autoComplete="off"
                    {...register('osPreference')}
                    error={errors.osPreference}
                />

                <FormInput
                    label={tr('Phone')}
                    brick="right"
                    autoComplete="off"
                    {...register('phone')}
                    error={errors.phone}
                />

                <FormInput
                    label={tr('Accounting id')}
                    brick="right"
                    autoComplete="off"
                    {...register('accountingId')}
                    error={errors.accountingId}
                />

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Supervisor:')}
                    </Text>
                    <UserComboBox onChange={onSupervisorChange} />
                    {nullable(errors.supervisorId, (e) => (
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

                <div className={cn(s.InputContainer, s.Wrap)}>
                    <Text weight="bold" color={gray8}>
                        {tr('External organization supervisor:')}
                    </Text>
                    <UserComboBox onChange={onExternalOrganizationSupervisorSelect} />
                    {nullable(errors.externalOrganizationSupervisorLogin, (e) => (
                        <Text size="xs" color={danger0}>
                            {e.message}
                        </Text>
                    ))}
                </div>

                <div className={s.InputContainer}>
                    <Text weight="bold" color={gray8}>
                        {tr('Access to internal systems:')}
                    </Text>
                    <Checkbox checked={accessToInternalSystems} onChange={onAccessToInternalSystemsClick} />
                </div>

                <div className={s.DateContainer}>
                    <FormInput
                        label={tr('Date')}
                        type="date"
                        autoComplete="off"
                        onChange={(e) => e.target.valueAsDate && setValue('date', e.target.valueAsDate)}
                        className={s.Date}
                    />
                </div>

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
                        placeholder={tr("Don't forget to attach NDA for external employee")}
                        uploadLink={pages.attaches}
                        onChange={(e) => setValue('comment', e)}
                        attachFormatter={formatter}
                    />
                </FormControl>

                {files.map((file) => (
                    <AttachItem file={file} key={file.id} onRemove={() => onAttachRemove(file)} />
                ))}
                {nullable(errors.attachIds, (e) => (
                    <Text color={danger0}>{e.message}</Text>
                ))}
            </div>

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
        </Form>
    );
};
