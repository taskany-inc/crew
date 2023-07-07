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
    PlusIcon,
} from '@taskany/bricks';
import { Stack } from '../layout/Stack';
import { PageSep } from '../PageSep';
import { gapS, gapXl, gray10, gray2, gray6, gray7, gray8, gray9, textColor } from '@taskany/colors';
import styled from 'styled-components';

const StyledText = styled(Text)`
    margin-left: 50px;
`;

const StyledCardInfo = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${gapXl};
`;

const StyledContactsInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledInfo = styled.div`
    display: grid;
    grid-template-columns: 7fr;
    margin-right: 80px;
    gap: ${gapS};
`;

const StyledTeams = styled.div`
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledGroup = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${gapS};
`;

const StyledAddIcon = styled(PlusIcon)`
    width: 14px;
    height: 14px;
    display: inline-block;
    background-color: ${gray7};
    border-radius: 50%;
    align-items: center;
    overflow: hidden;
`;

const StyledContactsLine = styled(PageSep)`
    margin: ${gapS} 0px;
`;

const StyledVerticalLine = styled.div`
    border-left: 1px solid ${gray7};
    display: inline-block;
    position: relative;
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
            <StyledCardInfo style={{ marginLeft: 50, marginTop: 20 }}>
                <UserPic size={150} src={user.avatar} />
                <Stack direction="column" gap={5} style={{ marginLeft: 40, marginTop: 10 }}>
                    <StyledText size="s" color={gray6}>
                        {user.source}:{' '}
                    </StyledText>
                    <StyledText size="l" color={gray10}></StyledText>
                    <StyledText size="xxl">{user.fullName}</StyledText>
                </Stack>
            </StyledCardInfo>

            <PageSep />

            <StyledCardInfo>
                <StyledContactsInfo>
                    <StyledText size="m" color={gray9} weight="bold">
                        Contacts
                        <StyledContactsLine />
                    </StyledText>

                    <StyledText size="s" color={gray10}>
                        <EnvelopeIcon size={15} color={textColor} />{' '}
                        <Link inline target="_blank" href={`mailto:${user.email}`}>
                            {user.email}
                        </Link>
                    </StyledText>
                    <StyledText size="s" color={gray10}>
                        <Link inline target="_blank" href={user.gitlab?.web_url}>
                            <GitLabIcon size={15} color={textColor} /> {user.gitlab?.username}
                        </Link>
                    </StyledText>

                    <StyledText size="s" color={gray10}>
                        <GitHubIcon size={15} color={textColor} />{' '}
                        <Link inline target="_blank" href={`https://github.com/${user.github}`}>
                            {user.github}
                        </Link>
                    </StyledText>

                    <StyledText size="s" color={gray10}>
                        <TelegramIcon size={15} color={textColor} />
                        <Link inline target="_blank" href={`https://t.me/${user.telegram}`}>
                            {' '}
                            {user.telegram}
                        </Link>
                    </StyledText>
                    <StyledText size="s" color={gray8}>
                        <StyledAddIcon size="s" color={gray2} /> Add link
                    </StyledText>
                </StyledContactsInfo>

                <StyledCardInfo>
                    <StyledVerticalLine />
                    
                    <StyledContactsInfo>
                        <Text size="m" color={gray9} weight="bold">
                            Quick summary
                        </Text>

                        {user.supervisor?.fullName && (
                            <Text size="m" color={gray9}>
                                Supervisor: <Text as="span"> {user.supervisor?.fullName}</Text>
                            </Text>
                        )}
                        <Text color={gray9}>Coordinator:</Text>
                        <StyledTeams>
                            <Text size="m" color={gray9} weight="bold">
                                Teams with participation
                            </Text>
                            {membershipGroupName.map((group) => (
                                <StyledGroup>
                                    <ProjectIcon size={15} color={gray9} />
                                    <Text key={group}>{group}</Text>
                                </StyledGroup>
                            ))}
                        </StyledTeams>
                    </StyledContactsInfo>
                </StyledCardInfo>
            </StyledCardInfo>
        </>
    );
};
