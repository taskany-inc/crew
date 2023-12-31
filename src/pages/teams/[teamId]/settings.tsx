import { TeamSettingsPage } from '../../../components/TeamSettingsPage/TeamSettingsPage';
import { createGetServerSideProps } from '../../../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { teamId: true },
    action: ({ stringIds }) => {
        return { teamId: stringIds.teamId };
    },
});

export default TeamSettingsPage;
