import React from 'react';
import {
    BrowserRouter, Routes, Route, Navigate, Link,
    useParams, useSearchParams, useLocation
} from 'react-router-dom';

import About from './src/About';
import Connect from './src/Connect';
import { ToolType, ToolCategory } from './types';
import { TOOLS, getIcon } from './lib/tools';

import { ImageResizer } from './src/img/imgresizer';
import { ImageCropper } from './src/img/imgcropper';
import { ImageConverter } from './src/img/imgconverter';
import { ImageToPdf } from './src/img/imgtopdf';
import { ImageToTxt } from './src/img/imgtotxt';
import { SvgConverter } from './src/img/svgconverter';

import { PdfMerge } from './src/pdf/mergepdf';
import { PdfSplit } from './src/pdf/splitpdf';
import { PdfWatermark } from './src/pdf/watermarkpdf';
import { PdfToImage } from './src/pdf/pdfimg';
import { PdfToDocs } from './src/pdf/pdfdocs';
import { PdfToTxt } from './src/pdf/pdftxt';
import { PdfToMarkdown } from './src/pdf/pdfmarkdown';

import { MdToDocs } from './src/markdown/markdowntodocs';
import { MdToPdf } from './src/markdown/markdowntopdf';
import { MdToTxt } from './src/markdown/markdowntotxt';

import {
    ChevronLeft,
    Image as ImageIcon,
    FileText,
    FileCode,
    Globe,
    Facebook,
    Mail,
    Send,
    Instagram,
    Github
} from 'lucide-react';

import { ToastProvider } from './components/Toast';

const sectionFor = (category: ToolCategory): string =>
    category === ToolCategory.PDF ? 'pdf' : category === ToolCategory.MARKDOWN ? 'markdown' : 'image';

const Footer: React.FC = () => {
    return (
        <footer className="w-full px-3 sm:px-4 pt-8 pb-5 md:py-12 bg-slate-50">
  <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-md border border-slate-100 p-5 sm:p-6 md:p-10">
    
    {/* Top Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-10 text-center md:text-left">
      
      {/* Brand */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-center md:justify-start gap-2.5">
          <img src="/favicon.svg" alt="ALIF TOOL logo" width="32" height="32" className="w-8 h-8" />
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
            ALIF TOOL
          </h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto md:mx-0">
          ALIF TOOL is a free online file processing platform that helps you
          work smarter with images, PDFs & Markdown.
        </p>
      </div>

      <div className="md:hidden border-t border-slate-100" aria-hidden="true" />

      {/* Quick Links */}
      <div className="space-y-2.5">
        <h4 className="text-xs md:text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Quick Links
        </h4>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-1 md:gap-y-2 text-sm text-slate-600 max-w-xs mx-auto md:mx-0 text-left">
          <li>
            <a href="/?tab=image" className="hover:text-blue-600 transition">
              Image Tools
            </a>
          </li>
          <li>
            <a href="/?tab=pdf" className="hover:text-blue-600 transition">
              PDF Tools
            </a>
          </li>
          <li>
            <a href="/?tab=markdown" className="hover:text-blue-600 transition">
              Markdown Tools
            </a>
          </li>
          <li>
            <Link to="/about" className="hover:text-blue-600 transition">
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-blue-600 transition">
              Connect
            </Link>
          </li>
        </ul>
      </div>

      <div className="md:hidden border-t border-slate-100" aria-hidden="true" />

      {/* Social */}
      <div className="space-y-2.5">
        <h4 className="text-xs md:text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Connect With Me
        </h4>
        <div className="flex items-center justify-center md:justify-start gap-0.5 min-[390px]:gap-2 md:flex-wrap md:gap-2.5">
          <a href="https://alif.mnr.bd" target="_blank" rel="noopener noreferrer" aria-label="Website"
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2C4B9B] hover:text-blue-600 hover:border-blue-300 hover:-translate-y-0.5 transition-all">
            <Globe size={18} />
          </a>
          <a href="https://www.facebook.com/withALIF" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2C4B9B] hover:text-blue-600 hover:border-blue-300 hover:-translate-y-0.5 transition-all">
            <Facebook size={18} />
          </a>
          <a href="mailto:alifbrur16@gmail.com" aria-label="Email"
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2C4B9B] hover:text-blue-600 hover:border-blue-300 hover:-translate-y-0.5 transition-all">
            <Mail size={18} />
          </a>
          <a href="https://t.me/ALIF1230" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2C4B9B] hover:text-sky-500 hover:border-sky-300 hover:-translate-y-0.5 transition-all">
            <Send size={18} />
          </a>
          <a href="https://instagram.com/withalif_2025" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2C4B9B] hover:text-pink-600 hover:border-pink-300 hover:-translate-y-0.5 transition-all">
            <Instagram size={18} />
          </a>
          <a href="https://github.com/With-ALIF" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2C4B9B] hover:text-gray-900 hover:border-gray-300 hover:-translate-y-0.5 transition-all">
            <Github size={18} />
          </a>
        </div>
      </div>

    </div>

    {/* Divider */}
    <div className="my-5 md:my-8 border-t border-slate-200" />

    {/* Bottom */}
    <div className="text-center text-xs text-slate-500 leading-relaxed">
      <p>© {new Date().getFullYear()} ALIF TOOL</p>
    </div>
  </div>
</footer>

    );
};

const ToolCard: React.FC<{ tool: typeof TOOLS[0] }> = ({ tool }) => (
    <Link to={`/${sectionFor(tool.category)}/${tool.id}`} className="block">
        <div className="bg-white rounded-2xl p-4 border hover:shadow transition text-center space-y-2">
            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                {getIcon(tool.icon, 'w-6 h-6')}
            </div>
            <h3 className="text-sm font-bold">{tool.title}</h3>
            <p className="text-xs text-slate-500">{tool.description}</p>
        </div>
    </Link>
);

const TABS: { id: string; label: string; category: ToolCategory; icon: React.ReactNode }[] = [
    { id: 'pdf', label: 'PDF', category: ToolCategory.PDF, icon: <FileText className="inline w-4 h-4 mr-1" /> },
    { id: 'image', label: 'IMAGE', category: ToolCategory.IMAGE, icon: <ImageIcon className="inline w-4 h-4 mr-1" /> },
    { id: 'markdown', label: 'MARKDOWN', category: ToolCategory.MARKDOWN, icon: <FileCode className="inline w-4 h-4 mr-1" /> },
];

const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const activeTab = TABS.some(t => t.id === tabParam) ? (tabParam as string) : 'pdf';

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab });
    };

    const activeTools = TOOLS.filter(
        t => t.category === TABS.find(tab => tab.id === activeTab)!.category
    );

    return (
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-10 space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold">
                    <span className="text-slate-700">ALIF</span>{' '}
                    <span className="text-[#0BA6DF]">TOOL</span>
                </h1>
                <p className="text-sm text-sky-700">
                    Secure, Fast & Free File Processing Website
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
    );
};

const ToolRunner = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const section = pathname.split('/')[1];
    const tool = TOOLS.find(t => t.id === id);

    if (!tool) return <Navigate to="/" />;

    const expectedSection = sectionFor(tool.category);
    if (section !== expectedSection) return <Navigate to={`/${expectedSection}/${tool.id}`} replace />;

    const renderTool = () => {
        switch (tool.id) {
            case ToolType.IMG_RESIZE: return <ImageResizer />;
            case ToolType.IMG_CROP: return <ImageCropper />;
            case ToolType.IMG_CONVERT: return <ImageConverter />;
            case ToolType.IMG_TO_PDF: return <ImageToPdf />;
            case ToolType.IMG_TO_TXT: return <ImageToTxt />;
            case ToolType.SVG_CONVERT: return <SvgConverter />;
            case ToolType.PDF_MERGE: return <PdfMerge />;
            case ToolType.PDF_SPLIT: return <PdfSplit />;
            case ToolType.PDF_WATERMARK: return <PdfWatermark />;
            case ToolType.PDF_TO_IMG: return <PdfToImage />;
            case ToolType.PDF_TO_DOCS: return <PdfToDocs />;
            case ToolType.PDF_TO_TXT: return <PdfToTxt />;
            case ToolType.PDF_TO_MD: return <PdfToMarkdown />;
            case ToolType.MD_TO_DOCS: return <MdToDocs />;
            case ToolType.MD_TO_PDF: return <MdToPdf />;
            case ToolType.MD_TO_TXT: return <MdToTxt />;
            default: return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-10">
            <Link to="/" className="flex items-center gap-1 text-sky-500 mb-4">
                <ChevronLeft size={16} />
                Back
            </Link>

            <div className="bg-white rounded-2xl p-6 shadow">
                <div className="text-center space-y-2 mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{tool.title}</h1>
                    <p className="text-sm md:text-base text-slate-500">{tool.subtitle ?? tool.description}</p>
                </div>
                {renderTool()}
            </div>
        </div>
    );
};

const SITE_URL = 'https://alif-tools.mnr.bd';
const SITE_NAME = 'ALIF Tool';

/**
 * The page is a SPA, so every URL ships the same <head>. Updating the title,
 * description and canonical per route keeps each tool page distinct for search
 * engines and link previews.
 */
const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};

const TitleManager = () => {
    const { pathname } = useLocation();

    React.useEffect(() => {
        const isToolPage = /^\/(image|pdf|markdown)\/[^/]+/.test(pathname);

        if (isToolPage) {
            const tool = TOOLS.find(t => t.id === pathname.split('/')[2]);
            const title = tool
                ? `${tool.title} — Free Online Tool | ${SITE_NAME}`
                : `${SITE_NAME} — Free Online Tools`;
            const description = tool
                ? `${tool.subtitle ?? tool.description} Free, fast and private — runs directly in your browser at ${SITE_URL}. No signup, no upload.`
                : 'Free online image, PDF and Markdown tools.';

            document.title = title;
            setMeta('meta[name="description"]', 'name', 'description', description);
            setMeta('meta[property="og:title"]', 'property', 'og:title', title);
            setMeta('meta[property="og:description"]', 'property', 'og:description', description);
            setMeta('meta[property="og:url"]', 'property', 'og:url', `${SITE_URL}${pathname}`);
            setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
            setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

            let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.rel = 'canonical';
                document.head.appendChild(canonical);
            }
            canonical.href = `${SITE_URL}${pathname}`;
            return;
        }

        const staticPages: Record<string, [string, string]> = {
            '/about': [
                `About — ${SITE_NAME}`,
                `About ${SITE_NAME} (${SITE_URL.replace('https://', '')}) — a free, privacy-first online platform for image, PDF and Markdown tools.`
            ],
            '/contact': [
                `Contact — ${SITE_NAME}`,
                `Contact ${SITE_NAME} — get in touch about free online image, PDF and Markdown tools at ${SITE_URL}.`
            ],
        };

        const entry = staticPages[pathname];
        const title = entry ? entry[0] : `${SITE_NAME} — Free Online Image, PDF & Markdown Tools`;
        const description = entry
            ? entry[1]
            : `${SITE_NAME} is a free online toolkit to resize, crop and convert images, merge, split and watermark PDFs, and convert Markdown to PDF or DOC. Fast, private, 100% free.`;

        document.title = title;
        setMeta('meta[name="description"]', 'name', 'description', description);
        setMeta('meta[property="og:title"]', 'property', 'og:title', title);
        setMeta('meta[property="og:description"]', 'property', 'og:description', description);
        setMeta('meta[property="og:url"]', 'property', 'og:url', `${SITE_URL}${pathname === '/' ? '/' : pathname}`);
        setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
        setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

        let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
    }, [pathname]);

    return null;
};

export default function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <TitleManager />
                <div className="min-h-screen flex flex-col bg-sky-50">
                    <div className="flex-grow">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/image/:id" element={<ToolRunner />} />
                            <Route path="/pdf/:id" element={<ToolRunner />} />
                            <Route path="/markdown/:id" element={<ToolRunner />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/contact" element={<Connect />} />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </BrowserRouter>
        </ToastProvider>
    );
}
