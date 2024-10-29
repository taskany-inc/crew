import { Button, Table, TableCell, TableRow, Text, Badge, Dot } from '@taskany/bricks/harmony';
import { useMemo, useState } from 'react';
import cn from 'classnames';
import { IconSortDownOutline, IconSortUpOutline } from '@taskany/icons';

import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { trpc } from '../../trpc/trpcClient';
import { useLocale } from '../../hooks/useLocale';
import { TableCellText } from '../TableCellText/TableCellText';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';

import s from './UserDecreeRequestsPage.module.css';
import { tr } from './UserDecreeRequestsPage.i18n';

export const UserDecreeRequestsPage = () => {
    const locale = useLocale();

    const [clickNameOrderCount, setClickNameOrderCount] = useState<'desc' | 'asc' | undefined>(undefined);
    const [clickDateOrderCount, setClickDateOrderCount] = useState<'desc' | 'asc'>('desc');

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        type: ['toDecree', 'fromDecree'],
        status: null,
        orderBy: { name: clickNameOrderCount, date: clickDateOrderCount },
    });

    const onNameOrderClick = () => {
        if (!clickNameOrderCount) setClickNameOrderCount('asc');
        if (clickNameOrderCount === 'asc') setClickNameOrderCount('desc');
        if (clickNameOrderCount === 'desc') setClickNameOrderCount(undefined);
    };

    const onDateOrderClick = () =>
        clickDateOrderCount === 'desc' ? setClickDateOrderCount('asc') : setClickDateOrderCount('desc');

    const statusText = (status: 'Approved' | 'Denied' | null) => {
        if (status === 'Approved') return tr('Approved');
        if (status === 'Denied') return tr('Denied');
        return tr('Under concideration');
    };

    const thead = useMemo(() => {
        return [
            { content: <Text className={s.HeaderText}>{tr('Status')}</Text>, width: 150 },
            {
                content: (
                    <div className={s.HeaderCellWithOrder}>
                        <Text className={s.HeaderText}>{tr('Name')}</Text>

                        <Button
                            iconLeft={
                                clickNameOrderCount !== 'desc' ? (
                                    <IconSortDownOutline size="s" />
                                ) : (
                                    <IconSortUpOutline size="s" />
                                )
                            }
                            view="clear"
                            className={cn({ [s.ButtonActive]: !!clickNameOrderCount })}
                            onClick={onNameOrderClick}
                            size="xs"
                        />
                    </div>
                ),
                width: 140,
            },
            { content: <Text className={s.HeaderText}>{tr('Type')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Role')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Team')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Supervisor')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Author')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Coordinator')}</Text>, width: 100 },
            {
                content: (
                    <Text className={s.HeaderText}>
                        <div className={s.HeaderCellWithOrder}>
                            <Text className={s.HeaderText}>{tr('Start date')}</Text>

                            <Button
                                iconLeft={
                                    clickDateOrderCount === 'desc' ? (
                                        <IconSortDownOutline size="s" />
                                    ) : (
                                        <IconSortUpOutline size="s" />
                                    )
                                }
                                view="clear"
                                className={cn({ [s.ButtonActive]: clickDateOrderCount === 'asc' })}
                                onClick={onDateOrderClick}
                                size="xs"
                            />
                        </div>
                    </Text>
                ),
                width: 100,
            },
            { content: <Text className={s.HeaderText}>{tr('Actions')}</Text>, width: 100 },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale, clickNameOrderCount, clickDateOrderCount]);

    const userRequestsData = useMemo(
        () =>
            userRequests.map((request) => ({
                request,
                list: [
                    {
                        content: (
                            <TableCellText
                                text={
                                    <Badge
                                        ellipsis
                                        className={cn(
                                            s.StatusText,
                                            { [s.StatusTextApproved]: request.status === 'Approved' },
                                            { [s.StatusTextDenied]: request.status === 'Denied' },
                                        )}
                                        text={statusText(request.status)}
                                        iconLeft={
                                            <Dot
                                                className={cn(
                                                    s.StatusDot,
                                                    { [s.StatusDotApproved]: request.status === 'Approved' },
                                                    { [s.StatusDotDenied]: request.status === 'Denied' },
                                                )}
                                            />
                                        }
                                    />
                                }
                            />
                        ),
                        width: 150,
                    },
                    {
                        content: <TableCellText twoLines text={request.name} />,
                        width: 140,
                    },
                    {
                        content: (
                            <TableCellText
                                twoLines
                                text={request.type === 'toDecree' ? tr('To decree') : tr('From decree')}
                            />
                        ),
                        width: 100,
                    },
                    {
                        content: <TableCellText twoLines text={request.title} />,
                        width: 100,
                    },
                    {
                        content: <TableCellText twoLines text={request.group?.name || ''} />,
                        width: 100,
                    },
                    {
                        content: <TableCellText twoLines text={request.supervisor?.name || ''} />,
                        width: 100,
                    },
                    {
                        content: <TableCellText twoLines text={request.creator?.name || ''} />,
                        width: 100,
                    },
                    {
                        content: (
                            <TableCellText
                                twoLines
                                text={request.coordinators.map(({ name, email }) => name || email).join(', ')}
                            />
                        ),
                        width: 100,
                    },
                    {
                        content: <TableCellText text={request.date?.toLocaleDateString() || ''} />,
                        width: 100,
                    },
                    {
                        content: (
                            <div onClick={(e) => e.stopPropagation()}>
                                <RequestFormActions requestId={request.id} small requestType="decree" />
                            </div>
                        ),
                    },
                ],
            })),
        [userRequests],
    );

    return (
        <ProfilesManagementLayout>
            <Table>
                <TableRow className={s.TableHeader}>
                    {thead.map((th, index) => (
                        <TableCell key={`header${index}`} width={th.width} className={s.HeaderCell}>
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
        </ProfilesManagementLayout>
    );
};
