import {
    BinIcon,
    FlowIcon,
    GitForkIcon,
    Link,
    ModalContent,
    ModalHeader,
    MoreHorizontalIcon,
    Text,
    UserPic,
} from '@taskany/bricks';
import styled from 'styled-components';
import { gapL, gapM, gapS, gapXl, gapXs, gray8, gray9, textColor } from '@taskany/colors';
import router from 'next/router';

import { Group, GroupsPage } from '../../api-client/groups/group-types';
import { useGroup } from '../../hooks/group-hooks';
import { User, UsersPage } from '../../api-client/users/user-types';
import { pageHrefs } from '../../utils/path';
import { PageSep } from '../PageSep';
import { CommonHeaderPreview } from '../CommonHeaderPreview';
import { InlineTrigger } from '../InlineTrigger';

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
    color: ${textColor};
    margin-left: ${gapS};
`;

const StyledBinIcon = styled.div`
    height: 100%;
    gap: ${gapS};
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
                <MoreHorizontalIcon size={15} color={gray8} style={{ marginLeft: gapM }} />
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
                                <StyledSupervisorLink
                                    inline
                                    target="_blank"
                                    href={pageHrefs.user(admin.supervisor?.userId)}
                                >
                                    {admin?.supervisor?.fullName}
                                </StyledSupervisorLink>
                            )}
                        </div>
                    </>
                </StyledQuickSummary>

                <TeamChildren groupChildren={groupChildren} />

                <TeamPeople users={users} />

                <StyledBinIcon>
                    <StyledPageSep />
                    <InlineTrigger icon={<BinIcon noWrap size="xs" />} text={'Archive group'} onClick={() => {}} />
                </StyledBinIcon>
            </StyledModalContent>
        </>
    );
};