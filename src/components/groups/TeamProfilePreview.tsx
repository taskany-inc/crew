import { Group, User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconBinOutline } from '@taskany/icons';

import { PreviewHeader } from '../PreviewHeader';
import { PreviewContent } from '../PreviewContent';
import { InlineTrigger } from '../InlineTrigger';
import { UserListItem } from '../UserListItem';
import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { pages } from '../../hooks/useRouter';

import { TeamChildren } from './TeamChildren';
import { TeamPeople } from './TeamPeople';
import { TransferGroupForm } from './TransferGroupForm';
import { tr } from './groups.i18n';

type UserProps = {
    group: Group;
};

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

export const TeamProfilePreview = ({ group }: UserProps): JSX.Element => {
    const parentId = group?.parentId;
    const parentQuery = trpc.group.getById.useQuery(String(parentId));
    const parentGroup = parentQuery.data;
    const childrenQuery = trpc.group.getChildren.useQuery(group.id);

    return (
        <>
            <PreviewHeader subtitle={parentGroup?.name} title={group?.name} link={pages.team(group.id)} />
            <PreviewContent>
                <NarrowSection title={tr('Quick summary')}>
                    <StyledSupervisorText size="m" color={gray9}>
                        {tr('Supervisor')}
                        <UserListItem user={{ name: 'Placeholder user', email: 'placeholder@example.com' } as User} />
                    </StyledSupervisorText>
                </NarrowSection>

                <TeamChildren groupChildren={childrenQuery.data ?? []} />

                <TeamPeople groupId={group.id} />

                <NarrowSection>
                    <TransferGroupForm group={group} />
                    <InlineTrigger icon={<IconBinOutline noWrap size="xs" />} text={'Archive group'} disabled />
                </NarrowSection>
            </PreviewContent>
        </>
    );
};
