import { Group, OrganizationUnit, SupplementalPosition, User, UserCreationRequest } from 'prisma/prisma-client';

export type SupplementalPositionWithUnit = SupplementalPosition & { organizationUnit: OrganizationUnit };

export interface BaseUserCreationRequest extends UserCreationRequest {
    supplementalPositions: Array<SupplementalPositionWithUnit>;
}

export interface CompleteUserCreationRequest extends BaseUserCreationRequest {
    group: Group | null;
    services: Record<'serviceName' | 'serviceId', string>[] | null;
    recruiter: User | null;
    creator: User | null;
    buddy: User | null;
    organization: OrganizationUnit;
    coordinators: User[];
    lineManagers: User[];
    supervisor: User | null;
    coordinator: User | null;
}

export interface UserDecreeRequest extends BaseUserCreationRequest {
    type: 'toDecree' | 'fromDecree';
    userTargetId: string;
    phone: string;
    coordinatorIds: string[];
    lineManagerIds: string[];
    surname: string;
    firstName: string;
    middleName: string;
}
