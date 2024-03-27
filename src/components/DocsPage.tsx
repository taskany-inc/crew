import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useTheme } from 'next-themes';
import 'swagger-ui-react/swagger-ui.css';

interface DocsPageProps {
    openApiDoc: string;
}

const SwaggerUi = dynamic(() => import('swagger-ui-react'));

export const DocsPage = ({ openApiDoc }: DocsPageProps) => {
    const { setTheme } = useTheme();

    useEffect(() => {
        setTheme('light');
    }, [setTheme]);

    return (
        <>
            <Head>
                <title>Crew OpenAPI</title>
            </Head>
            <SwaggerUi spec={openApiDoc} />
        </>
    );
};
