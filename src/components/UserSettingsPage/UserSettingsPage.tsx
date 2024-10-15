import { User } from 'prisma/prisma-client';
import { useTheme } from 'next-themes';
import { Fieldset, RadioControl, RadioGroup, RadioGroupLabel, Checkbox, Text } from '@taskany/bricks/harmony';
import { ChangeEvent } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { EditUserSettings } from '../../modules/userSchemas';
import { SettingsCard, SettingsContainer } from '../Settings';
import { useUserMutations } from '../../modules/userHooks';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { PageSep } from '../PageSep';
import { CommonHeader } from '../CommonHeader';
import { languages } from '../../utils/getLang';
import { Theme, themes } from '../../utils/theme';

import { tr } from './UserSettingsPage.i18n';
import s from './UserSettingsPage.module.css';

interface UserSettingPageBaseProps {
    user: User;
    settings: EditUserSettings;
}

export const UserSettingsPageBase = ({ user, settings }: UserSettingPageBaseProps) => {
    const { setTheme } = useTheme();

    const { editUserSettings } = useUserMutations();

    const onThemeChange = (theme: Theme) => {
        editUserSettings({ theme });
        setTheme(theme);
    };

    const onLocaleChange = (locale: string) => {
        editUserSettings({ locale });
    };

    const onShowAchievementsChange = (e: ChangeEvent<HTMLInputElement>) => {
        editUserSettings({ showAchievements: e.target.checked });
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
                    <form>
                        <Fieldset title={tr('Appearance')}>
                            <RadioGroup
                                name="theme"
                                className={s.FormControl}
                                value={settings.theme}
                                onChange={(e) => onThemeChange(e.target.value as Theme)}
                            >
                                <RadioGroupLabel className={s.FormControlLabel}>{tr('Theme')}</RadioGroupLabel>
                                {themes.map((t) => (
                                    <RadioControl key={t} value={t}>
                                        {t}
                                    </RadioControl>
                                ))}
                            </RadioGroup>

                            <RadioGroup
                                className={s.FormControl}
                                name="locale"
                                value={settings.locale}
                                onChange={(e) => onLocaleChange(e.target.value)}
                            >
                                <RadioGroupLabel className={s.FormControlLabel}>{tr('Locale')}</RadioGroupLabel>
                                {languages.map((language) => (
                                    <RadioControl value={language} key={language}>
                                        {language}
                                    </RadioControl>
                                ))}
                            </RadioGroup>

                            <div className={s.StyledInputContainer}>
                                <Text weight="bold" className={s.AchievementsInput}>
                                    {tr('Show achievements: ')}
                                </Text>
                                <Checkbox
                                    value="createExternalAccount"
                                    checked={settings.showAchievements}
                                    onChange={onShowAchievementsChange}
                                />
                            </div>
                        </Fieldset>
                    </form>
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
