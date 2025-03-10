import React, { useCallback, useMemo, useState } from 'react';
import { FormControl, FormControlInput, Text, Button, Counter } from '@taskany/bricks/harmony';
import { IconSearchOutline, IconSortDownOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { LayoutMain } from '../LayoutMain/LayoutMain';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { PageWrapper } from '../PageWrapper/PageWrapper';
import { AddFilterDropdown } from '../AddFilterDropdown/AddFilterDropdown';
import { AppliedSupervisorFilter } from '../AppliedSupervisorFilter/AppliedSupervisorFilter';
import { useGroupTreeFilter } from '../../hooks/useGroupTreeFilter';

import s from './TeamTreeLayoutWrapper.module.css';
import { tr } from './TeamTreeLayoutWrapper.i18n';

interface TeamTreeLayoutWrapperProps {
    header: React.ReactNode;
    pageTitle: string;
    title: string;
}

const enableControls = false;

export const TeamTreeLayoutWrapper: React.FC<React.PropsWithChildren<TeamTreeLayoutWrapperProps>> = ({
    children,
    header,
    pageTitle,
    title,
}) => {
    const { values, setter, clearParams } = useGroupTreeFilter();
    const [filtersState, setFiltersState] = useState(values);

    const filterItems = useMemo(() => {
        return [{ id: 'supervisor', title: tr('Supervisor') }];
    }, []);

    const filtersCounter = useMemo(() => Object.values(filtersState).flat().length, [filtersState]);

    const restFilterItems = useMemo(() => {
        return filterItems.filter((item) => !filtersState?.[item.id as keyof typeof filtersState]);
    }, [filterItems, filtersState]);

    const setPartialQueryByKey = useCallback((key: keyof typeof values) => {
        return (value?: string[]) => {
            setFiltersState((prev) => {
                return {
                    ...prev,
                    [key]: value,
                };
            });
        };
    }, []);

    const handleChange = useCallback(
        (key: keyof typeof values) => (users?: { id: string; name: string; email: string }[]) => {
            setPartialQueryByKey(key)(users?.map(({ id }) => id));
        },
        [setPartialQueryByKey],
    );

    const onApply = useCallback(() => {
        Object.keys(values).forEach((key) => {
            setter(key as keyof typeof values, filtersState?.[key as keyof typeof filtersState]);
        });
    }, [setter, values, filtersState]);

    const onCleanFilter = useCallback(
        (key: keyof typeof values) => () => {
            setPartialQueryByKey(key)(undefined);
            setter(key, undefined);
        },
        [setPartialQueryByKey, setter],
    );

    const onResetFilters = () => {
        clearParams();
        setFiltersState({});
    };

    const isFiltersEmpty = filtersState?.supervisor === undefined;

    return (
        <LayoutMain pageTitle={pageTitle}>
            <PageWrapper header={header}>
                <div className={s.TeamTreeLayoutWrapperHeader}>
                    <Text className={s.TeamTreeLayoutWrapperHeading} size="lg" weight="bold">
                        {title}
                    </Text>
                    <div className={s.TeamTreeLayoutWrapperHeaderControls}>
                        {nullable(
                            isFiltersEmpty,
                            () => (
                                <AddFilterDropdown
                                    title={tr('Filters')}
                                    items={restFilterItems}
                                    onChange={([item]) => setPartialQueryByKey(item.id as keyof typeof values)([])}
                                />
                            ),
                            <Button
                                view="default"
                                text={tr('Reset filters')}
                                onClick={onResetFilters}
                                iconRight={<Counter count={filtersCounter} size="xs" />}
                            />,
                        )}
                    </div>
                    {nullable(enableControls, () => (
                        <>
                            <Button iconLeft={<IconSortDownOutline size="s" />} text={tr('Sorting')} />
                            <FormControl>
                                <FormControlInput
                                    iconLeft={<IconSearchOutline size="s" />}
                                    outline
                                    placeholder={tr('Search in structure')}
                                />
                            </FormControl>
                        </>
                    ))}
                </div>

                {nullable(!isFiltersEmpty, () => (
                    <div className={s.TeamTreeLayoutWrapperFilters}>
                        {nullable(Boolean(filtersState?.supervisor), () => (
                            <AppliedSupervisorFilter
                                label={tr('Supervisor')}
                                selectedUsers={filtersState?.supervisor}
                                onChange={handleChange('supervisor')}
                                onClose={onApply}
                                onCleanFilter={onCleanFilter('supervisor')}
                            />
                        ))}
                    </div>
                ))}

                <StructTreeView>{children}</StructTreeView>
            </PageWrapper>
        </LayoutMain>
    );
};
