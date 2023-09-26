import { useRouter } from 'next/router';
import { UserPic, Text, Button } from '@taskany/bricks';
import { IconUsersOutline } from '@taskany/icons';
import { gapL, gapM, gapS, gapSm, gapXl, gapXs, gray10, gray6, gray9, textColor } from '@taskany/colors';
import styled from 'styled-components';

import { PageSep } from '../PageSep';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../layout/LayoutMain';
import { usePreviewContext } from '../../context/preview-context';
import { pages } from '../../hooks/useRouter';

import { UserContacts } from './UserContacts';
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
    gap: ${gapL};
    margin: ${gapXs} 0 ${gapL} ${gapXl};
`;

const StyledLine = styled(PageSep)`
    white-space: nowrap;
    margin: ${gapXs} 0px;
    width: 300px;
`;

const StyledTeamsLink = styled(Link)`
    margin-left: ${gapS};
    color: ${textColor};
    font-weight: 500;
`;

export const UserPage = () => {
    const router = useRouter();
    const { showGroupPreview } = usePreviewContext();

    const { userId } = router.query;
    const userQuery = trpc.user.getById.useQuery(String(userId));
    const user = userQuery.data;

    if (!user) return null;

    const groupMemberships = user.memberships;

    // TODO: select real org group
    const orgStructureMembership = groupMemberships[0];
    const otherMemberships = groupMemberships.slice(1);

    return (
        <LayoutMain pageTitle={user.name}>
            <StyledUser>
                <StyledUserPic size={150} name={user.name} src={user.image} email={user.email} />{' '}
                <StyledCard>
                    <Text size="s" color={gray6} weight="bold">
                        {!!orgStructureMembership && orgStructureMembership.roles.map((role) => role.name).join(', ')}
                    </Text>

                    {!!orgStructureMembership && (
                        <StyledGroupLink
                            target="_blank"
                            href={pages.team(orgStructureMembership.id)}
                            onClick={() => showGroupPreview(orgStructureMembership.group)}
                        >
                            {orgStructureMembership.group.name}
                        </StyledGroupLink>
                    )}
                    <Text size="xxl" weight="bold">
                        {user.name}
                    </Text>
                </StyledCard>
                <StyledButton>
                    <Button onClick={() => {}} text="Edit" color={textColor} size="s" />
                </StyledButton>
            </StyledUser>
            <PageSep />
            <StyledWrapper>
                <StyledUserContacts>
                    <UserContacts user={user} userServices={[]} />
                </StyledUserContacts>

                <StyledInfo>
                    <Text size="m" color={gray9} weight="bold">
                        {tr('Teams with participation')}
                        <StyledLine />
                    </Text>
                    {otherMemberships.map((membership) => (
                        <StyledGroups key={membership.id}>
                            <IconUsersOutline size={15} color={gray9} />

                            <StyledTeamsLink
                                target="_blank"
                                href={pages.team(membership.id)}
                                key={membership.group.name}
                                onClick={() => showGroupPreview(membership.group)}
                            >
                                {membership.group.name}
                            </StyledTeamsLink>
                        </StyledGroups>
                    ))}
                </StyledInfo>
            </StyledWrapper>
        </LayoutMain>
    );
};
