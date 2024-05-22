import { LogsPage } from '../components/LogsPage/LogsPage';
import { createGetServerSideProps } from '../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
});

export default LogsPage;
