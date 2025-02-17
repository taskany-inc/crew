import { TeamPage } from '../../../components/TeamPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { teamId: true },
    action: async ({ ssg, stringIds }) => {
        await Promise.all([
            ssg.group.getGroupTree.fetch(),
            ssg.group.getById.fetch(stringIds.teamId),
            ssg.group.getMemberships.fetch({ groupId: stringIds.teamId }),
        ]);

        return { teamId: stringIds.teamId };
    },
});

export default TeamPage;
