import styled from 'styled-components';
import { gapM, gapS } from '@taskany/colors';

import { NarrowSection } from '../NarrowSection';
import { trpc } from '../../trpc/trpcClient';
import { VacancyListItemEditable } from '../VacancyListItemEditable';

import { tr } from './TeamVacancies.i18n';

const StyledVacancyList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
    margin-bottom: ${gapM};
`;

type TeamVacanciesProps = {
    groupId: string;
};

export const TeamVacancies = ({ groupId }: TeamVacanciesProps) => {
    const vacanciesQuery = trpc.vacancy.getList.useQuery({ groupId, archived: false });

    return (
        <NarrowSection title={tr('Vacancies')}>
            <StyledVacancyList>
                {vacanciesQuery.data?.map((vacancy) => (
                    <VacancyListItemEditable key={vacancy.id} vacancy={vacancy} />
                ))}
            </StyledVacancyList>
        </NarrowSection>
    );
};
