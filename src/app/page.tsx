'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Image as ImageIcon, FileCode } from 'lucide-react';
import { TOOLS, getIcon, sectionFor } from '../lib/tools';
import { ToolCategory } from '../types';
import { Footer, ToolCardIcon } from '../components/Layout';

const TABS: { id: string; label: string; category: ToolCategory; icon: React.ReactNode }[] = [
    { id: 'pdf', label: 'PDF', category: ToolCategory.PDF, icon: <FileText className="inline w-4 h-4 mr-1" /> },
    { id: 'image', label: 'IMAGE', category: ToolCategory.IMAGE, icon: <ImageIcon className="inline w-4 h-4 mr-1" /> },
    { id: 'markdown', label: 'MARKDOWN', category: ToolCategory.MARKDOWN, icon: <FileCode className="inline w-4 h-4 mr-1" /> },
];

const ToolCard = ({ tool }: { tool: (typeof TOOLS)[0] }) => (
    <Link href={`/${sectionFor(tool.category)}/${tool.id}`} className="block">
        <div className="bg-white rounded-2xl p-4 border hover:shadow transition text-center space-y-2">
            <ToolCardIcon icon={getIcon(tool.icon, 'w-6 h-6')} bg={tool.bg} color={tool.color} />
            <h3 className="text-sm font-bold">{tool.title}</h3>
            <p className="text-xs text-slate-500">{tool.description}</p>
        </div>
    </Link>
);

const HomeContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const activeTab = TABS.some(t => t.id === tabParam) ? (tabParam as string) : 'pdf';

    const activeTools = TOOLS.filter(
        t => t.category === TABS.find(tab => tab.id === activeTab)!.category
    );

    return (
        <>
            <div className="max-w-5xl mx-auto px-4 pt-20 pb-10 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        <span className="text-slate-700">ALIF</span>{' '}
                        <span className="text-[#0BA6DF]">TOOL</span>
                    </h1>
                    <p className="text-sm text-sky-700">
                        Secure, Fast &amp; Free File Processing Website
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => router.push(`/?tab=${tab.id}`, { scroll: false })}
                            className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-white'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default function HomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-sky-50" />}>
            <HomeContent />
        </Suspense>
    );
}