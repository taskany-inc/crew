import { ServicesPage } from '../../components/ServicesPage/ServicesPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default ServicesPage;
