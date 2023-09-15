import { Group } from 'prisma/prisma-client';
import { gapL, gapM, gapS, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { IconPlusCircleOutline, IconUsersOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { pages } from '../../hooks/useRouter';
import { InlineTrigger } from '../InlineTrigger';
import { Link } from '../Link';

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
    margin-left: ${gapS};
`;

type GroupTeamsProps = {
    groupChildren: Group[];
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
                    groupChildren.map((child) => (
                        <div key={child.id}>
                            <IconUsersOutline size={13} color={gray9} />

                            <StyledLink target="_blank" href={pages.team(child.id)}>
                                {child.name}
                            </StyledLink>
                        </div>
                    ))}

                {/* TODO: Link to add to the teams */}
                <InlineTrigger
                    icon={<IconPlusCircleOutline noWrap size="xs" />}
                    text={'Add teams'}
                    onClick={() => {}}
                />
            </StyledUserTeams>
        </>
    );
};
