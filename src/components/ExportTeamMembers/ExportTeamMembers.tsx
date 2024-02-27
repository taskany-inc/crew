import { useCallback } from 'react';
import { Group } from 'prisma/prisma-client';
import { IconAttachmentOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { trpc } from '../../trpc/trpcClient';
import { downloadAsFile } from '../../utils/downloadAsFile';
import { useLocale } from '../../hooks/useLocale';
import { formatDate } from '../../utils/dateTime';

import { tr } from './ExportTeamMembers.i18n';

interface ExportTeamMembersProps {
    group: Group;
}

export const ExportTeamMembers = ({ group }: ExportTeamMembersProps) => {
    const exportMembers = trpc.group.exportMembers.useMutation();
    const locale = useLocale();

    const onClick = useCallback(async () => {
        const csv = await exportMembers.mutateAsync(group.id);
        const filename = `${group.name} - ${formatDate(new Date(), locale)}.csv`;
        downloadAsFile(csv, filename, 'text/csv');
    }, [group.name, group.id, locale, exportMembers]);

    return (
        <InlineTrigger
            icon={<IconAttachmentOutline size="xs" />}
            text={tr('Export team members')}
            onClick={onClick}
            disabled={exportMembers.isLoading}
        />
    );
};
