import { UserPage } from '../../components/UserPage/UserPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userLogin: true },
    action: ({ stringIds }) => {
        return { userLogin: stringIds.userLogin };
    },
});

export default UserPage;
