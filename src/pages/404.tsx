import NextErrorComponent from 'next/error';

export default function NotFound() {
    return <NextErrorComponent statusCode={404} title="Not found" />;
}
