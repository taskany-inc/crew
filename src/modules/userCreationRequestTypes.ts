import { Group, OrganizationUnit, User, UserCreationRequest } from 'prisma/prisma-client';

export interface FullyUserCreationRequest extends UserCreationRequest {
    supervisor: User;
    organization: OrganizationUnit;
    group: Group;
    services: Record<'serviceName' | 'serviceId', string>[] | null;
}
