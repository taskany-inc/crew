import { ScheduledDeactivationList } from '../components/ScheduledDeactivationList/ScheduledDeactivationList';
import { createGetServerSideProps } from '../utils/createGetSSRProps';
import { pages } from '../hooks/useRouter';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        try {
            await ssg.scheduledDeactivation.getList.fetch({});
        } catch (e) {
            return { redirect: { destination: pages.home } };
        }
    },
});
export default ScheduledDeactivationList;
