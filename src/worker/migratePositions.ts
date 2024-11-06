/* eslint-disable no-console */
/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
    const users = await prisma.user.findMany({
        where: {
            organizationUnitId: {
                not: null,
            },
        },
        include: {
            supplementalPositions: true,
        },
    });

    const total = users.length;
    let counter = 0;

    console.log(`GOT ${users.length} users`);

    let user = users.pop();
    const errorsIds = [];

    while (user) {
        const userId = user.id;
        counter++;

        console.log(`START PROCESS ${counter} of ${total}`);

        try {
            const status = user.active ? 'ACTIVE' : 'FIRED';
            const workStartDate = user.workStartDate || user.createdAt;
            const workEndDate = user.active ? undefined : user.deactivatedAt;
            const role = user.title;

            if (
                user.organizationUnitId &&
                !user.supplementalPositions.some((position) => position.organizationUnitId === user?.organizationUnitId)
            ) {
                await prisma.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        supplementalPositions: {
                            create: [
                                {
                                    organizationUnit: { connect: { id: user.organizationUnitId } },
                                    percentage: 1,
                                    main: true,
                                    role,
                                    status,
                                    workStartDate,
                                    workEndDate,
                                },
                            ],
                        },
                    },
                });
            }

            const supplementalIds = user.supplementalPositions.map((item) => item.id);

            if (supplementalIds.length) {
                prisma.supplementalPosition.updateMany({
                    data: {
                        role,
                        status,
                        workStartDate,
                        workEndDate,
                        main: false,
                    },
                    where: {
                        id: {
                            in: supplementalIds,
                        },
                    },
                });
            }
        } catch (e) {
            console.log('MIGRATION ERROR:', e);

            errorsIds.push(userId);
        }

        user = users.pop();
    }

    console.log(`MIGRATION FINISHED: ${total - errorsIds.length} of ${total}`);
    console.log('ERRORS USERS:', errorsIds);
})();
