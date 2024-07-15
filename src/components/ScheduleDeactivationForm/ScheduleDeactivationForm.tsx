import { useForm } from 'react-hook-form';
import { OrganizationUnit, ScheduledDeactivation } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Dropdown,
    Form,
    FormAction,
    FormActions,
    FormEditor,
    FormInput,
    FormRadio,
    FormRadioInput,
    FormTitle,
    MenuItem,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    nullable,
} from '@taskany/bricks';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { danger0, gapM, gapS, gray9 } from '@taskany/colors';
import { useRouter } from 'next/router';

import {
    CreateScheduledDeactivation,
    createScheduledDeactivationSchema,
} from '../../modules/scheduledDeactivationSchemas';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { Nullish } from '../../utils/types';
import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { useScheduledDeactivation } from '../../modules/scheduledDeactivationHooks';
import { DeviceInScheduleDeactivationForm } from '../DeviceInScheduleDeactivation/DeviceInScheduleDeactivation';
import { trpc } from '../../trpc/trpcClient';
import {
    AdditionalDevice,
    ScheduledDeactivationAttaches,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationOrganizationUnit,
    ScheduledDeactivationUser,
    scheduleDeactivateType,
} from '../../modules/scheduledDeactivationTypes';
import { pages } from '../../hooks/useRouter';
import { File } from '../../modules/attachTypes';
import { AttachItem } from '../AttachItem/AttachItem';
import { UserComboBox } from '../UserComboBox/UserComboBox';
import { attachFormatter } from '../../utils/attachFormatter';

import { tr } from './ScheduleDeactivationForm.i18n';

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

const StyledUserComboBox = styled.div`
    margin: ${gapS} ${gapM};
    width: 250px;
`;

interface ScheduleDeactivationFormProps {
    userId: string;
    visible: boolean;
    onClose: VoidFunction;
    organization?: Nullish<OrganizationUnit>;
    orgGroupName?: string;
    orgRoles?: string;
    scheduledDeactivation?: ScheduledDeactivation &
        ScheduledDeactivationUser &
        ScheduledDeactivationOrganizationUnit &
        ScheduledDeactivationNewOrganizationUnit &
        ScheduledDeactivationAttaches;
}

export const ScheduleDeactivationForm = ({
    userId,
    visible,
    onClose,
    organization,
    orgGroupName,
    orgRoles,
    scheduledDeactivation,
}: ScheduleDeactivationFormProps) => {
    const { createScheduledDeactivation, editScheduledDeactivation } = useScheduledDeactivation();
    const { asPath } = useRouter();
    const userQuery = trpc.user.getById.useQuery(userId);
    const user = userQuery.data;

    const [files, setFiles] = useState<File[]>(
        scheduledDeactivation?.attaches.map(({ id, filename }) => ({ id, name: filename })) || [],
    );

    const userDeviceQuery = trpc.device.getUserDevices.useQuery(userId);

    const userDevices = userDeviceQuery.data || [];
    const initTestingDevices: AdditionalDevice[] = scheduledDeactivation?.testingDevices
        ? JSON.parse(scheduledDeactivation.testingDevices as string)
        : userDevices.map((device) => ({ name: device.deviceName, id: device.deviceId }));

    const initDevices: AdditionalDevice[] =
        (scheduledDeactivation?.devices && JSON.parse(scheduledDeactivation.devices as string)) || [];

    const userServiceQuery = trpc.service.getUserServices.useQuery(userId);
    const phone = userServiceQuery.data?.find((s) => s.serviceName === 'Phone')?.serviceId;

    const defaultValuesBase = {
        userId,
        deactivateDate: scheduledDeactivation?.deactivateDate || undefined,
        email: scheduledDeactivation?.email || user?.email,
        teamLead: scheduledDeactivation?.teamLead || user?.supervisor?.name || undefined,
        teamLeadId: scheduledDeactivation?.teamLeadId || user?.supervisor?.id || undefined,
        organizationUnitId: scheduledDeactivation?.organizationUnitId || organization?.id,
        organization: scheduledDeactivation?.organization || (organization ? getOrgUnitTitle(organization) : undefined),
        organizationalGroup: scheduledDeactivation?.organizationalGroup || orgGroupName,
        organizationRole: scheduledDeactivation?.organizationRole || orgRoles,
        newOrganizationUnitId: scheduledDeactivation?.newOrganizationUnitId || undefined,
        newOrganizationalGroup: scheduledDeactivation?.newOrganizationalGroup || undefined,
        newOrganizationRole: scheduledDeactivation?.newOrganizationRole || undefined,
        newTeamLeadId: scheduledDeactivation?.newTeamLeadId || undefined,
        newTeamLead: scheduledDeactivation?.newTeamLead || undefined,
        phone: scheduledDeactivation?.phone || phone || undefined,
        workMode: scheduledDeactivation?.workMode || undefined,
        workModeComment: scheduledDeactivation?.workModeComment || undefined,
        comments: scheduledDeactivation?.comments || undefined,
        location: scheduledDeactivation?.location || undefined,
        unitId: scheduledDeactivation?.unitId || undefined,
        devices: initDevices,
        testingDevices: initTestingDevices,
    };
    const defaultValues =
        scheduledDeactivation?.type === scheduleDeactivateType[1]
            ? {
                  ...defaultValuesBase,
                  disableAccount: !!scheduledDeactivation?.disableAccount,
                  type: scheduleDeactivateType[1],
                  transferPercentage: scheduledDeactivation?.transferPercentage || undefined,
              }
            : { ...defaultValuesBase, type: scheduleDeactivateType[0], disableAccount: true };

    const {
        reset,
        handleSubmit,
        setValue,
        register,
        watch,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateScheduledDeactivation>({
        resolver: zodResolver(createScheduledDeactivationSchema),
        defaultValues,
    });

    const teamLeadQuery = trpc.user.getById.useQuery(String(scheduledDeactivation?.teamLeadId), {
        enabled: !!scheduledDeactivation?.teamLeadId,
    });

    const newTeamLeadQuery = trpc.user.getById.useQuery(String(scheduledDeactivation?.newTeamLeadId), {
        enabled: !!scheduledDeactivation?.newTeamLeadId,
    });

    useEffect(() => {
        if (!scheduledDeactivation) {
            phone && setValue('phone', phone);
            setValue('testingDevices', initTestingDevices);
        }
    }, [phone, initTestingDevices, setValue, scheduledDeactivation]);

    useEffect(() => {
        reset(defaultValues);
    }, [asPath]);

    const hideModal = useCallback(() => {
        onClose();
        reset(defaultValues);
    }, [onClose, reset]);

    const onSubmit = handleSubmit(async (data) => {
        scheduledDeactivation
            ? await editScheduledDeactivation({
                  id: scheduledDeactivation.id,
                  ...data,
                  attachIds: files.map(({ id }) => id),
              })
            : await createScheduledDeactivation({
                  ...data,
                  attachIds: files.map(({ id }) => id),
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

    const formatter = useCallback(
        (f: Array<{ filePath: string; name: string; type: string }>) => attachFormatter(f, setFiles),
        [],
    );

    return (
        <StyledModal visible={visible} onClose={hideModal} width={700}>
            <ModalHeader>
                <FormTitle>
                    {tr('Schedule profile deactivation for {userName}', {
                        userName: user?.name || (user?.email as string),
                    })}
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
                        defaultValue={scheduledDeactivation?.deactivateDate.toISOString().split('T')[0]}
                        type="date"
                        error={errors.deactivateDate}
                        autoComplete="off"
                        onChange={(e) => e.target.valueAsDate && setValue('deactivateDate', e.target.valueAsDate)}
                    />
                    <StyledLabel weight="bold">{tr('Email')}</StyledLabel>
                    <StyledFormInput error={errors.email} autoComplete="off" {...register('email')} />
                    <StyledLabel weight="bold">{tr('Organization')}</StyledLabel>
                    <OrganizationUnitComboBox
                        organizationUnit={scheduledDeactivation?.organizationUnit || organization}
                        onChange={(group) => group && setValue('organizationUnitId', group.id)}
                        inline
                        error={errors.organizationUnitId}
                    />
                    <StyledLabel weight="bold">{tr('TeamLead')}</StyledLabel>
                    <StyledUserComboBox>
                        <UserComboBox
                            user={user?.supervisor || teamLeadQuery?.data}
                            onChange={(u) => {
                                if (u) {
                                    setValue('teamLead', u.name || u.email);
                                    setValue('teamLeadId', u.id);
                                }
                            }}
                        />
                    </StyledUserComboBox>

                    {nullable(errors.teamLead && !watch('teamLead'), () => (
                        <Text color={danger0} size="s">
                            {errors.teamLead?.message}
                        </Text>
                    ))}
                    {nullable(watch('type') === 'transfer', () => (
                        <>
                            <StyledLabel weight="bold">{tr('New teamlead')}</StyledLabel>
                            <StyledUserComboBox>
                                <UserComboBox
                                    user={newTeamLeadQuery?.data}
                                    onChange={(u) => {
                                        if (u) {
                                            setValue('newTeamLead', u.name || u.email);
                                            setValue('newTeamLeadId', u.id);
                                        }
                                    }}
                                />
                                {nullable(errors.newTeamLead && !watch('newTeamLead'), () => (
                                    <Text color={danger0} size="s">
                                        {errors.newTeamLead?.message}
                                    </Text>
                                ))}
                            </StyledUserComboBox>
                            <StyledLabel weight="bold">{tr('Transfer to')}</StyledLabel>
                            <OrganizationUnitComboBox
                                onChange={(group) => group && setValue('newOrganizationUnitId', group.id)}
                                inline
                                organizationUnit={scheduledDeactivation?.newOrganizationUnit}
                                error={
                                    !watch('newOrganizationUnitId') && errors.newOrganizationUnitId
                                        ? errors.newOrganizationUnitId
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
                        defaultValue={scheduledDeactivation?.unitId}
                        onChange={(e) => setValue('unitId', Number(e.target.value))}
                    />
                    <DeviceInScheduleDeactivationForm
                        initialDevices={initTestingDevices}
                        label={tr('Testing devices')}
                        onDeviceAdd={(devices) => setValue('testingDevices', devices)}
                    />

                    <DeviceInScheduleDeactivationForm
                        initialDevices={initDevices}
                        label={tr('Devices')}
                        onDeviceAdd={(devices) => setValue('devices', devices)}
                    />
                    <FormEditor
                        uploadLink={pages.attaches}
                        onChange={(e) => setValue('comments', e)}
                        attachFormatter={formatter}
                    />
                    {files.map((file) => (
                        <AttachItem
                            file={file}
                            key={file.id}
                            onRemove={() => setFiles(files.filter(({ id }) => id !== file.id))}
                        />
                    ))}
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
