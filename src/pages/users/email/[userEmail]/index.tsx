import { UserPage } from '../../../../components/UserPage/UserPage';
import { prisma } from '../../../../utils/prisma';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';
import { pages } from '../../../../hooks/useRouter';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userEmail: true },
    action: async ({ stringIds }) => {
        const user = await prisma.user.findUnique({
            where: { email: stringIds.userEmail },
        });
        if (!user) return { notFound: true };
        return { redirect: { destination: pages.user(user.id) } };
    },
});

export default UserPage;
