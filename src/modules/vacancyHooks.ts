import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateVacancy, EditVacancy } from './vacancySchemas';

export const useVacancyMutations = () => {
    const utils = trpc.useContext();

    const createVacancy = trpc.vacancy.create.useMutation({
        onSuccess: () => {
            utils.vacancy.invalidate();
        },
    });

    const editVacancy = trpc.vacancy.edit.useMutation({
        onSuccess: () => {
            utils.vacancy.invalidate();
        },
    });

    const archiveVacancy = trpc.vacancy.archive.useMutation({
        onSuccess: () => {
            utils.vacancy.invalidate();
        },
    });

    return {
        createVacancy: (data: CreateVacancy) => notifyPromise(createVacancy.mutateAsync(data), 'vacancyCreate'),

        editVacancy: (data: EditVacancy) => notifyPromise(editVacancy.mutateAsync(data), 'vacancyUpdate'),

        archiveVacancy: (data: string) => notifyPromise(archiveVacancy.mutateAsync(data), 'vacancyArchive'),
    };
};
