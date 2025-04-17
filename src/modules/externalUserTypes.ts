import { CreateUser } from './userSchemas';

export interface ExternalUserCreate extends CreateUser {
    unit?: string;
}

export interface ExternalUserUpdate {
    email: string;
    name?: string;
    supervisorId?: string | null;
    active?: boolean;
    login?: string;
    method?: 'sp' | 'cloud-move' | 'cloud-no-move';
}
