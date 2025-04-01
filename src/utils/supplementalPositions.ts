import { PositionStatus, SupplementalPosition } from 'prisma/prisma-client';

export const getLastSupplementalPositions = <P extends SupplementalPosition>(items: P[]) => {
    return items.reduce<{ positions: P[]; endDate: Date | null }>(
        (acum, position) => {
            const lastEndDate = acum.endDate?.valueOf() || 0;
            const currentEndDate = position.workEndDate?.valueOf() || 0;

            if (position.status === PositionStatus.ACTIVE) {
                if (acum.endDate) {
                    acum.endDate = null;
                    acum.positions = [];
                }

                acum.positions.push(position);
            } else {
                if (acum.positions.length && !acum.endDate) {
                    return acum;
                }

                if (lastEndDate < currentEndDate) {
                    acum.endDate = position.workEndDate;
                    acum.positions = [position];
                }

                if (
                    lastEndDate === currentEndDate &&
                    !acum.positions.find((p) => p.organizationUnitId === position.organizationUnitId)
                ) {
                    acum.positions.push(position);
                }
            }

            return acum;
        },
        {
            positions: [],
            endDate: null,
        },
    );
};

export const getMainPositionFromLasts = <P extends SupplementalPosition>(items: P[]): P | null => {
    const { positions, endDate } = getLastSupplementalPositions(items);

    if (positions.length && endDate == null) {
        const activePositions = positions.filter(({ status }) => status === PositionStatus.ACTIVE);

        if (activePositions.length) {
            return activePositions.find(({ main }) => main) as P;
        }
    }

    return null;
};
