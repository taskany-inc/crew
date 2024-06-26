import { DocsPage } from '../components/DocsPage';
import { createGetServerSideProps } from '../utils/createGetSSRProps';
import { openApiDoc } from '../utils/openApiDoc';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: () => {
        return { openApiDoc };
    },
});

export default DocsPage;
