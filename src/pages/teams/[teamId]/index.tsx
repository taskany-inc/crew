import { TeamPage } from '../../../components/groups/TeamPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default TeamPage;
