import { Vacancy } from 'prisma/prisma-client';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';
import { IconSearchOutline } from '@taskany/icons';

import { config } from '../config';

import { Link } from './Link';

type VacancyListItemProps = {
    vacancy: Vacancy;
};

const StyledWrapper = styled.div`
    display: flex;
    gap: ${gapS};
    align-items: center;
    flex-wrap: nowrap;
`;

export const VacancyListItem = ({ vacancy }: VacancyListItemProps) => {
    return (
        <StyledWrapper>
            <IconSearchOutline size="s" color={gray9} />
            <Link href={`${config.hireIntegration.url}/candidates?vacancyIds=${vacancy.id}`} target="_blank">
                <Text>{vacancy.name}</Text>
            </Link>
        </StyledWrapper>
    );
};
