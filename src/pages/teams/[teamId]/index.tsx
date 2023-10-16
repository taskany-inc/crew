import { TeamPage } from '../../../components/groups/TeamPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { teamId: true },
    action: ({ stringIds }) => {
        return { teamId: stringIds.teamId };
    },
});

export default TeamPage;
