import styled from 'styled-components';
import { Group } from 'prisma/prisma-client';
import { gapM, gapS } from '@taskany/colors';
import { IconPlusCircleSolid } from '@taskany/icons';

import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { VacancyListItemEditable } from '../VacancyListItemEditable/VacancyListItemEditable';
import { InlineTrigger } from '../InlineTrigger';
import { CreateVacancyModal } from '../CreateVacancyModal/CreateVacancyModal';
import { useBoolean } from '../../hooks/useBoolean';
import { GroupSupervisor } from '../../modules/groupTypes';

import { tr } from './TeamVacancies.i18n';

const StyledVacancyList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type TeamVacanciesProps = {
    group: Group & GroupSupervisor;
};

export const TeamVacancies = ({ group }: TeamVacanciesProps) => {
    const vacanciesQuery = trpc.vacancy.getList.useQuery({ teamIds: [group.id], archived: false });

    const createVacancyModalVisibility = useBoolean(false);

    return (
        <NarrowSection title={tr('Vacancies')}>
            <StyledVacancyList>
                {vacanciesQuery.data?.vacancies.map((vacancy) => (
                    <VacancyListItemEditable key={vacancy.id} vacancy={vacancy} />
                ))}
            </StyledVacancyList>
            <InlineTrigger
                text={tr('Create vacancy')}
                icon={<IconPlusCircleSolid size="s" />}
                onClick={createVacancyModalVisibility.setTrue}
            />
            <CreateVacancyModal
                group={group}
                visible={createVacancyModalVisibility.value}
                onClose={createVacancyModalVisibility.setFalse}
            />
        </NarrowSection>
    );
};
