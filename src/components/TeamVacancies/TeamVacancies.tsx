import styled from 'styled-components';
import { Group } from '@prisma/client';
import { gapM, gapS } from '@taskany/colors';
import { IconPlusCircleSolid } from '@taskany/icons';

import { NarrowSection } from '../NarrowSection';
import { VacancyListItemEditable } from '../VacancyListItemEditable/VacancyListItemEditable';
import { InlineTrigger } from '../InlineTrigger';
import { CreateVacancyModal } from '../CreateVacancyModal/CreateVacancyModal';
import { useBoolean } from '../../hooks/useBoolean';
import { GroupMeta, GroupSupervisor, GroupVacancies } from '../../modules/groupTypes';
import { Restricted } from '../Restricted';

import { tr } from './TeamVacancies.i18n';

const StyledVacancyList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

interface TeamVacanciesProps {
    group: Group & GroupSupervisor & GroupMeta & GroupVacancies;
}

export const TeamVacancies = ({ group }: TeamVacanciesProps) => {
    const createVacancyModalVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Vacancies')}>
            <StyledVacancyList>
                {group.vacancies.map((vacancy) => (
                    <VacancyListItemEditable
                        key={vacancy.id}
                        vacancy={vacancy}
                        groupName={group.name}
                        isEditable={group.meta.isEditable}
                    />
                ))}
            </StyledVacancyList>

            <Restricted visible={group.meta.isEditable}>
                <InlineTrigger
                    text={tr('Create vacancy')}
                    icon={<IconPlusCircleSolid size="s" />}
                    onClick={createVacancyModalVisibility.setTrue}
                />
            </Restricted>

            <CreateVacancyModal
                group={group}
                visible={createVacancyModalVisibility.value}
                onClose={createVacancyModalVisibility.setFalse}
            />
        </NarrowSection>
    );
};
