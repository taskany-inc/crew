import { FC } from 'react';

import { FromDecreeRequestPage } from '../../../../../components/FromDecreeRequestPage/FromDecreeRequestPage';
import { pages } from '../../../../../hooks/useRouter';
import { createGetServerSideProps } from '../../../../../utils/createGetSSRProps';
import { trpc } from '../../../../../trpc/trpcClient';

const redirect = { redirect: { destination: pages.home } };

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    stringIds: { userId: true },
    action: async ({ stringIds, ssg, session }) => {
        if (!session.user.role?.editUserActiveState) {
            return redirect;
        }
        try {
            const user = await ssg.user.getById.fetch(stringIds.userId);
            await ssg.device.getUserDevices.fetch(stringIds.userId);

            const active = user.supplementalPositions.find((p) => p.status === 'ACTIVE');

            if (active) {
                return redirect;
            }

            return { userId: stringIds.userId };
        } catch (e) {
            return redirect;
        }
    },
});

interface DecreeRequestPageProps {
    userId: string;
}

export const DecreeRequestPage: FC<DecreeRequestPageProps> = ({ userId }) => {
    const { data: user } = trpc.user.getById.useQuery(userId, {
        enabled: Boolean(userId),
    });

    if (!user) {
        return null;
    }

    return <FromDecreeRequestPage user={user} />;
};

export default DecreeRequestPage;
