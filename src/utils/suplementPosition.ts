import { AddSupplementalPositionType } from '../modules/organizationUnitSchemas';

export const supplementPositionListToString = (supplementalPosition: AddSupplementalPositionType[]) =>
    supplementalPosition.map((s) => `${s.organizationUnit.name} ${s.percentage}% ${s.unitId || ''}`).join(', ');
