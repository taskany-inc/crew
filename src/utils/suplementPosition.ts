import { AddSupplementalPositionType } from '../modules/organizationUnitSchemas';

export const percentageMultiply = 100;

export const supplementPositionListToString = (supplementalPosition: AddSupplementalPositionType[]) =>
    supplementalPosition
        .map((s) => `${s.organizationUnit.name} ${s.percentage / percentageMultiply} ${s.unitId || ''}`)
        .join(', ');
