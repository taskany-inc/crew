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
import { Badge } from '@taskany/bricks/harmony';
import { gapS, gray10, gray8 } from '@taskany/colors';
import { IconBinOutline } from '@taskany/icons';

import { useGroupMutations } from '../../modules/groupHooks';
import { GroupListItem } from '../GroupListItem';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './ArchiveGroupForm.i18n';

interface ArchiveGroupFormProps {
    groupId: string;
    groupName: string;
}

const StyledInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledBadge = styled(Badge)`
    cursor: pointer;
    &:hover {
        color: ${gray10};
    }
    color: ${gray8};
    padding: 0;
`;

export const ArchiveGroupForm = ({ groupId, groupName }: ArchiveGroupFormProps) => {
    const { archiveGroup } = useGroupMutations();
    const archiveGroupModalVisibility = useBoolean(false);

    const onArchiveClick = useCallback(async () => {
        await archiveGroup(groupId);
        archiveGroupModalVisibility.setFalse();
    }, [archiveGroup, groupId, archiveGroupModalVisibility]);

    return (
        <>
            <StyledBadge
                onClick={archiveGroupModalVisibility.setTrue}
                iconLeft={<IconBinOutline size="xs" />}
                text={tr('Archive group')}
                weight="regular"
            />

            <Modal
                visible={archiveGroupModalVisibility.value}
                onClose={archiveGroupModalVisibility.setFalse}
                width={500}
            >
                <ModalHeader>
                    <FormTitle>{tr('Archive group {groupName}', { groupName })}</FormTitle>
                    <ModalCross onClick={archiveGroupModalVisibility.setFalse} />
                </ModalHeader>

                <ModalContent>
                    <StyledInfoWrapper>
                        <GroupListItem groupName={groupName} groupId={groupId} />
                    </StyledInfoWrapper>
                    <Form>
                        <FormActions>
                            <FormAction left />
                            <FormAction right inline>
                                <Button size="m" text={tr('Cancel')} onClick={archiveGroupModalVisibility.setFalse} />
                                <Button size="m" view="danger" onClick={onArchiveClick} text={tr('Archive')} />
                            </FormAction>
                        </FormActions>
                    </Form>
                </ModalContent>
            </Modal>
        </>
    );
};
