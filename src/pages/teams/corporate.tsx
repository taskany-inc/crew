import { CorporateTeamsPage } from '../../components/CorporateTeamsPage/CorporateTeamsPage';
import { createGetServerSideProps } from '../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: async ({ ssg }) => {
        // `superjson` cannot parse date those getting from `kysely`
        const { createdAt: _1, updatedAt: _2, ...mothership } = await ssg.group.getMothrshipGroup.fetch();
        await ssg.organizationUnit.getAll.fetch();

        return { mothership };
    },
});

export default CorporateTeamsPage;
