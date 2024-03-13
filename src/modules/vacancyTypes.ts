import { User } from '@prisma/client';

import { Nullish } from '../utils/types';

export interface VacancyUser {
    user: Nullish<User>;
}

export interface VacancyHr {
    hr: User;
}

export interface VacancyHiringManager {
    hiringManager: User;
}
