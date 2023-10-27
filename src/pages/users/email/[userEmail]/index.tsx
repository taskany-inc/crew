import { UserPage } from '../../../../components/UserPage/UserPage';
import { prisma } from '../../../../utils/prisma';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userEmail: true },
    action: async ({ stringIds }) => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: stringIds.userEmail },
        });
        return { userId: user.id };
    },
});

export default UserPage;
