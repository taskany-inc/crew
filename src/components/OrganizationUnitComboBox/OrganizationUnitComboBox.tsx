import { useState } from 'react';
import { OrganizationUnit } from 'prisma/prisma-client';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';
import { IconHomeAltOutline } from '@taskany/icons';
import { gray9 } from '@taskany/colors';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './OrganizationUnitComboBox.i18n';

interface OrganizationUnitComboBoxProps {
    organizationUnit?: Nullish<OrganizationUnit>;
    onChange: (organizationnNit: Nullish<OrganizationUnit>) => void;
}

const getOrgUnitTitle = (orgUnit: OrganizationUnit) => {
    return `${orgUnit.name} / ${orgUnit.country}`;
};

export const OrganizationUnitComboBox = ({ organizationUnit, onChange }: OrganizationUnitComboBoxProps) => {
    const [search, setSearch] = useState('');
    const suggestionsVisibility = useBoolean(false);
    const [selectedValue, setSelectedValue] = useState(organizationUnit);
    const organizationUnitQuery = trpc.organizationUnit.getList.useQuery(
        { search, take: 10 },
        { keepPreviousData: true },
    );

    return (
        <ComboBox
            value={search}
            onChange={(value: OrganizationUnit) => {
                setSearch(getOrgUnitTitle(value));
                setSelectedValue(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={organizationUnitQuery.data}
            renderInput={(props) => (
                <Input
                    iconLeft={nullable(selectedValue, () => (
                        <IconHomeAltOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose organization')}
                    size="m"
                    autoComplete="off"
                    onFocus={suggestionsVisibility.setTrue}
                    onChange={(e) => {
                        setSelectedValue(null);
                        onChange(null);
                        setSearch(e.target.value);
                    }}
                    {...props}
                />
            )}
            onClickOutside={(cb) => cb()}
            onClose={suggestionsVisibility.setFalse}
            renderItem={(props) => (
                <MenuItem key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick} ghost>
                    <Text size="s" ellipsis>
                        {getOrgUnitTitle(props.item)}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
