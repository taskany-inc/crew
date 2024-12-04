import { InternalUserCreationRequestPage } from '../../../../components/InternalUserCreationRequestPage/InternalUserCreationRequestPage';
import { pages } from '../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ session }) => {
        if (!session.user.role?.createInternalUserRequest) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
    },
});

export default InternalUserCreationRequestPage;
