import { Group, OrganizationUnit, SupplementalPosition, User, UserCreationRequest } from 'prisma/prisma-client';

export interface UserCreationRequestSupplementPosition {
    supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
}

export interface CompleteUserCreationRequest extends UserCreationRequest {
    supervisor: User | null;
    organization: OrganizationUnit;
    group: Group;
    services: Record<'serviceName' | 'serviceId', string>[] | null;
    buddy: User | null;
    coordinator: User | null;
    coordinators: User[];
    lineManagers: User[];
    recruiter: User | null;
    supplementalPositions: Array<SupplementalPosition & { organizationUnit: OrganizationUnit }>;
}
