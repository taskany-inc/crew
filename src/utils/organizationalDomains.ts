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

export const findSigmaMail = async (mails: Array<string | null | undefined>) => {
    const simgadom = await sigmaDomain();
    return mails.find((e) => e?.endsWith(simgadom)) || '';
};

export const corporateDomain = async () => {
    const corporateOrganizationDomain = await db
        .selectFrom('OrganizationDomain')
        .select('domain')
        .where('type', '=', DomainTypes.Corporate)
        .executeTakeFirstOrThrow();

    return corporateOrganizationDomain.domain;
};

export const findCorporateMail = async (mails: Array<string | null | undefined>) => {
    const corpDomain = await corporateDomain();
    return mails.find((e) => e?.endsWith(corpDomain)) || '';
};
