import { Paths } from '../utils/path';

export async function getServerSideProps() {
    return { redirect: { destination: Paths.TEAMS } };
}

export default function HomePage() {
    return null;
}
