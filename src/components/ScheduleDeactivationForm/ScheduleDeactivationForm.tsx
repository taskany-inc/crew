import { Controller, useForm } from 'react-hook-form';
import { OrganizationUnit, ScheduledDeactivation } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormInput,
    FormTitle,
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
import { attachFormatter } from '../../utils/attachFormatter';
import { FormControlEditor } from '../FormControlEditorForm/FormControlEditorForm';
import { FormControl } from '../FormControl/FormControl';
import { WorkModeCombobox } from '../WorkModeCombobox/WorkModeCombobox';
import { ExternalServiceName, findService } from '../../utils/externalServices';

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
    const phone = findService(ExternalServiceName.Phone, userServiceQuery.data);

    const defaultValuesBase = {
        userId,
        type: scheduleDeactivateType[1],
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
        workSpace: scheduledDeactivation?.workPlace || undefined,
        comments: scheduledDeactivation?.comments || undefined,
        location: scheduledDeactivation?.location || undefined,
        unitId: scheduledDeactivation?.unitId || undefined,
        unitIdString: scheduledDeactivation?.unitIdString || undefined,
        devices: initDevices,
        testingDevices: initTestingDevices,
        transferPercentage: scheduledDeactivation?.transferPercentage || undefined,
        lineManagerIds: [],
    };
    const defaultValues =
        !scheduledDeactivation || scheduledDeactivation?.type === scheduleDeactivateType[1]
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
        trigger,
        control,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<CreateScheduledDeactivation>({
        resolver: zodResolver(createScheduledDeactivationSchema()),
        defaultValues,
    });
    useEffect(() => {
        if (!scheduledDeactivation) {
            phone && setValue('phone', phone);
            initTestingDevices.length && setValue('testingDevices', initTestingDevices);
        }
    }, [phone, setValue, initTestingDevices, scheduledDeactivation]);

    useEffect(() => {
        reset(defaultValues);
    }, [asPath]);

    const hideModal = useCallback(() => {
        onClose();
        reset(defaultValues);
    }, [onClose, reset]);

    const onSubmit = handleSubmit(async (data) => {
        scheduledDeactivation
            ? await editScheduledDeactivation({ id: scheduledDeactivation.id, ...data })
            : await createScheduledDeactivation(data);
        hideModal();
    });

    const formatter = useCallback(
        (f: Array<{ filePath: string; name: string; type: string }>) =>
            attachFormatter(f, setFiles, (ids) => setValue('attachIds', ids as [string, ...string[]])),
        [],
    );

    const onAttachRemove = (file: File) => {
        setFiles(files.filter(({ id }) => id !== file.id));
        setValue('attachIds', files.filter(({ id }) => id !== file.id).map(({ id }) => id) as [string, ...string[]]);
    };

    const deactivateDate = watch('deactivateDate');

    const onWorkModeChange = (mode: string) => {
        setValue('workMode', mode);
        trigger('workMode');
    };

    return (
        <StyledModal visible={visible} onClose={hideModal} width={700}>
            <ModalHeader>
                <FormTitle>
                    {tr('Schedule transfer for {userName}', {
                        userName: user?.name || (user?.email as string),
                    })}
                </FormTitle>
                <ModalCross onClick={hideModal} />
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={onSubmit}>
                    {nullable(watch('type') === 'transfer', () => (
                        <StyledInputContainer>
                            <Text weight="bold" color={gray9}>
                                {tr('Disable account')}
                            </Text>
                            <input type="checkbox" {...register('disableAccount')} />
                        </StyledInputContainer>
                    ))}

                    <StyledFormInput
                        value={deactivateDate ? deactivateDate.toISOString().split('T')[0] : undefined}
                        type="date"
                        error={errors.deactivateDate}
                        autoComplete="off"
                        onChange={(e) => e.target.valueAsDate && setValue('deactivateDate', e.target.valueAsDate)}
                    />
                    <StyledLabel weight="bold">{tr('Email')}</StyledLabel>
                    <StyledFormInput error={errors.email} autoComplete="off" {...register('email')} />
                    <StyledLabel weight="bold">{tr('Organization')}</StyledLabel>
                    <OrganizationUnitComboBox
                        organizationUnitId={watch('organizationUnitId')}
                        onChange={(group) => group && setValue('organizationUnitId', group.id)}
                        inline
                        error={errors.organizationUnitId}
                    />
                    <StyledLabel weight="bold">{tr('TeamLead')}</StyledLabel>
                    <StyledFormInput error={errors.teamLead} autoComplete="off" {...register('teamLead')} />

                    {nullable(errors.teamLead && !watch('teamLead'), () => (
                        <Text color={danger0} size="s">
                            {errors.teamLead?.message}
                        </Text>
                    ))}
                    {nullable(watch('type') === 'transfer', () => (
                        <>
                            <StyledLabel weight="bold">{tr('New teamlead')}</StyledLabel>
                            <StyledFormInput
                                error={errors.newTeamLead}
                                autoComplete="off"
                                {...register('newTeamLead')}
                            />
                            {nullable(errors.newTeamLead && !watch('newTeamLead'), () => (
                                <Text color={danger0} size="s">
                                    {errors.newTeamLead?.message}
                                </Text>
                            ))}
                            <StyledLabel weight="bold">{tr('Transfer to')}</StyledLabel>
                            <OrganizationUnitComboBox
                                onChange={(group) => group && setValue('newOrganizationUnitId', group.id)}
                                inline
                                organizationUnitId={watch('newOrganizationUnitId')}
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
                                value={watch('transferPercentage')}
                                onChange={(e) => setValue('transferPercentage', Number(e.target.value))}
                            />
                        </>
                    ))}
                    <StyledLabel weight="bold">{tr('Phone')}</StyledLabel>
                    <StyledFormInput error={errors.phone} autoComplete="off" {...register('phone')} />
                    <StyledLabel weight="bold">{tr('Location')}</StyledLabel>
                    <StyledFormInput flat="top" autoComplete="off" error={errors.location} {...register('location')} />
                    <StyledLabel weight="bold">{tr('Work mode')}</StyledLabel>
                    <WorkModeCombobox onChange={onWorkModeChange} value={watch('workMode')} error={errors.workMode} />
                    <StyledLabel weight="bold">{tr('Work place')}</StyledLabel>
                    <StyledFormInput error={errors.workSpace} autoComplete="off" {...register('workSpace')} />
                    <StyledLabel weight="bold">{tr('Unit ID')}</StyledLabel>
                    <StyledFormInput error={errors.unitIdString} autoComplete="off" {...register('unitIdString')} />
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
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => (
                            <FormControl>
                                <FormControlEditor uploadLink={pages.attaches} {...field} attachFormatter={formatter} />
                            </FormControl>
                        )}
                    />
                    {files.map((file) => (
                        <AttachItem file={file} key={file.id} onRemove={() => onAttachRemove(file)} />
                    ))}
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button type="button" text={tr('Cancel')} onClick={hideModal} />
                            <Button
                                type="submit"
                                onClick={onSubmit}
                                text={scheduledDeactivation ? tr('Save') : tr('Create')}
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
