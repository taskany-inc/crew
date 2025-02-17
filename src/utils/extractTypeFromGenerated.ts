import { ColumnType } from 'kysely';

import { Timestamp } from '../generated/kyselyTypes';

export type ExtractTypeFromGenerated<T> = {
    [K in keyof T]: T[K] extends ColumnType<infer Date, any, any>
        ? Date
        : T[K] extends Timestamp | null
        ? Date | null
        : T[K];
};
