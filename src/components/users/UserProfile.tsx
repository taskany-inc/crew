import { useRouter } from 'next/router';
import { Link, UserPic, Text, Button } from '@taskany/bricks';
import {
    IconPlusCircleOutline,
    IconEnvelopeOutline,
    IconGithubOutline,
    IconPinAltOutline,
    IconTelegramOutline,
    IconUsersOutline,
    IconGitlabOutline,
} from '@taskany/icons';
import {
    backgroundColor,
    gapL,
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
import { InlineTrigger } from '../InlineTrigger';

import { tr } from './users.i18n';

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
`;

const StyledGroupLink = styled(Link)`
    font-size: 21px;
    color: ${gray10};
    font-weight: 700;
`;

const StyledButton = styled.div`
    align-self: end;
`;

const StyledContactsLine = styled(PageSep)`
    margin: 0 ${gapS} ${gapXs} 0;
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

const StyledUserInfo = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: ${gapL};
    gap: ${gapS};
`;

const StyledLink = styled(Link)`
    color: ${gray10};
    margin-left: ${gapS};
    font-size: 14px;
`;

const StyledAddLink = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${gapS};
`;

const StyledSupervisorLink = styled(Link)`
    color: ${textColor};
    font-weight: 500;
`;

const StyledGroups = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${gapSm};
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
                <UserPic size={150} src={user.avatar || user.email} />{' '}
                <StyledCard>
                    <Text size="s" color={gray6} weight="bold">
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
                <StyledUserInfo>
                    <Text size="m" color={gray9} weight="bold">
                        {tr('Contacts')} <StyledContactsLine />
                    </Text>

                    <div>
                        <IconEnvelopeOutline size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={`mailto:${user.email}`}>
                            {user.email}
                        </StyledLink>
                    </div>

                    {user.telegram && (
                        <div>
                            <IconTelegramOutline size={15} color={textColor} />
                            <StyledLink inline target="_blank" href={`https://t.me/${user.telegram}`}>
                                {user.telegram}
                            </StyledLink>
                        </div>
                    )}

                    {user.gitlab && (
                        <div>
                            <IconGitlabOutline size={15} color={textColor} />
                            <StyledLink inline target="_blank" href={user.gitlab?.web_url}>
                                {user.gitlab?.username}
                            </StyledLink>
                        </div>
                    )}

                    {user.github && (
                        <div>
                            <IconGithubOutline size={15} color={textColor} />
                            <StyledLink inline target="_blank" href={`https://github.com/${user.github}`}>
                                {user.github}
                            </StyledLink>
                        </div>
                    )}

                    <StyledAddLink>
                        {/* TODO: Add link */}
                        <InlineTrigger
                            icon={
                                <Circle size={16}>
                                    <CircleIconInner as={IconPlusCircleOutline} size="l" color={backgroundColor} />
                                </Circle>
                            }
                            text={'Add link'}
                            onClick={() => {}}
                        />
                    </StyledAddLink>
                </StyledUserInfo>

                <StyledVerticalLine />

                <StyledActivityFeedItem>
                    <Circle size={32}>
                        <CircleIconInner as={IconPinAltOutline} size="s" color={backgroundColor} />
                    </Circle>
                    <div>
                        <Text as="span" size="m" color={gray9} weight="bold">
                            {tr('Quick summary')}
                        </Text>

                        {user.supervisor && (
                            <div>
                                <Text size="m" color={gray9} style={{ marginTop: gapSm }}>
                                    {tr('Supervisor:')}{' '}
                                    <StyledSupervisorLink
                                        inline
                                        target="_blank"
                                        href={pages.user(user.supervisor?.userId)}
                                    >
                                        {user.supervisor?.fullName}
                                    </StyledSupervisorLink>
                                </Text>
                            </div>
                        )}
                    </div>

                    <StyledCircle size={32}>
                        <CircleIconInner as={IconUsersOutline} size="s" color={backgroundColor} />
                    </StyledCircle>
                    <div style={{ marginTop: gapXl }}>
                        <Text size="m" color={gray9} weight="bold">
                            {tr('Teams with participation')}
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
                    </div>
                </StyledActivityFeedItem>
            </StyledWrapper>
        </>
    );
};
