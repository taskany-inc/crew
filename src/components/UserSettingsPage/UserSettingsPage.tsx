import { User } from 'prisma/prisma-client';
import { useTheme } from 'next-themes';
import { CheckboxInput, Fieldset, Form, FormRadio, FormRadioInput, Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapM, gapS, gapXs, gray3, gray8 } from '@taskany/colors';
import { ChangeEvent } from 'react';

import { trpc } from '../../trpc/trpcClient';
import { EditUserSettings } from '../../modules/userSchemas';
import { SettingsCard, SettingsContainer } from '../Settings';
import { useUserMutations } from '../../modules/userHooks';
import { LayoutMain } from '../LayoutMain';
import { PageSep } from '../PageSep';
import { CommonHeader } from '../CommonHeader';
import { languages } from '../../utils/getLang';
import { Theme, themes } from '../../utils/theme';

import { tr } from './UserSettingsPage.i18n';

interface UserSettingPageBaseProps {
    user: User;
    settings: EditUserSettings;
}

const StyledInputContainer = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    padding: ${gapXs} ${gapM};
    background-color: ${gray3};
`;

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

                            <FormRadio
                                label={tr('Locale')}
                                name="locale"
                                value={settings.locale}
                                onChange={(v) => onLocaleChange(v)}
                            >
                                {languages.map((language) => (
                                    <FormRadioInput key={language} value={language} label={language} />
                                ))}
                            </FormRadio>

                            <StyledInputContainer>
                                <Text weight="bold" color={gray8}>
                                    {tr('Show achievements: ')}
                                </Text>
                                <CheckboxInput
                                    value="createExternalAccount"
                                    checked={settings.showAchievements}
                                    onChange={onShowAchievementsChange}
                                />
                            </StyledInputContainer>
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
