/* eslint-disable global-require */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { withSentryConfig } = require('@sentry/nextjs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: {
            ssr: true,
        },
    },
    reactStrictMode: process.env.STRICT_MODE,
    swcMinify: true,
    output: 'standalone',
    i18n: {
        locales: ['en', 'ru'],
        defaultLocale: process.env.DEFAULT_LOCALE || 'en',
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    sentry: {
        disableServerWebpackPlugin: process.env.SENTRY_DISABLED === '1',
        disableClientWebpackPlugin: process.env.SENTRY_DISABLED === '1',
        widenClientFileUpload: true,
    },
    webpack(config, { dev, isServer }) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });

        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };

        if (dev && !isServer && process.env.NEXT_PUBLIC_WDYR === '1') {
            const originalEntry = config.entry;
            config.entry = async () => {
                const wdrPath = path.resolve(__dirname, './src/utils/wdyr.ts');
                const entries = await originalEntry();

                if (entries['main.js'] && !entries['main.js'].includes(wdrPath)) {
                    entries['main.js'].push(wdrPath);
                }

                return entries;
            };
        }

        if (!dev && !isServer && !process.env.INCLUDE_SCRIPTS_TO_MAIN_BUNDLE) {
            config.externals = {
                React: 'react',
                ReactDOM: 'react-dom',
            };
        }

        return config;
    },
};

module.exports =
    process.env.NODE_ENV === 'development' && process.env.ANALYZE === 'true'
        ? require('@next/bundle-analyzer')({})(nextConfig)
        : withSentryConfig(nextConfig, {
              errorHandler: (err, invokeErr, compilation) => {
                  compilation.warnings.push(`@sentry/nextjs: ${err.message}`);
              },
              silent: true,
              hideSourcemaps: true,
              ignore: ['node_modules'],
          });
