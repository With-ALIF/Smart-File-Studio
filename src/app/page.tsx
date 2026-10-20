import Link from 'next/link';
import { FileText, Image as ImageIcon, FileCode } from 'lucide-react';
import { TOOLS, getIcon, sectionFor } from '../lib/tools';
import { ToolCategory } from '../types';
import { Footer, ToolCardIcon } from '../components/Layout';

const TABS: { id: string; label: string; category: ToolCategory; icon: React.ReactNode }[] = [
    { id: 'pdf', label: 'PDF', category: ToolCategory.PDF, icon: <FileText className="inline w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4" /> },
    { id: 'image', label: 'IMAGE', category: ToolCategory.IMAGE, icon: <ImageIcon className="inline w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4" /> },
    { id: 'markdown', label: 'MARKDOWN', category: ToolCategory.MARKDOWN, icon: <FileCode className="inline w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4" /> },
];

const CATEGORY_LABEL: Record<ToolCategory, string> = {
    [ToolCategory.PDF]: 'PDF',
    [ToolCategory.IMAGE]: 'Image',
    [ToolCategory.MARKDOWN]: 'Markdown',
};

const ToolCard = ({ tool }: { tool: (typeof TOOLS)[0] }) => (
    <Link href={`/${sectionFor(tool.category)}/${tool.id}`} className="block">
        <div className="bg-white rounded-2xl p-4 border hover:shadow transition text-center space-y-2">
            <ToolCardIcon icon={getIcon(tool.icon, 'w-6 h-6')} bg={tool.bg} color={tool.color} />
            <h3 className="text-sm font-bold">{tool.title}</h3>
            <p className="text-xs text-slate-500">{tool.description}</p>
        </div>
    </Link>
);

interface HomePageProps {
    searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
    const params = await searchParams;
    const tabParam = typeof params.tab === 'string' ? params.tab : undefined;
    const activeTab = TABS.some(t => t.id === tabParam) ? (tabParam as string) : 'pdf';
    const activeCategory = TABS.find(tab => tab.id === activeTab)!.category;
    const activeTools = TOOLS.filter(t => t.category === activeCategory);

    return (
        <>
            <main className="max-w-5xl mx-auto px-4 pt-20 pb-10 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        <span className="text-slate-700">ALIF</span>{' '}
                        <span className="text-[#0BA6DF]">TOOL</span>
                    </h1>
                    <p className="text-sm text-sky-700">
                        ALIF Tools — Secure, Fast &amp; Free File Processing Website
                    </p>
                </div>

                <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2">
                    {TABS.map(tab => (
                        <Link
                            key={tab.id}
                            href={`/?tab=${tab.id}`}
                            scroll={false}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition-colors sm:px-4 sm:text-sm ${activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-white'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </Link>
                    ))}
                </div>

                <h2 className="text-center text-base font-bold text-slate-700">
                    Free {CATEGORY_LABEL[activeCategory]} tools
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
