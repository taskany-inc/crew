import { NavItem } from '../NavItem/NavItem';

import s from './NavMenu.module.css';

interface NevMenuItemProp {
    id: string;
    title: string;
}

interface NavMenuProps {
    navMenu: NevMenuItemProp[];
    active: string | void;
    onClick: (id: string) => void;
}

export const NavMenu = ({ navMenu, onClick, active }: NavMenuProps) => {
    return (
        <div className={s.Container}>
            {navMenu.map((nav, index) => (
                <NavItem
                    key={index + nav.id}
                    id={nav.id}
                    title={nav.title}
                    active={nav.id === active}
                    onClick={() => onClick(nav.id)}
                />
            ))}
        </div>
    );
};
