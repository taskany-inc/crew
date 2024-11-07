import { UploadTeamStructurePage } from '../../components/UploadTeamStructurePage/UploadTeamStructurePage';
import { pages } from '../../hooks/useRouter';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: ({ session }) => {
        if (!session.user.role?.importData) {
            return {
                redirect: {
                    destination: pages.home,
                    permanent: false,
                },
            };
        }
    },
});

export default UploadTeamStructurePage;
