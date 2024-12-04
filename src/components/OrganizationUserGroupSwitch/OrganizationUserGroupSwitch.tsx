import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { useRouter } from '../../hooks/useRouter';
import { useAppConfig } from '../../contexts/appConfigContext';

import s from './OrganizationUserGroupSwitch.module.css';
import { tr } from './OrganizationUserGroupSwitch.i18n';

interface OrganizationUserGroupSwitchProps {
    value: 'org' | 'users';
}
export const OrganizationUserGroupSwitch = ({ value }: OrganizationUserGroupSwitchProps) => {
    const router = useRouter();
    const appConfig = useAppConfig();

    return (
        <Switch value={value} className={s.Switch}>
            <SwitchControl
                text={tr('Organization groups')}
                value="org"
                onClick={() => value === 'users' && appConfig?.orgGroupId && router.team(appConfig.orgGroupId)}
            />
            <SwitchControl text={tr('User groups')} value="users" onClick={() => value === 'org' && router.teams()} />
        </Switch>
    );
};
