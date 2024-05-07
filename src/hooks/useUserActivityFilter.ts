import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUrlParams } from '@taskany/bricks';

export const useUserActivityFilterUrlParams = () => {
    const router = useRouter();
    const pushUrl = useCallback((url: string) => router.push(url), [router]);

    return useUrlParams(
        {
            from: 'string',
            to: 'string',
        },
        router.query,
        pushUrl,
    );
};
