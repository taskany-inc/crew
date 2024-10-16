import { Button } from '@taskany/bricks/harmony';
import cn from 'classnames';
import { useEffect, useState } from 'react';

import s from './NavItem.module.css';

interface NevItemProp {
    id: string;
    title: string;
}

export const NavItem = ({ id, title }: NevItemProp) => {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const options = { threshold: 0.7 };
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setActive(true);
            } else setActive(false);
        }, options);

        const element = document.querySelector(`#${id}`);

        element && observer.observe(element);

        return () => observer.disconnect();
    }, [id]);

    return (
        <a className={cn(s.Link)} href={`#${id}`}>
            <Button className={cn(s.Button, { [s.Button_active]: active })} text={title} view="ghost" />
        </a>
    );
};
