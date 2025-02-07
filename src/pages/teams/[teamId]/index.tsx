import { TeamPage } from '../../../components/TeamPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { teamId: true },
    action: async ({ ssg, stringIds }) => {
        await Promise.all([
            ssg.group.getGroupTree.fetch(stringIds.teamId),
            ssg.group.getById.fetch(stringIds.teamId),
            ssg.group.getMemberships.fetch(stringIds.teamId),
        ]);

        return { teamId: stringIds.teamId };
    },
});

export default TeamPage;
