import { Group, User } from 'prisma/prisma-client';
import { ModalContent, ModalHeader, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gapM, gapS, gapXl, gapXs, gray9 } from '@taskany/colors';
import { IconBinOutline, IconGitPullOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { PreviewHeader } from '../PreviewHeader';
import { InlineTrigger } from '../InlineTrigger';
import { trpc } from '../../trpc/trpcClient';
import { pages } from '../../hooks/useRouter';

import { TeamChildren } from './TeamChildren';
import { TeamPeople } from './TeamPeople';

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
`;

const StyledModalContent = styled(ModalContent)`
    gap: ${gapXl};
    overflow: auto;
    height: 100%;
`;

const StyledQuickSummary = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapXs};
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledPageSep = styled(PageSep)`
    white-space: nowrap;
    margin: 5px 0px;
    width: 300px;
`;

const Wrapper = styled.div`
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

type UserProps = {
    group: Group;
    users: User[];
    groupChildren: Group[];
};

export const TeamProfilePreview = ({ group, users, groupChildren }: UserProps): JSX.Element => {
    const parentId = group?.parentId;
    const parentQuery = trpc.group.getById.useQuery(String(parentId));
    const parentGroup = parentQuery.data;

    return (
        <>
            <StyledModalHeader>
                <PreviewHeader subtitle={parentGroup?.name} title={group?.name} link={pages.team(group.id)} />
            </StyledModalHeader>
            <StyledModalContent>
                <StyledQuickSummary>
                    <Text as="span" size="m" color={gray9} weight="bold">
                        Quick summary
                        <StyledPageSep />
                    </Text>
                </StyledQuickSummary>

                <TeamChildren groupChildren={groupChildren} />

                <TeamPeople users={users} />

                <Wrapper>
                    <StyledPageSep />
                    <InlineTrigger
                        icon={<IconGitPullOutline noWrap size="xs" />}
                        text={'Transfer group'}
                        onClick={() => {}}
                    />
                    <div style={{ marginTop: gapS }}>
                        <InlineTrigger
                            icon={<IconBinOutline noWrap size="xs" />}
                            text={'Archive group'}
                            onClick={() => {}}
                        />
                    </div>
                </Wrapper>
            </StyledModalContent>
        </>
    );
};
