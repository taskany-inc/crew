import { Button } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './NavItem.module.css';

interface NevItemProp {
    id: string;
    title: string;
    active?: boolean;
    onClick?: () => void;
}

export const NavItem = ({ title, active, onClick }: NevItemProp) => {
    return (
        <Button className={cn(s.Button, { [s.Button_active]: active })} text={title} view="ghost" onClick={onClick} />
    );
};
