import { UserCreateRequestsPage } from '../../../components/UserCreateRequestsPage/UserCreateRequestsPage';
import { pages } from '../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        try {
            await ssg.user.getUsersRequests.fetch();
        } catch (e) {
            return { redirect: { destination: pages.home } };
        }
    },
});

export default UserCreateRequestsPage;
