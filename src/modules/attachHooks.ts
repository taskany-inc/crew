import { trpc } from '../trpc/trpcClient';
import { SessionUser } from '../utils/auth';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { attachMethods } from './attachMethods';

export const useAttachMutations = () => {
    const utils = trpc.useContext();

    const deleteAttach = (id: string, user: SessionUser) =>
        attachMethods.deleteAttach(id, user).then(() => utils.scheduledDeactivation.invalidate());

    return {
        deleteAttach: (id: string, user: SessionUser) => notifyPromise(deleteAttach(id, user), 'attachDelete'),
    };
};
