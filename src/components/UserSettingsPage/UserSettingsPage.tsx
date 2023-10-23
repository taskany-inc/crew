import { User } from 'prisma/prisma-client';
import { useTheme } from 'next-themes';
import { Fieldset, Form, FormRadio, FormRadioInput, Text } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { UserSettings } from '../../modules/user.types';
import { SettingsCard, SettingsContainer } from '../Settings';
import { useUserMutations } from '../../modules/user.hooks';
import { LayoutMain } from '../layout/LayoutMain';
import { PageSep } from '../PageSep';
import { CommonHeader } from '../CommonHeader';
import { Theme, themes } from '../../utils/theme';

import { tr } from './UserSettingsPage.i18n';

interface UserSettingPageBaseProps {
    user: User;
    settings: UserSettings;
}

export const UserSettingsPageBase = ({ user, settings }: UserSettingPageBaseProps) => {
    const { setTheme } = useTheme();

    const { editUserSettings } = useUserMutations();

    const onThemeChange = (theme: Theme) => {
        editUserSettings.mutateAsync({ theme });
        setTheme(theme);
    };

    return (
        <LayoutMain pageTitle={user.name}>
            <CommonHeader
                title={
                    <Text size="xxl" weight="bold">
                        {user.name}
                    </Text>
                }
            />

            <PageSep />

            <SettingsContainer>
                <SettingsCard>
                    <Form>
                        <Fieldset title={tr('Appearance')}>
                            <FormRadio
                                label={tr('Theme')}
                                name="theme"
                                value={settings.theme}
                                onChange={(v) => onThemeChange(v as Theme)}
                            >
                                {themes.map((t) => (
                                    <FormRadioInput key={t} value={t} label={t} />
                                ))}
                            </FormRadio>
                        </Fieldset>
                    </Form>
                </SettingsCard>
            </SettingsContainer>
        </LayoutMain>
    );
};

interface UserSettingPageProps {
    userId: string;
}

export const UserSettingsPage = ({ userId }: UserSettingPageProps) => {
    const userQuery = trpc.user.getById.useQuery(userId);
    const user = userQuery.data;

    const settingsQuery = trpc.user.getSettings.useQuery();
    const settings = settingsQuery.data;

    if (!user || !settings) return null;

    return <UserSettingsPageBase user={user} settings={settings} />;
};
