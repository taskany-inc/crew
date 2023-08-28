import { ServicesPage } from '../../controllers/ServicesPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default ServicesPage;
