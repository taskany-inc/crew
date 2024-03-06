import { FiltersApplied } from '@taskany/bricks';
import { Group, Role, User } from 'prisma/prisma-client';
import { gray7 } from '@taskany/colors';

import { UserFilterQuery } from '../../modules/userTypes';

import { tr } from './UserFilterApplied.i18n';

interface UserFilterAppliedProps {
    filterState: UserFilterQuery;
    supervisors?: User[];
    groups?: Group[];
    roles?: Role[];
}

export const UserFilterApplied = ({ filterState, supervisors, groups, roles }: UserFilterAppliedProps) => {
    let filterAppliedString = '';
    if (filterState.supervisorsQuery?.length && supervisors?.length) {
        filterAppliedString = `${
            filterAppliedString +
            tr('Supervisors: ') +
            supervisors
                .filter((supervisor) => filterState.supervisorsQuery?.includes(supervisor.id))
                .map((s) => s.name || s.email)
                .join(', ')
        }. `;
    }

    if (filterState.groupsQuery?.length && groups?.length) {
        filterAppliedString = `${
            filterAppliedString +
            tr('Groups: ') +
            groups
                .filter((group) => filterState.groupsQuery?.includes(group.id))
                .map((s) => s.name)
                .join(', ')
        }. `;
    }

    if (filterState.rolesQuery?.length && roles?.length) {
        filterAppliedString = `${
            filterAppliedString +
            tr('Roles: ') +
            roles
                .filter((role) => filterState.rolesQuery?.includes(role.id))
                .map((s) => s.name)
                .join(', ')
        }.`;
    }

    if (filterState.activeQuery !== undefined) {
        const active = filterState.activeQuery ? tr('Active.') : tr('Inactive.');
        filterAppliedString = `${filterAppliedString + active}`;
    }

    return (
        <FiltersApplied size="s" weight="bold" color={gray7}>
            {filterAppliedString}
        </FiltersApplied>
    );
};
