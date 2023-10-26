import { TeamsPage } from '../../components/TeamsPage/TeamsPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default TeamsPage;
