import { mailingSettingType } from '../modules/userTypes';

import { MailingList } from './MailingList/MailingList';
import { AdminPanelLayout } from './AdminPanelLayout/AdminPanelLayout';

export const MailingLists = () => {
    return (
        <AdminPanelLayout>
            {mailingSettingType.map((type) => (
                <MailingList key={type} mailingSettings={type} />
            ))}
        </AdminPanelLayout>
    );
};
