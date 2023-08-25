import { gapL, gapM, gapS, gapXs, gray10, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { Link, Text } from '@taskany/bricks';
import { IconEnvelopeOutline, IconGithubOutline, IconGitlabOutline, IconTelegramOutline } from '@taskany/icons';

import { User } from '../../api-client/users/user-types';
import { PageSep } from '../PageSep';

const StyledUserInfo = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapS};
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledContactsLine = styled(PageSep)`
    white-space: nowrap;
    margin: ${gapXs} 0px;
    width: 300px;
`;

const StyledLink = styled(Link)`
    color: ${gray10};
    margin-left: ${gapS};
    font-size: 14px;
`;

const StyledCard = styled.div`
    height: 100%;
`;

type UserContactsProps = {
    user: User | undefined;
};

export const UserContacts = ({ user }: UserContactsProps) => {
    return (
        <>
            <StyledCard>
                <StyledUserInfo>
                    <Text size="m" color={gray9} weight="bold">
                        Contacts
                        <StyledContactsLine />
                    </Text>
                    <div>
                        <IconEnvelopeOutline size={15} color={gray10} />
                        <StyledLink inline target="_blank" href={`mailto:${user?.email}`}>
                            {user?.email}
                        </StyledLink>
                    </div>
                    {user?.telegram && (
                        <div>
                            <IconTelegramOutline size={15} color={gray10} />
                            <StyledLink inline target="_blank" href={`https://t.me/${user.telegram}`}>
                                {user.telegram}
                            </StyledLink>
                        </div>
                    )}
                    {user?.gitlab && (
                        <div>
                            <IconGitlabOutline size={15} color={gray10} />
                            <StyledLink inline target="_blank" href={user?.gitlab?.web_url}>
                                {user.gitlab?.username}
                            </StyledLink>
                        </div>
                    )}
                    {user?.github && (
                        <div>
                            <IconGithubOutline size={15} color={gray10} />
                            <StyledLink inline target="_blank" href={`https://github.com/${user.github}`}>
                                {user.github}
                            </StyledLink>
                        </div>
                    )}
                </StyledUserInfo>
            </StyledCard>
        </>
    );
};
