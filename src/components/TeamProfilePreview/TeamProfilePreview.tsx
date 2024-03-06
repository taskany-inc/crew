import styled from 'styled-components';
import { ModalPreview, Text, nullable } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';

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
import { ArchiveGroupForm } from '../ArchiveGroupForm/ArchiveGroupForm';
import { Restricted } from '../Restricted';

import { tr } from './TeamProfilePreview.i18n';

interface UserProps {
    groupId: string;
}

const StyledModalPreview = styled(ModalPreview)`
    display: flex;
    flex-direction: column;
`;

const StyledSupervisorText = styled(Text)`
    display: flex;
    gap: ${gapS};
`;

export const TeamProfilePreview = ({ groupId }: UserProps): JSX.Element => {
    const { hidePreview } = usePreviewContext();
    const groupQuery = trpc.group.getById.useQuery(groupId);
    const childrenQuery = trpc.group.getChildren.useQuery(groupId);

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

                        <TeamChildren
                            groupId={group.id}
                            groupChildren={childrenQuery.data ?? []}
                            isEditable={group.meta.isEditable}
                        />

                        <TeamPeople groupId={group.id} isEditable={group.meta.isEditable} />

                        <TeamVacancies group={group} />

                        <NarrowSection>
                            <Restricted visible={group.meta.isEditable}>
                                <TransferGroupForm group={group} />
                            </Restricted>

                            <Restricted visible={group.meta.isEditable && !childrenQuery.data?.length}>
                                <ArchiveGroupForm groupId={group.id} groupName={group.name} />
                            </Restricted>

                            <ExportTeamMembers group={group} />
                        </NarrowSection>
                    </PreviewContent>
                </StyledModalPreview>
            ))}
        </>
    );
};
