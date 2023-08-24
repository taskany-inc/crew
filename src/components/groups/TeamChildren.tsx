import { backgroundColor, gapL, gapM, gapS, gray10, gray9, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { Link, PlusIcon, ProjectIcon, Text } from '@taskany/bricks';

import { PageSep } from '../PageSep';
import { pageHrefs } from '../../utils/path';
import { GroupsPage } from '../../api-client/groups/group-types';
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

const StyledLink = styled(Link)`
    color: ${gray10};
    margin-left: ${gapS};
    font-size: 16px;
    color: ${textColor};
`;

const StyledAddLink = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${gapS};
    margin-top: ${gapS};
`;

type GroupTeamsProps = {
    groupChildren: GroupsPage;
};

export const TeamChildren = ({ groupChildren }: GroupTeamsProps) => {
    return (
        <>
            <StyledUserTeams>
                <Text color={gray9} size="m" weight="bold">
                    Teams
                    <StyledPageSep />
                </Text>

                {groupChildren &&
                    groupChildren?.items?.map((child) => (
                        <div key={child._id}>
                            <ProjectIcon size={13} color={gray9} />

                            <StyledLink
                                inline
                                target="_blank"
                                color={backgroundColor}
                                key={child.name}
                                href={pageHrefs.group(child._id)}
                            >
                                {child.name}
                            </StyledLink>
                        </div>
                    ))}

                {/* TODO: Link to add to the teams */}
                <InlineTrigger icon={<PlusIcon noWrap size="xs" />} text={'Add teams'} onClick={() => {}} />
            </StyledUserTeams>
        </>
    );
};