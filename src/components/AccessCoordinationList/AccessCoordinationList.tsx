import { Button, Table, TableCell, TableRow, Text } from '@taskany/bricks/harmony';
import { useMemo, useState } from 'react';
import cn from 'classnames';
import { IconSortDownOutline, IconSortUpOutline } from '@taskany/icons';

import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { trpc } from '../../trpc/trpcClient';
import { useLocale } from '../../hooks/useLocale';
import { TableCellText } from '../TableCellText/TableCellText';
import { useRouter } from '../../hooks/useRouter';
import { RequestFormActions } from '../RequestFormActions/RequestFormActions';
import { ProfilesManagementLayout } from '../ProfilesManagementLayout/ProfilesManagementLayout';
import { getOrgUnitTitle } from '../../utils/organizationUnit';

import s from './AccessCoordinationList.module.css';
import { tr } from './AccessCoordinationList.i18n';

export const AccessCoordinationList = () => {
    const locale = useLocale();

    const router = useRouter();

    const [clickNameOrderCount, setClickNameOrderCount] = useState<'desc' | 'asc' | undefined>(undefined);
    const [clickDateOrderCount, setClickDateOrderCount] = useState<'desc' | 'asc'>('desc');

    const { data: userRequests = [] } = trpc.userCreationRequest.getList.useQuery({
        type: ['externalEmployee', 'externalFromMainOrgEmployee'],
        status: null,
        orderBy: { name: clickNameOrderCount, createdAt: clickDateOrderCount },
    });

    const onEdit = (id: string, type: string) =>
        type === 'externalEmployee'
            ? router.externalUserRequestEdit(id)
            : router.externalUserFromMainOrgRequestEdit(id);

    const onClick = (id: string, type: string) =>
        type === 'externalEmployee' ? router.externalUserRequest(id) : router.externalUserFromMainOrgRequest(id);
    const onNameOrderClick = () => {
        if (!clickNameOrderCount) setClickNameOrderCount('asc');
        if (clickNameOrderCount === 'asc') setClickNameOrderCount('desc');
        if (clickNameOrderCount === 'desc') setClickNameOrderCount(undefined);
    };

    const onDateOrderClick = () =>
        clickDateOrderCount === 'desc' ? setClickDateOrderCount('asc') : setClickDateOrderCount('desc');

    const thead = useMemo(() => {
        return [
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
            { content: <Text className={s.HeaderText}>{tr('Email')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Login')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Phone')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Organization')}</Text>, width: 100 },

            { content: <Text className={s.HeaderText}>{tr('Role')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Manager')}</Text>, width: 100 },
            { content: <Text className={s.HeaderText}>{tr('Author')}</Text>, width: 100 },
            {
                content: (
                    <Text className={s.HeaderText}>
                        <div className={s.HeaderCellWithOrder}>
                            <Text className={s.HeaderText}>{tr('Creation date')}</Text>

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
                        content: <TableCellText twoLines text={request.name} />,
                        width: 140,
                    },
                    {
                        content: <TableCellText twoLines text={request.email} />,
                        width: 100,
                    },
                    {
                        content: <TableCellText text={request.login} />,
                        width: 100,
                    },
                    {
                        content: (
                            <TableCellText
                                text={
                                    request.services?.find((service) => service.serviceName === 'Phone')?.serviceId ||
                                    ''
                                }
                            />
                        ),
                        width: 100,
                    },
                    {
                        content: <TableCellText text={getOrgUnitTitle(request.organization)} twoLines />,
                        width: 100,
                    },
                    {
                        content: <TableCellText text={request.title || ''} twoLines />,
                        width: 100,
                    },
                    {
                        content: (
                            <TableCellText
                                twoLines
                                text={request.lineManagers.map(({ name, email }) => name || email).join(', ')}
                            />
                        ),
                        width: 100,
                    },
                    {
                        content: <TableCellText text={request.creator?.name || ''} twoLines />,
                        width: 100,
                    },
                    {
                        content: <TableCellText text={request.createdAt?.toLocaleDateString() || ''} />,
                        width: 100,
                    },
                    {
                        content: (
                            <div onClick={(e) => e.stopPropagation()}>
                                <RequestFormActions
                                    requestId={request.id}
                                    small
                                    onEdit={() => request.type && onEdit(request.id, request.type)}
                                />
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
                        <TableListItem
                            key={row.request.id}
                            onClick={() => {
                                row.request.type && onClick(row.request.id, row.request.type);
                            }}
                        >
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
