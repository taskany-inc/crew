import { useForm } from 'react-hook-form';
import { User, OrganizationUnit } from '@prisma/client';
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
    FormTextarea,
    FormTitle,
    MenuItem,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    nullable,
} from '@taskany/bricks';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { gapM, gapS, gray9 } from '@taskany/colors';
import { useRouter } from 'next/router';

import {
    CreateScheduledDeactivation,
    createScheduledDeactivationSchema,
} from '../../modules/scheduledDeactivationSchemas';
import { UserSupervisor } from '../../modules/userTypes';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { Nullish } from '../../utils/types';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { useScheduledDeactivation } from '../../modules/scheduledDeactivationHooks';
import { DeviceInScheduleDeactivationForm } from '../DeviceInScheduleDeactivation/DeviceInScheduleDeactivation';
import { trpc } from '../../trpc/trpcClient';

import { tr } from './NewScheduleDeactivationForm.i18n';

const StyledInputContainer = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    padding: ${gapS} ${gapM};
`;

const StyledModal = styled(Modal)`
    overflow-y: auto;
    height: 1500px;
`;

const StyledLabel = styled(Text)`
    margin-left: ${gapM};
    color: ${gray9};
`;

const StyledFormInput = styled(FormInput)`
    width: 60%;
`;

interface NewScheduleDeactivationFormProps {
    user: User & UserSupervisor;
    visible: boolean;
    onClose: VoidFunction;
    organization?: Nullish<OrganizationUnit>;
    orgGroupName?: string;
    orgRoles?: string;
}

interface DefaultValues {
    userId: string;
    email: string;
    teamLead?: string;
    organization?: string;
    organizationalGroup?: string;
    organizationRole?: string;
}

export const NewScheduleDeactivationForm = ({
    user,
    visible,
    onClose,
    organization,
    orgGroupName,
    orgRoles,
}: NewScheduleDeactivationFormProps) => {
    const { createScheduledDeactivation } = useScheduledDeactivation();

    const { asPath } = useRouter();

    const userDeviceQuery = trpc.device.getUserDevices.useQuery(user.id);

    const userDevices = userDeviceQuery.data || [];
    const initTestingDevices = userDevices.map((device) => ({ name: device.deviceName, id: device.deviceId }));

    const userServiceQuery = trpc.service.getUserServices.useQuery(user.id);
    const phone = userServiceQuery.data?.find((s) => s.serviceName === 'Phone')?.serviceId;

    const defaultValues: DefaultValues = {
        userId: user.id,
        email: user.email,
        teamLead: user.supervisor?.name || undefined,
        organization: organization ? getOrgUnitTitle(organization) : undefined,
        organizationalGroup: orgGroupName,
        organizationRole: orgRoles,
    };
    const {
        reset,
        handleSubmit,
        setValue,
        register,
        watch,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateScheduledDeactivation>({
        resolver: zodResolver(createScheduledDeactivationSchema),
        defaultValues: { ...defaultValues, type: 'retirement', disableAccount: true },
    });

    useEffect(() => {
        phone && setValue('phone', phone);
        setValue('testingDevices', initTestingDevices);
    }, [phone, initTestingDevices, setValue]);

    useEffect(() => {
        reset({ ...defaultValues, type: 'retirement', disableAccount: true });
    }, [asPath]);

    const hideModal = useCallback(() => {
        onClose();
        reset();
    }, [onClose, reset]);

    const onSubmit = handleSubmit(async (data) => {
        await createScheduledDeactivation({
            ...data,
        });
        hideModal();
    });

    const onTypeChange = useCallback(
        (type: string) => {
            if (type === 'retirement') {
                setValue('type', 'retirement');
                setValue('disableAccount', true);
                setValue('newOrganizationRole', undefined);
                setValue('newTeamLead', undefined);
                setValue('newOrganizationalGroup', undefined);
            }
            if (type === 'transfer') {
                setValue('type', 'transfer');
            }
        },
        [setValue],
    );

    const workModeItems = [tr('Office'), tr('Mixed'), tr('Remote')].map((m) => ({
        title: m,
        action: () => setValue('workMode', m),
    }));
    const deactivationRadioValues = [
        { label: tr('Retirement'), value: 'retirement' },
        { label: tr('Transfer'), value: 'transfer' },
    ];
    return (
        <StyledModal visible={visible} onClose={hideModal} width={700}>
            <ModalHeader>
                <FormTitle>
                    {tr('Schedule profile deactivation for {userName}', { userName: user.name || user.email })}
                </FormTitle>
                <ModalCross onClick={hideModal} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    <FormRadio label={tr('Type')} name="type" value={watch('type')} onChange={(v) => onTypeChange(v)}>
                        {deactivationRadioValues.map(({ value, label }) => (
                            <FormRadioInput key={value} value={value} label={label} />
                        ))}
                    </FormRadio>
                    {nullable(watch('type') === 'transfer', () => (
                        <StyledInputContainer>
                            <Text weight="bold" color={gray9}>
                                {tr('Disable account')}
                            </Text>
                            <input type="checkbox" {...register('disableAccount')} />
                        </StyledInputContainer>
                    ))}

                    <StyledFormInput
                        type="date"
                        error={errors.deactivateDate}
                        autoComplete="off"
                        onChange={(e) => e.target.valueAsDate && setValue('deactivateDate', e.target.valueAsDate)}
                    />
                    <StyledLabel weight="bold">{tr('Email')}</StyledLabel>
                    <StyledFormInput error={errors.email} autoComplete="off" {...register('email')} />
                    <StyledLabel weight="bold">{tr('Organization')}</StyledLabel>
                    <OrganizationUnitComboBox
                        organizationUnit={organization}
                        onChange={(group) => group && setValue('organization', getOrgUnitTitle(group))}
                        inline
                        error={errors.organization}
                    />
                    <StyledLabel weight="bold">{tr('TeamLead')}</StyledLabel>
                    <StyledFormInput error={errors.teamLead} autoComplete="off" {...register('teamLead')} />
                    {nullable(watch('type') === 'transfer', () => (
                        <>
                            <StyledLabel weight="bold">{tr('New teamlead')}</StyledLabel>
                            <StyledFormInput
                                error={errors.newTeamLead}
                                autoComplete="off"
                                {...register('newTeamLead')}
                            />
                            <StyledLabel weight="bold">{tr('Transfer to')}</StyledLabel>
                            <OrganizationUnitComboBox
                                onChange={(group) => group && setValue('newOrganization', getOrgUnitTitle(group))}
                                inline
                                error={
                                    !watch('newOrganization') && errors.newOrganization
                                        ? errors.newOrganization
                                        : undefined
                                }
                            />
                            <StyledLabel weight="bold">{tr('Organizational role')}</StyledLabel>
                            <StyledFormInput
                                error={errors.organizationRole}
                                autoComplete="off"
                                {...register('organizationRole')}
                            />
                            <StyledLabel weight="bold">{tr('New organizational role')}</StyledLabel>
                            <StyledFormInput
                                error={errors.newOrganizationRole}
                                autoComplete="off"
                                {...register('newOrganizationRole')}
                            />
                            <StyledLabel weight="bold">{tr('Organizational group')}</StyledLabel>
                            <StyledFormInput
                                error={errors.organizationalGroup}
                                autoComplete="off"
                                {...register('organizationalGroup')}
                            />
                            <StyledLabel weight="bold">{tr('New organizational group')}</StyledLabel>
                            <StyledFormInput
                                error={errors.newOrganizationalGroup}
                                autoComplete="off"
                                {...register('newOrganizationalGroup')}
                            />
                            <StyledLabel weight="bold">{tr('Transfer percentage')}</StyledLabel>
                            <StyledFormInput
                                error={errors.transferPercentage}
                                type="number"
                                autoComplete="off"
                                onChange={(e) => setValue('transferPercentage', Number(e.target.value))}
                            />
                        </>
                    ))}
                    <StyledLabel weight="bold">{tr('Phone')}</StyledLabel>
                    <StyledFormInput error={errors.phone} autoComplete="off" {...register('phone')} />
                    <StyledLabel weight="bold">{tr('Location')}</StyledLabel>
                    <StyledFormInput flat="top" autoComplete="off" error={errors.location} {...register('location')} />
                    <StyledLabel weight="bold">{tr('Work mode')}</StyledLabel>
                    <Dropdown
                        onChange={(item) => item.action()}
                        text="Work mode"
                        items={workModeItems}
                        renderTrigger={(props) => (
                            <FormInput
                                value={watch('workMode')}
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
                    <StyledLabel weight="bold">{tr('Work mode comment')}</StyledLabel>

                    <StyledFormInput
                        error={errors.workModeComment}
                        autoComplete="off"
                        {...register('workModeComment')}
                    />
                    <StyledLabel weight="bold">{tr('Unit ID')}</StyledLabel>
                    <StyledFormInput
                        error={errors.unitId}
                        type="number"
                        autoComplete="off"
                        onChange={(e) => setValue('unitId', Number(e.target.value))}
                    />
                    <DeviceInScheduleDeactivationForm
                        initialDevices={initTestingDevices}
                        label={tr('Testing devices')}
                        onDeviceAdd={(devices) => setValue('testingDevices', devices)}
                    />

                    <DeviceInScheduleDeactivationForm
                        initialDevices={[]}
                        label={tr('Devices')}
                        onDeviceAdd={(devices) => setValue('devices', devices)}
                    />
                    <FormTextarea minHeight={180} autoComplete="off" {...register('comments')} />
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button type="button" text={tr('Cancel')} onClick={hideModal} />
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
            </ModalContent>
        </StyledModal>
    );
};
