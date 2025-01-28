import { trpc } from '../trpc/trpcClient';

import { AddOrDeleteEmail } from './mailingSettingsSchemas';

export const useMailSettingsMutations = () => {
    const utils = trpc.useContext();

    const addEmail = trpc.mailSettings.addEmail.useMutation({
        onSuccess: () => {
            utils.mailSettings.getEmails.invalidate();
        },
    });

    const deleteEmail = trpc.mailSettings.deleteEmail.useMutation({
        onSuccess: () => {
            utils.mailSettings.getEmails.invalidate();
        },
    });
    return {
        addEmail: (data: AddOrDeleteEmail) => addEmail.mutateAsync(data),
        deleteEmail: (data: AddOrDeleteEmail) => deleteEmail.mutateAsync(data),
    };
};
