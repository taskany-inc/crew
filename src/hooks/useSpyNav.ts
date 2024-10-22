import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { throttle } from 'throttle-debounce';

interface UseSpyNavOptions {
    // delay after which the scroll will work
    clickDelay: number;
    // offset in px for early setting active element by scroll
    topOffset: number;
    // throttled time for trigger scroll
    scrollDelay: number;
}

interface UseSpyNav {
    <T extends HTMLElement>(root: React.RefObject<T>, opts?: Readonly<UseSpyNavOptions>): {
        activeId: string | void;
        onClick: (id: string) => void;
        onScroll: () => void;
    };
}

const topOffset = 40;
const delayAfterClick = 1000;
const scrollDelay = 50;

export const useSpyNav: UseSpyNav = (root, opts = { clickDelay: delayAfterClick, topOffset, scrollDelay }) => {
    const [active, setActive] = useState<string>();
    const rectRef = useRef<DOMRectReadOnly | null>(root.current?.getBoundingClientRect() ?? null);
    // flag for skipping scroll listener after click by nav item
    const skipScrollRef = useRef(false);

    const onScrollHandler = useCallback(() => {
        if (root.current == null || skipScrollRef.current) {
            return;
        }

        const { children } = root.current;

        if (rectRef.current == null) {
            rectRef.current = root.current.getBoundingClientRect();
        }

        const targetRect = rectRef.current;

        const closestChildToTopBorder = Array.from(children).find((child) => {
            const rect = child.getBoundingClientRect();

            const collideTopRootBorder = rect.top - opts.topOffset <= targetRect.top && rect.bottom > targetRect.top;
            const bottomClosestToTopRootBorder = rect.bottom <= targetRect.top + rect.height;

            return collideTopRootBorder && bottomClosestToTopRootBorder;
        });

        if (closestChildToTopBorder != null) {
            setActive((current) => {
                if (current !== closestChildToTopBorder.id) {
                    return closestChildToTopBorder.id;
                }

                return current;
            });
        }
    }, [root, opts]);

    const onClickHandler = useCallback(
        (id: string) => {
            if (root.current == null) {
                return;
            }

            if (active === id) {
                return;
            }

            skipScrollRef.current = true;

            const target = document.getElementById(id);

            if (target == null) {
                return;
            }

            setActive(id);
            target.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                skipScrollRef.current = false;
            }, opts.clickDelay);
        },
        [root, opts, active],
    );

    useEffect(() => {
        const rootNode = root.current;

        if (rootNode) {
            onScrollHandler();
        }
    }, [root, onScrollHandler]);

    return useMemo(
        () => ({ activeId: active, onClick: onClickHandler, onScroll: throttle(opts.scrollDelay, onScrollHandler) }),
        [active, onClickHandler, onScrollHandler, opts],
    );
};
