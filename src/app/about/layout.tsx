import type { Metadata } from 'next';

const SITE_URL = 'https://alif-tools.mnr.bd';

export const metadata: Metadata = {
    title: { absolute: 'About ALIF Tool (ALIF Tools, MNR Tool, Tools BD)' },
    description:
        'About ALIF Tool (ALIF Tools, MNR Tool, Tools BD) — a free, privacy-first platform for image, PDF and Markdown tools. Everything runs in your browser.',
    alternates: { canonical: '/about' },
    openGraph: {
        title: 'About ALIF Tool (ALIF Tools, MNR Tool, Tools BD)',
        description:
            'About ALIF Tool — a free, privacy-first online platform for image, PDF and Markdown tools, also known as ALIF Tools, MNR Tool and Tools BD.',
        url: `${SITE_URL}/about`,
        type: 'website',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ALIF Tool' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About ALIF Tool (ALIF Tools, MNR Tool, Tools BD)',
        description:
            'About ALIF Tool — a free, privacy-first online platform for image, PDF and Markdown tools, also known as ALIF Tools, MNR Tool and Tools BD.',
        images: ['/og-image.png'],
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}