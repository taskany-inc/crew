import { useMemo } from 'react';

import { pages } from '../../hooks/useRouter';

import { tr } from './header.i18n';

type HeaderLink = { path: string; text: string };

type UseHeaderMenuResult = {
    entityListMenuItems: HeaderLink[];
};

export const useHeaderMenu = (): UseHeaderMenuResult => {
    const entityListMenuItems = useMemo(() => {
        const items: HeaderLink[] = [
            { path: pages.teams, text: tr('Teams') },
            { path: pages.users, text: tr('Users') },
            { path: pages.services, text: tr('Services') },
        ];

        return items;
    }, []);

    return { entityListMenuItems };
};
