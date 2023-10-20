import { ExternalService, UserService } from 'prisma/prisma-client';

export type UserServiceInfo = UserService & { service: ExternalService };
