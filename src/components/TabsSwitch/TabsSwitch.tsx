import React from 'react';
import { useRouter } from 'next/router';
import { Switch, SwitchControl } from '@taskany/bricks/harmony';

import { Link } from '../Link';

import s from './TabsSwitch.module.css';

interface TabsMenuOptions {
    title: string;
    href: string;
    visible?: boolean;
}

interface TabsSwitchProps {
    tabsMenuOptions: Array<TabsMenuOptions>;
}

export const TabsSwitch: React.FC<TabsSwitchProps> = ({ tabsMenuOptions }) => {
    const router = useRouter();

    return (
        <Switch value={router.asPath} className={s.Switch}>
            {tabsMenuOptions
                .filter(({ visible }) => visible)
                .map(({ title, href }) => (
                    <Link key={href} href={href}>
                        <SwitchControl text={title} value={href} />
                    </Link>
                ))}
        </Switch>
    );
};
