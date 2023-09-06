import { pages } from '../utils/pages';

export async function getServerSideProps() {
    return { redirect: { destination: pages.teams } };
}

export default function HomePage() {
    return null;
}
