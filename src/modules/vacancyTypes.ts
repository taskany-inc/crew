import { Group, User } from 'prisma/prisma-client';

import { Nullish } from '../utils/types';

export type VacancyGroup = {
    group: Group;
};

export type VacancyUser = {
    user: Nullish<User>;
};
