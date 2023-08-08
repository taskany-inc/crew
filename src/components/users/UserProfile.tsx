import { useRouter } from 'next/router';
import {
    EnvelopeIcon,
    GitHubIcon,
    GitLabIcon,
    Link,
    TelegramIcon,
    UserPic,
    Text,
    ProjectIcon,
    Button,
    AddSmallIcon,
    PinAltIcon,
} from '@taskany/bricks';
import {
    backgroundColor,
    gapL,
    gapM,
    gapS,
    gapSm,
    gapXl,
    gapXs,
    gray10,
    gray2,
    gray6,
    gray7,
    gray8,
    gray9,
    textColor,
} from '@taskany/colors';
import styled from 'styled-components';

import { useUser } from '../../api-client/users/user-api-hook';
import { PageSep } from '../PageSep';
import { Circle, CircledAddIcon as CircleIconInner } from '../Circle';
import { ActivityFeedItem } from '../ActivityFeed';
import { pageHrefs } from '../../utils/path';

import { tr } from './users.i18n';

const StyledUser = styled.div`
    display: grid;
    grid-template-columns: 12rem 1fr 5vw;
    padding: ${gapM} ${gapL};
`;

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    align-self: end;
    gap: ${gapS};
`;

const StyledButton = styled.div`
    align-self: end;
`;

const StyledContactsLine = styled(PageSep)`
    margin: ${gapXs} 0;
`;

const StyledVerticalLine = styled.div`
    border-left: 1px solid ${gray7};
    display: inline-block;
    margin-left: ${gapXl};
`;

const StyledDetailedUserInfo = styled.div`
    display: grid;
    flex-direction: column;
`;

const StyledWrapper = styled.div`
    display: flex;
    margin-left: ${gapL};
`;

const StyledUserInfo = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledLink = styled(Link)`
    color: ${gray10};
    margin-left: ${gapS};
`;

const StyledAddLink = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${gapS};
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
                <UserPic size={150} src={user.avatar} />{' '}
                <StyledCard>
                    <Text size="s" color={gray6}>
                        {user.source}: {!!orgStructureGroup && orgStructureGroup.roles.map((role) => role.title)}
                    </Text>

                    {!!orgStructureGroup && (
                        <Text size="l" color={gray10}>
                            {orgStructureGroup.groupName}
                        </Text>
                    )}
                    <Text size="xxl">{user.fullName}</Text>
                </StyledCard>
                <StyledButton>
                    <Button onClick={() => {}} text="Edit" color={textColor} size="s" />
                </StyledButton>
            </StyledUser>
            <PageSep />
            <StyledUserInfo>
                <Text size="m" color={gray9} weight="bold">
                    {tr('Contacts')}{' '}
                </Text>
                <StyledContactsLine />
            </StyledUserInfo>

            <StyledWrapper>
                <StyledDetailedUserInfo>
                    <StyledUserInfo>
                        <Text size="m" color={gray9} weight="bold">
                            {tr('Contacts')}{' '}
                        </Text>
                        <StyledContactsLine />
                    </StyledUserInfo>
                    <div>
                        <EnvelopeIcon size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={`mailto:${user.email}`}>
                            {user.email}
                        </StyledLink>
                    </div>
                    {user.gitlab && (
                        <div>
                            <GitLabIcon size={15} color={textColor} />
                            <StyledLink inline target="_blank" href={user.gitlab?.web_url}>
                                {user.gitlab?.username}
                            </StyledLink>
                        </div>
                    )}
                    {user.github && (
                        <div>
                            <>
                                <GitHubIcon size={15} color={textColor} />
                                <StyledLink inline target="_blank" href={`https://github.com/${user.github}`}>
                                    {user.github}
                                </StyledLink>
                            </>
                        </div>
                    )}
                    {user.telegram && (
                        <div>
                            <>
                                <TelegramIcon size={15} color={textColor} />
                                <StyledLink inline target="_blank" href={`https://t.me/${user.telegram}`}>
                                    {user.telegram}
                                </StyledLink>
                            </>
                        </div>
                    )}
                    <StyledAddLink>
                        <Circle size={14}>
                            <CircleIconInner as={AddSmallIcon} size="m" color={gray2} />
                        </Circle>
                        <Text as="span" color={gray8}>
                            {tr('Add link')}
                        </Text>
                    </StyledAddLink>
                </StyledDetailedUserInfo>

                <StyledVerticalLine />
                <StyledActivityFeedItem>
                    <Circle size={32}>
                        <CircleIconInner as={PinAltIcon} size="s" color={backgroundColor} />
                    </Circle>
                    <div>
                        <Text as="span" size="m" color={gray9} weight="bold">
                            {tr('Quick summary')}
                        </Text>

                        {user.supervisor && (
                            <div>
                                <Text size="m" color={gray9} style={{ marginTop: gapSm }}>
                                    {tr('Supervisor:')}{' '}
                                    <Link inline target="_blank" href={pageHrefs.user(user.supervisor?.userId)}>
                                        {user.supervisor?.fullName}
                                    </Link>
                                </Text>
                            </div>
                        )}
                    </div>

                    <StyledCircle size={32}>
                        <CircleIconInner as={ProjectIcon} size="s" color={backgroundColor} />
                    </StyledCircle>
                    <div style={{ marginTop: gapXl }}>
                        <Text size="m" color={gray9} weight="bold">
                            {tr('Teams with participation')}
                        </Text>
                        {teams.map((team) => (
                            <StyledGroups key={team.uid}>
                                <ProjectIcon size={15} color={gray9} />

                                <StyledLink
                                    inline
                                    target="_blank"
                                    key={team.groupName}
                                    href={pageHrefs.group(team.uid)}
                                >
                                    {team.groupName}
                                </StyledLink>
                            </StyledGroups>
                        ))}
                    </div>
                </StyledActivityFeedItem>
            </StyledWrapper>
        </>
    );
};
