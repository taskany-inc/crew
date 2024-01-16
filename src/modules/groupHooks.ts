import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateGroup, EditGroup, MoveGroup } from './groupSchemas';

export const useGroupMutations = () => {
    const utils = trpc.useContext();

    const addGroup = trpc.group.add.useMutation({
        onSuccess: () => {
            utils.group.invalidate();
        },
    });

    const editGroup = trpc.group.edit.useMutation({
        onSuccess: () => {
            utils.group.invalidate();
        },
    });

    const archiveGroup = trpc.group.archive.useMutation({
        onSuccess: () => {
            utils.group.invalidate();
        },
    });

    const moveGroup = trpc.group.move.useMutation({
        onSuccess: () => {
            utils.group.invalidate();
        },
    });

    return {
        addGroup: (data: CreateGroup) => notifyPromise(addGroup.mutateAsync(data), 'groupCreate'),

        editGroup: (data: EditGroup) => notifyPromise(editGroup.mutateAsync(data), 'groupUpdate'),

        archiveGroup: (data: string) => notifyPromise(archiveGroup.mutateAsync(data), 'groupArchive'),

        moveGroup: (data: MoveGroup) => notifyPromise(moveGroup.mutateAsync(data), 'groupMove'),
    };
};
