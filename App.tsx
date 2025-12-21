import React from 'react';
import {
    HashRouter,
    Routes,
    Route,
    Navigate,
    Link,
    useParams,
    useSearchParams
} from 'react-router-dom';

import About from './src/About';
import { ToolType, ToolCategory } from './types';
import { TOOLS, getIcon } from './lib/tools';

import {
    ImageResizer,
    ImageCropper,
    ImageConverter,
    ImageToPdf
} from './components/Tools/ImageTools';

import {
    PdfMerge,
    PdfSplit,
    PdfWatermark,
    PdfInvert,
    PdfToImage
} from './components/Tools/PdfTools';

import {
    ChevronLeft,
    Image as ImageIcon,
    FileText,
    Facebook,
    Mail,
    Send,
    Instagram,
    Github
} from 'lucide-react';

import { ToastProvider } from './components/Toast';

const Footer: React.FC = () => {
    return (
        <footer className="w-full px-4 py-12 bg-slate-50">
  <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-md border border-slate-100 p-10">
    
    {/* Top Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
      
      {/* Brand */}
      <div className="space-y-3">
        <h3 className="text-2xl font-extrabold text-slate-800">
          ALIF TOOL
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          ALIF TOOL is a free online file processing platform that helps you
          work smarter with images & PDFs.
        </p>
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800 uppercase">
          Quick Links
        </h4>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>
            <a href="https://alif-tool.netlify.app/#/?tab=image" className="hover:text-blue-600 transition">
              Image Tools
            </a>
          </li>
          <li>
            <a href="https://alif-tool.netlify.app/#/?tab=pdf" className="hover:text-blue-600 transition">
              PDF Tools
            </a>
          </li>
          <li>
            <Link to="/about" className="hover:text-blue-600 transition">
              About
            </Link>
          </li>
        </ul>
      </div>

      {/* Social */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800 uppercase">
          Connect With Me
        </h4>
        <div className="flex justify-center md:justify-start gap-5">
          <a href="https://www.facebook.com/withALIF" target="_blank" rel="noopener noreferrer"
            className="text-[#2C4B9B] hover:text-blue-600 hover:scale-110 transition">
            <Facebook size={20} />
          </a>
          <a href="mailto:alifbrur16@gmail.com"
            className="text-[#2C4B9B] hover:text-blue-600 hover:scale-110 transition">
            <Mail size={20} />
          </a>
          <a href="https://t.me/ALIF1230" target="_blank" rel="noopener noreferrer"
            className="text-[#2C4B9B] hover:text-sky-500 hover:scale-110 transition">
            <Send size={20} />
          </a>
          <a href="https://instagram.com/withalif_2025" target="_blank" rel="noopener noreferrer"
            className="text-[#2C4B9B] hover:text-pink-600 hover:scale-110 transition">
            <Instagram size={20} />
          </a>
          <a href="https://github.com/With-ALIF" target="_blank" rel="noopener noreferrer"
            className="text-[#2C4B9B] hover:text-gray-900 hover:scale-110 transition">
            <Github size={20} />
          </a>
        </div>
      </div>

    </div>

    {/* Divider */}
    <div className="my-8 border-t border-slate-200" />

    {/* Bottom */}
    <p className="text-center text-xs text-slate-500">
      © {new Date().getFullYear()} ALIF TOOL • Built with ❤️ by ALIF
    </p>
  </div>
</footer>

    );
};

const ToolCard: React.FC<{ tool: typeof TOOLS[0] }> = ({ tool }) => (
    <Link to={`/tool/${tool.id}`} className="block">
        <div className="bg-white rounded-2xl p-4 border hover:shadow transition text-center space-y-2">
            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                {getIcon(tool.icon, 'w-6 h-6')}
            </div>
            <h3 className="text-sm font-bold">{tool.title}</h3>
            <p className="text-xs text-slate-500">{tool.description}</p>
        </div>
    </Link>
);

const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'image' ? 'image' : 'pdf';

    const setActiveTab = (tab: 'image' | 'pdf') => {
        setSearchParams({ tab });
    };

    const activeTools = TOOLS.filter(t =>
        activeTab === 'image'
            ? t.category === ToolCategory.IMAGE
            : t.category === ToolCategory.PDF
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

            <div className="flex justify-center gap-2">
                <button onClick={() => setActiveTab('pdf')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'pdf' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>
                    <FileText className="inline w-4 h-4 mr-1" />
                    PDF
                </button>

                <button onClick={() => setActiveTab('image')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'image' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>
                    <ImageIcon className="inline w-4 h-4 mr-1" />
                    IMAGE
                </button>
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
    const tool = TOOLS.find(t => t.id === id);

    if (!tool) return <Navigate to="/" />;

    const renderTool = () => {
        switch (tool.id) {
            case ToolType.IMG_RESIZE: return <ImageResizer />;
            case ToolType.IMG_CROP: return <ImageCropper />;
            case ToolType.IMG_CONVERT: return <ImageConverter />;
            case ToolType.IMG_TO_PDF: return <ImageToPdf />;
            case ToolType.PDF_MERGE: return <PdfMerge />;
            case ToolType.PDF_SPLIT: return <PdfSplit />;
            case ToolType.PDF_WATERMARK: return <PdfWatermark />;
            case ToolType.PDF_TO_IMG: return <PdfToImage />;
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
                {renderTool()}
            </div>
        </div>
    );
};

export default function App() {
    return (
        <ToastProvider>
            <HashRouter>
                <div className="min-h-screen flex flex-col bg-sky-50">
                    <div className="flex-grow">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/tool/:id" element={<ToolRunner />} />
                            <Route path="/about" element={<About />} />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </HashRouter>
        </ToastProvider>
    );
}
