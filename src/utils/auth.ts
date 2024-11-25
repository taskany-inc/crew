import { UserRole } from 'prisma/prisma-client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import { type NextAuthOptions } from 'next-auth';

import { config } from '../config';
import { historyEventMethods } from '../modules/historyEventMethods';

import { prisma } from './prisma';
import { verifyPassword } from './passwords';
import { dropUnchangedValuesFromEvent } from './dropUnchangedValuesFromEvents';

const providers: NextAuthOptions['providers'] = [];

if (config.nextAuth.credentialsAuth) {
    providers.push(
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'email', type: 'text', placeholder: 'admin@taskany.org' },
                password: { label: 'password', type: 'password' },
            },
            async authorize(creds) {
                if (!creds?.email || !creds.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: creds.email },
                    include: { accounts: true },
                });

                if (!user) return null;

                const credentialsAccount = user.accounts.find((account) => account.type === 'credentials');

                if (!credentialsAccount?.password) return null;

                const verification = await verifyPassword(creds.password, credentialsAccount.password);

                if (!verification) return null;

                const { accounts, ...restUser } = user;

                return restUser;
            },
        }),
    );
}

if (config.nextAuth.keycloak.id && config.nextAuth.keycloak.secret && config.nextAuth.keycloak.issuer) {
    providers.push(
        // https://next-auth.js.org/providers/keycloak
        KeycloakProvider({
            allowDangerousEmailAccountLinking: true,
            clientId: config.nextAuth.keycloak.id,
            clientSecret: config.nextAuth.keycloak.secret,
            issuer: config.nextAuth.keycloak.issuer,
            client: {
                authorization_signed_response_alg: config.nextAuth.keycloak.jwsAlgorithm,
                id_token_signed_response_alg: config.nextAuth.keycloak.jwsAlgorithm,
            },
            profile: (profile) => {
                return {
                    id: profile.sub,
                    name: profile.name ?? profile.preferred_username,
                    email: profile.email,
                    image: profile.picture,
                    login: profile.preferred_username,
                };
            },
        }),
    );
}

const adapter = PrismaAdapter(prisma);

// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
    secret: config.nextAuth.secret,
    adapter: {
        ...adapter,
        createUser: async (user) => {
            const login =
                'login' in user && typeof user.login === 'string' && user.login.length > 0 ? user.login : undefined;
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { login: { equals: login, mode: 'insensitive' } },
                        { email: { equals: user.email, mode: 'insensitive' } },
                        {
                            services: {
                                some: { serviceName: 'Email', serviceId: { equals: user.email, mode: 'insensitive' } },
                            },
                        },
                    ],
                },
                include: { services: true },
            });
            if (existingUser) {
                const mainEmail = user.email;
                const secondaryEmail = existingUser.email;
                const updatedUser = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { email: mainEmail, login },
                });
                const { before, after } = dropUnchangedValuesFromEvent(
                    { email: existingUser.email, login: existingUser.login ?? undefined },
                    { email: mainEmail, login },
                );
                await historyEventMethods.create({ subsystem: 'Auth user merge' }, 'editUser', {
                    groupId: undefined,
                    userId: existingUser.id,
                    before,
                    after,
                });
                if (existingUser.services.find((s) => s.serviceName === 'Email' && s.serviceId === mainEmail)) {
                    await prisma.userService.update({
                        where: {
                            userId: existingUser.id,
                            serviceName_serviceId: { serviceName: 'Email', serviceId: mainEmail },
                        },
                        data: { serviceId: secondaryEmail },
                    });
                }
                return updatedUser;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const newUser = await adapter.createUser!(user);
            await historyEventMethods.create({ subsystem: 'Auth new user' }, 'createUser', {
                groupId: undefined,
                userId: newUser.id,
                before: undefined,
                after: {
                    name: newUser.name || undefined,
                    email: newUser.email,
                    login,
                    createExternalAccount: false,
                },
            });
            return newUser;
        },
    },
    session: { strategy: 'jwt' },
    providers,
    callbacks: {
        session: async ({ session, token, user }) => {
            const id = (session.user.id || token?.id || user.id) as string;
            const dbUser = await prisma.user.findUnique({
                where: { id },
                select: { id: true, name: true, email: true, role: true },
            });

            if (!dbUser) throw new Error(`No user with id ${id}`);

            return { ...session, user: dbUser };
        },

        jwt: async ({ token, user }) => {
            return user
                ? {
                      ...token,
                      id: user.id,
                      email: user.email,
                  }
                : token;
        },
    },
};

export interface SessionUser {
    id: string;
    name: string | null;
    email: string;
    role: UserRole | null;
}

declare module 'next-auth' {
    interface Session {
        user: SessionUser;
    }
}

declare module 'next' {
    interface NextApiRequest {
        session?: {
            user: SessionUser;
        };
    }
}
