import { pages } from '../hooks/useRouter';
import { createGetServerSideProps } from '../utils/createGetSSRProps';

export const getServerSideProps = createGetServerSideProps({
    requireSession: true,
    action: ({ session }) => {
        return { redirect: { destination: pages.user(session.user.id) } };
    },
});

export default function HomePage() {
    return null;
}
