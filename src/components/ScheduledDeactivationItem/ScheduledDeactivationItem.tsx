import { ScheduledDeactivation } from '@prisma/client';
import { Text } from '@taskany/bricks';
import { gapM, gapS, gray1, gray9 } from '@taskany/colors';
import styled from 'styled-components';

import {
    ScheduledDeactivationAttaches,
    ScheduledDeactivationCreator,
    ScheduledDeactivationNewOrganizationUnit,
    ScheduledDeactivationOrganizationUnit,
    ScheduledDeactivationUser,
} from '../../modules/scheduledDeactivationTypes';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { useSessionUser } from '../../hooks/useSessionUser';
import { Restricted } from '../Restricted';
import { ScheduledDeactivationEditMenu } from '../ScheduledDeactivationEditMenu/ScheduledDeactivationEditMenu';
import { getOrgUnitTitle } from '../../utils/organizationUnit';

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
const StyledRow = styled.div`
    display: grid;
    grid-template-columns: 4fr 1fr 10px;
    gap: ${gapS};
    width: 100%;
`;

interface ScheduledDeactivationItemProps {
    scheduledDeactivation: ScheduledDeactivation &
        ScheduledDeactivationCreator &
        ScheduledDeactivationUser &
        ScheduledDeactivationOrganizationUnit &
        ScheduledDeactivationNewOrganizationUnit &
        ScheduledDeactivationAttaches;
}

export const ScheduledDeactivationItem = ({ scheduledDeactivation }: ScheduledDeactivationItemProps) => {
    const sessionUser = useSessionUser();

    const title =
        scheduledDeactivation.type === 'retirement'
            ? tr('Retirement of {name}', { name: scheduledDeactivation.user.name! })
            : tr('Transfer of {name} from {oldOrganization} to {newOrganization}', {
                  name: scheduledDeactivation.user.name!,
                  oldOrganization: scheduledDeactivation?.organizationUnit
                      ? getOrgUnitTitle(scheduledDeactivation.organizationUnit)
                      : '',
                  newOrganization: scheduledDeactivation?.newOrganizationUnit
                      ? getOrgUnitTitle(scheduledDeactivation.newOrganizationUnit)
                      : '',
              });
    return (
        <StyledWrapper>
            <StyledRow>
                <>
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
                </>
                <Restricted visible={!!sessionUser.role?.editScheduledDeactivation}>
                    <ScheduledDeactivationEditMenu scheduledDeactivation={scheduledDeactivation} />
                </Restricted>
            </StyledRow>
            <Text color={gray9}>
                {tr('Date')}: {scheduledDeactivation.deactivateDate.toLocaleDateString()}
            </Text>
        </StyledWrapper>
    );
};
