import { Button, Table, TableCell, TableRow, Text } from '@taskany/bricks/harmony';
import { useCallback, useMemo } from 'react';

import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { trpc } from '../../trpc/trpcClient';
import { useLocale } from '../../hooks/useLocale';
import { UserRequest } from '../../trpc/inferredTypes';

import { tr } from './UserCreateRequestsTable.i18n';

interface UserCreateRequestsTableProps {
    openModal: () => void;
    onSelectRequest: (request: UserRequest) => void;
}

export const UserCreateRequestsTable = ({ openModal, onSelectRequest }: UserCreateRequestsTableProps) => {
    const locale = useLocale();
    const { data: userRequests = [] } = trpc.user.getUsersRequests.useQuery();

    const thead = useMemo(() => {
        return [
            { content: tr('Name'), width: 240 },
            { content: tr('Login'), width: 180 },
            { content: tr('Email'), width: 180 },
            { content: tr('Organization'), width: 180 },
            { content: tr('Group'), width: 180 },
            { content: tr('Supervisor'), width: 180 },
            { content: null },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale]);

    const handleOpenModal = useCallback(
        (request: UserRequest) => () => {
            openModal();
            onSelectRequest(request);
        },
        [onSelectRequest, openModal],
    );

    const userRequestsData = useMemo(
        () =>
            userRequests.map((request) => ({
                request,
                list: [
                    {
                        content: <Text>{request.name}</Text>,
                        width: 240,
                    },
                    {
                        content: <Text>{request.login}</Text>,
                        width: 160,
                    },
                    {
                        content: <Text>{request.email}</Text>,
                        width: 160,
                    },
                    {
                        content: <Text>{request.organization.name}</Text>,
                        width: 160,
                    },
                    {
                        content: <Text>{request.group.name}</Text>,
                        width: 160,
                    },
                    {
                        content: <Text>{request.supervisor.name}</Text>,
                        width: 160,
                    },
                    {
                        content: <Button text="Resolve" onClick={handleOpenModal(request)} />,
                    },
                ],
            })),
        [handleOpenModal, userRequests],
    );

    return (
        <Table>
            <TableRow>
                {thead.map((th) => (
                    <TableCell key={th.content} width={th.width}>
                        {th.content}
                    </TableCell>
                ))}
            </TableRow>
            {userRequestsData.map((row) => {
                return (
                    <TableListItem key={row.request.id}>
                        {row.list.map((cell, index) => (
                            <TableListItemElement key={`${row.request.id}-${index}`} width={cell.width}>
                                {cell.content}
                            </TableListItemElement>
                        ))}
                    </TableListItem>
                );
            })}
        </Table>
    );
};
