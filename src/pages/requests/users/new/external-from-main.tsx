import { ExternalFromMainOrgUserCreationRequestPage } from '../../../../components/ExternalFromMainOrgUserCreationRequestPage/ExternalFromMainOrgUserCreationRequestPage';
import { pages } from '../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ session }) => {
        if (!session.user.role?.createUser) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
    },
});

export default ExternalFromMainOrgUserCreationRequestPage;
