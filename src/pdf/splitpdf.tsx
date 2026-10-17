import React, { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Download, SplitSquareHorizontal, FileText, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { readFileAsArrayBuffer, downloadFile, toEnglishDigits } from '../../lib/utils';
import { useToast } from '../../components/Toast';
import { SuccessModal } from '../../components/SuccessModal';
import './pdfjsGlobal';

/**
 * Turn a range string like "1, 3, 5-10" into a sorted, de-duplicated list of
 * 0-based page indices that actually exist in the document.
 */
const parseRange = (range: string, pageCount: number): number[] => {
    const indices = new Set<number>();
    range
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n, 10));
                if (!isNaN(start) && !isNaN(end)) {
                    const from = Math.min(start, end);
                    const to = Math.max(start, end);
                    for (let i = from; i <= to; i++) indices.add(i - 1);
                }
            } else {
                const num = parseInt(part, 10);
                if (!isNaN(num)) indices.add(num - 1);
            }
        });
    return Array.from(indices)
        .filter(i => i >= 0 && i < pageCount)
        .sort((a, b) => a - b);
};

export const PdfSplit: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [range, setRange] = useState('1');
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    const [thumbs, setThumbs] = useState<{ page: number; url: string }[]>([]);
    const [previewing, setPreviewing] = useState(false);

    const [zoomIndex, setZoomIndex] = useState<number | null>(null);
    const [zoomUrl, setZoomUrl] = useState('');
    const [zoomLoading, setZoomLoading] = useState(false);

    const selected = file ? parseRange(range, pageCount) : [];
    const selectedKey = selected.join(',');

    const onFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setThumbs([]);
            setZoomIndex(null);
            try {
                const buffer = await readFileAsArrayBuffer(f);
                const pdf = await PDFDocument.load(buffer);
                setPageCount(pdf.getPageCount());
            } catch (error) {
                showToast("Invalid PDF file", "error");
                setFile(null);
            }
        }
    };

    // Render small page previews for whatever range is currently typed.
    useEffect(() => {
        if (!file || selected.length === 0 || !window.pdfjsLib) {
            setThumbs([]);
            setPreviewing(false);
            return;
        }

        let cancelled = false;
        setPreviewing(true);

        const run = async () => {
            try {
                const buffer = await readFileAsArrayBuffer(file);
                const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
                const next: { page: number; url: string }[] = [];

                for (const index of selected) {
                    if (cancelled) break;
                    const page = await pdf.getPage(index + 1);
                    const viewport = page.getViewport({ scale: 0.5 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext('2d');
                    await page.render({ canvasContext: context as CanvasRenderingContext2D, viewport }).promise;

                    next.push({ page: index + 1, url: canvas.toDataURL('image/jpeg', 0.7) });
                    page.cleanup();
                }

                if (!cancelled) setThumbs(next);
            } catch (e) {
                if (!cancelled) setThumbs([]);
            } finally {
                if (!cancelled) setPreviewing(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, range, pageCount]);

    // Render the clicked page again at a much higher resolution for zooming.
    useEffect(() => {
        if (!file || zoomIndex === null || !window.pdfjsLib) return;

        const index = selected[zoomIndex];
        if (index === undefined) return;

        let cancelled = false;
        setZoomLoading(true);
        setZoomUrl('');

        const run = async () => {
            try {
                const buffer = await readFileAsArrayBuffer(file);
                const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
                if (cancelled) return;

                const page = await pdf.getPage(index + 1);
                const natural = page.getViewport({ scale: 1 });
                const available = Math.min(window.innerWidth - 64, 900);
                const scale = Math.min(3, Math.max(1.2, available / natural.width));
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context as CanvasRenderingContext2D, viewport }).promise;

                if (cancelled) return;
                setZoomUrl(canvas.toDataURL('image/jpeg', 0.92));
                page.cleanup();
            } catch (e) {
                if (!cancelled) setZoomUrl('');
            } finally {
                if (!cancelled) setZoomLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, zoomIndex, selectedKey]);

    // Keyboard navigation inside the zoom viewer.
    useEffect(() => {
        if (zoomIndex === null) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setZoomIndex(null);
            else if (selected.length > 1 && e.key === 'ArrowRight') {
                setZoomIndex(i => (i === null ? i : (i + 1) % selected.length));
            } else if (selected.length > 1 && e.key === 'ArrowLeft') {
                setZoomIndex(i => (i === null ? i : (i - 1 + selected.length) % selected.length));
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [zoomIndex, selected.length]);

    const handleSplit = async () => {
        if (!file) return;
        try {
            const buffer = await readFileAsArrayBuffer(file);
            const srcPdf = await PDFDocument.load(buffer);
            const newPdf = await PDFDocument.create();

            const validIndices = parseRange(range, pageCount);

            if (validIndices.length === 0) {
                showToast("No valid pages selected.", "error");
                return;
            }

            const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
            copiedPages.forEach(p => newPdf.addPage(p));
            
            const pdfBytes = await newPdf.save();
            downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), `split_${file.name}`);
            setSuccess(true);
        } catch (e) {
            console.error(e);
            showToast("Error processing PDF", "error");
        }
    };

    const zoomPage = zoomIndex === null ? undefined : selected[zoomIndex];

    return (
        <div className="space-y-4 md:space-y-6">
            <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => { setFile(null); setRange('1'); setThumbs([]); setPageCount(0); setZoomIndex(null); }} />
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-orange-500 hover:bg-orange-50/30 transition-all bg-white">
                    <input type="file" accept="application/pdf" onChange={onFileLoad} className="hidden" id="split-upload" />
                    <label htmlFor="split-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <SplitSquareHorizontal className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload PDF to Split</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Extract specific pages</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <div className="mb-4 md:mb-6">
                         <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-orange-600 border border-orange-100">
                            <FileText className="w-6 h-6" />
                        </div>
                         <h3 className="text-base md:text-lg font-bold text-slate-800 break-all px-2">{file.name}</h3>
                         <p className="text-slate-500 text-xs md:text-sm">{pageCount} pages</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-4">
                        <label className="block text-left text-xs md:text-sm text-slate-500 font-medium">Pages to Extract</label>
                        <input 
                            type="text" 
                            value={range} 
                            onChange={(e) => setRange(toEnglishDigits(e.target.value))} 
                            placeholder="e.g. 1, 3, 5-10"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 md:p-4 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm md:text-base"
                        />
                        <p className="text-xs text-slate-400 text-left">Enter page numbers (e.g. 1, 2) or ranges (e.g. 1-5).</p>

                        {selected.length > 0 && (
                            <div className="text-left">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-slate-600">
                                        Preview · {selected.length} page{selected.length === 1 ? '' : 's'} selected
                                    </p>
                                    {previewing ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Rendering…
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-slate-400">Tap a page to zoom</span>
                                    )}
                                </div>

                                {previewing && thumbs.length === 0 ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-center">
                                        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                            Loading page previews…
                                        </span>
                                    </div>
                                ) : thumbs.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                                        {thumbs.map((t, i) => (
                                            <button
                                                key={t.page}
                                                type="button"
                                                onClick={() => setZoomIndex(i)}
                                                title={`Zoom page ${t.page}`}
                                                aria-label={`Zoom page ${t.page}`}
                                                className="group relative rounded-lg overflow-hidden border border-slate-200 bg-white hover:border-orange-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-all cursor-zoom-in"
                                            >
                                                <div className="relative aspect-[1/1.414] bg-slate-50">
                                                    <img src={t.url} alt={`Page ${t.page}`} className="w-full h-full object-contain" />
                                                    <div className="absolute top-1 left-1 bg-black/65 text-white text-[9px] px-1 py-0.5 rounded">
                                                        Pg {t.page}
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-bold text-white">Zoom</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {selected.length === 0 && range.trim() !== '' && (
                            <p className="text-xs text-red-500 text-left">No valid pages in this range (1–{pageCount}).</p>
                        )}

                        <button onClick={handleSplit} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-orange-200 transition-all text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={selected.length === 0}>
                            <Download className="w-5 h-5" />
                            <span>Download Extracted PDF</span>
                        </button>
                    </div>
                </div>
            )}

            {zoomIndex !== null && zoomPage !== undefined && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex flex-col"
                    onClick={() => setZoomIndex(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Page ${zoomPage + 1} preview`}
                >
                    <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
                        <span className="text-sm font-semibold">
                            Page {zoomPage + 1}
                            <span className="text-slate-300 font-normal"> of {pageCount}</span>
                        </span>

                        <div className="flex items-center gap-2">
                            {selected.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setZoomIndex((zoomIndex - 1 + selected.length) % selected.length); }}
                                        className="p-2 rounded-lg hover:bg-white/10 transition"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-xs text-slate-200 tabular-nums">
                                        {zoomIndex + 1} / {selected.length}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setZoomIndex((zoomIndex + 1) % selected.length); }}
                                        className="p-2 rounded-lg hover:bg-white/10 transition"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomIndex(null)}
                                className="p-2 rounded-lg hover:bg-white/10 transition"
                                aria-label="Close preview"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 overflow-auto flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {zoomLoading ? (
                            <span className="inline-flex items-center gap-2 text-sm text-white/80">
                                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                                Rendering high resolution…
                            </span>
                        ) : zoomUrl ? (
                            <img
                                src={zoomUrl}
                                alt={`Page ${zoomPage + 1}`}
                                className="max-w-full rounded-lg shadow-2xl border border-white/10"
                            />
                        ) : (
                            <span className="text-sm text-white/70">Preview unavailable for this page.</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};