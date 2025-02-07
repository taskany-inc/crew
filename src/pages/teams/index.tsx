import { TeamsPage } from '../../components/TeamsPage/TeamsPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        // `superjson` cannot parse date those getting from `kysely`
        const { createdAt: _1, updatedAt: _2, ...mothership } = await ssg.group.getMothrshipGroup.fetch();
        await ssg.group.getGroupTree.fetch(mothership.id);

        return { mothership };
    },
});

export default TeamsPage;
