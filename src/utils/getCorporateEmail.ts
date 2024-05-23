import { config } from '../config';

export const getCorporateEmail = (login: string | null) => {
    const domain = config.corporateEmailDomain || '@taskany.org';
    return `${login}${domain}`;
};
