import { hashPassword } from '../src/utils/passwords';
import { prisma } from '../src/utils/prisma';

const main = async () => {
    const adminEmail = 'admin@taskany.org';
    const adminPassword = await hashPassword('admin');

    await prisma.user.create({
        data: {
            name: 'Admin',
            email: adminEmail,
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
};

main();
