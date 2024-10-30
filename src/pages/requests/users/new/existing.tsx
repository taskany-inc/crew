import { ExistingUserCreationRequestPage } from '../../../../components/ExistingUserCreationRequestPage/ExistingUserCreationRequestPage';
import { pages } from '../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ session, ssg }) => {
        if (!session.user.role?.createUser) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }

        await ssg.userRole.getListWithScope.fetch();
    },
});

export default ExistingUserCreationRequestPage;
