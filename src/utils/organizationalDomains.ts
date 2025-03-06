import { db } from './db';

export enum DomainTypes {
    Sigma = 'Sigma',
    Corporate = 'Corporate',
}

export const sigmaDomain = async () => {
    const sigmaOrganizationDomain = await db
        .selectFrom('OrganizationDomain')
        .select('domain')
        .where('type', '=', DomainTypes.Sigma)
        .executeTakeFirstOrThrow();

    return sigmaOrganizationDomain.domain;
};

export const findSigmaMail = (mails: Array<string | null | undefined>) =>
    mails.find(async (e) => e?.endsWith(await sigmaDomain())) || '';

export const corporateDomain = async () => {
    const corporateOrganizationDomain = await db
        .selectFrom('OrganizationDomain')
        .select('domain')
        .where('type', '=', DomainTypes.Corporate)
        .executeTakeFirstOrThrow();

    return corporateOrganizationDomain.domain;
};

export const findCorporateMail = (mails: Array<string | null | undefined>) =>
    mails.find(async (e) => e?.endsWith(await corporateDomain())) || '';
