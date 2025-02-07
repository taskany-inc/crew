import { TeamPage } from '../../../components/TeamPage/TeamPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { teamId: true },
    action: async ({ ssg, stringIds }) => {
        const team = await ssg.group.getById.fetch(stringIds.teamId);
        await ssg.group.getChildren.fetch(team.id);
        await ssg.group.getMemberships.fetch(stringIds.teamId);

        return { teamId: stringIds.teamId };
    },
});

export default TeamPage;
