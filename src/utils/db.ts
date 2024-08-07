import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

import { DB as Database } from '../generated/kyselyTypes';

import { parseConnectionURL } from './parseConnectionUrl';

const connectionConfig = parseConnectionURL();

const dialect = new PostgresDialect({
    pool: new Pool({
        database: connectionConfig?.database,
        host: connectionConfig?.host,
        user: connectionConfig?.user,
        password: connectionConfig?.password,
        port: connectionConfig?.port,
        max: connectionConfig?.connectionLimit,
        options: `-c search_path=${connectionConfig?.schema || 'public'}`,
    }),
});

const isDebugEnabled = process.env.NODE_ENV === 'development' && process.env.DEBUG?.includes('db:kysely:provider');

export const db = new Kysely<Database>({
    dialect,
    plugins: [
        {
            transformQuery(query) {
                if (isDebugEnabled) {
                    // eslint-disable-next-line no-console
                    console.log(db.getExecutor().compileQuery(query.node, query.queryId));
                }
                return query.node;
            },
            async transformResult(res) {
                if (isDebugEnabled) {
                    // eslint-disable-next-line no-console
                    console.table(res.result);
                }
                return res.result;
            },
        },
    ],
});
