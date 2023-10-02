import { Group } from 'prisma/prisma-client';
import { useMemo, createContext, useContext, useState, FC, PropsWithChildren } from 'react';

export const noop = (): void => {};

type PreviewContext = {
    showUserPreview: (userId: string) => void;
    showGroupPreview: (group: Group) => void;
    userId?: string;
    group?: Group;
    hidePreview: () => void;
};

export const previewContext = createContext<PreviewContext>({
    showUserPreview: noop,
    showGroupPreview: noop,
    hidePreview: noop,
});

export const PreviewContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [userId, setUserId] = useState<string>();
    const [group, setGroup] = useState<Group>();

    const value: PreviewContext = useMemo(
        () => ({
            showUserPreview: (id: string) => {
                setUserId(id);
                setGroup(undefined);
            },
            showGroupPreview: (g: Group) => {
                setGroup(g);
                setUserId(undefined);
            },
            userId,
            group,
            hidePreview: () => {
                setGroup(undefined);
                setUserId(undefined);
            },
        }),

        [userId, group],
    );

    return <previewContext.Provider value={value}>{children}</previewContext.Provider>;
};

export const usePreviewContext = () => useContext(previewContext);
