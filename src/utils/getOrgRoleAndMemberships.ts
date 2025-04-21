import { UserMemberships, UserSupplementalPositions, UserWithSuplementalPositions } from '../modules/userTypes';

import { getLastSupplementalPositions } from './supplementalPositions';
import { tr } from './utils.i18n';

export const getOrgRoleAndMemberships = (user: UserWithSuplementalPositions & UserMemberships) => {
    const { positions } = getLastSupplementalPositions(user.supplementalPositions);

    const orgMembership = user.memberships.find((m) => m.group.organizational);
    const orgRoles = orgMembership?.roles.map((r) => r.name).join(', ');

    const { main, supplemental } = positions.reduce<{
        main: UserSupplementalPositions['supplementalPositions'][number] | null;
        supplemental: UserSupplementalPositions['supplementalPositions'][number][];
    }>(
        (acum, item) => {
            if (item.status !== 'ACTIVE') {
                return acum;
            }
            if (item.main) {
                acum.main = item;
            } else {
                acum.supplemental.push(item);
            }
            return acum;
        },
        { main: null, supplemental: [] },
    );

    const orgRole: string[] = [];

    if (orgRoles) {
        orgRole.push(orgRoles);
    }

    if (main?.intern) {
        orgRole.push(tr('Intern'));
    }

    return { orgRole, orgMembership, supplemental, main };
};
