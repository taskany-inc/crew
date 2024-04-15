import { useSession } from 'next-auth/react';

import { SessionUser } from '../utils/auth';

export const useSessionUser = (): SessionUser => {
    const { data } = useSession();

    if (!data?.user) throw new Error('useSessionUser is only for authenticated pages!');

    return data.user;
};
