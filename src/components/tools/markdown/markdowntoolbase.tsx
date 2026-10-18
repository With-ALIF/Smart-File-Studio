'use client';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, FileText, FileCode } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import type { MdBlock } from '../../../lib/markdown';

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
    '\u200D': '',
    '\u00AD': '',
};

const isSafeChar = (code: number): boolean => {
    if (code === 9 || code === 10) return true;
    if (code >= 0x80 && code <= 0x9F) return false;
    return code <= 0xFF;
};

const sanitizeText = (input: string): string => {
    let out = '';
    for (const ch of input) {
        const mapped = CHAR_REPLACEMENTS[ch];
        if (mapped !== undefined) {
            out += mapped;
            continue;
        }
        if (isSafeChar(ch.codePointAt(0) ?? 0)) out += ch;
    }
    return out.replace(/[ \t]{2,}/g, ' ').trim();
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

export const buildPdfBytes = (blocks: MdBlock[], title: string): jsPDF => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 56;
    const contentW = pageW - margin * 2;
    let y = margin;

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

    const layout = (runs: Run[], size: number, maxWidth: number) => {
        type Word = { text: string; run: Run; width: number; spaceAfter: number };
        const words: Word[] = [];

        for (const run of runs) {
            applyFont(run, size);
            const spaceW = doc.getTextWidth(' ');
            const parts = run.text.split(/\s+/).filter(Boolean);
            parts.forEach((part, i) => {
                words.push({
                    text: part,
                    run,
                    width: doc.getTextWidth(part),
                    spaceAfter: i < parts.length - 1 ? spaceW : 0,
                });
            });
        }

        const lines: Word[][] = [];
        let line: Word[] = [];
        let width = 0;

        for (const word of words) {
            const extra = line.length === 0 ? 0 : doc.getTextWidth(' ');
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
        lines: { text: string; run: Run; width: number; spaceAfter: number }[][],
        size: number,
        x: number,
        lineHeight: number,
        strikeColor?: [number, number, number],
    ) => {
        lines.forEach((words, lineIndex) => {
            let cursor = x;
            if (!words.length) {
                y += lineHeight;
                return;
            }
            words.forEach((word, i) => {
                applyFont(word.run, size);
                doc.text(word.text, cursor, y);
                if (word.run.strike) {
                    doc.setDrawColor(...(strikeColor ?? [150, 150, 150]));
                    doc.setLineWidth(0.5);
                    doc.line(cursor, y - size * 0.3, cursor + word.width, y - size * 0.3);
                }
                cursor += word.width;
                if (i < words.length - 1) cursor += doc.getTextWidth(' ');
            });
            if (lineIndex < lines.length - 1) y += lineHeight;
        });
        y += lineHeight;
    };

    for (const block of blocks) {
        switch (block.type) {
            case 'heading': {
                const size = [24, 19, 16, 14, 12, 11][Math.min(block.level, 6) - 1];
                const lineHeight = size * 1.35;
                const lines = layout(parseInline(block.text, 'bold'), size, contentW);
                const needed = lines.length * lineHeight + 14;

                if (y + needed > pageH - margin) newPage();

                if (block.level <= 2) {
                    doc.setDrawColor(12, 102, 194);
                    doc.setLineWidth(block.level === 1 ? 2 : 1);
                    doc.line(margin, y - size * 0.95, pageW - margin, y - size * 0.95);
                }
                y += size * 0.35;
                drawLines(lines, size, margin, lineHeight);
                y += block.level === 1 ? 10 : 6;
                break;
            }

            case 'paragraph': {
                const size = 11;
                const lineHeight = 16;
                const lines = layout(parseInline(block.text), size, contentW);
                if (y + lines.length * lineHeight > pageH - margin) newPage();
                drawLines(lines, size, margin, lineHeight);
                y += 6;
                break;
            }

            case 'quote': {
                const size = 11;
                const lineHeight = 16;
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
                const lineHeight = 16;
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

            case 'code': {
                const size = 9.5;
                const lineHeight = 13;
                const rawLines = block.text.split('\n').map((l) => sanitizeText(l)).filter((l, i, arr) => l !== '' || i < arr.length - 1);
                const boxPad = 10;
                const boxHeight = rawLines.length * lineHeight + boxPad * 2;

                if (y + boxHeight > pageH - margin) newPage();

                doc.setFillColor(246, 247, 249);
                doc.rect(margin, y - size, contentW, boxHeight, 'F');
                doc.setDrawColor(0, 102, 204);
                doc.setLineWidth(2);
                doc.line(margin, y - size, margin, y - size + boxHeight);

                let codeY = y + boxPad;
                rawLines.forEach((line) => {
                    doc.setFont('courier', 'normal');
                    doc.setFontSize(size);
                    doc.setTextColor(...BASE_COLOR);
                    doc.text(line || ' ', margin + boxPad + 2, codeY);
                    codeY += lineHeight;
                });

                y += boxHeight + 10;
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
}

export const MarkdownTool: React.FC<MarkdownToolProps> = ({ fileHint, buttonLabel, onConvert }) => {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    const onFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
    };

    const run = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const text = await file.text();
            const baseName = file.name.replace(/\.(md|markdown|txt)$/i, '') || 'document';
            await onConvert(text, baseName);
            showToast('Done');
        } catch (err) {
            console.error(err);
            showToast('Conversion failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all bg-white">
                    <input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={onFileLoad} className="hidden" id="md-upload" />
                    <label htmlFor="md-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <FileCode className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">{fileHint}</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Click to choose a Markdown file</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-blue-600 border border-blue-100">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 break-all px-2">{file.name}</h3>
                    </div>

                    <button
                        onClick={run}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3.5 md:py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-200 transition-all text-sm md:text-base"
                    >
                        {processing ? 'Converting...' : (<><Download className="w-5 h-5" /><span>{buttonLabel}</span></>)}
                    </button>

                    <button onClick={() => setFile(null)} className="w-full text-slate-500 text-sm hover:text-slate-700 underline">
                        Choose another file
                    </button>
                </div>
            )}
        </div>
    );
};