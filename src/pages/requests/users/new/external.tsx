import { ExternalUserCreationRequestPage } from '../../../../components/ExternalUserCreationRequestPage/ExternalUserCreationRequestPage';
import { pages } from '../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ session }) => {
        if (!session.user.role?.createExternalUserRequest) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
    },
});

export default ExternalUserCreationRequestPage;
