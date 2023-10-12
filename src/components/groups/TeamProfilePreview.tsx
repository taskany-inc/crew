import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { ModalPreview, Text, nullable } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconBinOutline } from '@taskany/icons';

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
import { TransferGroupForm } from './TransferGroupForm';
import { tr } from './groups.i18n';

type UserProps = {
    groupId: string;
};

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

const TeamProfilePreview = ({ groupId }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const groupQuery = trpc.group.getById.useQuery(groupId);
    const childrenQuery = trpc.group.getChildren.useQuery(groupId);

    return (
        <>
            {nullable(groupQuery.data, (group) => (
                <ModalPreview visible onClose={hidePreview}>
                    <PreviewHeader subtitle={group.parent?.name} title={group?.name} link={pages.team(group.id)} />
                    <PreviewContent>
                        <NarrowSection title={tr('Quick summary')}>
                            <StyledSupervisorText size="m" color={gray9}>
                                {tr('Supervisor')}
                                <UserListItem
                                    user={{ name: 'Placeholder user', email: 'placeholder@example.com' } as User}
                                />
                            </StyledSupervisorText>
                        </NarrowSection>

                        <TeamChildren groupId={group.id} groupChildren={childrenQuery.data ?? []} />

                        <TeamPeople groupId={group.id} />

                        <NarrowSection>
                            <TransferGroupForm group={group} />
                            <InlineTrigger icon={<IconBinOutline size="xs" />} text={'Archive group'} disabled />
                        </NarrowSection>
                    </PreviewContent>
                </ModalPreview>
            ))}
        </>
    );
};

export default TeamProfilePreview;
