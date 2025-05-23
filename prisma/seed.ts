import { UserRoleDeprecated } from 'prisma/prisma-client';

import { hashPassword } from '../src/utils/passwords';
import { prisma } from '../src/utils/prisma';
import { AccessOperation } from '../src/utils/access';
import { ExternalServiceName } from '../src/utils/externalServices';
import { DomainTypes } from '../src/utils/organizationalDomains';

const main = async () => {
    const adminEmail = 'admin@taskany.org';
    const adminPassword = await hashPassword('admin');

    const adminAccess: Record<AccessOperation, true> = {
        createUser: true,
        editRoleScopes: true,
        editUserRole: true,
        editUserCreationRequests: true,
        editUser: true,
        editUserActiveState: true,
        editUserAchievements: true,
        editUserBonuses: true,
        viewUserBonuses: true,
        viewUserExtendedInfo: true,
        editScheduledDeactivation: true,
        viewScheduledDeactivation: true,
        editFullGroupTree: true,
        viewHistoryEvents: true,
        importData: true,
        decideOnUserCreationRequest: true,
        createExistingUserRequest: true,
        createInternalUserRequest: true,
        createExternalUserRequest: true,
        createExternalFromMainUserRequest: true,
        readManyInternalUserRequests: true,
        readManyExternalUserRequests: true,
        readManyExternalFromMainUserRequests: true,
        editInternalUserRequest: true,
        editExternalUserRequest: true,
        editExternalFromMainUserRequest: true,
    };

    await prisma.userRole.createMany({
        data: [
            {
                code: 'admin',
                name: 'Administrator',
                ...adminAccess,
            },
            {
                code: 'hr_lead',
                name: 'HR lead',
                editUser: true,
                editUserAchievements: true,
                editUserBonuses: true,
                viewUserBonuses: true,
                viewUserExtendedInfo: true,
                editFullGroupTree: true,
            },
            {
                code: 'hr',
                name: 'HR',
                editUser: true,
                editUserAchievements: true,
                viewUserBonuses: true,
                viewUserExtendedInfo: true,
                editFullGroupTree: true,
            },
            {
                code: 'project_owner',
                name: 'Project owner',
                viewUserExtendedInfo: true,
            },
        ],
    });

    const user = await prisma.user.create({
        data: {
            name: 'Admin',
            email: adminEmail,
            title: 'Superuser',
            roleCode: 'admin',
            roleDeprecated: UserRoleDeprecated.ADMIN,
            accounts: {
                create: {
                    type: 'credentials',
                    provider: 'seed',
                    providerAccountId: 'credentials',
                    password: adminPassword,
                },
            },
            settings: {
                create: {
                    showAchievements: true,
                },
            },
        },
    });

    const servicesData = [
        { name: ExternalServiceName.Email, icon: 'IconEnvelopeOutline', linkPrefix: 'mailto:' },
        { name: ExternalServiceName.WorkEmail, icon: 'IconEnvelopeOutline', linkPrefix: 'mailto:' },
        { name: ExternalServiceName.PersonalEmail, icon: 'IconEnvelopeOutline', linkPrefix: 'mailto:' },
        { name: ExternalServiceName.Phone, icon: 'IconPhoneOutline', linkPrefix: 'tel:' },
        { name: ExternalServiceName.Github, icon: 'IconGithubOutline', linkPrefix: 'https://github.com/' },
        { name: ExternalServiceName.Gitlab, icon: 'IconGitlabOutline', linkPrefix: 'https://gitlab.com/' },
        { name: ExternalServiceName.Telegram, icon: 'IconTelegramOutline', linkPrefix: 'https://t.me/' },
        { name: ExternalServiceName.AccountingSystem, icon: 'IconCalculatorOutline' },
        { name: ExternalServiceName.ServiceNumber, icon: 'IconReceiptOutline' },
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

    const domains = await Promise.all([
        prisma.organizationDomain.create({
            data: {
                domain: '@taskany.org',
                type: DomainTypes.Corporate,
            },
        }),
        prisma.organizationDomain.create({
            data: {
                domain: '@taskany-sigma.org',
                type: DomainTypes.Sigma,
            },
        }),
    ]);

    const organizationData = [
        { name: 'Head office', country: 'UK', main: true },
        { name: 'Subsidiary', country: 'France' },
    ];

    await Promise.all(
        organizationData.map((data) =>
            prisma.organizationUnit.create({
                data: {
                    ...data,
                    organizationDomains: {
                        connect: domains,
                    },
                },
            }),
        ),
    );

    await prisma.group.create({
        data: {
            name: 'taskany',
            organizational: true,
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

    const rootOrgGroup = await prisma.group.findFirst({ where: { parentId: null, organizational: true } });

    await prisma.appConfig.create({ data: { orgGroupId: rootOrgGroup?.id, orgGroupUpdatedAt: new Date() } });
};

main();
