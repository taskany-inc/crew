import { UserDecreeRequestsPage } from '../../../components/UserDecreeRequestsPage/UserDecreeRequestsPage';
import { pages } from '../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        try {
            await ssg.userCreationRequest.getList.fetch({});
        } catch (e) {
            return { redirect: { destination: pages.home } };
        }
    },
});

export default UserDecreeRequestsPage;
