import { UsersPage } from '../../components/UsersPage/UsersPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default UsersPage;
