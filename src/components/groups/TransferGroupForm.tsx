import {
    AutoComplete,
    AutoCompleteInput,
    AutoCompleteList,
    Button,
    MenuItem,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
    Text,
    nullable,
} from '@taskany/bricks';
import { gapM, gapS, gray10 } from '@taskany/colors';
import styled from 'styled-components';
import { useState } from 'react';
import { Group } from 'prisma/prisma-client';
import { IconGitPullOutline, IconSearchOutline } from '@taskany/icons';

import { trpc } from '../../trpc/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { GroupListItem } from '../GroupListItem';
import { useGroupMutations } from '../../modules/group.hooks';

import { tr } from './groups.i18n';

const StyledModalContent = styled(ModalContent)`
    min-height: 390px;
`;

const StyledConfirmationWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapM};
`;

const StyledButtontRow = styled.div`
    display: flex;
    gap: ${gapS};
`;

interface TransferGroupFormProps {
    group: Group;
}

export const TransferGroupForm = ({ group }: TransferGroupFormProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<Group>();
    const groupListQuery = trpc.group.getList.useQuery({ search, take: 10 }, { keepPreviousData: true });
    const oldBreadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(group.id);
    const newBreadcrumbsQuery = trpc.group.getBreadcrumbs.useQuery(selectedGroup?.id ?? group.id);
    const { moveGroup } = useGroupMutations();

    const onReset = () => {
        setSearch('');
        setSelectedGroup(undefined);
    };

    const onClose = () => {
        onReset();
        setModalVisible(false);
    };

    const onTransferClick = async () => {
        if (!selectedGroup) {
            return;
        }
        await moveGroup.mutateAsync({ id: group.id, newParentId: selectedGroup.id });
        onClose();
    };

    return (
        <>
            <InlineTrigger
                icon={<IconGitPullOutline noWrap size="xs" />}
                text={tr('Transfer group')}
                onClick={() => setModalVisible(true)}
            />

            <Modal visible={modalVisible} width={400} onClose={onClose}>
                <ModalHeader>
                    <Text size="l">{tr('Transfer group')}</Text>
                    <ModalCross onClick={onClose} />
                </ModalHeader>

                <StyledModalContent>
                    {nullable(selectedGroup, () => (
                        <StyledConfirmationWrapper>
                            <Text>{tr('Current group path')}</Text>
                            <div>
                                {oldBreadcrumbsQuery.data?.map((g) => (
                                    <GroupListItem key={g.id} group={g} />
                                ))}
                            </div>

                            {nullable(selectedGroup, () => (
                                <>
                                    <Text>{tr('New group path')}</Text>
                                    <div>
                                        {newBreadcrumbsQuery.data?.map((g) => (
                                            <GroupListItem key={g.id} group={g} />
                                        ))}
                                        <GroupListItem group={group} />
                                    </div>
                                </>
                            ))}

                            <StyledButtontRow>
                                <Button view="default" text={tr('Cancel')} onClick={onReset} />
                                <Button view="primary" text={tr('Transfer')} onClick={onTransferClick} />
                            </StyledButtontRow>
                        </StyledConfirmationWrapper>
                    ))}

                    {!selectedGroup && (
                        <AutoComplete<Group>
                            mode="single"
                            items={groupListQuery.data ?? []}
                            onChange={(items) => {
                                setSearch(items[0].name);
                                setSelectedGroup(items[0]);
                            }}
                            keyGetter={(item) => item.id}
                            renderItem={(props) => (
                                <MenuItem
                                    key={props.item.id}
                                    ghost
                                    focused={props.hovered}
                                    onClick={props.onItemClick}
                                    color={gray10}
                                >
                                    {props.item.name}
                                </MenuItem>
                            )}
                        >
                            <AutoCompleteInput
                                type="text"
                                value={search}
                                onChange={(value) => setSearch(value)}
                                iconLeft={<IconSearchOutline size="xs" />}
                                placeholder={tr('Group search')}
                            />
                            <AutoCompleteList title={tr('Groups')} />
                        </AutoComplete>
                    )}
                </StyledModalContent>
            </Modal>
        </>
    );
};
