import { ServicesPage } from '../../components/services/ServicesPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default ServicesPage;
