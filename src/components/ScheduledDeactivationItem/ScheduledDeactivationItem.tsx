import { ScheduledDeactivation } from '@prisma/client';
import { Text } from '@taskany/bricks';
import { gapM, gapS, gray1, gray9 } from '@taskany/colors';
import styled from 'styled-components';

import { ScheduledDeactivationCreator, ScheduledDeactivationUser } from '../../modules/scheduledDeactivationTypes';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';

import { tr } from './ScheduledDeactivationItem.i18n';

const StyledWrapper = styled.div`
    width: 70%;
    padding: ${gapM};
    margin: ${gapM};

    &:hover {
        background-color: ${gray1};
    }
`;

const StyledText = styled(Text)`
    color: inherit;
    margin-bottom: ${gapS};
`;

interface ScheduledDeactivationItemProps {
    scheduledDeactivation: ScheduledDeactivation & ScheduledDeactivationCreator & ScheduledDeactivationUser;
}

export const ScheduledDeactivationItem = ({ scheduledDeactivation }: ScheduledDeactivationItemProps) => {
    const title =
        scheduledDeactivation.type === 'retirement'
            ? tr('Retirement of {name}', { name: scheduledDeactivation.user.name! })
            : tr('Transfer of {name} from {oldOrganization} to {newOrganization}', {
                  name: scheduledDeactivation.user.name!,
                  oldOrganization: scheduledDeactivation.organization,
                  newOrganization: scheduledDeactivation.newOrganization!,
              });
    return (
        <StyledWrapper>
            <Link href={pages.user(scheduledDeactivation.user.id)}>
                <StyledText size="l" weight="bold">
                    {title}
                </StyledText>
            </Link>
            <Link href={pages.user(scheduledDeactivation.creator.id)}>
                <StyledText>
                    {tr('Author')}: {scheduledDeactivation.creator.name}
                </StyledText>
            </Link>
            <Text color={gray9}>
                {tr('Date')}: {scheduledDeactivation.deactivateDate.toLocaleDateString()}
            </Text>
        </StyledWrapper>
    );
};
