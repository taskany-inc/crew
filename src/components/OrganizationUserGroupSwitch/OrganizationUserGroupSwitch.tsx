import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { useRouter } from '../../hooks/useRouter';
import { config } from '../../config';

import s from './OrganizationUserGroupSwitch.module.css';
import { tr } from './OrganizationUserGroupSwitch.i18n';

interface OrganizationUserGroupSwitchProps {
    value: 'org' | 'users';
}
export const OrganizationUserGroupSwitch = ({ value }: OrganizationUserGroupSwitchProps) => {
    const router = useRouter();

    return (
        <Switch value={value} className={s.Switch}>
            <SwitchControl
                text={tr('Organization groups')}
                value="org"
                onClick={() => value === 'users' && config.orgGroupId && router.team(config.orgGroupId)}
            />
            <SwitchControl text={tr('User groups')} value="users" onClick={() => value === 'org' && router.teams()} />
        </Switch>
    );
};
