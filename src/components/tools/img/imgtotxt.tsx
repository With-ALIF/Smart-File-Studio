'use client';
import React, { useState } from 'react';
import { Download, ScanText, Copy } from 'lucide-react';
import { readFileAsDataURL, downloadFile } from '../../../lib/utils';
import { translateTextTo } from '../../../lib/translate';
import { useToast } from '../../../components/Toast';

export const ImageToTxt: React.FC = () => {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState('');
    const [lang, setLang] = useState('eng');
    const [target, setTarget] = useState<'' | 'Bengali' | 'English'>('');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState('');

    const onFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setText('');
        setPreview(await readFileAsDataURL(f));
    };

    const run = async () => {
        if (!file) return;
        const Tesseract = (window as any).Tesseract;
        if (!Tesseract) {
            showToast('OCR engine not loaded yet. Check your connection.', 'error');
            return;
        }
        setProcessing(true);
        setProgress(0);
        try {
            const worker = await Tesseract.createWorker(lang, 1, {
                logger: (m: { status?: string; progress?: number }) => {
                    if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });
            const result = await worker.recognize(file);
            const raw = (result?.data?.text ?? '').trim();
            await worker.terminate();
            setText(raw);

            if (target && raw) {
                try {
                    const translated = await translateTextTo(raw, target === 'Bengali' ? 'bn' : 'en');
                    setText(translated);
                } catch (err) {
                    console.error(err);
                    showToast('Translation failed — showing original text.', 'error');
                    return;
                }
            }
            showToast('Done');
        } catch (e) {
            console.error(e);
            showToast('OCR failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview('');
        setText('');
        setProgress(0);
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard');
        } catch {
            showToast('Copy failed', 'error');
        }
    };

    const download = () => {
        if (!file) return;
        const name = file.name.replace(/\.[^.]+$/, '') || 'image';
        downloadFile(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${name}.txt`);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-orange-500 hover:bg-orange-50/30 transition-all bg-white">
                    <input type="file" accept="image/*" onChange={onFileLoad} className="hidden" id="ocr-upload" />
                    <label htmlFor="ocr-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <ScanText className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload image to extract text</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Supports JPG, PNG, WebP — text is read locally</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/2">
                            <img src={preview} alt="preview" className="w-full max-h-64 object-contain rounded-xl border border-slate-200 bg-slate-50" />
                        </div>
                        <div className="w-full md:w-1/2 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-500 mb-1 font-medium text-xs md:text-sm">Language</label>
                                    <select
                                        value={lang}
                                        onChange={(e) => setLang(e.target.value)}
                                        disabled={processing}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm md:text-base focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="eng">English</option>
                                        <option value="ben">Bengali</option>
                                        <option value="eng+ben">English + Bengali</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-500 mb-1 font-medium text-xs md:text-sm">Auto-translate</label>
                                    <select
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value as '' | 'Bengali' | 'English')}
                                        disabled={processing}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm md:text-base focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Off</option>
                                        <option value="Bengali">To Bengali</option>
                                        <option value="English">To English</option>
                                    </select>
                                </div>
                            </div>

                            {target && (
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Auto-translate uses AI — the recognised text (not the image) is sent to the translation service.
                                </p>
                            )}

                            <button
                                onClick={run}
                                disabled={processing}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-orange-200 transition-all text-sm md:text-base"
                            >
                                <ScanText className="w-5 h-5" />
                                {processing ? `Reading... ${progress}%` : 'Extract Text'}
                            </button>

                            {processing && (
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {text && (
                        <div className="space-y-2">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={8}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm md:text-base"
                            />
                            <div className="flex gap-2">
                                <button onClick={copy} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 text-sm">
                                    <Copy className="w-4 h-4" /> Copy
                                </button>
                                <button onClick={download} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 text-sm">
                                    <Download className="w-4 h-4" /> Download TXT
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={reset} className="w-full text-slate-500 text-sm hover:text-slate-700 underline">
                        Choose another image
                    </button>
                </div>
            )}
        </div>
    );
};
