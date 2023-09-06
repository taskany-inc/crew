import { useRouter } from 'next/router';
import { Link, UserPic, Text, Button } from '@taskany/bricks';
import { IconPinAltOutline, IconUsersOutline } from '@taskany/icons';
import {
    backgroundColor,
    gapL,
    gapM,
    gapS,
    gapSm,
    gapXl,
    gapXs,
    gray10,
    gray6,
    gray7,
    gray9,
    textColor,
} from '@taskany/colors';
import styled from 'styled-components';

import { PageSep } from '../PageSep';
import { Circle, CircledAddIcon as CircleIconInner } from '../Circle';
import { ActivityFeedItem } from '../ActivityFeed';
import { pages } from '../../utils/pages';
import { useUser } from '../../hooks/user-hooks';

import { tr } from './users.i18n';
import { UserContacts } from './UserContacts';
import { QuickSummary } from './QuickSummary';

const StyledUser = styled.div`
    display: grid;
    grid-template-columns: 12rem 1fr 5vw;
    padding: ${gapXs} ${gapL};
`;

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    align-self: end;
    gap: ${gapS};
    margin-left: ${gapL};
`;

const StyledUserPic = styled(UserPic)`
    margin-left: ${gapM};
`;

const StyledGroupLink = styled(Link)`
    font-size: 21px;
    color: ${gray10};
    font-weight: 700;
`;

const StyledButton = styled.div`
    align-self: end;
`;

const StyledVerticalLine = styled.div`
    border-left: 1px solid ${gray7};
    display: inline-block;
    margin-left: ${gapXl};
`;

const StyledWrapper = styled.div`
    display: flex;
    margin-top: ${gapL};
`;

const StyledUserContacts = styled.div`
    padding: ${gapXs} 0 0 ${gapL};
`;

const StyledGroups = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${gapSm};
`;

const StyledInfo = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapS};
    margin: ${gapM} 0 ${gapL} ${gapM};
`;

const StyledLine = styled(PageSep)`
    white-space: nowrap;
    margin: ${gapXs} 0px;
    width: 300px;
`;

const StyledActivityFeedItem = styled(ActivityFeedItem)`
    align-items: flex-start;
    grid-template-columns: ${gapXl} 1fr;
    justify-content: flex-start;
    position: relative;
    margin-left: -17px;
`;

const StyledCircle = styled(Circle)`
    margin-top: ${gapXl};
`;

const StyledTeamsLink = styled(Link)`
    margin-left: ${gapS};
    color: ${textColor};
    font-weight: 500;
`;

export const UserProfile = () => {
    const router = useRouter();
    const { userId } = router.query;
    const userQuery = useUser(String(userId));
    const user = userQuery.data;

    if (!user) return null;

    const groupMemberships = user?.groupMemberships;

    const orgStructureGroup = groupMemberships.filter(({ isOrgGroup }) => isOrgGroup)[0];

    const teams = groupMemberships.filter(({ isOrgGroup }) => !isOrgGroup);

    return (
        <>
            <StyledUser>
                <StyledUserPic size={150} src={user.avatar || user.email} />{' '}
                <StyledCard>
                    <Text size="s" color={gray6} weight="bold">
                        {user.source}:{' '}
                        {!!orgStructureGroup && orgStructureGroup.roles.map((role) => role.title).join(', ')}
                    </Text>

                    {!!orgStructureGroup && (
                        <StyledGroupLink inline target="_blank" href={pages.team(orgStructureGroup.uid)}>
                            {orgStructureGroup.groupName}
                        </StyledGroupLink>
                    )}
                    <Text size="xxl" weight="bold">
                        {user.fullName}
                    </Text>
                </StyledCard>
                <StyledButton>
                    <Button onClick={() => {}} text="Edit" color={textColor} size="s" />
                </StyledButton>
            </StyledUser>
            <PageSep />

            <StyledWrapper>
                <StyledUserContacts>
                    <UserContacts user={user} showDevices />
                </StyledUserContacts>
                <StyledVerticalLine />

                <StyledActivityFeedItem>
                    <Circle size={32}>
                        <CircleIconInner as={IconPinAltOutline} size="s" color={backgroundColor} />
                    </Circle>

                    <div>
                        <QuickSummary user={user} />
                    </div>

                    <StyledCircle size={32}>
                        <CircleIconInner as={IconUsersOutline} size="s" color={backgroundColor} />
                    </StyledCircle>
                    <StyledInfo>
                        <Text size="m" color={gray9} weight="bold">
                            {tr('Teams with participation')}
                            <StyledLine />
                        </Text>
                        {teams.map((team) => (
                            <StyledGroups key={team.uid}>
                                <IconUsersOutline size={15} color={gray9} />

                                <StyledTeamsLink
                                    inline
                                    target="_blank"
                                    key={team.groupName}
                                    href={pages.team(team.uid)}
                                >
                                    {team.groupName}
                                </StyledTeamsLink>
                            </StyledGroups>
                        ))}
                    </StyledInfo>
                </StyledActivityFeedItem>
            </StyledWrapper>
        </>
    );
};
