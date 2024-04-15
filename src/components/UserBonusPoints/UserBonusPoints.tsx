import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { IconEditSolid, IconBagPlusOutline } from '@taskany/icons';
import { gapS, gapM } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { BonusPointsHistory } from '../BonusPointsHistory/BonusPointsHistory';
import { config } from '../../config';
import { Link } from '../Link';
import { BonusPointsBalanceModal } from '../BonusPointsBalanceModal/BonusPointsBalanceModal';
import { useBoolean } from '../../hooks/useBoolean';
import { useSessionUser } from '../../hooks/useSessionUser';

import { tr } from './UserBonusPoints.i18n';

interface UserBonusPointsProps {
    user: User;
}

const StyledText = styled(Text)`
    margin-top: ${gapM};
`;

const StyledBagIcon = styled(IconBagPlusOutline)`
    margin-right: ${gapS};
`;

export const UserBonusPoints = ({ user }: UserBonusPointsProps) => {
    const modalVisibility = useBoolean(false);
    const sessionUser = useSessionUser();

    return (
        <NarrowSection title={tr('Achievements and bonuses')}>
            <Text size="m">
                {sessionUser.id === user.id ? tr('My bonuses') : tr('Bonuses')}: {user.bonusPoints}
            </Text>
            <BonusPointsHistory userId={user.id} />

            {nullable(sessionUser.role?.editUserBonuses, () => (
                <InlineTrigger
                    text={tr('Add / Subtract')}
                    icon={<IconEditSolid size="s" />}
                    onClick={modalVisibility.setTrue}
                />
            ))}

            <StyledText>
                {nullable(config.bonusPoints.storeLink, (storeLink) => (
                    <Text size="m" weight="bold">
                        <Link href={storeLink} target="_blank">
                            <StyledBagIcon size="s" />
                            {tr('Spend and earn')}
                        </Link>
                    </Text>
                ))}
            </StyledText>

            <BonusPointsBalanceModal
                userId={user.id}
                visible={modalVisibility.value}
                onClose={modalVisibility.setFalse}
            />
        </NarrowSection>
    );
};
