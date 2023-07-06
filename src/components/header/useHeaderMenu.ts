import { useMemo } from 'react';

import { Paths } from '../../utils/path';

type HeaderLink = { path: string; text: string };

type UseHeaderMenuResult = {
    entityListMenuItems: HeaderLink[];
};

export const useHeaderMenu = (): UseHeaderMenuResult => {
    const entityListMenuItems = useMemo(() => {
        const items: HeaderLink[] = [{ path: Paths.TEAMS, text: 'Teams' }];

        items.push({ path: Paths.USERS, text: 'Users' });

        items.push({ path: Paths.SERVICES, text: 'Services' });

        return items;
    }, []);

    return { entityListMenuItems };
};
