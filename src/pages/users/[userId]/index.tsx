import { UserPage } from '../../../components/UserPage/UserPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: ({ stringIds }) => {
        return { userId: stringIds.userId };
    },
});

export default UserPage;
