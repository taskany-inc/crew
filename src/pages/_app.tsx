import Head from 'next/head';
import type { AppProps } from 'next/app';

function TaskanyCrewApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default TaskanyCrewApp;
