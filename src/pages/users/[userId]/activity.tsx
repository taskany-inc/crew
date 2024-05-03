import { UserActivityPage } from '../../../components/UserActivityPage/UserActivityPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: ({ stringIds }) => {
        return { userId: stringIds.userId };
    },
});

export default UserActivityPage;
