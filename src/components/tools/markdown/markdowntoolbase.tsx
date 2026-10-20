'use client';
import React, { useId, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Check, Copy, Download, FileCode, FileText, Sparkles, Upload, X } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import type { MdBlock } from '../../../lib/markdown';
import {
    clearBengaliCache,
    ensureBengaliFont,
    measureBengaliWidthPt,
    renderBengali,
} from '../../../lib/fonts/bengaliCanvas';

const CHAR_REPLACEMENTS: Record<string, string> = {
    '\u00A0': ' ', '\u2007': ' ', '\u2009': ' ', '\u200A': ' ', '\u202F': ' ', '\u200B': '',
    '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-', '\u2015': '-', '\u2212': '-',
    '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'",
    '\u201C': '"', '\u201D': '"', '\u201E': '"',
    '\u2026': '...',
    '\u2022': '\u2022',
    '\u00D7': 'x', '\u00F7': '/',
    '\u2192': '->', '\u2190': '<-', '\u21D2': '=>',
    '\u2605': '*', '\u2606': '*', '\u2726': '*',
    '\u2713': 'v', '\u2714': 'v',
    '\u26A0': '!', '\u2757': '!', '\u24D8': '!',
    '\uFE0E': '', '\uFE0F': '',
    '\u00AD': '',
};

// jsPDF's built-in fonts are WinAnsi-only and, more importantly, jsPDF never
// runs OpenType shaping (GSUB). Bengali needs that shaping to form conjuncts
// (যুক্তাক্ষর like ক্ষ) and to reposition vowel signs, so we can't just embed a
// Bengali TTF — it would render as disjoint glyphs. Instead, Bengali runs are
// rasterised by the browser's text engine (see lib/fonts/bengaliCanvas) and
// placed as high-res PNGs. Latin text keeps the crisp vector path.

/** Bengali block plus ZWJ/ZWNJ and the dotted circle used by renderers. */
const isBengaliChar = (code: number): boolean =>
    (code >= 0x0980 && code <= 0x09FF) ||  // Bengali
    (code >= 0x200C && code <= 0x200D) ||  // ZWNJ / ZWJ
    code === 0x25CC;                          // dotted circle used by renderers

const isLatinSafe = (code: number): boolean => {
    if (code === 9 || code === 10) return true;
    if (code >= 0x80 && code <= 0x9F) return false;
    return code <= 0x24F;
};

const hasBengali = (input: string): boolean => {
    for (const ch of input) {
        const code = ch.codePointAt(0) ?? 0;
        if (code >= 0x0980 && code <= 0x09FF) return true;
    }
    return false;
};

/** Set once per document so sanitizeText() knows whether Noto is embedded. */
let bengaliActive = false;

const sanitizeText = (input: string): string => {
    let out = '';
    for (const ch of input) {
        const code = ch.codePointAt(0) ?? 0;
        const mapped = CHAR_REPLACEMENTS[ch];
        if (mapped !== undefined) {
            out += mapped;
            continue;
        }
        if (bengaliActive && isBengaliChar(code)) {
            out += ch;
            continue;
        }
        if (isLatinSafe(code)) out += ch;
    }
    return out.replace(/[ \t]{2,}/g, ' ').trim();
};

const sanitizeCodeLine = (input: string): string => {
    let out = '';
    for (const ch of input) {
        const code = ch.codePointAt(0) ?? 0;
        const mapped = CHAR_REPLACEMENTS[ch];
        if (mapped !== undefined) {
            out += mapped;
            continue;
        }
        if (bengaliActive && isBengaliChar(code)) {
            out += ch;
            continue;
        }
        if (isLatinSafe(code)) out += ch;
    }
    return out;
};

type FontKey = 'normal' | 'bold' | 'italic' | 'bolditalic' | 'code' | 'codebold';

const FONTS: Record<FontKey, [string, string]> = {
    normal: ['helvetica', 'normal'],
    bold: ['helvetica', 'bold'],
    italic: ['helvetica', 'italic'],
    bolditalic: ['helvetica', 'bolditalic'],
    code: ['courier', 'normal'],
    codebold: ['courier', 'bold'],
};

interface Run {
    text: string;
    font: FontKey;
    color?: [number, number, number];
    strike?: boolean;
}

const INLINE_PATTERN =
    /(!?\[[^\]]*\]\([^)\s]+\))|(`[^`\n]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(~~[^~\n]+~~)|(\*[^*\n]+\*)|(_[^_\n]+_)/g;

const BASE_COLOR: [number, number, number] = [32, 38, 48];
const LINK_COLOR: [number, number, number] = [12, 102, 194];

const parseInline = (input: string, base: FontKey = 'normal'): Run[] => {
    const runs: Run[] = [];
    let last = 0;

    INLINE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = INLINE_PATTERN.exec(input)) !== null) {
        if (match.index > last) {
            const text = sanitizeText(input.slice(last, match.index));
            if (text) runs.push({ text, font: base });
        }
        last = match.index + match[0].length;

        const token = match[0];

        if (match[1]) {
            const label = sanitizeText(token.replace(/^!?\[([^\]]*)\]\([^)\s]+\)$/, '$1'));
            if (label) runs.push({ text: label, font: base, color: LINK_COLOR });
        } else if (match[2]) {
            const code = sanitizeText(token.slice(1, -1));
            if (code) runs.push({ text: code, font: base === 'normal' ? 'code' : 'codebold', color: [120, 40, 60] });
        } else if (match[3] || match[4]) {
            const strong = sanitizeText(token.replace(/^(\*\*|__)([\s\S]*)\1$/, '$2'));
            if (strong) runs.push({ text: strong, font: base === 'normal' ? 'bold' : 'bolditalic' });
        } else if (match[5]) {
            const struck = sanitizeText(token.replace(/^~~([\s\S]*)~~$/, '$1'));
            if (struck) runs.push({ text: struck, font: base, strike: true });
        } else if (match[6] || match[7]) {
            const em = sanitizeText(token.replace(/^(\*|_)([\s\S]*)\1$/, '$2'));
            if (em) runs.push({ text: em, font: base === 'bold' ? 'bolditalic' : 'italic' });
        }
    }

    const tail = sanitizeText(input.slice(last));
    if (tail) runs.push({ text: tail, font: base });

    return runs.length ? runs : [{ text: '', font: base }];
};

export const buildPdfBytes = async (blocks: MdBlock[], title: string): Promise<jsPDF> => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 56;
    const contentW = pageW - margin * 2;
    let y = margin;

    // Detect Bengali up front so sanitizeText() keeps those codepoints and we
    // know to load the shaping font. jsPDF itself never runs OpenType shaping,
    // so Bengali is drawn as rasterised images via lib/fonts/bengaliCanvas.
    const docHasBengali =
        hasBengali(title) || blocks.some((b) => JSON.stringify(b).match(/[\u0980-\u09FF]/));
    bengaliActive = docHasBengali;
    // Load the web font so canvas shaping is ready before we draw anything.
    if (docHasBengali) {
        clearBengaliCache();
        await ensureBengaliFont();
    }

    const isBoldFont = (font: FontKey) =>
        font === 'bold' || font === 'bolditalic' || font === 'codebold';
    const isItalicFont = (font: FontKey) => font === 'italic' || font === 'bolditalic';

    /** Accurate shaped width for Bengali, jsPDF metrics for everything else. */
    const wordWidth = (text: string, run: Run, size: number): number => {
        if (docHasBengali && hasBengali(text)) {
            return measureBengaliWidthPt(text, size, isBoldFont(run.font), isItalicFont(run.font));
        }
        applyFont(run, size);
        return doc.getTextWidth(text);
    };

    /** Draw one word; rasterises Bengali, uses vector text for Latin. */
    const drawWord = (
        text: string,
        run: Run,
        size: number,
        x: number,
        baseline: number,
        width: number,
        strikeColor?: [number, number, number],
    ) => {
        if (docHasBengali && hasBengali(text)) {
            const img = renderBengali(
                text,
                size,
                isBoldFont(run.font),
                isItalicFont(run.font),
                run.color ?? BASE_COLOR,
            );
            if (img) {
                doc.addImage(
                    img.dataUrl,
                    'PNG',
                    x + img.xPt,
                    baseline + img.yPt,
                    img.wPt,
                    img.hPt,
                    img.alias,
                    'FAST',
                );
                if (run.strike) {
                    doc.setDrawColor(...(strikeColor ?? [150, 150, 150]));
                    doc.setLineWidth(0.5);
                    doc.line(x, baseline - size * 0.3, x + width, baseline - size * 0.3);
                }
                return;
            }
            // If rasterising failed, fall through to plain vector text.
        }
        applyFont(run, size);
        doc.text(text, x, baseline);
        if (run.strike) {
            doc.setDrawColor(...(strikeColor ?? [150, 150, 150]));
            doc.setLineWidth(0.5);
            doc.line(x, baseline - size * 0.3, x + width, baseline - size * 0.3);
        }
    };

    const newPage = () => {
        doc.addPage();
        y = margin;
    };

    const applyFont = (run: Run, size: number) => {
        const [family, style] = FONTS[run.font];
        doc.setFont(family, style);
        doc.setFontSize(size);
        doc.setTextColor(...(run.color ?? BASE_COLOR));
    };

    type LaidWord = { text: string; run: Run; width: number; spaceWidth: number };

    /** Advance width of a single space for this run (shaped for Bengali). */
    const spaceWidth = (run: Run, size: number): number => {
        if (docHasBengali && hasBengali(run.text)) {
            return measureBengaliWidthPt(' ', size, isBoldFont(run.font), isItalicFont(run.font));
        }
        applyFont(run, size);
        return doc.getTextWidth(' ');
    };

    const layout = (runs: Run[], size: number, maxWidth: number): LaidWord[][] => {
        const words: LaidWord[] = [];

        for (const run of runs) {
            const gap = spaceWidth(run, size);
            const parts = run.text.split(/\s+/).filter(Boolean);
            for (const part of parts) {
                words.push({
                    text: part,
                    run,
                    width: wordWidth(part, run, size),
                    spaceWidth: gap,
                });
            }
        }

        const lines: LaidWord[][] = [];
        let line: LaidWord[] = [];
        let width = 0;

        for (const word of words) {
            const extra = line.length === 0 ? 0 : line[line.length - 1].spaceWidth;
            const needed = word.width + extra;
            if (line.length > 0 && width + needed > maxWidth) {
                lines.push(line);
                line = [word];
                width = word.width;
            } else {
                line.push(word);
                width += needed;
            }
        }
        if (line.length) lines.push(line);
        if (!lines.length) lines.push([]);

        return lines;
    };

    const drawLines = (
        lines: LaidWord[][],
        size: number,
        x: number,
        lineHeight: number,
        strikeColor?: [number, number, number],
    ) => {
        lines.forEach((words) => {
            let cursor = x;
            if (!words.length) {
                y += lineHeight;
                return;
            }
            words.forEach((word, i) => {
                drawWord(word.text, word.run, size, cursor, y, word.width, strikeColor);
                cursor += word.width;
                if (i < words.length - 1) cursor += word.spaceWidth;
            });
            y += lineHeight;
        });
    };

    for (const block of blocks) {
        switch (block.type) {
case 'heading': {
                const size = [24, 19, 16, 14, 12, 11][Math.min(block.level, 6) - 1];
                const lineHeight = size * 1.35;
                const lines = layout(parseInline(block.text, 'bold'), size, contentW);

                // Space above the heading so the rule never touches the
                // previous paragraph (Bengali glyphs sit very high).
                y += block.level === 1 ? 6 : 16;

                const needed = lines.length * lineHeight + 14;
                if (y + needed > pageH - margin) {
                    newPage();
                }

                if (block.level <= 2) {
                    doc.setDrawColor(12, 102, 194);
                    doc.setLineWidth(block.level === 1 ? 2 : 1);
                    const headText = lines[0]?.find((w) => w.run.text.trim().length > 0)?.run.text ?? '';
                    const asc = docHasBengali && hasBengali(headText) ? 1.15 : 0.95;
                    doc.line(margin, y - size * asc, pageW - margin, y - size * asc);
                }
                y += docHasBengali ? size * 0.5 : size * 0.35;
                drawLines(lines, size, margin, lineHeight);
                y += block.level === 1 ? (docHasBengali ? 16 : 10) : (docHasBengali ? 12 : 6);
                break;
            }

            case 'paragraph': {
                const size = 11;
                const lineHeight = docHasBengali ? 18 : 16;
                const lines = layout(parseInline(block.text), size, contentW);
                if (y + lines.length * lineHeight > pageH - margin) newPage();
                drawLines(lines, size, margin, lineHeight);
                y += 6;
                break;
            }

            case 'quote': {
                const size = 11;
                const lineHeight = docHasBengali ? 18 : 16;
                const lines = layout(parseInline(block.text, 'italic'), size, contentW - 18);
                if (y + lines.length * lineHeight + 12 > pageH - margin) newPage();

                const barTop = y - size * 0.85;
                const barHeight = lines.length * lineHeight + 4;
                doc.setFillColor(12, 102, 194);
                doc.rect(margin, barTop, 3, barHeight, 'F');

                const before = y;
                y += 6;
                drawLines(lines, size, margin + 14, lineHeight);
                y = before + barHeight + 8;
                break;
            }

            case 'list': {
                const size = 11;
                const lineHeight = docHasBengali ? 18 : 16;
                block.items.forEach((item, idx) => {
                    const marker = block.ordered ? `${idx + 1}.` : '\u2022';
                    const lines = layout(parseInline(item), size, contentW - 26);
                    if (y + lines.length * lineHeight > pageH - margin) newPage();

                    applyFont({ text: marker, font: 'normal' }, size);
                    doc.setTextColor(100, 116, 139);
                    doc.text(marker, margin + 4, y);

                    drawLines(lines, size, margin + 26, lineHeight);
                    y += 3;
                });
                y += 6;
                break;
            }

            case 'table': {
                const size = 9.5;
                const lineHeight = docHasBengali ? 15 : 13;
                const pad = 5;
                const columns = block.header.length;
                const colW = contentW / columns;

                const rowCells = (cells: string[], header: boolean) =>
                    cells.map((cell) =>
                        layout(parseInline(cell, header ? 'bold' : 'normal'), size, colW - pad * 2)
                    );

                const drawRow = (cells: string[], header: boolean) => {
                    const cellLines = rowCells(cells, header);
                    const maxLines = Math.max(...cellLines.map((lines) => lines.length));
                    const rowH = maxLines * lineHeight + pad * 2;
                    if (y + rowH > pageH - margin) newPage();

                    if (header) {
                        doc.setFillColor(243, 244, 246);
                        doc.rect(margin, y, contentW, rowH, 'F');
                    }

                    doc.setDrawColor(203, 213, 225);
                    doc.setLineWidth(0.5);
                    cellLines.forEach((lines, index) => {
                        const x = margin + index * colW;
                        doc.rect(x, y, colW, rowH);
                        let cellY = y + pad + size * 0.8;
                        lines.forEach((words) => {
                            let cursor = x + pad;
                            words.forEach((word, wordIndex) => {
                                drawWord(word.text, word.run, size, cursor, cellY, word.width);
                                cursor += word.width;
                                if (wordIndex < words.length - 1) cursor += word.spaceWidth;
                            });
                            cellY += lineHeight;
                        });
                    });
                    y += rowH;
                };

                drawRow(block.header, true);
                block.rows.forEach((row) =>
                    drawRow(Array.from({ length: columns }, (_, index) => row[index] ?? ''), false)
                );
                y += 8;
                break;
            }

            case 'code': {
                const size = 9.5;
                const lineHeight = docHasBengali ? 15 : 13;
                const boxPad = 10;
                const maxTextWidth = contentW - boxPad * 2 - 2;

                // Breathing room above the box (tables/quotes otherwise sit
                // flush against it).
                y += 6;
                const rawLines = block.text
                    .split('\n')
                    .map((line) => sanitizeCodeLine(line.replace(/\t/g, '    ')));

                const measureWidth = (text: string, lineHasBengali: boolean): number =>
                    lineHasBengali ? measureBengaliWidthPt(text, size, false, false) : (() => {
                        doc.setFont('courier', 'normal');
                        doc.setFontSize(size);
                        return doc.getTextWidth(text);
                    })();

                const wrapLine = (line: string, lineHasBengali: boolean): string[] => {
                    if (!line) return [''];
                    const lines: string[] = [];
                    let current = '';
                    for (const ch of line) {
                        const next = current + ch;
                        if (current && measureWidth(next, lineHasBengali) > maxTextWidth) {
                            lines.push(current);
                            current = ch;
                        } else {
                            current = next;
                        }
                    }
                    lines.push(current);
                    return lines;
                };

                const wrapped: { text: string; bengali: boolean }[] = [];
                for (const line of rawLines) {
                    const bengali = docHasBengali && hasBengali(line);
                    for (const part of wrapLine(line, bengali)) {
                        wrapped.push({ text: part, bengali });
                    }
                }

                let index = 0;
                while (index < wrapped.length) {
                    const available = pageH - margin - y;
                    const maxLines = Math.floor((available - boxPad * 2) / lineHeight);
                    if (maxLines <= 0) {
                        newPage();
                        continue;
                    }

                    const count = Math.min(wrapped.length - index, maxLines);
                    const chunk = wrapped.slice(index, index + count);
                    const boxHeight = chunk.length * lineHeight + boxPad * 2;

                    doc.setFillColor(246, 247, 249);
                    doc.rect(margin, y - size, contentW, boxHeight, 'F');
                    doc.setDrawColor(0, 102, 204);
                    doc.setLineWidth(2);
                    doc.line(margin, y - size, margin, y - size + boxHeight);

                    let codeY = y + boxPad;
                    for (const item of chunk) {
                        const codeX = margin + boxPad + 2;
                        const codeRun: Run = { text: item.text, font: 'code' };
                        drawWord(
                            item.text || ' ',
                            codeRun,
                            size,
                            codeX,
                            codeY,
                            measureWidth(item.text, item.bengali),
                        );
                        codeY += lineHeight;
                    }

                    index += count;
                    y += boxHeight + 10;
                    if (index < wrapped.length) newPage();
                }
                break;
            }

            case 'hr': {
                if (y + 18 > pageH - margin) newPage();
                doc.setDrawColor(214, 220, 228);
                doc.setLineWidth(0.8);
                doc.line(margin, y, pageW - margin, y);
                y += 18;
                break;
            }
        }
    }

    doc.setProperties({ title });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BASE_COLOR);
    return doc;
};

interface MarkdownToolProps {
    fileHint: string;
    buttonLabel: string;
    onConvert: (text: string, baseName: string) => void | Promise<void>;
    outputLabel?: string;
    getOutputText?: (text: string) => string;
    getOutputHtml?: (text: string) => string;
    renderPreview?: (markdown: string) => React.ReactNode;
}

interface MarkdownResult {
    text: string;
    source: string;
    name: string;
}

export const MarkdownTool: React.FC<MarkdownToolProps> = ({
    fileHint,
    buttonLabel,
    onConvert,
    outputLabel = 'Converted text',
    getOutputText,
    getOutputHtml,
    renderPreview,
}) => {
    const { showToast } = useToast();
    const inputId = useId();
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [output, setOutput] = useState<MarkdownResult | null>(null);
    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    const hasOutput = Boolean(getOutputText);
    const canConvert = text.trim().length > 0;
    const baseName = (file?.name || 'document').replace(/\.(md|markdown|txt)$/i, '') || 'document';

    const clearResult = () => {
        setOutput(null);
        setCopied(false);
    };

    const updateText = (value: string) => {
        setText(value);
        clearResult();
    };

    const onFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        try {
            const content = await f.text();
            setFile(f);
            setText(content);
            clearResult();
            showToast(`Loaded ${f.name}`);
        } catch {
            showToast('Could not read this file', 'error');
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const clearAll = () => {
        setFile(null);
        setText('');
        clearResult();
    };

    const convert = async () => {
        const source = text.trim();
        if (!source) {
            showToast('Paste some Markdown or upload a file first.', 'error');
            return;
        }
        setProcessing(true);
        try {
            if (!getOutputText) {
                await onConvert(source, baseName);
                showToast('Done');
                return;
            }
            const result = getOutputText(source);
            setOutput({ text: result, source, name: baseName });
            setCopied(false);
            showToast('Converted — copy or download below');
        } catch (err) {
            console.error(err);
            showToast('Conversion failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const download = async () => {
        if (!output) return;
        setProcessing(true);
        try {
            await onConvert(output.source, output.name);
            showToast('Downloaded');
        } catch (err) {
            console.error(err);
            showToast('Download failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const copy = async () => {
        if (!output) return;
        let copied = false;

        try {
            const html = getOutputHtml?.(output.source);
            if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
                const documentHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([documentHtml], { type: 'text/html' }),
                        'text/plain': new Blob([output.text], { type: 'text/plain' }),
                    }),
                ]);
                copied = true;
            } else {
                await navigator.clipboard.writeText(output.text);
                copied = true;
            }
        } catch {
            try {
                await navigator.clipboard.writeText(output.text);
                copied = true;
            } catch {
                copied = false;
            }
        }

        if (copied) {
            setCopied(true);
            showToast('Copied to clipboard');
            window.setTimeout(() => setCopied(false), 2000);
        } else {
            showToast('Copy failed', 'error');
        }
    };

    return (
        <div className={`grid items-start gap-4 md:gap-6 ${hasOutput ? 'lg:grid-cols-2' : ''}`}>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 md:text-base">
                        <FileCode className="h-4 w-4 text-blue-600" />
                        Markdown input
                    </h3>
                    {file && (
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="max-w-[160px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={removeFile}
                                aria-label="Remove uploaded file"
                                className="rounded-full p-0.5 hover:bg-blue-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => updateText(e.target.value)}
                            placeholder="Paste your Markdown here..."
                            aria-label="Markdown text"
                            className="h-56 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:text-base"
                        />
                        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] text-slate-400">
                            {text.length.toLocaleString()} chars
                        </span>
                    </div>

                    <input
                        id={inputId}
                        type="file"
                        accept=".md,.markdown,.txt,text/markdown,text/plain"
                        onChange={onFileLoad}
                        className="hidden"
                    />
                    <label
                        htmlFor={inputId}
                        className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 text-center transition-all sm:h-56 ${
                            file
                                ? 'border-blue-400 bg-blue-50/50'
                                : 'border-slate-300 bg-slate-50/60 hover:border-blue-500 hover:bg-blue-50/40'
                        }`}
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                            <Upload className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-bold text-slate-800">{file ? 'Change file' : 'Upload file'}</span>
                        <span className="max-w-full truncate text-[11px] text-slate-500">{file?.name ?? '.md, .markdown, .txt'}</span>
                    </label>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-400">
                    {fileHint}. Uploads fill the text box so you can edit before converting.
                </p>

                <button
                    onClick={convert}
                    disabled={processing || !canConvert}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-4 md:text-base"
                >
                    {processing ? (
                        'Converting...'
                    ) : hasOutput ? (
                        <><Sparkles className="h-5 w-5" /><span>Convert</span></>
                    ) : (
                        <><Download className="h-5 w-5" /><span>{buttonLabel}</span></>
                    )}
                </button>

                {(text || file) && (
                    <button onClick={clearAll} className="w-full text-sm text-slate-500 underline hover:text-slate-700">
                        Clear
                    </button>
                )}
            </div>

            {hasOutput && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-800 md:text-base">{outputLabel}</h3>
                        <button
                            onClick={copy}
                            disabled={!output}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    {renderPreview && output ? (
                        <div className="md-preview h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 md:text-base">
                            {renderPreview(output.source)}
                        </div>
                    ) : (
                        <textarea
                            readOnly
                            value={output?.text ?? ''}
                            placeholder="Converted text will appear here."
                            aria-label={outputLabel}
                            className="h-56 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:text-base"
                        />
                    )}

                    <button
                        onClick={download}
                        disabled={!output || processing}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-3.5 md:text-base"
                    >
                        <Download className="h-5 w-5" />
                        {buttonLabel}
                    </button>

                    <p className="text-[11px] leading-relaxed text-slate-400">
                        Everything runs locally in your browser. Nothing is uploaded.
                    </p>
                </div>
            )}
        </div>
    );
};