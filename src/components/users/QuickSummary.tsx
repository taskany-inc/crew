import { gapL, gapM, gapS, gray9, gapXs } from '@taskany/colors';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';

import { User } from '../../api-client/users/user-types';
import { PageSep } from '../PageSep';
import { pages } from '../../hooks/useRouter';
import { Link } from '../Link';

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
                                <StyledSupervisorLink target="_blank" href={pages.user(user.supervisor.userId)}>
                                    {user.supervisor.fullName}
                                </StyledSupervisorLink>
                            </Text>
                        </div>
                    </>
                )}
            </StyledQuickSummary>
        </>
    );
};
