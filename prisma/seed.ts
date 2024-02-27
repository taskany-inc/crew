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

    const servicesData = [
        { name: 'Email', icon: 'IconEnvelopeOutline', linkPrefix: 'mailto:' },
        { name: 'Phone', icon: 'IconPhoneOutline', linkPrefix: 'tel:' },
        { name: 'Login', icon: 'IconUserSquareOutline' },
        { name: 'Github', icon: 'IconGithubOutline', linkPrefix: 'https://github.com/' },
        { name: 'Gitlab', icon: 'IconGitlabOutline', linkPrefix: 'https://gitlab.com/' },
        { name: 'Telegram', icon: 'IconTelegramOutline', linkPrefix: 'https://t.me/' },
    ];

    await prisma.externalService.createMany({ data: servicesData });

    await Promise.all(
        servicesData.map((data) => {
            return prisma.userService.create({
                data: { serviceName: data.name, userId: user.id, serviceId: `${data.name} id` },
            });
        }),
    );

    const devicesData = [{ name: 'MacBook' }, { name: 'Smart Display' }, { name: 'Smart Speaker' }];

    await prisma.device.createMany({ data: devicesData });

    await Promise.all(
        devicesData.map((data) => {
            return prisma.userDevice.create({
                data: { deviceName: data.name, userId: user.id, deviceId: `${data.name} id` },
            });
        }),
    );

    await prisma.organizationUnit.createMany({
        data: [
            { name: 'Head office', country: 'UK' },
            { name: 'Subsidiary', country: 'France' },
        ],
    });

    await prisma.group.create({
        data: {
            name: 'taskany',
            children: {
                create: {
                    name: 'frontend',
                    children: {
                        create: {
                            name: 'services',
                            children: {
                                create: {
                                    name: 'crew',
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    await prisma.role.createMany({
        data: [{ name: 'CEO' }, { name: 'Manager' }, { name: 'Designer' }, { name: 'Programmer' }, { name: 'HR' }],
    });

    await prisma.apiToken.create({
        data: { id: '2c88d9e5-dcbf-44be-b377-1b5461a1f1e6', description: 'test-token' },
    });

    await prisma.appConfig.create({});
};

main();
