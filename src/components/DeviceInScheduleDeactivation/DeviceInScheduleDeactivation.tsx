import { Button, Input, nullable, Text } from '@taskany/bricks';
import { useCallback, useState } from 'react';
import { IconPlusCircleSolid } from '@taskany/icons';
import styled from 'styled-components';
import { gapM, gapS, gapXs, gray9 } from '@taskany/colors';

import { InlineTrigger } from '../InlineTrigger';
import { AdditionalDevice } from '../../modules/scheduledDeactivationTypes';

import { tr } from './DeviceInScheduleDeactivation.i18n';

const StyledInputsWrapper = styled.div`
    display: grid;
    grid-template-columns: 3fr 3fr 1fr 1fr;
    margin-bottom: ${gapXs};
`;

const StyledWrapper = styled.div`
    margin: ${gapS} ${gapM};
`;

const StyledText = styled(Text)`
    margin-left: ${gapM};
    margin-top: ${gapS};
`;

interface DeviceInScheduleDeactivationFormProps {
    label: string;
    initialDevices: AdditionalDevice[];
    onDeviceAdd: (devices: AdditionalDevice[]) => void;
}
export const DeviceInScheduleDeactivationForm = ({
    onDeviceAdd,
    label,
    initialDevices,
}: DeviceInScheduleDeactivationFormProps) => {
    const [formVisible, setFormVisible] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [devices, setDevices] = useState<AdditionalDevice[]>(initialDevices);

    const onClick = useCallback(() => {
        onDeviceAdd([...devices, { id: deviceId, name: deviceName }]);
        setDevices((prev) => [...prev, { id: deviceId, name: deviceName }]);
        setDeviceId('');
        setDeviceName('');
        setFormVisible(false);
    }, [deviceId, deviceName, setDeviceId, setDeviceName, setFormVisible, setDevices, onDeviceAdd, devices]);

    return (
        <>
            <StyledText weight="bold" color={gray9}>
                {label}
            </StyledText>
            {devices.map((device) => (
                <StyledText key={device.id}>
                    {device.name} {device.id}
                </StyledText>
            ))}
            <StyledWrapper>
                {nullable(
                    formVisible,
                    () => (
                        <>
                            <StyledInputsWrapper>
                                <Input
                                    brick="right"
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    placeholder="name"
                                />
                                <Input brick="center" onChange={(e) => setDeviceId(e.target.value)} placeholder="id" />
                                <Button
                                    type="button"
                                    brick="center"
                                    outline
                                    size="s"
                                    text={tr('Cancel')}
                                    onClick={() => setFormVisible(false)}
                                />
                                <Button
                                    type="button"
                                    brick="left"
                                    outline
                                    size="s"
                                    text={tr('Add')}
                                    view="primary"
                                    onClick={onClick}
                                />
                            </StyledInputsWrapper>
                        </>
                    ),
                    <InlineTrigger
                        text={tr('Add device')}
                        icon={<IconPlusCircleSolid size="s" />}
                        onClick={() => setFormVisible(true)}
                    />,
                )}
            </StyledWrapper>
        </>
    );
};
