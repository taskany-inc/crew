import { trpc } from '../trpc/trpcClient';

import { EditAdditionEmails } from './mailingSettingsSchemas';

export const useMailSettingsMutations = () => {
    const utils = trpc.useContext();

    const editAdditionalEmails = trpc.mailSettings.editAdditionalEmails.useMutation({
        onSuccess: () => {
            utils.mailSettings.additionalEmails.invalidate();
        },
    });

    return {
        editAdditionalEmails: (data: EditAdditionEmails) => editAdditionalEmails.mutateAsync(data),
    };
};
