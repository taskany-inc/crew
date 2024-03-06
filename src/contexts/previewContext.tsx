import { useMemo, createContext, useContext, useState, FC, PropsWithChildren } from 'react';

export const noop = (): void => {};

interface PreviewContext {
    showUserPreview: (userId: string) => void;
    showGroupPreview: (groupId: string) => void;
    userId?: string;
    groupId?: string;
    hidePreview: () => void;
}

export const previewContext = createContext<PreviewContext>({
    showUserPreview: noop,
    showGroupPreview: noop,
    hidePreview: noop,
});

export const PreviewContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [userId, setUserId] = useState<string>();
    const [groupId, setGroupId] = useState<string>();

    const value: PreviewContext = useMemo(
        () => ({
            showUserPreview: (id: string) => {
                setUserId(id);
                setGroupId(undefined);
            },
            showGroupPreview: (id: string) => {
                setGroupId(id);
                setUserId(undefined);
            },
            userId,
            groupId,
            hidePreview: () => {
                setGroupId(undefined);
                setUserId(undefined);
            },
        }),

        [userId, groupId],
    );

    return <previewContext.Provider value={value}>{children}</previewContext.Provider>;
};

export const usePreviewContext = () => useContext(previewContext);
