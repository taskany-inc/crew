import { useState } from 'react';
import { ComboBox, Input, MenuItem, Text, nullable } from '@taskany/bricks';
import { IconTrophyOutline } from '@taskany/icons';
import { gray9 } from '@taskany/colors';

import { trpc } from '../../trpc/trpcClient';
import { useBoolean } from '../../hooks/useBoolean';
import { BonusPointsAchievement } from '../../modules/bonusPointsTypes';

import { tr } from './BonusAchievementComboBox.i18n';

interface BonusAchievementComboBoxProps {
    achievement?: BonusPointsAchievement;
    onChange: (achievement?: BonusPointsAchievement) => void;
}

const getAchievementTitle = (achievement?: BonusPointsAchievement) => {
    return achievement
        ? `${achievement.attributes.title} / ${tr('Points')}: ${achievement.attributes.bonus}`
        : undefined;
};

export const BonusAchievementComboBox = ({ achievement, onChange }: BonusAchievementComboBoxProps) => {
    const [search, setSearch] = useState('');
    const suggestionsVisibility = useBoolean(false);
    const [selectedAchievement, setSelectedAchievement] = useState(achievement);
    const achievementsQuery = trpc.bonusPoints.getAchievements.useQuery(
        { search },
        { staleTime: Infinity, keepPreviousData: true },
    );

    return (
        <ComboBox
            value={selectedAchievement ? undefined : search}
            onChange={(value: BonusPointsAchievement) => {
                setSearch(value.attributes.title);
                setSelectedAchievement(value);
                suggestionsVisibility.setFalse();
                onChange(value);
            }}
            visible={suggestionsVisibility.value}
            items={achievementsQuery.data}
            renderInput={({ value, ...restProps }) => (
                <Input
                    iconLeft={nullable(selectedAchievement, () => (
                        <IconTrophyOutline size={16} color={gray9} />
                    ))}
                    placeholder={tr('Choose achievement')}
                    size="m"
                    autoComplete="off"
                    value={value ?? getAchievementTitle(selectedAchievement)}
                    onFocus={suggestionsVisibility.setTrue}
                    onBlur={() => setTimeout(suggestionsVisibility.setFalse, 100)}
                    onChange={(e) => {
                        setSelectedAchievement(undefined);
                        onChange(undefined);
                        setSearch(e.target.value);
                    }}
                    {...restProps}
                />
            )}
            renderItem={(props) => (
                <MenuItem key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick} ghost>
                    <Text size="s" ellipsis>
                        {getAchievementTitle(props.item)}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
