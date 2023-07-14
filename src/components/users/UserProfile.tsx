import { useRouter } from 'next/router';
import { useUser } from '../../api-client/user-api-hook';
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
import { PageSep } from '../PageSep';
import { backgroundColor, gapS, gapXs, gray10, gray2, gray6, gray7, gray8, gray9, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { Circle, CircledAddIcon as CircleIconInner } from '../Circle';
import { ActivityFeedItem } from '../ActivityFeed';

const StyledUser = styled.div`
    display: grid;
    grid-template-columns: 12rem 1fr 5vw;
    padding: 0 30px;
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
    margin-left: 70px;
`;

const StyledDetailedUserInfo = styled.div`
    display: grid;
    flex-direction: column;
`;

const StyledWrapper = styled.div`
    display: flex;
    margin-left: 40px;
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
    margin-top: ${gapS};
`;

const StyledText = styled(Text)`
    margin-left: ${gapS};
`;

const StyledActivityFeedItem = styled(ActivityFeedItem)`
    align-items: flex-start;
    grid-template-columns: 70px 1fr;
    justify-content: flex-start;
    position: relative;
    margin-left: -17px;
`;

export const UserProfile = () => {
    const router = useRouter();
    const { userId } = router.query;
    const userQuery = useUser(String(userId));
    const user = userQuery.data;
    if (!user) return null;
    const membershipGroupName = user?.groupMemberships.map((item) => item.groupName) || [];

    return (
        <>
            <StyledUser>
                <UserPic size={150} src={user.avatar} />{' '}
                <StyledCard>
                    <Text size="s" color={gray6}>
                        {user.source}: Role
                    </Text>
                    <Text size="l" color={gray10}>
                        Teams
                    </Text>
                    <Text size="xxl">{user.fullName}</Text>
                </StyledCard>
                <StyledButton>
                    <Button onClick={() => {}} text="Edit" color={textColor} size="s" />
                </StyledButton>
            </StyledUser>
            <PageSep />
            <StyledWrapper>
                <StyledDetailedUserInfo>
                    <StyledUserInfo>
                        <Text size="m" color={gray9} weight="bold">
                            Contacts{' '}
                        </Text>
                        <StyledContactsLine />
                    </StyledUserInfo>
                    <div>
                        <EnvelopeIcon size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={`mailto:${user.email}`}>
                            {user.email}
                        </StyledLink>
                    </div>
                    <div>
                        <GitLabIcon size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={user.gitlab?.web_url}>
                            {user.gitlab?.username}
                        </StyledLink>
                    </div>
                    <div>
                        <GitHubIcon size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={`https://github.com/${user.github}`}>
                            {user.github}
                        </StyledLink>
                    </div>
                    <div>
                        <TelegramIcon size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={`https://t.me/${user.telegram}`}>
                            {user.telegram}
                        </StyledLink>
                    </div>
                    <StyledAddLink>
                        <Circle size={14}>
                            <CircleIconInner as={AddSmallIcon} size="m" color={gray2} />
                        </Circle>
                        <Text as="span" color={gray8}>
                            Add link
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
                            Quick summary
                        </Text>
                        <div>
                            {user.supervisor?.fullName && (
                                <Text size="m" color={gray9}>
                                    Supervisor: <Text as="span">{user.supervisor?.fullName}</Text>
                                </Text>
                            )}
                            <Text color={gray9}>Coordinator:</Text>
                        </div>
                    </div>

                    <Circle size={32}>
                        <CircleIconInner as={ProjectIcon} size="s" color={backgroundColor} />
                    </Circle>

                    <div style={{ marginTop: 20 }}>
                        <Text size="m" color={gray9} weight="bold">
                            Teams with participation
                        </Text>
                        {membershipGroupName.map((group) => (
                            <StyledGroups>
                                <ProjectIcon size={15} color={gray9} />
                                <StyledText as="span" key={group}>
                                    {group}
                                </StyledText>
                            </StyledGroups>
                        ))}
                    </div>
                </StyledActivityFeedItem>
            </StyledWrapper>
        </>
    );
};
