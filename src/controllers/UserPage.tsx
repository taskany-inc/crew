import { useUser } from '../api-client/user-api-hook';
import {
    UserPic,
    Text,
    EnvelopeIcon,
    GitHubIcon,
    GitLabIcon,
    TelegramIcon,
    ProjectIcon,
    Link,
    Button,
} from '@taskany/bricks';

import styled from 'styled-components';
import { Stack } from '../components/layout/Stack';
import { PageSep } from '../components/PageSep';
import { LayoutMain } from '../components/layout/LayoutMain';
import { useRouter } from 'next/router';
import { gapS, gray10, gray6, gray9, textColor } from '@taskany/colors';

const StyledTitle = styled(Text)`
    margin-left: 50px;
`;

const StyledText = styled(Text)`
    margin-left: 50px;
`;

const StyledCardInfo = styled.div`
    display: flex;
    flex-direction: row;
`;

const StyledInfo = styled.div`
    display: grid;
    grid-template-columns: 7fr;
    gap: ${gapS};
    margin-right: 80px;
`;

const StyledTeamsInfo = styled.div`
    margin-top: 50px;
`;

export const UserPage = () => {
    const router = useRouter();
    const { userId } = router.query;
    const userQuery = useUser(String(userId));
    const user = userQuery.data;
    if (!user) return null;

    return (
        <LayoutMain pageTitle={''}>
            <StyledCardInfo style={{ marginLeft: 50, marginTop: 20 }}>
                <UserPic size={150} src={user.avatar} />
                <Stack direction="column" gap={5} style={{ marginLeft: 40, marginTop: 10 }}>
                    <StyledText size="s" color={gray6}>
                        {user.source}: {user.groupMemberships.map((i) => i.roles.some((i) => i.title))}
                    </StyledText>
                    <StyledText size="l" color={gray10}></StyledText>
                    <StyledText size="xxl">{user.fullName}</StyledText>
                </Stack>
            </StyledCardInfo>

            <PageSep />

            <StyledCardInfo>
                <StyledInfo>
                    <StyledTitle size="m" color={gray9} weight="bold">
                        Contacts
                    </StyledTitle>

                    <StyledText size="s" color={gray9}>
                        <EnvelopeIcon size={15} color={textColor} />{' '}
                        <Link inline target="_blank" href={`mailto:${user.email}`}>
                            {user.email}
                        </Link>
                    </StyledText>
                    <StyledText size="s" color={gray9}>
                        <Link inline target="_blank" href={user.gitlab?.web_url}>
                            <GitLabIcon size={15} color={textColor} /> {user.gitlab?.username}
                        </Link>
                    </StyledText>

                    <StyledText size="s" color={gray9}>
                        <GitHubIcon size={15} color={textColor} />{' '}
                        <Link inline target="_blank" href={`https://github.com/${user.github}`}>
                            {user.github}
                        </Link>
                    </StyledText>

                    <StyledText size="s" color={gray9}>
                        <TelegramIcon size={15} color={textColor} />
                        <Link inline target="_blank" href={`https://t.me/${user.telegram}`}>
                            {' '}
                            {user.telegram}
                        </Link>
                    </StyledText>
                </StyledInfo>

                <StyledInfo>
                    <Text size="m" color={gray9} weight="bold">
                        Quick summary
                    </Text>

                    <Text size="m" color={gray9}>
                        Supervisor: {user.supervisor?.fullName}
                    </Text>
                    <Text color={gray9}>Cordinator:</Text>
                    <StyledTeamsInfo>
                        <Text size="m" color={gray9} weight="bold">
                            Teams with participation
                        </Text>
                        <div>
                            <ProjectIcon size={15} />
                        </div>
                    </StyledTeamsInfo>
                </StyledInfo>
            </StyledCardInfo>
        </LayoutMain>
    );
};
