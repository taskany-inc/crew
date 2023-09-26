import { Group, User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { ModalPreview, Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconBinOutline, IconGitPullOutline } from '@taskany/icons';

import { PreviewHeader } from '../PreviewHeader';
import { PreviewContent } from '../PreviewContent';
import { InlineTrigger } from '../InlineTrigger';
import { UserListItem } from '../UserListItem';
import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../context/preview-context';

import { TeamChildren } from './TeamChildren';
import { TeamPeople } from './TeamPeople';
import { tr } from './groups.i18n';

type UserProps = {
    group: Group;
};

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

const TeamProfilePreview = ({ group }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const parentId = group?.parentId;
    const parentQuery = trpc.group.getById.useQuery(String(parentId));
    const parentGroup = parentQuery.data;
    const childrenQuery = trpc.group.getChildren.useQuery(group.id);

    return (
        <ModalPreview visible onClose={hidePreview}>
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
                    <InlineTrigger icon={<IconGitPullOutline noWrap size="xs" />} text={'Transfer group'} disabled />
                    <div style={{ marginTop: gapS }}>
                        <InlineTrigger icon={<IconBinOutline noWrap size="xs" />} text={'Archive group'} disabled />
                    </div>
                </NarrowSection>
            </PreviewContent>
        </ModalPreview>
    );
};

export default TeamProfilePreview;
