import { useState } from 'react';
import { OrganizationUnit } from 'prisma/prisma-client';
import { ComboBox, FormInput, Input, MenuItem, Text, nullable } from '@taskany/bricks';
import { IconHomeAltOutline } from '@taskany/icons';
import { gray9 } from '@taskany/colors';

import { Nullish } from '../../utils/types';
import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { OrganizationUnitSearchType } from '../../modules/organizationUnitSchemas';

import { tr } from './OrganizationUnitComboBox.i18n';

interface OrganizationUnitComboBoxProps {
    organizationUnit?: Nullish<OrganizationUnit>;
    searchType?: OrganizationUnitSearchType;
    onChange: (organizationUnit: Nullish<OrganizationUnit>) => void;
    inline?: boolean;
    placeholder?: string;
    label?: string;
    error?: React.ComponentProps<typeof FormInput>['error'];
}

export const OrganizationUnitComboBox = ({
    organizationUnit,
    searchType,
    onChange,
    inline,
    placeholder,
    label,
    error,
}: OrganizationUnitComboBoxProps) => {
    const [search, setSearch] = useState(organizationUnit ? getOrgUnitTitle(organizationUnit) : '');
    const suggestionsVisibility = useBoolean(false);
    const [selectedValue, setSelectedValue] = useState(organizationUnit);
    const organizationUnitQuery = trpc.organizationUnit.getList.useQuery(
        { search, take: 10, searchType },
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
            renderInput={(props) =>
                inline ? (
                    <FormInput
                        label={label}
                        placeholder={placeholder || tr('Choose organization')}
                        autoComplete="off"
                        onFocus={suggestionsVisibility.setTrue}
                        onChange={(e) => {
                            setSelectedValue(null);
                            onChange(null);
                            setSearch(e.target.value);
                        }}
                        error={error}
                        {...props}
                    />
                ) : (
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
                )
            }
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
