'use client';
import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { readFileAsArrayBuffer } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';

interface PdfTextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const pdfItemsToPageText = (items: unknown[]): string => {
    const parsed: PdfTextItem[] = [];
    for (const raw of items) {
        const it = raw as { str?: string; transform?: number[]; width?: number; height?: number };
        if (typeof it.str !== 'string' || !it.str.trim() || !Array.isArray(it.transform)) continue;
        parsed.push({
            str: it.str,
            x: it.transform[4],
            y: it.transform[5],
            width: typeof it.width === 'number' ? it.width : 0,
            height: typeof it.height === 'number' && it.height > 0
                ? it.height
                : Math.abs(it.transform[3]) || 10,
        });
    }
    if (!parsed.length) return '';

    parsed.sort((a, b) => (b.y - a.y) || (a.x - b.x));

    const lines: { y: number; height: number; items: PdfTextItem[] }[] = [];
    for (const item of parsed) {
        const last = lines[lines.length - 1];
        const tolerance = Math.max(2, item.height * 0.5);
        if (last && Math.abs(last.y - item.y) <= tolerance) {
            last.items.push(item);
            last.height = Math.max(last.height, item.height);
        } else {
            lines.push({ y: item.y, height: item.height, items: [item] });
        }
    }

    const out: string[] = [];
    let prevY: number | null = null;
    let prevHeight = 12;
for (const line of lines) {
        const ordered = [...line.items].sort((a, b) => a.x - b.x);
        let text = '';
        let prevRight: number | null = null;

        // A monospaced code listing keeps every column the same distance
        // apart, so a generous threshold still splits columns correctly
        // while proportional prose stays a single space.
        const monoLike = ordered.length > 2 && ordered.every((it) => it.str.length > 0 && it.width / Math.max(it.str.length, 1) > 0.5);
        const gapFactor = monoLike ? 0.9 : 0.22;

        for (const item of ordered) {
            if (prevRight !== null && item.x - prevRight > Math.max(1, item.height * gapFactor)) {
                // Two or more columns apart: keep the visual gap so the
                // structure survives instead of collapsing into one blob.
                const gap = item.x - prevRight;
                if (gapFactor > 0.5 && gap > item.height * 1.6) {
                    text += '  ';
                } else {
                    text += ' ';
                }
            }
            text += item.str;
            prevRight = item.x + item.width;
        }
// Collapse only runs of spaces that come from PDF word-spacing.
        // Leading indentation must survive or code listings lose their shape.
        const leading = text.match(/^[ \t]*/)?.[0] ?? '';
        const body = text.slice(leading.length).replace(/[^\S\n]{2,}/g, ' ');
        text = (leading + body).replace(/[ \t]+$/, '');
        if (!text.trim()) continue;
        if (prevY !== null && prevY - line.y > prevHeight * 1.6) out.push('');
        out.push(text);
        prevY = line.y;
        prevHeight = line.height;
    }
    return out.join('\n');
};

export const extractPdfPagesText = async (file: File): Promise<string[]> => {
    const buffer = await readFileAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(pdfItemsToPageText(content.items));
        page.cleanup();
    }
    return pages;
};

/** Join pages with a blank line so blocks never merge across page breaks. */
export const joinPageText = (pages: string[]): string =>
    pages
        .map((p) => p.replace(/[ \t]+$/, ''))
        .join('\n\n');

/** A page with less real text than this is treated as a scan/picture page. */
const MIN_PAGE_TEXT = 25;

/**
 * A PDF whose Bengali font has no Unicode map (very common with documents
 * made in Bijoy/SutonnyMJ) comes back as raw glyph ids - e.g. "¬ ¾ ‚ ² ¾"
 * instead of "বাংলা". Real Bengali, Latin, Arabic, Devanagari and other
 * scripts always contain letters, so a page that is mostly Latin-1 symbols
 * is unreadable and has to be taken from the rendered page instead.
 */
export const isUnreadablePageText = (text: string): boolean => {
    const compact = text.replace(/\s+/g, '');
    if (!compact) return true;
    if (/[\u0980-\u09FF]/.test(compact)) return false;
    if (/[A-Za-z]/.test(compact)) return false;
    const symbols = (compact.match(/[\u00A0-\u02FF\u2010-\u203A\uE000-\uF8FF\uFFFD]/g) || []).length;
    return symbols / compact.length > 0.2;
};

export const needsPageImage = (text: string): boolean =>
    text.replace(/\s+/g, '').length < MIN_PAGE_TEXT || isUnreadablePageText(text);

export interface PdfDocPage {
    text: string;
    /** JPEG data URL of the rendered page, only set when the text is unusable. */
    image: string | null;
    /** Page size in points (scale 1) so the doc can keep the aspect ratio. */
    width: number;
    height: number;
}

const renderPageImage = async (page: any): Promise<string | null> => {
    try {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        // JPEG has no alpha channel: without this the page background is black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
        console.error('PDF page render failed', err);
        return null;
    }
};

/**
 * Page-by-page extraction for the DOC export. Pages whose text layer is
 * missing (scans, rasterised Bengali) or garbled (font without ToUnicode)
 * are rendered to an image so the document is never blank.
 */
export const extractPdfPagesForDoc = async (file: File): Promise<PdfDocPage[]> => {
    const buffer = await readFileAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: PdfDocPage[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = pdfItemsToPageText(content.items);
        const size = page.getViewport({ scale: 1 });
        const image = needsPageImage(text) ? await renderPageImage(page) : null;
        pages.push({ text, image, width: size.width, height: size.height });
        page.cleanup();
    }
    return pages;
};

interface PdfTextToolProps {
    hint: string;
    buttonLabel: string;
    onExtract?: (text: string, baseName: string) => void;
    /** Used by exports that need the original pages (PDF -> Docs). */
    onExtractFile?: (file: File, baseName: string) => Promise<void> | void;
}

export const PdfTextTool: React.FC<PdfTextToolProps> = ({ hint, buttonLabel, onExtract, onExtractFile }) => {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    const onFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const run = async () => {
        if (!file || !window.pdfjsLib) return;
        setProcessing(true);
        try {
            const baseName = file.name.replace(/\.pdf$/i, '') || 'document';
            if (onExtractFile) {
                await onExtractFile(file, baseName);
            } else if (onExtract) {
                const pages = await extractPdfPagesText(file);
                onExtract(joinPageText(pages), baseName);
            }
            showToast('Done');
        } catch (e) {
            console.error(e);
            showToast('Failed to read PDF', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all bg-white">
                    <input type="file" accept="application/pdf" onChange={onFileLoad} className="hidden" id="pdf-extract-upload" />
                    <label htmlFor="pdf-extract-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <FileText className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">{hint}</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Click to choose a PDF file</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-emerald-600 border border-emerald-100">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 break-all px-2">{file.name}</h3>
                    </div>

                    <button
                        onClick={run}
                        disabled={processing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-3.5 md:py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-200 transition-all text-sm md:text-base"
                    >
                        {processing ? 'Extracting...' : (<><Download className="w-5 h-5" /><span>{buttonLabel}</span></>)}
                    </button>

                    <button onClick={() => setFile(null)} className="w-full text-slate-500 text-sm hover:text-slate-700 underline">
                        Choose another file
                    </button>
                </div>
            )}
        </div>
    );
};
