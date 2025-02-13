import { ComponentProps, HTMLAttributes, useEffect, useReducer, useRef, useState } from 'react';
import { Button, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconArrowDownCircleOutline, IconArrowUpCircleOutline } from '@taskany/icons';
import cn from 'classnames';

import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';

import { tr } from './Description.i18n';
import s from './Description.module.css';

type Size = NonNullable<ComponentProps<typeof TeamPageSubtitle>['size']>;

interface DecriptionProps extends HTMLAttributes<HTMLDivElement> {
    size: Size;
    description?: string;
}

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

const useOverflow = <T extends HTMLElement>(ref: React.MutableRefObject<T | null>) => {
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
        if (ref.current) {
            setOverflow(ref.current.clientHeight < ref.current.scrollHeight);
        }
    }, [ref]);

    return overflow;
};

const useCollapse = () => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const heightRef = useRef(0);
    const initialOverllow = useOverflow(nodeRef);
    const [collapse, toggleCollapse] = useReducer((state) => !state, !initialOverllow);

    useEffect(() => {
        if (nodeRef.current) {
            heightRef.current = nodeRef.current.clientHeight;
        }
    }, []);

    useEffect(() => {
        if (nodeRef.current == null) {
            return;
        }

        const node = nodeRef.current;

        if (collapse) {
            node.style.setProperty('height', `${heightRef.current}px`);
        } else {
            node.style.setProperty('height', `${node.scrollHeight}px`);
        }
    }, [collapse]);

    return {
        ref: nodeRef,
        onClick: toggleCollapse,
        collapse,
        overflow: initialOverllow,
    };
};

export const Description = ({ size, description }: DecriptionProps) => {
    const { ref, onClick, collapse, overflow } = useCollapse();

    const icon = !collapse ? <IconArrowUpCircleOutline size="s" /> : <IconArrowDownCircleOutline size="s" />;

    return nullable(
        description,
        (t) => (
            <>
                <div className={s.Description}>
                    <Text
                        ref={ref}
                        lines={4}
                        ellipsis
                        size={textSizesMap[size]}
                        className={cn(s.DescriptionText, { [s.DescriptionExpanded]: overflow && !collapse })}
                    >
                        {t}
                    </Text>
                </div>
                {nullable(overflow, () => (
                    <Button className={s.Button} onClick={onClick} type="button" view="ghost" iconLeft={icon} />
                ))}
            </>
        ),
        <Text>{tr('Not provided')}</Text>,
    );
};
