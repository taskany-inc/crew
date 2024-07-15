import { Group, OrganizationUnit, User, UserCreationRequest } from 'prisma/prisma-client';

export interface CompleteUserCreationRequest extends UserCreationRequest {
    supervisor: User;
    organization: OrganizationUnit;
    group: Group;
    services: Record<'serviceName' | 'serviceId', string>[] | null;
    buddy: User | null;
    coordinator: User | null;
    recruiter: User | null;
}
