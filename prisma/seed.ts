import { UserRole } from 'prisma/prisma-client';

import { hashPassword } from '../src/utils/passwords';
import { prisma } from '../src/utils/prisma';

const main = async () => {
    const adminEmail = 'admin@taskany.org';
    const adminPassword = await hashPassword('admin');

    const user = await prisma.user.create({
        data: {
            name: 'Admin',
            email: adminEmail,
            role: UserRole.ADMIN,
            accounts: {
                create: {
                    type: 'credentials',
                    provider: 'seed',
                    providerAccountId: 'credentials',
                    password: adminPassword,
                },
            },
        },
    });

    const github = await prisma.externalService.create({
        data: {
            name: 'github',
            icon: 'IconGithubOutline',
            linkPrefix: 'https://github.com/',
        },
    });

    await prisma.userService.create({
        data: {
            serviceName: github.name,
            userId: user.id,
            serviceId: 'githubId',
        },
    });

    const gitlab = await prisma.externalService.create({
        data: {
            name: 'gitlab',
            icon: 'IconGitlabOutline',
            linkPrefix: 'https://gitlab.com/',
        },
    });

    await prisma.userService.create({
        data: {
            serviceName: gitlab.name,
            userId: user.id,
            serviceId: 'gitlabId',
        },
    });

    const email = await prisma.externalService.create({
        data: {
            name: 'email',
            icon: 'IconEnvelopeOutline',
            linkPrefix: 'mailto:',
        },
    });

    await prisma.userService.create({
        data: {
            serviceName: email.name,
            userId: user.id,
            serviceId: 'emailId',
        },
    });

    const telegram = await prisma.externalService.create({
        data: {
            name: 'telegram',
            icon: 'IconTelegramOutline',
            linkPrefix: 'https://t.me/',
        },
    });

    await prisma.userService.create({
        data: {
            serviceName: telegram.name,
            userId: user.id,
            serviceId: 'telegramId',
        },
    });
};

main();
