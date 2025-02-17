import { useMemo } from 'react';
import cn from 'classnames';
import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { pages, useRouter } from '../../hooks/useRouter';

import s from './OrganizationUserGroupSwitch.module.css';
import { tr } from './OrganizationUserGroupSwitch.i18n';

interface OrganizationUserGroupSwitchProps {
    noGap?: boolean;
}

export const OrganizationUserGroupSwitch = ({ noGap }: OrganizationUserGroupSwitchProps) => {
    const router = useRouter();

    const value = useMemo(() => {
        const { router: nextRouter } = router;
        switch (nextRouter.asPath) {
            case pages.teams:
                return 'org';
            case pages.corp:
                return 'corp';
            default:
                break;
        }
    }, [router]);

    return (
        <Switch value={value} className={cn(s.Switch, { [s.Switch_noGap]: noGap })}>
            <SwitchControl
                text={tr('Functional groups')}
                value="org"
                onClick={() => value !== 'org' && router.teams()}
            />
            <SwitchControl
                text={tr('Corporate groups')}
                value="corp"
                onClick={() => value === 'corp' && router.corp()}
            />
            <SwitchControl text={tr('V-teams')} value="users" onClick={() => value === 'org' && router.teams()} />
        </Switch>
    );
};
