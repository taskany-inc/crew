export interface ExternalUserUpdate {
    email: string;
    name?: string;
    supervisorId?: string | null;
    active?: boolean;
    login?: string;
    method?: 'sp' | 'cloud-move' | 'cloud-no-move';
}
