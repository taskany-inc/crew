import { ModalContent, ModalHeader, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gapM, gapS, gapXl, gapXs, gray9, textColor } from '@taskany/colors';
import { IconBinOutline, IconGitPullOutline } from '@taskany/icons';

import { Group, GroupsPage } from '../../api-client/groups/group-types';
import { useGroup } from '../../hooks/group-hooks';
import { UsersPage } from '../../api-client/users/user-types';
import { pages } from '../../hooks/useRouter';
import { PageSep } from '../PageSep';
import { CommonHeaderPreview } from '../CommonHeaderPreview';
import { InlineTrigger } from '../InlineTrigger';
import { Link } from '../Link';

import { TeamChildren } from './TeamChildren';
import { TeamPeople } from './TeamPeople';

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
`;

const StyledModalContent = styled(ModalContent)`
    gap: ${gapXl};
    overflow: scroll;
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

const StyledSupervisorLink = styled(Link)`
    margin-left: ${gapS};
`;

const Wrapper = styled.div`
    height: 100%;
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

type UserProps = {
    group: Group | undefined;
    users: UsersPage;
    groupChildren: GroupsPage;
};

export const TeamProfilePreview = ({ group, users, groupChildren }: UserProps): JSX.Element => {
    const parentId = group?.parentId;
    const parentQuery = useGroup(String(parentId));
    const parentGroup = parentQuery.data;
    const admin = users?.items.find((user) => user.groupMemberships.find((i) => i.groupName && group?._id === i.uid));

    return (
        <>
            <StyledModalHeader>
                <CommonHeaderPreview subtitle={parentGroup?.name} title={group?.name} />
            </StyledModalHeader>
            <StyledModalContent>
                <StyledQuickSummary>
                    <>
                        <Text as="span" size="m" color={gray9} weight="bold">
                            Quick summary
                            <StyledPageSep />
                        </Text>
                        <div>
                            <Text as="span" size="m" color={gray9}>
                                Supervisor:{' '}
                            </Text>
                            {admin?.supervisor && (
                                <StyledSupervisorLink target="_blank" href={pages.user(admin.supervisor.userId)}>
                                    {admin?.supervisor?.fullName}
                                </StyledSupervisorLink>
                            )}
                        </div>
                    </>
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
