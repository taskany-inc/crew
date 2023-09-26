import { Group, User } from 'prisma/prisma-client';
import { useMemo, createContext, useContext, useState, FC, PropsWithChildren } from 'react';

export const noop = (): void => {};

type PreviewContext = {
    showUserPreview: (user: User) => void;
    showGroupPreview: (group: Group) => void;
    user?: User;
    group?: Group;
    hidePreview: () => void;
};

export const previewContext = createContext<PreviewContext>({
    showUserPreview: noop,
    showGroupPreview: noop,
    hidePreview: noop,
});

export const PreviewContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User>();
    const [group, setGroup] = useState<Group>();

    const value: PreviewContext = useMemo(
        () => ({
            showUserPreview: (u: User) => {
                setUser(u);
                setGroup(undefined);
            },
            showGroupPreview: (g: Group) => {
                setGroup(g);
                setUser(undefined);
            },
            user,
            group,
            hidePreview: () => {
                setGroup(undefined);
                setUser(undefined);
            },
        }),

        [user, group],
    );

    return <previewContext.Provider value={value}>{children}</previewContext.Provider>;
};

export const usePreviewContext = () => useContext(previewContext);
