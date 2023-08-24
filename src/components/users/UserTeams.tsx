import { gapL, gapM, gapS, gapXs, gray10, gray9, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { Link, PlusIcon, ProjectIcon, Text } from '@taskany/bricks';

import { User } from '../../api-client/users/user-types';
import { PageSep } from '../PageSep';
import { pageHrefs } from '../../utils/path';
import { InlineTrigger } from '../InlineTrigger';

const StyledUserTeams = styled.div`
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

const StyledRoles = styled.div`
    display: flex;
    flex-direction: rows;
    gap: ${gapXs};
`;

const StyledLink = styled(Link)`
    color: ${gray10};
    margin-left: ${gapS};
    color: ${textColor};
    font-weight: bold;
`;

type UserTeamsProps = {
    user: User | undefined;
};

export const UserTeams = ({ user }: UserTeamsProps) => {
    const groupMemberships = user?.groupMemberships;
    const teams = groupMemberships?.filter(({ isOrgGroup }) => !isOrgGroup);

    return (
        <>
            <StyledUserTeams>
                <Text color={gray9} size="m">
                    Teams
                    <StyledPageSep />
                </Text>

                {teams &&
                    teams?.map((team) => (
                        <div key={team.uid}>
                            <ProjectIcon size={15} color={gray9} />

                            <StyledLink
                                inline
                                target="_blank"
                                color={textColor}
                                key={team.groupName}
                                href={pageHrefs.group(team.uid)}
                            >
                                {team.groupName}
                            </StyledLink>
                            <StyledRoles>
                                {team.roles.length > 0 && (
                                    <Text size="s" color={gray10}>
                                        <Text size="s" as="span" color={gray9}>
                                            Role:
                                        </Text>{' '}
                                        {team.roles.map((role) => role.title).join(', ')}
                                    </Text>
                                )}
                            </StyledRoles>
                        </div>
                    ))}

                {/* TODO: Link to add to the teams */}
                <InlineTrigger icon={<PlusIcon noWrap size="xs" />} text={'Add teams'} onClick={() => {}} />
            </StyledUserTeams>
        </>
    );
};