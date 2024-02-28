import { useSession } from 'next-auth/react';
import { UserRole } from 'prisma/prisma-client';
import styled from 'styled-components';
import { ModalPreview, Text, nullable } from '@taskany/bricks';
import { Badge } from '@taskany/bricks/harmony';
import { gapS, gray10, gray8, gray9 } from '@taskany/colors';
import { IconBinOutline } from '@taskany/icons';

import { PreviewHeader } from '../PreviewHeader/PreviewHeader';
import { PreviewContent } from '../PreviewContent';
import { UserListItem } from '../UserListItem/UserListItem';
import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { TeamChildren } from '../TeamChildren/TeamChildren';
import { TransferGroupForm } from '../TransferGroupForm/TransferGroupForm';
import { TeamPeople } from '../TeamPeople/TeamPeople';
import { TeamVacancies } from '../TeamVacancies/TeamVacancies';
import { ExportTeamMembers } from '../ExportTeamMembers/ExportTeamMembers';
import { ArchiveGroupModal } from '../ArchiveGroup/ArchiveGroup';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './TeamProfilePreview.i18n';

type UserProps = {
    groupId: string;
};

const StyledModalPreview = styled(ModalPreview)`
    display: flex;
    flex-direction: column;
`;

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

const StyledBadge = styled(Badge)`
    cursor: pointer;
    &:hover {
        color: ${gray10};
    }
    color: ${gray8};
    padding: 0;
`;

const TeamProfilePreview = ({ groupId }: UserProps): JSX.Element => {
    const session = useSession();
    const { hidePreview } = usePreviewContext();
    const groupQuery = trpc.group.getById.useQuery(groupId);
    const childrenQuery = trpc.group.getChildren.useQuery(groupId);
    const archiveGroupModalVisibility = useBoolean(false);
    const user = session.data?.user;

    return (
        <>
            {nullable(groupQuery.data, (group) => (
                <StyledModalPreview visible onClose={hidePreview}>
                    <PreviewHeader subtitle={group.parent?.name} title={group?.name} link={pages.team(group.id)} />
                    <PreviewContent>
                        {nullable(group.supervisor, (supervisor) => (
                            <NarrowSection title={tr('Quick summary')}>
                                <StyledSupervisorText size="m" color={gray9}>
                                    {tr('Supervisor')}
                                    <UserListItem user={supervisor} />
                                </StyledSupervisorText>
                            </NarrowSection>
                        ))}

                        <TeamChildren groupId={group.id} groupChildren={childrenQuery.data ?? []} />

                        <TeamPeople groupId={group.id} />
                        <TeamVacancies group={group} />

                        <NarrowSection>
                            <TransferGroupForm group={group} />

                            <ArchiveGroupModal
                                visible={archiveGroupModalVisibility.value}
                                groupId={group.id}
                                groupName={group.name}
                                onClose={archiveGroupModalVisibility.setFalse}
                            />
                            {nullable(user?.role === UserRole.ADMIN && !childrenQuery.data?.length, () => (
                                <StyledBadge
                                    onClick={archiveGroupModalVisibility.setTrue}
                                    iconLeft={<IconBinOutline size="xs" />}
                                    text={tr('Archive group')}
                                    weight="regular"
                                />
                            ))}

                            <ExportTeamMembers group={group} />
                        </NarrowSection>
                    </PreviewContent>
                </StyledModalPreview>
            ))}
        </>
    );
};

export default TeamProfilePreview;
