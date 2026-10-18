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
    const description = `${tool.subtitle ?? tool.description} Free, fast and private — runs directly in your browser at ${SITE_URL}. No signup, no upload.`;

    return {
        title,
        description,
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

    return <ToolRunner tool={tool} />;
}