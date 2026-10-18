'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Construction } from 'lucide-react';
import { readFileAsDataURL } from '../../../lib/utils';
import { describeImage } from '../../../services/gemini';

const LatexRenderer: React.FC<{ text: string }> = ({ text }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [katexLoaded, setKatexLoaded] = useState(false);

    useEffect(() => {
        const checkKatex = () => {
            if ((window as any).katex) {
                setKatexLoaded(true);
            }
        };

        checkKatex();
        const interval = setInterval(checkKatex, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !katexLoaded) return;

        const renderMath = () => {
             const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
             containerRef.current!.innerHTML = '';
             parts.forEach(part => {
                 if (part.startsWith('$$') && part.endsWith('$$')) {
                     const math = part.slice(2, -2);
                     const el = document.createElement('div');
                     el.className = "my-3 overflow-x-auto text-center";
                     try { (window as any).katex.render(math, el, { displayMode: true, throwOnError: false, output: 'html' }); } 
                     catch(e) { el.textContent = math; }
                     containerRef.current!.appendChild(el);
                 } else if (part.startsWith('$$') && part.endsWith('$$')) { // Corrected from original code logic duplication check
                     const math = part.slice(1, -1);
                     const el = document.createElement('span');
                     try { (window as any).katex.render(math, el, { displayMode: false, throwOnError: false, output: 'html' }); } 
                     catch(e) { el.textContent = math; }
                     containerRef.current!.appendChild(el);
                 } else if (part.startsWith('$') && part.endsWith('$')) {
                     const math = part.slice(1, -1);
                     const el = document.createElement('span');
                     try { (window as any).katex.render(math, el, { displayMode: false, throwOnError: false, output: 'html' }); } 
                     catch(e) { el.textContent = math; }
                     containerRef.current!.appendChild(el);
                 } else {
                     const span = document.createElement('span');
                     span.innerHTML = part.replace(/\n/g, '<br/>');
                     containerRef.current!.appendChild(span);
                 }
             });
        };

        renderMath();
    }, [text, katexLoaded]);

    if (!katexLoaded) return <div className="whitespace-pre-line text-slate-700 text-sm">{text.replace(/\$\$/g, '').replace(/\$/g, '')}</div>;

    return <div ref={containerRef} className="text-slate-700 leading-relaxed space-y-2 font-medium text-sm md:text-base" />;
};

export const ImageDescriber: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [question, setQuestion] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if(!image) return;
        setLoading(true);
        try {
            const base64 = image.split(',')[1];
            const result = await describeImage(base64, fileType, question);
            const cleanResult = result.replace(/\*/g, '');
            setDescription(cleanResult);
        } catch(e) {
            setDescription("Failed to analyze image.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {!image ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-violet-500 hover:bg-violet-50/30 transition-all bg-white relative overflow-hidden">
                     <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-sm">
                        <Construction className="w-3 h-3" />
                        <span>Under Construction</span>
                    </div>

                     <input type="file" accept="image/*" onChange={async (e) => {
                        if(e.target.files?.[0]) {
                            setFileType(e.target.files[0].type);
                            setImage(await readFileAsDataURL(e.target.files[0]));
                            setDescription('');
                            setQuestion('');
                        }
                    }} className="hidden" id="ai-upload" />
                    <label htmlFor="ai-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                             <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-violet-600" />
                        </div>
                        <span className="text-slate-600 font-medium text-sm md:text-base">Upload Image (Photo)</span>
                    </label>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                     <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center relative">
                         <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-sm z-10">
                            <Construction className="w-3 h-3" />
                            <span>Beta</span>
                         </div>
                        <img src={image} className="max-h-64 md:max-h-80 mx-auto rounded-lg object-contain" alt="Target" />
                     </div>
                     <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col border border-slate-200 shadow-sm">
                        <h3 className="text-base md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="text-violet-500 w-5 h-5" />
                            AI Analyst & Solver (Bengali)
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-xs md:text-sm text-slate-500 mb-2 font-medium">Ask a question (Optional)</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="প্রশ্ন জিজ্ঞাসা করুন..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all text-sm md:text-base"
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
                                />
                                <Send className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50 rounded-xl p-4 overflow-y-auto max-h-48 md:max-h-60 mb-4 border border-slate-200">
                            {loading ? (
                                <div className="flex items-center justify-center h-full gap-2">
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" />
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce delay-150" />
                                </div>
                            ) : (
                                description ? (
                                    <LatexRenderer text={description} />
                                ) : (
                                    <div className="text-center text-slate-400 text-xs md:text-sm py-8">
                                        <p>Click 'Analyze' to start.</p>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={handleAnalyze} 
                                disabled={loading}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg text-sm md:text-base ${loading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200'}`}
                            >
                                {loading ? 'Thinking...' : 'Analyze'}
                            </button>
                             <button 
                                onClick={() => { setImage(null); setDescription(''); setQuestion(''); }}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors text-sm md:text-base"
                            >
                                Reset
                            </button>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};
