import cn from 'classnames';
import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { useRouter } from '../../hooks/useRouter';
import { useAppConfig } from '../../contexts/appConfigContext';

import s from './OrganizationUserGroupSwitch.module.css';
import { tr } from './OrganizationUserGroupSwitch.i18n';

interface OrganizationUserGroupSwitchProps {
    value: 'org' | 'users';
    noGap?: boolean;
}
export const OrganizationUserGroupSwitch = ({ value, noGap }: OrganizationUserGroupSwitchProps) => {
    const router = useRouter();
    const appConfig = useAppConfig();

    return (
        <Switch value={value} className={cn(s.Switch, { [s.Switch_noGap]: noGap })}>
            <SwitchControl
                text={tr('Functional groups')}
                value="org"
                onClick={() => value === 'users' && appConfig?.orgGroupId && router.team(appConfig.orgGroupId)}
            />
            <SwitchControl text={tr('User groups')} value="users" onClick={() => value === 'org' && router.teams()} />
            <SwitchControl text={tr('V-teams')} value="users" onClick={() => value === 'org' && router.teams()} />
        </Switch>
    );
};
