import styled from 'styled-components';
import { gapL, gapM, gapS, gray9, textColor } from '@taskany/colors';
import { UserPic, Text, Link } from '@taskany/bricks';
import { IconPlusCircleOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { InlineTrigger } from '../InlineTrigger';
import { UsersPage } from '../../api-client/users/user-types';
import { pageHrefs } from '../../utils/path';

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
    color: ${textColor};
    margin-left: ${gapS};
    font-size: 14px;
    font-weight: 600;
`;

type TeamPeopleProps = {
    users: UsersPage;
};

export const TeamPeople = ({ users }: TeamPeopleProps) => {
    return (
        <StyledUsers>
            <Text color={gray9} size="m" weight="bold">
                People
                <StyledPageSep />
            </Text>

            {users?.items.map((user) => (
                <div key={user._id} style={{ gap: gapS, display: 'flex' }}>
                    <UserPic size={17} src={user?.avatar || user?.email} />
                    <StyledLink inline target="_blank" href={pageHrefs.user(user._id)}>
                        {user.fullName}
                    </StyledLink>
                </div>
            ))}

            {/* TODO: Link to "Add participant" */}
            <InlineTrigger
                icon={<IconPlusCircleOutline noWrap size="s" />}
                text={'Add participant'}
                onClick={() => {}}
            />
        </StyledUsers>
    );
};
