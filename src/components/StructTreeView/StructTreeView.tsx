import React, { useRef, useReducer, useEffect, createContext, useCallback, useState, useMemo, memo } from 'react';
import cn from 'classnames';
import { IconRightOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';
import { Spinner } from '@taskany/bricks/harmony';

import s from './StructTreeView.module.css';

const useCollapse = () => {
    const collapseRef = useRef<HTMLDivElement | null>(null);
    const [collapsed, toggleCollapsed] = useReducer((state) => !state, true);
    const [phase, setPhase] = useState<'idle' | 'opening' | 'closing'>('idle');

    useEffect(() => {
        if (collapseRef.current != null) {
            const node = collapseRef.current;

            if (!collapsed) {
                node.style.height = `${node.scrollHeight}px`;
                node.style.overflowY = 'hidden';
                setPhase('opening');
            } else {
                node.style.height = '0px';
                setPhase('idle');
            }
        }
    }, [collapsed]);

    const toggle = useCallback(() => {
        if (collapseRef.current == null) {
            return;
        }
        const node = collapseRef.current;
        if (collapsed) {
            toggleCollapsed();
            node.addEventListener(
                'transitionend',
                () => {
                    node.style.removeProperty('height');
                    node.style.removeProperty('overflow');
                    setPhase('idle');
                },
                { once: true },
            );
        } else {
            node.addEventListener('transitionend', () => toggleCollapsed(), { once: true });

            node.style.overflowY = 'hidden';
            node.style.height = `${node.scrollHeight}px`;
            setPhase('closing');
            setTimeout(() => {
                node.style.height = '0px';
                node.style.removeProperty('overflowY');
            }, 0);
        }
    }, [collapsed]);

    return {
        ref: collapseRef,
        state: collapsed,
        toggle,
        phase,
    };
};

const cssInnerOffsetVar = '--tree-sticky-heading-inner-offset';

const findAllPrevElementsOffset = (from: HTMLElement): number => {
    let parent = from.parentElement;
    const offsets: number[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (parent == null) {
            break;
        }

        if (parent.hasAttribute('data-struct-tree')) {
            // early exit
            break;
        }

        if (parent.hasAttribute('data-branch-content')) {
            const target = parent.previousElementSibling;
            if (target) {
                offsets.push(target.clientHeight);
            }
        }

        parent = parent?.parentElement;
    }

    return offsets.reduce((acc, val) => acc + val, 0);
};

interface StructTreeViewContextImpl {
    toggle: () => void;
    state: boolean;
    phase: 'idle' | 'opening' | 'closing';
}

const StructTreeViewContext = createContext<StructTreeViewContextImpl | null>(null);

export const StructTreeView: React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>> = memo(
    ({ children, ...rest }) => {
        return (
            <div {...rest} data-struct-tree="1">
                {children}
            </div>
        );
    },
);

interface BranchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode;
    isOpen?: boolean;
    disable?: boolean;
}

export const Branch: React.FC<React.PropsWithChildren<BranchProps>> = ({
    title,
    children,
    className,
    isOpen,
    disable,
}) => {
    const { ref, toggle, state, phase } = useCollapse();

    useEffect(() => {
        if (isOpen === state && !disable) {
            toggle();
        }
    }, [isOpen, state, toggle, disable]);

    const needSetClassName = useMemo(() => {
        if (phase === 'idle') {
            return !state;
        }

        return phase !== 'closing';
    }, [phase, state]);

    return (
        <StructTreeViewContext.Provider value={{ toggle, state, phase }}>
            <div
                className={cn(s.Branch, className, {
                    [s.isOpen]: needSetClassName,
                })}
            >
                {title}
                <div className={cn(s.BranchContent)} ref={ref} data-branch-content>
                    {nullable(!state, () => children)}
                </div>
            </div>
        </StructTreeViewContext.Provider>
    );
};

export const Heading: React.FC<
    React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & { loading?: boolean; hideCollapseIcon?: boolean }
> = ({ className, children, loading, onClick, hideCollapseIcon, ...rest }) => {
    const nodeRef = useRef<HTMLDivElement>(null);

    const setCalculatedHeaderOffset = useCallback(() => {
        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            const siblingContentElement = nodeRef.current.nextElementSibling;

            if (siblingContentElement instanceof HTMLElement) {
                const currentOffset = findAllPrevElementsOffset(nodeRef.current);
                siblingContentElement.style.setProperty(cssInnerOffsetVar, `${rect.height + currentOffset}px`);
            }
        }
    }, []);

    useEffect(() => {
        // ¯\_(ツ)_/¯
        setTimeout(setCalculatedHeaderOffset, 0);
    }, [setCalculatedHeaderOffset]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            setCalculatedHeaderOffset();
        });

        if (nodeRef.current) {
            resizeObserver.observe(nodeRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [setCalculatedHeaderOffset]);

    return (
        <div className={cn(s.Heading, className)} onClick={onClick} {...rest} ref={nodeRef} data-content-header="1">
            <span className={s.IconWrapper}>
                {nullable(
                    loading,
                    () => (
                        <Spinner size="s" />
                    ),
                    nullable(!hideCollapseIcon, () => <IconRightOutline size="s" className={cn(s.IconArrow)} />),
                )}
            </span>
            <div className={cn(s.Content)}>{children}</div>
        </div>
    );
};

export const Leaf: React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>> = ({
    className,
    children,
    ...rest
}) => {
    return (
        <div className={cn(s.Leaf, className)} {...rest}>
            {children}
        </div>
    );
};
