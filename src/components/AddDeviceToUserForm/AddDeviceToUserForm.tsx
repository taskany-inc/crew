import { Button, ComboBox, InlineForm, Input, MenuItem } from '@taskany/bricks';
import { gray10, gray7 } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';
import { Device } from 'prisma/prisma-client';
import { IconPlusCircleSolid } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { useDeviceMutations } from '../../modules/device.hooks';

import { tr } from './AddDeviceToUserForm.i18n';

const StyledInput = styled(Input)`
    font-size: 14px;
    font-weight: normal;
    padding: 5px 10px;
    flex: 1;

    border: 1px solid ${gray7};
    box-sizing: border-box;
`;

const StyledInputsWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr max-content;
`;

interface DevicesFormProps {
    userId: string;
}

export const AddDeviceToUserForm = ({ userId }: DevicesFormProps) => {
    const [search, setSearch] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<Device>();
    const [deviceId, setDeviceId] = useState('');
    const { addDeviceToUser } = useDeviceMutations();
    const devicesListQuery = trpc.device.getList.useQuery({ search, take: 10 });

    const onReset = () => {
        setSearch('');
        setSelectedDevice(undefined);
        setDeviceId('');
    };

    const onSubmit = async () => {
        if (!selectedDevice) {
            return;
        }
        await addDeviceToUser.mutateAsync({
            deviceId,
            userId,
            deviceName: selectedDevice.name,
        });
        onReset();
    };

    return (
        <InlineForm
            renderTrigger={(props) => (
                <InlineTrigger text={tr('Add device')} icon={<IconPlusCircleSolid size="s" />} {...props} />
            )}
            onSubmit={onSubmit}
            onReset={onReset}
        >
            <StyledInputsWrapper>
                <ComboBox
                    value={selectedDevice ? undefined : search}
                    onChange={(value: Device) => {
                        setSearch(value.name);
                        setSelectedDevice(value);
                    }}
                    visible={!selectedDevice}
                    items={devicesListQuery.data}
                    maxWidth={100}
                    renderInput={({ value, ...restProps }) => (
                        <StyledInput
                            placeholder={tr('Device')}
                            autoFocus
                            autoComplete="off"
                            value={value ?? search}
                            onChange={(e) => {
                                setSelectedDevice(undefined);
                                setSearch(e.target.value);
                            }}
                            brick="right"
                            {...restProps}
                        />
                    )}
                    renderItem={(props) => (
                        <MenuItem
                            key={props.item.id}
                            ghost
                            focused={props.cursor === props.index}
                            onClick={props.onClick}
                            color={gray10}
                        >
                            {props.item.name}
                        </MenuItem>
                    )}
                />
                <StyledInput
                    brick="center"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder={tr('id')}
                />
                <Button type="submit" brick="left" outline size="m" text={tr('Add')} view="primary" />
            </StyledInputsWrapper>
        </InlineForm>
    );
};
