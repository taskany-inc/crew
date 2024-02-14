import { useCallback } from 'react';
import { Group } from 'prisma/prisma-client';
import { IconAttachmentOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { trpc } from '../../trpc/trpcClient';
import { createCsvDocument } from '../../utils/csv';
import { downloadAsFile } from '../../utils/downloadAsFile';
import { useLocale } from '../../hooks/useLocale';
import { formatDate } from '../../utils/dateTime';
import { MembershipInfo } from '../../modules/userTypes';

import { tr } from './ExportTeamMembers.i18n';

interface ExportTeamMembersProps {
    group: Group;
}

const formatMembership = (membership: MembershipInfo) => ({
    ...membership,
    userName: membership.user.name,
    email: membership.user.email,
    roles: membership.roles.map((r) => r.name).join(', '),
    percentage: membership.percentage === null ? '' : membership.percentage,
});

export const ExportTeamMembers = ({ group }: ExportTeamMembersProps) => {
    const membershipsQuery = trpc.group.getMemberships.useQuery(group.id);
    const locale = useLocale();

    const onClick = useCallback(() => {
        if (!membershipsQuery.data) return;
        const data = membershipsQuery.data.map(formatMembership);
        const csv = createCsvDocument(data, [
            { key: 'userName', name: tr('Full name') },
            { key: 'email', name: 'Email' },
            { key: 'roles', name: tr('Roles') },
            { key: 'percentage', name: tr('Membership percentage') },
        ]);
        const filename = `${group.name} - ${formatDate(new Date(), locale)}`;
        downloadAsFile(csv, filename, 'text/csv');
    }, [group.name, membershipsQuery.data, locale]);

    return (
        <InlineTrigger icon={<IconAttachmentOutline size="xs" />} text={tr('Export team members')} onClick={onClick} />
    );
};
