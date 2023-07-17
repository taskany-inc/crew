import { FC } from 'react';

import { Footer, Link } from '@taskany/bricks';

import { tr } from './footer.i18n';
import { FooterItem } from '@taskany/bricks/components/Footer';
import { gray9 } from '@taskany/colors';

export const PageFooter: FC = () => {
    const menuItems = [
        { title: tr('Terms'), url: '/terms' },
        { title: tr('Docs'), url: '/docs' },
        { title: tr('Contact Taskany'), url: '/contactTaskany' },
        { title: tr('API'), url: '/api' },
        { title: tr('About'), url: '/about' },
    ];
    return (
        <Footer>
            {menuItems.map(({ title, url }) => (
                <Link key={url} href={url} inline>
                    <FooterItem color={gray9}>{title}</FooterItem>
                </Link>
            ))}
        </Footer>
    );
};
