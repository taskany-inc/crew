import { UserRole } from 'prisma/prisma-client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
// eslint-disable-next-line camelcase
import { type NextAuthOptions } from 'next-auth';

import { config } from '../config';

import { prisma } from './prisma';
import { verifyPassword } from './passwords';

const providers: NextAuthOptions['providers'] = [
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
];

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
        }),
    );
}

// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
    secret: config.nextAuth.secret,
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt' },
    providers,
    callbacks: {
        session: async ({ session, token, user }) => {
            const id = (session.user.id || token?.id || user.id) as string;
            const dbUser = await prisma.user.findUnique({ where: { id } });

            if (!dbUser) throw new Error(`No user with id ${id}`);

            return {
                ...session,
                user: { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role },
            };
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

export type SessionUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
};

declare module 'next-auth' {
    interface Session {
        user: SessionUser;
    }
}
