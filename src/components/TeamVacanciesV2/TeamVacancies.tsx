import { ComponentProps, FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { Badge, Text } from '@taskany/bricks/harmony';
import { IconPlusCircleOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { TeamPageSubtitle } from '../TeamPageSubtitle/TeamPageSubtitle';
import { CreateVacancyModal } from '../CreateVacancyModal/CreateVacancyModal';
import { List, ListItem } from '../List/List';
import { useBoolean } from '../../hooks/useBoolean';
import { VacancyItem } from '../VacancyItem/VacancyItem';
import { Restricted } from '../Restricted';
import { trpc } from '../../trpc/trpcClient';

import { tr } from './TeamVacanciesV2.i18n';
import s from './TeamVacancies.module.css';

interface TeamChildrenProps extends HTMLAttributes<HTMLDivElement> {
    group: ComponentProps<typeof CreateVacancyModal>['group'];
    editable?: boolean;
    size?: ComponentProps<typeof TeamPageSubtitle>['size'];
}

export const TeamVacancies: FC<TeamChildrenProps> = ({
    className,
    children,
    group,
    editable = false,
    size,
    ...props
}) => {
    const createVacancyModalVisibility = useBoolean(false);

    const { data: vacancies = [] } = trpc.group.getGroupChidrenVacancies.useQuery(group.id);

    return (
        <>
            <div className={cn(s.TeamVacancies, className)} {...props}>
                <TeamPageSubtitle
                    size={size}
                    counter={vacancies.length}
                    action={
                        <Restricted visible={editable}>
                            <Badge
                                iconLeft={<IconPlusCircleOutline className={s.TriggerIcon} size="s" />}
                                text={tr('Add')}
                                onClick={createVacancyModalVisibility.setTrue}
                                view="secondary"
                                weight="regular"
                            />
                        </Restricted>
                    }
                >
                    {tr('Vacancies')}
                </TeamPageSubtitle>
                {nullable(
                    vacancies,
                    () => (
                        <List>
                            {vacancies.map((v, index) => (
                                <ListItem key={index}>
                                    <VacancyItem size={size} item={v} editable={editable} />
                                </ListItem>
                            ))}
                        </List>
                    ),
                    <Text className={s.Empty}>{tr('No vacancies')}</Text>,
                )}
            </div>

            <CreateVacancyModal
                group={group}
                visible={createVacancyModalVisibility.value}
                onClose={createVacancyModalVisibility.setFalse}
            />
        </>
    );
};
