import { Checkbox, Table, Text } from '@taskany/bricks/harmony';
import { useCallback } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { scopes, scopesDescriptions } from '../../utils/access';
import { useUserRoleMutations } from '../../modules/userRoleHooks';
import { ChangeRoleScope } from '../../modules/userRoleSchemas';
import { AdminPanelLayout } from '../AdminPanelLayout/AdminPanelLayout';
import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';

import s from './AdminPanel.module.css';

const width = '200px';

const CellCheckbox = ({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
    <TableListItemElement width={width} className={s.AdminPanelTableCell}>
        <Checkbox checked={checked} onChange={onChange} />
    </TableListItemElement>
);

export const AdminPanel = () => {
    const { data: roles = [] } = trpc.userRole.getListWithScope.useQuery();

    const thead: { title?: string; width: string }[] = [
        { width: '100px' },
        ...scopes.map((scope) => ({ title: scopesDescriptions[scope], width })),
    ];

    const { changeRoleScope } = useUserRoleMutations();

    const handleChangeScope = useCallback(
        (code: string, scope: ChangeRoleScope['scope']['field']) => async (e: React.ChangeEvent<HTMLInputElement>) => {
            await changeRoleScope({ code, scope: { field: scope, value: e.target.checked } });
        },
        [changeRoleScope],
    );

    return (
        <AdminPanelLayout>
            <Table className={s.AdminPanelTable}>
                <TableListItem className={s.AdminPanelTableHeader}>
                    {thead.map((item) => (
                        <TableListItemElement
                            key={item.title}
                            width={item.width}
                            className={s.AdminPanelTableHeaderCell}
                        >
                            <Text>{item.title}</Text>
                        </TableListItemElement>
                    ))}
                </TableListItem>
                {roles.map((role) => (
                    <TableListItem key={role.code}>
                        <TableListItemElement width="100px" className={s.AdminPanelTableCell}>
                            <Text className={s.AdminPanelTableCellContent}>{role.name}</Text>
                        </TableListItemElement>

                        {scopes.map((scope) => (
                            <CellCheckbox
                                key={scope}
                                checked={role[scope]}
                                onChange={handleChangeScope(role.code, scope)}
                            />
                        ))}
                    </TableListItem>
                ))}
            </Table>
        </AdminPanelLayout>
    );
};
