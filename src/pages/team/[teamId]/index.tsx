import { TeamPage } from '../../../components/TeamPage/TeamPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { teamId: true },
    action: async ({ ssg, stringIds }) => {
        await Promise.all([
            ssg.group.getById.fetch(stringIds.teamId),
            ssg.group.getChildren.fetch(stringIds.teamId),
            await ssg.group.getMemberships.fetch({ groupId: stringIds.teamId }),
            ssg.group.getBreadcrumbs.fetch(stringIds.teamId),
        ]);

        return { teamId: stringIds.teamId };
    },
});

export default TeamPage;
