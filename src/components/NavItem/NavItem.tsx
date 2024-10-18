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
        const root = document.querySelector('#rootscroll');
        const observer = new IntersectionObserver(
            (entries) => {
                if (root && root.scrollHeight - root.clientHeight - root.scrollTop < root.clientHeight / 10) {
                    if (root.firstElementChild?.lastElementChild?.id === entries[0].target.id) {
                        setActive(true);
                    } else setActive(false);
                } else if (
                    root &&
                    entries[0].isIntersecting &&
                    entries[0].boundingClientRect.top - (entries[0].rootBounds?.top || 0) < 30
                ) {
                    setActive(true);
                } else setActive(false);
            },
            { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], root },
        );

        const element = document.querySelector(`#${id}`);

        element && observer.observe(element);

        return () => observer.disconnect();
    }, [id, setActive]);

    return (
        <a className={s.Link} href={`#${id}`}>
            <Button className={cn(s.Button, { [s.Button_active]: active })} text={title} view="ghost" />
        </a>
    );
};
