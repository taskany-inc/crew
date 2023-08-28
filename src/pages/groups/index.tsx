import { TeamsPage } from '../../controllers/TeamsPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default TeamsPage;
