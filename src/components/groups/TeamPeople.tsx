import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { gapL, gapM, gapS, gapXs, gray9 } from '@taskany/colors';
import { UserPic, Text } from '@taskany/bricks';
import { IconPlusCircleOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { InlineTrigger } from '../InlineTrigger';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';

const StyledUsers = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapS};
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledPageSep = styled(PageSep)`
    white-space: nowrap;
    margin: 5px 0px;
    width: 300px;
`;

const StyledLink = styled(Link)`
    margin-left: ${gapXs};
    font-size: 14px;
    font-weight: 600;
`;

type TeamPeopleProps = {
    users: User[];
};

export const TeamPeople = ({ users }: TeamPeopleProps) => {
    return (
        <StyledUsers>
            <Text color={gray9} size="m" weight="bold">
                People
                <StyledPageSep />
            </Text>

            {users.map((user) => (
                <div key={user.id} style={{ gap: gapS, display: 'flex' }}>
                    <UserPic size={17} name={user.name} src={user.image} email={user.email} />
                    <StyledLink target="_blank" href={pages.user(user.id)}>
                        {user.name}
                    </StyledLink>
                </div>
            ))}

            <InlineTrigger
                icon={<IconPlusCircleOutline noWrap size="s" />}
                text={'Add participant'}
                onClick={() => {}}
            />
        </StyledUsers>
    );
};
