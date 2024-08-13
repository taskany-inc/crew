import { Button, Table, TableCell, TableRow } from '@taskany/bricks/harmony';
import { useCallback, useMemo } from 'react';

import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { trpc } from '../../trpc/trpcClient';
import { useLocale } from '../../hooks/useLocale';
import { UserRequest } from '../../trpc/inferredTypes';
import { TableCellText } from '../TableCellText/TableCellText';

import { tr } from './UserCreateRequestsTable.i18n';
import s from './UserCreateRequestTable.module.css';

interface UserCreateRequestsTableProps {
    openModal: () => void;
    onSelectRequest: (request: UserRequest) => void;
}

export const UserCreateRequestsTable = ({ openModal, onSelectRequest }: UserCreateRequestsTableProps) => {
    const locale = useLocale();
    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({ active: true });

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
                        content: <TableCellText text={request.name} />,
                        width: 240,
                    },
                    {
                        content: <TableCellText text={request.login} />,
                        width: 160,
                    },
                    {
                        content: <TableCellText text={request.email} />,
                        width: 160,
                    },
                    {
                        content: <TableCellText text={request.organization.name} />,
                        width: 160,
                    },
                    {
                        content: <TableCellText text={request.group.name} />,
                        width: 160,
                    },
                    {
                        content: <TableCellText text={request.supervisor.name || ''} />,
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
            <TableRow className={s.TableHeader}>
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
