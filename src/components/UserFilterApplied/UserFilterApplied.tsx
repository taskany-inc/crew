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
    if (filterState.supervisors?.length && supervisors?.length) {
        filterAppliedString = `${
            filterAppliedString +
            tr('Supervisors: ') +
            supervisors
                .filter((supervisor) => filterState.supervisors?.includes(supervisor.id))
                .map((s) => s.name || s.email)
                .join(', ')
        }. `;
    }

    if (filterState.groups?.length && groups?.length) {
        filterAppliedString = `${
            filterAppliedString +
            tr('Groups: ') +
            groups
                .filter((group) => filterState.groups?.includes(group.id))
                .map((s) => s.name)
                .join(', ')
        }. `;
    }

    if (filterState.roles?.length && roles?.length) {
        filterAppliedString = `${
            filterAppliedString +
            tr('Roles: ') +
            roles
                .filter((role) => filterState.roles?.includes(role.id))
                .map((s) => s.name)
                .join(', ')
        }. `;
    }

    if (filterState.activity !== undefined) {
        const activity = filterState.activity === 'active' ? tr('Active.') : tr('Inactive.');
        filterAppliedString = `${filterAppliedString + activity}`;
    }

    return (
        <FiltersApplied size="s" weight="bold" color={gray7}>
            {filterAppliedString}
        </FiltersApplied>
    );
};
