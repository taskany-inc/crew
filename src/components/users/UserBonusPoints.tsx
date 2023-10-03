import { User } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Button, InlineForm, Input, Text, nullable } from '@taskany/bricks';
import { IconEditSolid } from '@taskany/icons';
import { gapM, gapS } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { InlineTrigger } from '../InlineTrigger';
import { UserMeta } from '../../modules/user.types';

import { tr } from './users.i18n';

type UserBonusPointsProps = {
    user: User & UserMeta;
};

const StyledText = styled(Text)`
    margin-bottom: ${gapM};
`;

const StyledReasonInput = styled(Input)`
    margin-bottom: ${gapS};
`;

const StyledRowWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr max-content max-content;
    gap: ${gapS};
`;

export const UserBonusPoints = ({ user }: UserBonusPointsProps) => {
    return (
        <NarrowSection title={tr('Bonus points')}>
            <StyledText>
                {tr('Balance')}: {user.bonusPoints}
            </StyledText>

            {nullable(user.meta.isBalanceEditable, () => (
                <InlineForm
                    onSubmit={async () => {}}
                    onReset={() => {}}
                    renderTrigger={(props) => (
                        <InlineTrigger
                            text={tr('Add / Subtract')}
                            icon={<IconEditSolid noWrap size="s" />}
                            {...props}
                        />
                    )}
                >
                    <StyledReasonInput placeholder={tr('Reason for balance change')} />
                    <StyledRowWrapper>
                        <Input type="number" defaultValue={0} />
                        <Button text="+" />
                        <Button text="-" />
                    </StyledRowWrapper>
                </InlineForm>
            ))}
        </NarrowSection>
    );
};
