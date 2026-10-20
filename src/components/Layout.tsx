'use client';

import Link from 'next/link';
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
    Github,
    Info,
    MessageSquare,
} from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="w-full px-3 sm:px-4 pt-8 pb-5 md:py-12 bg-slate-50">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-md border border-slate-100 p-5 sm:p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-10 text-center md:text-left">
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-center md:justify-start gap-2.5">
                            <img src="/favicon.svg" alt="ALIF TOOL logo" width="32" height="32" className="w-8 h-8" />
                            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
                                ALIF TOOL
                            </h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto md:mx-0">
                            ALIF TOOL is a free online file processing platform that helps you
                            work smarter with images, PDFs &amp; Markdown.
                        </p>
                    </div>

                    <div className="md:hidden border-t border-slate-100" aria-hidden="true" />

                    <div className="space-y-2.5">
                        <h4 className="text-xs md:text-sm font-semibold text-slate-800 uppercase tracking-wide">
                            Quick Links
                        </h4>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-1 md:gap-y-2 text-sm text-slate-600 max-w-xs mx-auto md:mx-0 text-left">
                            <li>
                                <Link href="/?tab=image" className="group inline-flex items-center gap-2 hover:text-blue-600 transition">
                                    <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                                    <span>Image Tools</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/?tab=pdf" className="group inline-flex items-center gap-2 hover:text-blue-600 transition">
                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                                    <span>PDF Tools</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/?tab=markdown" className="group inline-flex items-center gap-2 hover:text-blue-600 transition">
                                    <FileCode className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                                    <span>Markdown Tools</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="group inline-flex items-center gap-2 hover:text-blue-600 transition">
                                    <Info className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                                    <span>About</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="group inline-flex items-center gap-2 hover:text-blue-600 transition">
                                    <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                                    <span>Connect</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:hidden border-t border-slate-100" aria-hidden="true" />

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

                <div className="my-5 md:my-8 border-t border-slate-200" />

            </div>
        </footer>
    );
};

export const BackLink = () => (
    <Link href="/" className="flex items-center gap-1 text-sky-500 mb-4 w-fit">
        <ChevronLeft size={16} />
        Back
    </Link>
);

export const ToolHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="text-center space-y-2 mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm md:text-base text-slate-500">{subtitle}</p>
    </div>
);

export const CardShell = ({ children }: { children: React.ReactNode }) => (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-10">
        <div className="bg-white rounded-2xl p-6 shadow">{children}</div>
    </div>
);

export const HomeHeader = ({ icon }: { icon: React.ReactNode }) => (
    <div className="text-center">
        <h1 className="text-4xl font-bold">
            <span className="text-slate-700">ALIF</span>{' '}
            <span className="text-[#0BA6DF]">TOOL</span>
        </h1>
        <p className="text-sm text-sky-700">Secure, Fast &amp; Free File Processing Website</p>
    </div>
);

export const ToolCardIcon = ({
    icon,
    bg,
    color,
}: {
    icon: React.ReactNode;
    bg: string;
    color: string;
}) => (
    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {icon}
    </div>
);

export const CategoryIcon = {
    pdf: <FileText className="inline w-4 h-4 mr-1" />,
    image: <ImageIcon className="inline w-4 h-4 mr-1" />,
    markdown: <FileCode className="inline w-4 h-4 mr-1" />,
};