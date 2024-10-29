import { ToDecreeRequestPage } from '../../../../../components/ToDecreeRequestPage/ToDecreeRequestPage';
import { pages } from '../../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';

const redirect = { redirect: { destination: pages.home } };

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: async ({ stringIds, ssg, session }) => {
        if (!session.user.role?.editUserActiveState) {
            return redirect;
        }
        try {
            const user = await ssg.user.getById.fetch(stringIds.userId);

            const active = user.supplementalPositions.find((p) => p.status === 'ACTIVE');

            if (!active) {
                return redirect;
            }

            return { userId: stringIds.userId };
        } catch (e) {
            return redirect;
        }
    },
});

export default ToDecreeRequestPage;
