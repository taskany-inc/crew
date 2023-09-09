import { pages } from '../hooks/useRouter';

export async function getServerSideProps() {
    return { redirect: { destination: pages.teams } };
}

export default function HomePage() {
    return null;
}
