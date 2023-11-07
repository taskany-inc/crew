import { TeamsPage } from '../../components/TeamsPage/TeamsPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        const roots = await ssg.group.getRoots.fetch();
        await Promise.all(
            roots.map(async (group) => {
                await ssg.group.getChildren.fetch(group.id);
            }),
        );
    },
});

export default TeamsPage;
