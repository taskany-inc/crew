import { useMemo } from 'react';

import { Paths } from '../../utils/path';

import { tr } from './header.i18n';

type HeaderLink = { path: string; text: string };

type UseHeaderMenuResult = {
    entityListMenuItems: HeaderLink[];
};

export const useHeaderMenu = (): UseHeaderMenuResult => {
    const entityListMenuItems = useMemo(() => {
        const items: HeaderLink[] = [{ path: Paths.TEAMS, text: tr('Teams') }];

        items.push({ path: Paths.USERS, text: tr('Users') });

        items.push({ path: Paths.SERVICES, text: tr('Services') });

        return items;
    }, []);

    return { entityListMenuItems };
};
