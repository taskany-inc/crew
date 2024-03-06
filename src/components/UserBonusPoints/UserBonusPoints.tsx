import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { IconEditSolid, IconBagPlusOutline } from '@taskany/icons';
import { gapS, gapM } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { UserMeta } from '../../modules/userTypes';
import { BonusPointsHistory } from '../BonusPointsHistory/BonusPointsHistory';
import { config } from '../../config';
import { Link } from '../Link';
import { BonusPointsBalanceModal } from '../BonusPointsBalanceModal/BonusPointsBalanceModal';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './UserBonusPoints.i18n';

interface UserBonusPointsProps {
    user: User & UserMeta;
}

const StyledText = styled(Text)`
    margin-top: ${gapM};
`;

const StyledBagIcon = styled(IconBagPlusOutline)`
    margin-right: ${gapS};
`;

export const UserBonusPoints = ({ user }: UserBonusPointsProps) => {
    const modalVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Achievements and bonuses')}>
            <Text size="m">
                {tr('My bonuses')}: {user.bonusPoints}
            </Text>
            <BonusPointsHistory userId={user.id} />

            {nullable(user.meta.isBonusEditable, () => (
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
