import { ReactNode } from 'react';
import { Breadcrumb, Breadcrumbs } from '@taskany/bricks/harmony';

import { usePreviewContext } from '../../contexts/previewContext';
import { useAppConfig } from '../../contexts/appConfigContext';
import { trpc } from '../../trpc/trpcClient';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';

import { tr } from './TeamBreadcrumbs.i18n';

interface TeamBreadcrumbsProps {
    groupId: string;
    orgGroup: 'hide' | 'link';
    className?: string;
    children?: ReactNode;
}

export const TeamBreadcrumbs = ({ groupId, orgGroup, className, children }: TeamBreadcrumbsProps) => {
    const appConfig = useAppConfig();
    const { showGroupPreview } = usePreviewContext();
    const breadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(groupId);
    const breadcrumbs = breadcrumbsQuery.data ?? [];

    const orgGroupBreadcrumb =
        orgGroup === 'link' ? (
            <Breadcrumb key="org">
                <Link href={pages.teams}>{tr('Teams')}</Link>
            </Breadcrumb>
        ) : null;

    return (
        <Breadcrumbs className={className}>
            {breadcrumbs.map((breadcrumb) =>
                breadcrumb.id === appConfig?.orgGroupId ? (
                    orgGroupBreadcrumb
                ) : (
                    <Breadcrumb key={breadcrumb.id}>
                        <Link href={pages.team(breadcrumb.id)} onClick={() => showGroupPreview(breadcrumb.id)}>
                            {breadcrumb.name}
                        </Link>
                    </Breadcrumb>
                ),
            )}
            {children}
        </Breadcrumbs>
    );
};
