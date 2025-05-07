import { UserCreationRequestStatus } from 'prisma/prisma-client';

import { tr } from './utils.i18n';

export const getStatusText = (status: UserCreationRequestStatus | null) => {
    if (status === 'Approved') return tr('Approved');
    if (status === 'Denied') return tr('Denied');
    if (status === 'Canceled') return tr('Canceled');
    if (status === 'Draft') return tr('Draft');
    if (status === 'Completed') return tr('Completed');
    return tr('Under concideration');
};
