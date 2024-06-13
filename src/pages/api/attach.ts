/* eslint-disable no-await-in-loop */

import { getApiHandler, getAuthChecker } from '../../utils/apiHandler';
import { postHandler, getHandler, deleteHandler } from '../../modules/attachHandler';

export const config = {
    api: {
        bodyParser: false,
    },
};

// eslint-disable-next-line newline-per-chained-call
const handler = getApiHandler().use(getAuthChecker()).get(getHandler).delete(deleteHandler).post(postHandler);

export default handler;
