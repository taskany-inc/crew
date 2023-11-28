import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { IconEditSolid } from '@taskany/icons';
import { gapM, gray8 } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { UserMeta } from '../../modules/userTypes';
import { BonusPointsHistory } from '../BonusPointsHistory/BonusPointsHistory';
import { config } from '../../config';
import { Link } from '../Link';
import { BonusPointsBalanceModal } from '../BonusPointsBalanceModal/BonusPointsBalanceModal';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './UserBonusPoints.i18n';

type UserBonusPointsProps = {
    user: User & UserMeta;
};

const StyledText = styled(Text)`
    margin-bottom: ${gapM};
`;

export const UserBonusPoints = ({ user }: UserBonusPointsProps) => {
    const modalVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Bonus points')}>
            <StyledText>
                {tr('Balance')}: {user.bonusPoints}
            </StyledText>

            {nullable(user.meta.isBonusEditable, () => (
                <InlineTrigger
                    text={tr('Add / Subtract')}
                    icon={<IconEditSolid size="s" />}
                    onClick={modalVisibility.setTrue}
                />
            ))}

            <BonusPointsHistory userId={user.id} />

            {nullable(config.bonusPoints.storeLink, (storeLink) => (
                <Text color={gray8} size="s">
                    <Link href={storeLink} target="_blank">
                        {tr('Spend and earn')}
                    </Link>
                </Text>
            ))}

            <BonusPointsBalanceModal
                userId={user.id}
                visible={modalVisibility.value}
                onClose={modalVisibility.setFalse}
            />
        </NarrowSection>
    );
};
