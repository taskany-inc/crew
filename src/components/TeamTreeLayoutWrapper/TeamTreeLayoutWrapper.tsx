import React from 'react';
import { FormControl, FormControlInput, Text, Button } from '@taskany/bricks/harmony';
import { IconFilterOutline, IconSearchOutline, IconSortDownOutline } from '@taskany/icons';

import { LayoutMain } from '../LayoutMain/LayoutMain';
import { StructTreeView } from '../StructTreeView/StructTreeView';
import { PageWrapper } from '../PageWrapper/PageWrapper';

import s from './TeamTreeLayoutWrapper.module.css';
import { tr } from './TeamTreeLayoutWrapper.i18n';

interface TeamTreeLayoutWrapperProps {
    header: React.ReactNode;
    pageTitle: string;
    title: string;
}

export const TeamTreeLayoutWrapper: React.FC<React.PropsWithChildren<TeamTreeLayoutWrapperProps>> = ({
    children,
    header,
    pageTitle,
    title,
}) => {
    return (
        <LayoutMain pageTitle={pageTitle}>
            <PageWrapper header={header}>
                <div className={s.TeamTreeLayoutWrapperHeader}>
                    <Text className={s.TeamTreeLayoutWrapperHeading} size="lg" weight="bold">
                        {title}
                    </Text>
                    <div className={s.TeamTreeLayoutWrapperHeaderControls}>
                        <Button view="default" iconLeft={<IconFilterOutline size="s" />} text={tr('Filters')} />
                        <Button iconLeft={<IconSortDownOutline size="s" />} text={tr('Sorting')} />
                        <FormControl>
                            <FormControlInput
                                iconLeft={<IconSearchOutline size="s" />}
                                outline
                                placeholder={tr('Search in structure')}
                            />
                        </FormControl>
                    </div>
                </div>
                <StructTreeView>{children}</StructTreeView>
            </PageWrapper>
        </LayoutMain>
    );
};
