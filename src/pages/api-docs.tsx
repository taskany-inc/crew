import { ApiPage } from '../components/ApiPage';
import { createGetServerSideProps } from '../utils/createGetSSRProps';
import { openApiDoc } from '../utils/openApiDoc';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: () => {
        return { openApiDoc };
    },
});

export default ApiPage;
