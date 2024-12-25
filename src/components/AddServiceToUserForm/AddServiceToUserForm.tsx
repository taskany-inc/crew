import { Button, ComboBox, InlineForm, Input, MenuItem } from '@taskany/bricks';
import { gray10 } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';
import { ExternalService } from 'prisma/prisma-client';
import { IconPlusCircleSolid } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { useServiceMutations } from '../../modules/serviceHooks';
import { ExternalServiceName } from '../../utils/externalServices';

import { tr } from './AddServiceToUserForm.i18n';

const StyledInputsWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr max-content;
`;

interface ServicesFormProps {
    userId: string;
}

export const AddServiceToUserForm = ({ userId }: ServicesFormProps) => {
    const [search, setSearch] = useState('');
    const [selectedService, setSelectedService] = useState<ExternalService>();
    const [serviceId, setServiceId] = useState('');
    const { addServiceToUser } = useServiceMutations();
    const servicesListQuery = trpc.service.getList.useQuery({ search, take: 10 });

    const onReset = () => {
        setSearch('');
        setSelectedService(undefined);
        setServiceId('');
    };

    const onSubmit = async () => {
        if (!selectedService) {
            return;
        }
        await addServiceToUser({
            serviceId,
            userId,
            serviceName: selectedService.name as ExternalServiceName,
        });
        onReset();
    };

    return (
        <InlineForm
            renderTrigger={(props) => (
                <InlineTrigger text={tr('Add link')} icon={<IconPlusCircleSolid size="s" />} {...props} />
            )}
            onSubmit={onSubmit}
            onReset={onReset}
        >
            <StyledInputsWrapper>
                <ComboBox
                    value={selectedService ? undefined : search}
                    onChange={(value: ExternalService) => {
                        setSearch(value.displayName || value.name);
                        setSelectedService(value);
                    }}
                    visible={!selectedService}
                    items={servicesListQuery.data}
                    maxWidth={100}
                    renderInput={({ value, ...restProps }) => (
                        <Input
                            placeholder={tr('Service')}
                            autoFocus
                            autoComplete="off"
                            value={value ?? search}
                            onChange={(e) => {
                                setSelectedService(undefined);
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
                            {props.item.displayName || props.item.name}
                        </MenuItem>
                    )}
                />
                <Input
                    brick="center"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder={tr('id or username')}
                />
                <Button type="submit" brick="left" outline size="m" text={tr('Add')} view="primary" />
            </StyledInputsWrapper>
        </InlineForm>
    );
};
