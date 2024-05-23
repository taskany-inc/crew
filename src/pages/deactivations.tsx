import { ScheduledDeactivationList } from '../components/ScheduledDeactivationList/ScheduledDeactivationList';
import { createGetServerSideProps } from '../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({ requireSession: true });

export default ScheduledDeactivationList;
