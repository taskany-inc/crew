import type { GetServerSidePropsContext } from 'next';

import { Paths } from '../utils/path';

export async function getServerSideProps(_context: GetServerSidePropsContext) {
    return { redirect: { destination: Paths.TEAMS } };
}

export default function HomePage() {
    return null;
}
