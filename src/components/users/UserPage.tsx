import { useRouter } from 'next/router';
import { UserPic, Text, Button, nullable } from '@taskany/bricks';
import { gapL, gapS, gapXl, gray10, gray6 } from '@taskany/colors';
import styled from 'styled-components';

import { PageSep } from '../PageSep';
import { Link } from '../Link';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../layout/LayoutMain';
import { usePreviewContext } from '../../context/preview-context';
import { pages } from '../../hooks/useRouter';
import { NarrowSection } from '../NarrowSection';
import { GroupListItem } from '../groups/GroupListItem';

import { UserContacts } from './UserContacts';
import { tr } from './users.i18n';
import { UserBonusPoints } from './UserBonusPoints';

const StyledHeader = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr max-content;
    gap: ${gapXl};
    padding: 0 ${gapL} ${gapL} ${gapL};
    align-items: end;
`;

const StyledUserNameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledGroupLink = styled(Link)`
    font-size: 21px;
    color: ${gray10};
    font-weight: 700;
`;

const StyledUserInfoWrapper = styled.div`
    margin-top: ${gapL};
    padding: 0 ${gapL};
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: ${gapL};
`;

const StyledLeftPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapL};
`;

const StyledRightPanel = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapL};
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
            <StyledHeader>
                <UserPic size={150} name={user.name} src={user.image} email={user.email} />
                <StyledUserNameWrapper>
                    <Text size="s" color={gray6} weight="bold">
                        {!!orgStructureMembership && orgStructureMembership.roles.map((role) => role.name).join(', ')}
                    </Text>

                    {!!orgStructureMembership && (
                        <StyledGroupLink
                            href={pages.team(orgStructureMembership.id)}
                            onClick={() => showGroupPreview(orgStructureMembership.group.id)}
                        >
                            {orgStructureMembership.group.name}
                        </StyledGroupLink>
                    )}
                    <Text size="xxl" weight="bold">
                        {user.name}
                    </Text>
                </StyledUserNameWrapper>
                {/* TODO: implement profile editing issues/29 */}
                {nullable(user.meta.isEditable, () => (
                    <Button onClick={() => {}} text={tr('Edit')} size="s" />
                ))}
            </StyledHeader>

            <PageSep />

            <StyledUserInfoWrapper>
                <StyledLeftPanel>
                    <UserBonusPoints user={user} />

                    <UserContacts user={user} />
                </StyledLeftPanel>

                <StyledRightPanel>
                    <NarrowSection title={tr('Teams with participation')}>
                        {otherMemberships.map((membership) => (
                            <GroupListItem group={membership.group} key={membership.id} />
                        ))}
                    </NarrowSection>
                </StyledRightPanel>
            </StyledUserInfoWrapper>
        </LayoutMain>
    );
};
