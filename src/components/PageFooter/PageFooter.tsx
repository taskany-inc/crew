import { FC, useCallback, useState } from 'react';
import { Footer, FooterItem, Modal } from '@taskany/bricks';
import { useRouter } from 'next/router';

import FeedbackCreateForm from '../FeedbackCreateForm/FeedbackCreateForm';
import { Link } from '../Link';
import { defaultLocale, languages } from '../../utils/getLang';
import { useUserMutations } from '../../modules/userHooks';

import { tr } from './PageFooter.i18n';

export const PageFooter: FC = () => {
    const [openFeedbackForm, setOpenFeedbackForm] = useState(false);

    const menuItems = [
        { title: tr('Terms'), url: '/terms' },
        { title: tr('Docs'), url: '/docs' },
        { title: tr('Contact Taskany'), url: '/contactTaskany' },
        { title: tr('API'), url: '/api-docs' },
        { title: tr('About'), url: '/about' },
    ];

    const router = useRouter();
    const { locale } = router;

    const { editUserSettings } = useUserMutations();

    const onLocaleChange = useCallback(async () => {
        const newLocale = locale === defaultLocale ? languages[1] : defaultLocale;

        await editUserSettings({ locale: newLocale });
    }, [editUserSettings, locale]);

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

            <Link inline onClick={onLocaleChange}>
                <FooterItem>{tr('Locale change title')}</FooterItem>
            </Link>
        </Footer>
    );
};
