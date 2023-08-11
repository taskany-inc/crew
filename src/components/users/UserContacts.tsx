import { gapL, gapM, gapS, gray10, gray9, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { EnvelopeIcon, GitHubIcon, GitLabIcon, Link, TelegramIcon, Text } from '@taskany/bricks';

import { User } from '../../api-client/users/user-types';
import { PageSep } from '../PageSep';

const StyledUserInfo = styled.div`
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
    color: ${gray10};
    margin-left: ${gapS};
`;

type UserContactsProps = {
    user: User | undefined;
};

export const UserContacts = ({ user }: UserContactsProps) => {
    return (
        <>
            <StyledUserInfo>
                <div>
                    <Text size="m" color={gray9} weight="bold">
                        Contacts
                    </Text>
                    <StyledPageSep />
                </div>
                <div>
                    <EnvelopeIcon size={15} color={textColor} />
                    <StyledLink inline target="_blank" href={`mailto:${user?.email}`}>
                        {user?.email}
                    </StyledLink>
                </div>
                {user?.gitlab && (
                    <div>
                        <GitLabIcon size={15} color={textColor} />
                        <StyledLink inline target="_blank" href={user?.gitlab?.web_url}>
                            {user.gitlab?.username}
                        </StyledLink>
                    </div>
                )}
                {user?.github && (
                    <div>
                        <>
                            <GitHubIcon size={15} color={textColor} />
                            <StyledLink inline target="_blank" href={`https://github.com/${user.github}`}>
                                {user.github}
                            </StyledLink>
                        </>
                    </div>
                )}
                {user?.telegram && (
                    <div>
                        <>
                            <TelegramIcon size={15} color={textColor} />
                            <StyledLink inline target="_blank" href={`https://t.me/${user.telegram}`}>
                                {user.telegram}
                            </StyledLink>
                        </>
                    </div>
                )}
            </StyledUserInfo>
        </>
    );
};
