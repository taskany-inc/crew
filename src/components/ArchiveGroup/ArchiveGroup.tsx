import { useCallback } from 'react';
import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
} from '@taskany/bricks';
import styled from 'styled-components';
import { gapS } from '@taskany/colors';

import { useGroupMutations } from '../../modules/groupHooks';
import { GroupListItem } from '../GroupListItem';

import { tr } from './ArchiveGroup.i18n';

interface ArchiveGroupModalProps {
    visible: boolean;
    groupId: string;
    groupName: string;
    onClose: VoidFunction;
}

const StyledInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

export const ArchiveGroupModal = ({ visible, groupId, groupName, onClose }: ArchiveGroupModalProps) => {
    const { archiveGroup } = useGroupMutations();

    const onArchiveClick = useCallback(async () => {
        await archiveGroup(groupId);
        onClose();
    }, [archiveGroup, groupId, onClose]);

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Archive group {groupName}', { groupName })}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <StyledInfoWrapper>
                    <GroupListItem groupName={groupName} groupId={groupId} />
                </StyledInfoWrapper>
                <Form>
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onClose} />
                            <Button size="m" view="danger" onClick={onArchiveClick} text={tr('Archive')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
