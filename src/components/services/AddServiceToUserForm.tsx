import { Button, ComboBox, InlineForm, Input, MenuItem, TableCell } from '@taskany/bricks';
import { gray10, gray7, gray8 } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';
import { ExternalService } from 'prisma/prisma-client';
import { IconPlusCircleSolid } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { useServiceMutations } from '../../modules/service.hooks';

import { tr } from './services.i18n';

const StyledInlineTrigger = styled(InlineTrigger)`
    display: inline-flex;
    color: ${gray8};
    line-height: 28px;
`;

const StyledInput = styled(Input)`
    font-size: 14px;
    font-weight: normal;
    padding: 5px 10px;
    flex: 1;

    border: 1px solid ${gray7};
    box-sizing: border-box;
`;

const StyledTableCell = styled(TableCell)`
    flex-wrap: nowrap;
    display: flex;
    align-items: center;
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
        await addServiceToUser.mutateAsync({
            serviceId,
            userId,
            serviceName: selectedService.name,
        });
        onReset();
    };

    return (
        <InlineForm
            renderTrigger={(props) => (
                <StyledInlineTrigger text={tr('Add link')} icon={<IconPlusCircleSolid noWrap size="s" />} {...props} />
            )}
            onSubmit={onSubmit}
            onReset={onReset}
        >
            <StyledTableCell col={4} align="center">
                <ComboBox
                    value={selectedService ? undefined : search}
                    onChange={(value: ExternalService) => {
                        setSearch(value.name);
                        setSelectedService(value);
                    }}
                    visible={!selectedService}
                    items={servicesListQuery.data}
                    maxWidth={100}
                    renderInput={({ value, ...restProps }) => (
                        <StyledInput
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
                            {props.item.name}
                        </MenuItem>
                    )}
                />
                <StyledInput
                    brick="center"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder={tr('Link to the service')}
                />
                <Button type="submit" brick="left" outline size="m" text={tr('Add')} view="primary" />
            </StyledTableCell>
        </InlineForm>
    );
};
