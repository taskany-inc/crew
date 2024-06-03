import { Checkbox, Table, TableCell, TableRow, Text } from '@taskany/bricks/harmony';
import { useCallback } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { LayoutMain, PageContent } from '../LayoutMain';
import { scopes } from '../../utils/access';
import { useUserRoleMutations } from '../../modules/userRoleHooks';
import { AddScopeToRole } from '../../modules/userRoleSchemas';

import s from './AdminPanel.module.css';

const width = '200px';

const thead: { title?: string; width: string }[] = [
    { width: '100px' },
    ...scopes.map((scope) => ({ title: scope, width })),
];

const CellCheckbox = ({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
    <TableCell width={width}>
        <Checkbox checked={checked} onChange={onChange} />
    </TableCell>
);

export const AdminPanel = () => {
    const { data: roles = [] } = trpc.userRole.getListWithScope.useQuery();

    const { addScopeToRole } = useUserRoleMutations();

    const handleChangeScope = useCallback(
        (code: string, scope: AddScopeToRole['scope']['field']) => async (e: React.ChangeEvent<HTMLInputElement>) => {
            await addScopeToRole({ code, scope: { field: scope, value: e.target.checked } });
        },
        [addScopeToRole],
    );

    return (
        <LayoutMain>
            <PageContent>
                <Table className={s.AdminPanelTable}>
                    <TableRow>
                        {thead.map((item) => (
                            <TableCell key={item.title} width={item.width}>
                                <Text>{item.title}</Text>
                            </TableCell>
                        ))}
                    </TableRow>
                    {roles.map((role) => (
                        <TableRow key={role.code}>
                            <TableCell width="100px">{role.name}</TableCell>

                            {scopes.map((scope) => (
                                <CellCheckbox
                                    key={scope}
                                    checked={role[scope]}
                                    onChange={handleChangeScope(role.code, scope)}
                                />
                            ))}
                        </TableRow>
                    ))}
                </Table>
            </PageContent>
        </LayoutMain>
    );
};
