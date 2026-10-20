export type MdTableAlign = 'left' | 'center' | 'right';

export type MdBlock =
    | { type: 'heading'; level: number; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; ordered: boolean; items: string[] }
    | { type: 'code'; text: string }
    | { type: 'quote'; text: string }
    | { type: 'table'; header: string[]; rows: string[][]; align: MdTableAlign[] }
    | { type: 'hr' };

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inlineHtml = (s: string): string => {
    let out = escapeHtml(s);
    out = out
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m: string, t: string, u: string) => {
        const safe = /^https?:\/\//i.test(u) ? u : '#';
        return `<a href="${safe}">${t}</a>`;
    });
    return out;
};


const FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*(\S*)\s*$/;
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})\s*$/;

const splitTableRow = (line: string): string[] => {
    let row = line.trim();
    if (row.startsWith('|')) row = row.slice(1);
    if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
    const cells: string[] = [];
    let cell = '';
    for (let i = 0; i < row.length; i++) {
        if (row[i] === '\\' && row[i + 1] === '|') {
            cell += '|';
            i++;
            continue;
        }
        if (row[i] === '|') {
            cells.push(cell.trim());
            cell = '';
            continue;
        }
        cell += row[i];
    }
    cells.push(cell.trim());
    return cells;
};

const parseTableAlign = (line: string): MdTableAlign[] | null => {
    if (!line.includes('|')) return null;
    const cells = splitTableRow(line);
    if (!cells.length) return null;
    const align: MdTableAlign[] = [];
    for (const cell of cells) {
        if (!/^:?-{3,}:?$/.test(cell)) return null;
        const left = cell.startsWith(':');
        const right = cell.endsWith(':');
        align.push(left && right ? 'center' : right ? 'right' : 'left');
    }
    return align;
};

const isTableStart = (lines: string[], index: number): boolean => {
    const header = lines[index];
    const delimiter = lines[index + 1];
    return Boolean(header && delimiter && header.includes('|') && parseTableAlign(delimiter));
};

const normalizeCells = (cells: string[], length: number): string[] =>
    Array.from({ length }, (_, index) => cells[index] ?? '');

const normalizeAlign = (align: MdTableAlign[], length: number): MdTableAlign[] =>
    Array.from({ length }, (_, index) => align[index] ?? 'left');

export const markdownToBlocks = (md: string): MdBlock[] => {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const blocks: MdBlock[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        const fence = line.match(FENCE_RE);
        if (fence) {
            const marker = fence[1][0];
            const openIndent = (line.match(/^ */) ?? [''])[0].length;
            const code: string[] = [];
            i++;
            while (i < lines.length) {
                const close = lines[i].match(FENCE_CLOSE_RE);
                const closeIndent = (lines[i].match(/^ */) ?? [''])[0].length;
                if (close && close[1][0] === marker && closeIndent <= openIndent + 3) {
                    i++;
                    break;
                }
                const text = lines[i].slice(0, openIndent).trim() === ''
                    ? lines[i].slice(openIndent)
                    : lines[i];
                code.push(text.replace(/\s+$/, ''));
                i++;
            }
            blocks.push({ type: 'code', text: code.join('\n') });
            continue;
        }

        if (isTableStart(lines, i)) {
            const header = splitTableRow(line);
            const align = normalizeAlign(parseTableAlign(lines[i + 1]) ?? [], header.length);
            const rows: string[][] = [];
            i += 2;
            while (i < lines.length) {
                const rowLine = lines[i];
                if (!rowLine.trim() || !rowLine.includes('|')) break;
                rows.push(normalizeCells(splitTableRow(rowLine), header.length));
                i++;
            }
            blocks.push({ type: 'table', header, rows, align });
            continue;
        }

        const heading = line.match(/^ {0,3}(#{1,6})\s+(.*)$/);
        if (heading) {
            blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
            i++;
            continue;
        }

        if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
            blocks.push({ type: 'hr' });
            i++;
            continue;
        }

        if (/^\s*>\s?/.test(line)) {
            const quote: string[] = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                quote.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }
            blocks.push({ type: 'quote', text: quote.join(' ') });
            continue;
        }

        const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
        if (bullet) {
            const items: string[] = [];
            while (i < lines.length) {
                const m = lines[i].match(/^\s*[-*+]\s+(.*)$/);
                if (!m) break;
                items.push(m[1]);
                i++;
            }
            blocks.push({ type: 'list', ordered: false, items });
            continue;
        }

        const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
        if (numbered) {
            const items: string[] = [];
            while (i < lines.length) {
                const m = lines[i].match(/^\s*\d+[.)]\s+(.*)$/);
                if (!m) break;
                items.push(m[1]);
                i++;
            }
            blocks.push({ type: 'list', ordered: true, items });
            continue;
        }

        if (/^\s*$/.test(line)) {
            i++;
            continue;
        }

        const para: string[] = [line];
        i++;
        while (
            i < lines.length &&
            !/^\s*$/.test(lines[i]) &&
            !/^ {0,3}(#{1,6})\s/.test(lines[i]) &&
            !FENCE_RE.test(lines[i]) &&
            !/^\s*[-*+]\s+/.test(lines[i]) &&
            !/^\s*\d+[.)]\s+/.test(lines[i]) &&
            !/^\s*>\s?/.test(lines[i]) &&
            !/^\s*([-*_])\1{2,}\s*$/.test(lines[i]) &&
            !isTableStart(lines, i)
        ) {
            para.push(lines[i]);
            i++;
        }
        blocks.push({ type: 'paragraph', text: para.join(' ') });
    }

    return blocks;
};

export const markdownToHtml = (md: string): string => {
    const parts: string[] = [];
    for (const block of markdownToBlocks(md)) {
        switch (block.type) {
            case 'heading':
                parts.push(`<h${block.level}>${inlineHtml(block.text)}</h${block.level}>`);
                break;
            case 'paragraph':
                parts.push(`<p>${inlineHtml(block.text)}</p>`);
                break;
            case 'quote':
                parts.push(`<blockquote>${inlineHtml(block.text)}</blockquote>`);
                break;
            case 'code':
                parts.push(`<pre><code>${escapeHtml(block.text)}</code></pre>`);
                break;
            case 'hr':
                parts.push('<hr/>');
                break;
            case 'list': {
                const tag = block.ordered ? 'ol' : 'ul';
                const items = block.items.map((it) => `<li>${inlineHtml(it)}</li>`).join('');
                parts.push(`<${tag}>${items}</${tag}>`);
                break;
            }
            case 'table': {
                const head = block.header
                    .map(
                        (cell, index) =>
                            `<th style="border:1px solid #cbd5e1;padding:6px 8px;background:#f1f5f9;font-weight:700;text-align:${block.align[index]};vertical-align:top">${inlineHtml(cell)}</th>`
                    )
                    .join('');
                const body = block.rows
                    .map((row) => {
                        const cells = row
                            .map(
                                (cell, index) =>
                                    `<td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:${block.align[index]};vertical-align:top">${inlineHtml(cell)}</td>`
                            )
                            .join('');
                        return `<tr>${cells}</tr>`;
                    })
                    .join('');
                parts.push(
                    `<table style="border-collapse:collapse;margin:0 0 10px 0;width:100%"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
                );
                break;
            }
        }
    }
    return parts.join('\n');
};

const stripInlineMarkdown = (value: string): string =>
    value
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
        .replace(/(^|[^_])_([^_]+)_/g, '$1$2');

const tableToPlainText = (block: Extract<MdBlock, { type: 'table' }>): string => {
    const rows = [block.header, ...block.rows];
    return rows
        .map((row) =>
            row
                .map((cell) => stripInlineMarkdown(cell).replace(/\s+/g, ' ').trim())
                .join('\t')
        )
        .join('\n');
};

export const markdownToPlainText = (md: string): string => {
    return markdownToBlocks(md)
        .map((block) => {
            switch (block.type) {
                case 'heading':
                case 'paragraph':
                case 'quote':
                    return stripInlineMarkdown(block.text);
                case 'code':
                    return block.text;
                case 'list':
                    return block.items
                        .map(
                            (item, index) =>
                                `${block.ordered ? `${index + 1}.` : '\u2022'} ${stripInlineMarkdown(item)}`
                        )
                        .join('\n');
                case 'table':
                    return tableToPlainText(block);
                case 'hr':
                    return '';
            }
        })
        .filter((part) => part.trim().length > 0)
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};


export const htmlToDocBlob = (bodyHtml: string, title = 'Document'): Blob => {
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="ALIF TOOL">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
@page WordSection1 { size: 595.3pt 841.9pt; margin: 72pt 72pt 72pt 72pt; }
div.WordSection1 { page: WordSection1; }

body{
  font-family:"Calibri","Segoe UI",Arial,sans-serif;
  font-size:11pt;
  line-height:1.5;
  color:#202632;
  word-wrap:break-word;
  overflow-wrap:break-word;
  orphans:3;
  widows:3;
}

p{ margin:0 0 10pt 0; mso-margin-top-alt:auto; }

h1,h2,h3,h4,h5,h6{
  font-family:"Calibri","Segoe UI",Arial,sans-serif;
  color:#0c66c2;
  margin:18pt 0 8pt 0;
  page-break-after:avoid;
  break-after:avoid;
  line-height:1.25;
}
h1{ font-size:20pt; border-bottom:1.5pt solid #0c66c2; padding-bottom:4pt; }
h2{ font-size:16pt; border-bottom:0.75pt solid #cbd5e1; padding-bottom:3pt; }
h3{ font-size:13.5pt; }
h4{ font-size:12pt; }
h5,h6{ font-size:11pt; }

a{ color:#0c66c2; text-decoration:underline; word-break:break-all; }

ul,ol{ margin:0 0 10pt 22pt; padding:0; }
li{ margin:0 0 4pt 0; }

blockquote{
  margin:0 0 10pt 0;
  padding:6pt 0 6pt 12pt;
  border-left:3pt solid #0c66c2;
  color:#4b5563;
  font-style:italic;
}

pre{
  font-family:"Consolas","Courier New",monospace;
  font-size:9.5pt;
  line-height:1.45;
  background:#f3f4f6;
  border:0.75pt solid #e5e7eb;
  border-left:3pt solid #0c66c2;
  padding:8pt 10pt;
  margin:0 0 10pt 0;
  white-space:pre-wrap;
  word-wrap:break-word;
}
pre div{ margin:0; padding:0; line-height:1.45; }

code{
  font-family:"Consolas","Courier New",monospace;
  font-size:9.5pt;
  background:#f3f4f6;
  color:#7b2233;
}

hr{
  border:none;
  border-top:0.75pt solid #d1d5db;
  margin:14pt 0;
}

img{ max-width:100%; height:auto; }

table{ border-collapse:collapse; width:100%; margin:0 0 10pt 0; page-break-inside:avoid; }
th,td{ border:0.75pt solid #cbd5e1; padding:6pt 8pt; text-align:left; vertical-align:top; }
th{ background:#f3f4f6; font-weight:bold; }
</style>
</head>
<body>
<div class="WordSection1">
${bodyHtml}
</div>
</body>
</html>`;
    return new Blob(['\ufeff', html], { type: 'application/msword' });
};

/* ------------------------------------------------------------------ *
 * Extracted-PDF text -> structured output
 *
 * PDF text extraction gives us raw lines with no semantics. Running those
 * through a naive "one paragraph per block" split destroys indentation,
 * collapses code listings into a single blob of text and prints markdown
 * markers verbatim. These helpers classify each line so code stays code.
 * ------------------------------------------------------------------ */

type ExtractedBlock =
    | { kind: 'code'; lines: string[] }
    | { kind: 'heading'; level: number; text: string }
    | { kind: 'list'; ordered: boolean; items: string[] }
    | { kind: 'quote'; lines: string[] }
    | { kind: 'hr' }
    | { kind: 'paragraph'; lines: string[] };

/**
 * Many PDFs embed a font without a Unicode map, so box-drawing glyphs come
 * back as their raw glyph ids - e.g. "│" (U+2502) turns into the two
 * characters "%ß". Without a repair pass those lines are indistinguishable
 * from prose and the whole listing collapses into one paragraph.
 *
 * These replacements map the most common id sequences back onto the real
 * characters so indentation and structure survive.
 */
const GLYPH_REPAIRS: [RegExp, string][] = [
    // ---- Latin-1 double-decode (the common case):
    // each box-drawing glyph comes back as a fixed multi-byte string.
    // Order matters: longer variants first, and the "│" rule must run last.
    [/%\xDF%\xDF%\xDF\xDF/g, '\u2514'], // └──   (6 chars)
    [/%\xDF%\xDF\xDF/g, '\u251C'],     // ├──   (5 chars, trailing ß)
    [/%\xDF%\xDF%/g, '\u2502'],        // │     (5 chars, trailing %)
    [/%\xDF%\xDF\xDF\xDF\xDF/g, '\u2514'],
    [/%\xDF%\xDF\xDF\xDF/g, '\u2502'],

    // ---- UTF-8 encoded mojibake (0xC3 0x9F).
    [/%\xC3\x9F%\xC3\x9F%\xC3\x9F\xC3\x9F/g, '\u2514'],
    [/%\xC3\x9F%\xC3\x9F%\xC3\x9F/g, '\u251C'],
    [/%\xC3\x9F%\xC3\x9F%/g, '\u2502'],
    [/%\xC3\x9F%\xC3\x9F\xC3\x9F/g, '\u2514'],
    [/%\xC3\x9F%\xC3\x9F/g, '\u2502'],

    // ---- Leftovers: any % left next to a repaired glyph is separator noise.
    [/\xDF/g, '\u2502'],
    [/%%+/g, ' '],
    [/%(?=\s*$)/g, ''],
    [/(?<=\s)%/g, ' '],
];

/** Repair mojibake glyphs and normalise unicode quotes/dashes. */
const repairGlyphs = (line: string): string => {
    let out = line;
    for (const [pattern, replacement] of GLYPH_REPAIRS) {
        out = out.replace(pattern, replacement);
    }
    return out
        .replace(/\u2018|\u2019/g, "'")
        .replace(/\u201C|\u201D/g, '"')
        .replace(/\u2013|\u2014/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u00A0/g, ' ');
};

/** Lines that look like source code / directory trees. */
const isCodeLine = (line: string): boolean => {
    if (!line.trim()) return false;
    // Box-drawing tree characters are a strong signal.
    if (/[\u2502\u251C\u2514\u250C\u2500\u252C\u2534\u253C]/.test(line)) return true;
    // A markdown fence, even glued to nearby text after PDF extraction.
    if (line.includes('```')) return true;
    // Two or more leading spaces = an indented listing / continuation.
    if (/^[ \t]{2,}\S/.test(line)) return true;
    // File paths, imports, or command lines.
    if (/^\s*[\w./-]+\.(tsx?|jsx?|json|md|css|html|svg|pdf|py|sh)\b/.test(line)) return true;
    if (/^\s*(import|export|const|let|var|function|class|from|require|<\/?[a-z])/.test(line)) return true;
    return false;
};

/** Drop markdown markers that survived PDF extraction. */
const stripInlineMarkers = (line: string): string =>
    line
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/(^|[^\w])__([^_]+)__/g, '$1$2')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\*/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

const classifyExtracted = (text: string): ExtractedBlock[] => {
    // Repair mojibake glyph ids *before* classification so that a damaged
    // directory tree is still recognised as code.
    const lines = text
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((l) => repairGlyphs(l));
    const blocks: ExtractedBlock[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        // ---- horizontal rule ----
        if (/^[-=\u2014\u2013_]{3,}$/.test(trimmed) && !/[A-Za-z]/.test(trimmed)) {
            blocks.push({ kind: 'hr' });
            i++;
            continue;
        }

        // ---- code block (consume consecutive code lines) ----
        if (isCodeLine(line)) {
            const code: string[] = [];
            while (i < lines.length && (isCodeLine(lines[i]) || !lines[i].trim())) {
                code.push(lines[i].replace(/\s+$/, ''));
                i++;
            }
            // Drop trailing blank lines captured from the lookahead.
            while (code.length && !code[code.length - 1].trim()) code.pop();
            if (code.length) blocks.push({ kind: 'code', lines: code });
            continue;
        }

        // ---- heading ----
        const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            blocks.push({
                kind: 'heading',
                level: heading[1].length,
                text: stripInlineMarkers(heading[2]),
            });
            i++;
            continue;
        }

        // ---- quote ----
        if (/^[>»]\s?/.test(trimmed)) {
            const quote: string[] = [];
            while (i < lines.length && /^[>»]\s?/.test(lines[i].trim()) && !isCodeLine(lines[i])) {
                quote.push(lines[i].trim().replace(/^[>»]\s?/, ''));
                i++;
            }
            blocks.push({ kind: 'quote', lines: quote });
            continue;
        }

        // ---- list ----
        const bullet = trimmed.match(/^[-*+•]\s+(.*)$/);
        const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (bullet || numbered) {
            const ordered = !!numbered;
            const items: string[] = [];
            while (i < lines.length) {
                const t = lines[i].trim();
                if (!t) break;
                const b = t.match(/^[-*+•]\s+(.*)$/);
                const n = t.match(/^\d+[.)]\s+(.*)$/);
                if (ordered && n) items.push(stripInlineMarkers(n[1]));
                else if (!ordered && b) items.push(stripInlineMarkers(b[1]));
                else break;
                i++;
            }
            if (items.length) blocks.push({ kind: 'list', ordered, items });
            continue;
        }

        // ---- paragraph (until a blank line or a structural line) ----
        const para: string[] = [];
        while (i < lines.length) {
            const t = lines[i].trim();
            if (!t) break;
            if (isCodeLine(lines[i])) break;
            if (/^(#{1,6})\s+/.test(t)) break;
            if (/^[-*+•]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) break;
            if (/^[>»]\s?/.test(t)) break;
            para.push(stripInlineMarkers(t));
            i++;
        }
        if (para.length) blocks.push({ kind: 'paragraph', lines: para });
    }

    return blocks;
};

export const textToMarkdown = (text: string): string => {
    return classifyExtracted(text)
        .map((block) => {
            switch (block.kind) {
                case 'code': {
                    const cleaned = block.lines.map((l) =>
                        l.replace(/```+\s*\w*\s*/g, '').replace(/\s+$/, '')
                    );
                    return ['```', ...cleaned, '```'].join('\n');
                }
                case 'heading':
                    return '#'.repeat(block.level) + ' ' + block.text;
                case 'list':
                    return block.items
                        .map((item, idx) => (block.ordered ? `${idx + 1}. ${item}` : `- ${item}`))
                        .join('\n');
                case 'quote':
                    return block.lines.map((l) => `> ${l}`).join('\n');
                case 'hr':
                    return '---';
                case 'paragraph':
                    return block.lines.join('\n');
            }
        })
        .filter(Boolean)
        .join('\n\n');
};

export const textToHtml = (text: string): string => {
    return classifyExtracted(text)
        .map((block) => {
            switch (block.kind) {
                case 'code': {
                    // Drop the ``` fences: they are markup, not content, and PDF
                    // extraction often glues them onto the neighbouring line.
                    const lines = block.lines
                        .map((l) => l.replace(/```+\s*\w*\s*/g, '').replace(/\s+$/, ''));
                    // One <div> per line: Word ignores bare newlines inside <pre>,
                    // but it always honours block elements.
                    const body = lines
                        .map((l) => `<div>${escapeHtml(l) || '&nbsp;'}</div>`)
                        .join('');
                    return `<pre>${body}</pre>`;
                }
                case 'heading': {
                    const level = Math.min(block.level, 6);
                    return `<h${level}>${escapeHtml(block.text)}</h${level}>`;
                }
                case 'list': {
                    const tag = block.ordered ? 'ol' : 'ul';
                    const items = block.items
                        .map((item) => `<li>${escapeHtml(item)}</li>`)
                        .join('');
                    return `<${tag}>${items}</${tag}>`;
                }
                case 'quote':
                    return `<blockquote>${block.lines
                        .map((l) => `<p>${escapeHtml(l)}</p>`)
                        .join('')}</blockquote>`;
                case 'hr':
                    return '<hr/>';
                case 'paragraph':
                    return block.lines
                        .map((l) => `<p>${escapeHtml(l)}</p>`)
                        .join('');
            }
        })
        .filter(Boolean)
        .join('\n');
};
