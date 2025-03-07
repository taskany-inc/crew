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

const useOverflowRef = <T extends HTMLElement>(): [React.RefObject<T>, boolean] => {
    const nodeRef = useRef<T>(null);
    const [overflow, setOverflow] = useState(() => false);
    useEffect(() => {
        if (nodeRef.current) {
            const node = nodeRef.current;
            queueMicrotask(() => {
                const { height } = node.getBoundingClientRect();
                setOverflow(height < node.scrollHeight);
            });
        }
    }, []);

    return [nodeRef, overflow];
};

const useCollapse = () => {
    const heightRef = useRef(0);
    const [ref, initialOverllow] = useOverflowRef();
    const [collapse, toggleCollapse] = useReducer((state) => !state, !initialOverllow);

    useEffect(() => {
        if (ref.current) {
            const node = ref.current;
            queueMicrotask(() => {
                heightRef.current = node.clientHeight;
            });
        }
    }, [ref]);

    useEffect(() => {
        if (ref.current == null || !initialOverllow) {
            return;
        }

        const node = ref.current;

        if (collapse) {
            node.style.setProperty('height', `${heightRef.current}px`);
        } else {
            node.style.setProperty('height', `${node.scrollHeight}px`);
        }
    }, [collapse, ref, initialOverllow]);

    return {
        ref,
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
            <div className={s.Description}>
                <Text
                    ref={ref}
                    lines={4}
                    ellipsis={overflow && collapse}
                    size={textSizesMap[size]}
                    className={cn(s.DescriptionText, { [s.DescriptionExpanded]: overflow && !collapse })}
                >
                    {t}
                </Text>
                {nullable(overflow, () => (
                    <Button
                        className={s.DescriprionCollaseBtn}
                        onClick={onClick}
                        type="button"
                        view="clear"
                        iconLeft={icon}
                    />
                ))}
            </div>
        ),
        <Text>{tr('Not provided')}</Text>,
    );
};
