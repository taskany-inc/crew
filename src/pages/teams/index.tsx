import { TeamsPage } from '../../components/TeamsPage/TeamsPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        // `superjson` cannot parse date those getting from `kysely`
        const { createdAt: _1, updatedAt: _2, ...mothership } = await ssg.group.getMothrshipGroup.fetch();
        const response = await ssg.group.getGroupTree.fetch();

        if (response?.children) {
            await ssg.group.getGroupMetaByIds.fetch({
                ids: response.children.map(({ id }) => id),
                organizational: true,
            });
        }

        return { mothership };
    },
});

export default TeamsPage;
