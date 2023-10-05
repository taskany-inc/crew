import { useState } from 'react';
import styled from 'styled-components';
import { BonusAction, BonusHistory } from 'prisma/prisma-client';
import { FormTitle, Modal, ModalContent, ModalCross, ModalHeader, Text, nullable } from '@taskany/bricks';
import { IconHistoryOutline } from '@taskany/icons';
import { gapM, gapS, gray10 } from '@taskany/colors';

import { trpc } from '../../trpc/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { FormattedDate } from '../FormattedDate';

import { tr } from './users.i18n';

const StyledHistoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapM};
`;

const StyledHistoryRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: ${gapS};
`;

const StyledModalContent = styled(ModalContent)`
    overflow: auto;
    max-height: 70vh;
`;

const actionToUiText: Record<BonusAction, string> = {
    ADD: tr('Added'),
    SUBTRACT: tr('Subtracted'),
};

const BonusActionItem = ({ history }: { history: BonusHistory }) => {
    return (
        <div>
            <StyledHistoryRow>
                <Text>
                    {actionToUiText[history.action]} {history.amount}
                </Text>
                <FormattedDate date={history.createdAt} />
            </StyledHistoryRow>
            <Text size="s" color={gray10}>
                {history.description}
            </Text>
        </div>
    );
};

type BonusPointsHistoryProps = {
    userId: string;
};

export const BonusPointsHistory = ({ userId }: BonusPointsHistoryProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const historyQuery = trpc.user.getBonusPointsHistory.useQuery(userId, { enabled: modalVisible });

    return (
        <>
            <InlineTrigger
                text={tr('View bonus points history')}
                icon={<IconHistoryOutline size="s" />}
                onClick={() => setModalVisible(true)}
            />

            <Modal visible={modalVisible && !!historyQuery.data} onClose={() => setModalVisible(false)} width={500}>
                <ModalHeader>
                    <FormTitle>{tr('Bonus points history')}</FormTitle>
                    <ModalCross onClick={() => setModalVisible(false)} />
                </ModalHeader>

                <StyledModalContent>
                    {nullable(historyQuery.data, (history) => (
                        <StyledHistoryContainer>
                            {history.map((h) => (
                                <BonusActionItem key={h.id} history={h} />
                            ))}
                        </StyledHistoryContainer>
                    ))}
                </StyledModalContent>
            </Modal>
        </>
    );
};
