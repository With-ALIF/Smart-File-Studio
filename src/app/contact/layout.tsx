import type { Metadata } from 'next';

const SITE_URL = 'https://alif-tools.mnr.bd';

export const metadata: Metadata = {
    title: { absolute: 'Connect — ALIF Tool' },
    description:
        'Contact ALIF Tool — get in touch about free online image, PDF and Markdown tools at alif-tools.mnr.bd.',
    alternates: { canonical: '/contact' },
    openGraph: {
        title: 'Connect — ALIF Tool',
        description:
            'Get in touch with ALIF Tool about free online image, PDF and Markdown tools.',
        url: `${SITE_URL}/contact`,
        type: 'website',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ALIF Tool' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Connect — ALIF Tool',
        description:
            'Get in touch with ALIF Tool about free online image, PDF and Markdown tools.',
        images: ['/og-image.png'],
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}