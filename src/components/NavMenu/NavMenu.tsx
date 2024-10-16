import { NavItem } from '../NavItem/NavItem';

import s from './NavMenu.module.css';

interface NevMenuItemProp {
    id: string;
    title: string;
}

interface NavMenuProps {
    navMenu: NevMenuItemProp[];
}

export const NavMenu = ({ navMenu }: NavMenuProps) => {
    return (
        <div className={s.Container}>
            {navMenu.map((nav, index) => (
                <NavItem key={index + nav.id} id={nav.id} title={nav.title} />
            ))}
        </div>
    );
};
