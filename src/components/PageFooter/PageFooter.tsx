import { FC, useState } from 'react';
import { Footer, FooterItem, Modal } from '@taskany/bricks';

import FeedbackCreateForm from '../FeedbackCreateForm/FeedbackCreateForm';
import { Link } from '../Link';

import { tr } from './PageFooter.i18n';

export const PageFooter: FC = () => {
    const [openFeedbackForm, setOpenFeedbackForm] = useState(false);

    const menuItems = [
        { title: tr('Terms'), url: '/terms' },
        { title: tr('Docs'), url: '/docs' },
        { title: tr('Contact Taskany'), url: '/contactTaskany' },
        { title: tr('API'), url: '/api' },
        { title: tr('About'), url: '/about' },
    ];

    return (
        <Footer>
            <Modal visible={openFeedbackForm} onClose={() => setOpenFeedbackForm(false)}>
                <FeedbackCreateForm onClose={() => setOpenFeedbackForm(false)} />
            </Modal>
            <Link>
                <FooterItem onClick={() => setOpenFeedbackForm(true)}>{tr('Feedback')}</FooterItem>
            </Link>
            {menuItems.map(({ title, url }) => (
                <Link key={url} href={url}>
                    <FooterItem>{title}</FooterItem>
                </Link>
            ))}
        </Footer>
    );
};
