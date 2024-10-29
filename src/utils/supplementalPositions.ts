import { SupplementalPosition } from 'prisma/prisma-client';

export const getLastSupplementalPositions = <P extends SupplementalPosition>(items: P[]) => {
    return items.reduce<{ positions: P[]; endDate: Date | null }>(
        (acum, position) => {
            const lastEndDate = acum.endDate?.valueOf() || 0;
            const currentEndDate = position.workEndDate?.valueOf() || 0;

            if (position.status === 'ACTIVE') {
                acum.endDate = null;
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
