import { gapL, gapM, gapS, gray9, gapXs, textColor } from '@taskany/colors';
import styled from 'styled-components';
import { Link, Text } from '@taskany/bricks';

import { User } from '../../api-client/users/user-types';
import { PageSep } from '../PageSep';
import { pageHrefs } from '../../utils/path';

const StyledQuickSummary = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapXs};
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledPageSep = styled(PageSep)`
    white-space: nowrap;
    margin: 5px 0px;
    width: 300px;
`;

const StyledSupervisorLink = styled(Link)`
    color: ${textColor};
    margin-left: ${gapXs};
`;

type QuickSummaryProps = {
    user: User | undefined;
};

export const QuickSummary = ({ user }: QuickSummaryProps) => {
    return (
        <>
            <StyledQuickSummary>
                {user?.supervisor && (
                    <>
                        <Text as="span" size="m" color={gray9} weight="bold">
                            Quick summary
                            <StyledPageSep />
                        </Text>
                        <div>
                            <Text size="m" color={gray9}>
                                Supervisor:{' '}
                                <StyledSupervisorLink
                                    inline
                                    target="_blank"
                                    href={pageHrefs.user(user.supervisor?.userId)}
                                >
                                    {user.supervisor?.fullName}
                                </StyledSupervisorLink>
                            </Text>
                        </div>
                    </>
                )}
            </StyledQuickSummary>
        </>
    );
};
