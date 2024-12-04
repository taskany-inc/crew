import { ExistingUserCreationRequestPage } from '../../../../components/ExistingUserCreationRequestPage/ExistingUserCreationRequestPage';
import { pages } from '../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ session }) => {
        if (!session.user.role?.createExistingUserRequest) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
    },
});

export default ExistingUserCreationRequestPage;
