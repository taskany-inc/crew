import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { ServerStyleSheet } from 'styled-components';

const ExternalScripts = process.env.INCLUDE_SCRIPTS_TO_MAIN_BUNDLE
    ? () => null
    : () => (
          // eslint-disable-next-line react/jsx-indent
          <>
              <Script strategy="beforeInteractive" src="https://unpkg.com/react@18/umd/react.production.min.js" />
              <Script
                  strategy="beforeInteractive"
                  src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
              />
          </>
      );

export default class TaskanyCrewDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <ExternalScripts />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }

    static async getInitialProps(ctx: DocumentContext) {
        const sheet = new ServerStyleSheet();
        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
                });

            const initialProps = await Document.getInitialProps(ctx);

            return {
                ...initialProps,
                styles: (
                    <>
                        {initialProps.styles}
                        {sheet.getStyleElement()}
                    </>
                ),
            };
        } finally {
            sheet.seal();
        }
    }
}
