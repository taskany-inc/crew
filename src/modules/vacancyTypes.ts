import { User } from '@prisma/client';

import { Nullish } from '../utils/types';

export interface VacancyUser {
    user: Nullish<User>;
}

export interface VacancyHr {
    hr: Nullish<Omit<User, 'roleDeprecated'>>;
}

export interface VacancyHiringManager {
    hiringManager: Nullish<Omit<User, 'roleDeprecated'>>;
}
