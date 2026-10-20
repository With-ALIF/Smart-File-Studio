import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { TOOLS, sectionFor } from '../../../lib/tools';
import { ToolRunner } from '../../../components/ToolRunner';

const SITE_URL = 'https://alif-tools.mnr.bd';

interface RouteProps {
    params: Promise<{ category: string; id: string }>;
}

export function generateStaticParams() {
    return TOOLS.map(tool => ({
        category: sectionFor(tool.category),
        id: tool.id,
    }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { category, id } = await params;
    const tool = TOOLS.find(t => t.id === id);

    if (!tool) {
        return { title: 'Tool not found' };
    }

    const expected = sectionFor(tool.category);
    const title = `${tool.title} — Free Online Tool`;
    const description = `${tool.subtitle ?? tool.description} Free, fast and private — runs in your browser on ALIF Tool. No signup, no upload.`;

    return {
        title,
        description,
        keywords: [
            tool.title,
            `${tool.title} online`,
            `free ${tool.title.toLowerCase()}`,
            `${tool.title} Bangladesh`,
            'ALIF Tool', 'ALIF Tools', 'MNR Tool', 'MNR Tools', 'Tools BD',
            'free online tools', 'browser tools',
        ],
        alternates: { canonical: `/${expected}/${tool.id}` },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${expected}/${tool.id}`,
            type: 'website',
            images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${tool.title} — ALIF Tool` }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/og-image.png'],
        },
    };
}

export default async function ToolPage({ params }: RouteProps) {
    const { category, id } = await params;
    const tool = TOOLS.find(t => t.id === id);

    if (!tool) notFound();


    const expected = sectionFor(tool.category);
    if (category !== expected) {
        redirect(`/${expected}/${tool.id}`);
    }

    const toolUrl = `${SITE_URL}/${expected}/${tool.id}`;
    const appJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `${tool.title} — ALIF Tool`,
        alternateName: ['ALIF Tool', 'ALIF Tools', 'MNR Tool', 'MNR Tools', 'Tools BD'],
        url: toolUrl,
        description: `${tool.subtitle ?? tool.description} Free online ${tool.title.toLowerCase()} by ALIF Tool.`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        isPartOf: { '@type': 'WebSite', name: 'ALIF Tool', url: `${SITE_URL}/` },
        publisher: { '@type': 'Organization', name: 'ALIF Tool', url: `${SITE_URL}/` },
    };

    return (
        <>
            <ToolRunner tool={tool} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
            />
        </>
    );
}