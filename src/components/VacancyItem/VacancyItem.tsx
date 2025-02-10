import { ComponentProps, FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';
import {
    Button,
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    ListView,
    ListViewItem,
    MenuItem,
    Text,
} from '@taskany/bricks/harmony';
import { IconEdit1Outline, IconMoreVerticalOutline, IconXCircleOutline } from '@taskany/icons';

import { config } from '../../config';
import { useBoolean } from '../../hooks/useBoolean';
import { GroupVacancies } from '../../trpc/inferredTypes';
import { Link } from '../Link';
import { UpdateVacancyModal } from '../UpdateVacancyModal/UpdateVacancyModal';
import { ArchiveVacancyModal } from '../ArchiveVacancyModal/ArchiveVacancyModal';
import { Restricted } from '../Restricted';

import s from './VacancyItem.module.css';
import { tr } from './VacancyItem.i18n';

type Size = 'm' | 'l';

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'm',
};

interface VacancyItemProps extends HTMLAttributes<HTMLDivElement> {
    item: GroupVacancies[number];
    editable: boolean;
    size?: Size;
}

export const VacancyItem: FC<VacancyItemProps> = ({ className, editable, item, size = 'l', ...props }) => {
    const dropdownVisibility = useBoolean(false);
    const editVacancyModalVisibility = useBoolean(false);
    const archiveVacancyModalVisibility = useBoolean(false);

    const items = useMemo(
        () => [
            {
                label: tr('Edit'),
                action: () => {
                    editVacancyModalVisibility.setTrue();
                    dropdownVisibility.setFalse();
                },
                icon: <IconEdit1Outline size="s" />,
            },
            {
                label: tr('Archive'),
                action: () => {
                    archiveVacancyModalVisibility.setTrue();
                    dropdownVisibility.setFalse();
                },
                icon: <IconXCircleOutline size="s" className={s.IconArchive} />,
            },
        ],
        [archiveVacancyModalVisibility, editVacancyModalVisibility, dropdownVisibility],
    );

    return (
        <>
            <div className={cn(s.TeamItem, className)} {...props}>
                <div className={s.TeamItemContent}>
                    <Link href={`${config.hireIntegration.url}/candidates?vacancyIds=${item.id}`} target="_blank">
                        <Text size={textSizesMap[size]}>{item.name}</Text>
                    </Link>
                    <Text size={textSizesMap[size]} className={s.TeamName}>
                        {item.group?.name}
                    </Text>
                </div>
                <Restricted visible={editable}>
                    <Dropdown isOpen={dropdownVisibility.value} onClose={() => dropdownVisibility.setFalse()}>
                        <DropdownTrigger
                            renderTrigger={(props) => (
                                <Button
                                    onClick={() => dropdownVisibility.toggle()}
                                    iconLeft={<IconMoreVerticalOutline ref={props.ref} size="xs" />}
                                />
                            )}
                        />
                        <DropdownPanel placement="right-start">
                            <ListView>
                                {items.map((item) => (
                                    <ListViewItem
                                        key={item.label}
                                        value={item}
                                        renderItem={({ active, hovered, ...props }) => (
                                            <MenuItem
                                                hovered={active || hovered}
                                                onClick={item.action}
                                                key={item.label}
                                                {...props}
                                            >
                                                <Text className={cn(s.VacancyItemAction)} size="s">
                                                    {item.icon}
                                                    {item.label}
                                                </Text>
                                            </MenuItem>
                                        )}
                                    />
                                ))}
                            </ListView>
                        </DropdownPanel>
                    </Dropdown>
                </Restricted>
            </div>
            <UpdateVacancyModal
                visible={editVacancyModalVisibility.value}
                vacancy={item}
                groupName={item.group?.name || ''}
                onClose={editVacancyModalVisibility.setFalse}
            />

            <ArchiveVacancyModal
                visible={archiveVacancyModalVisibility.value}
                vacancy={item}
                onClose={archiveVacancyModalVisibility.setFalse}
            />
        </>
    );
};
