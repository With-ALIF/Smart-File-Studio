export type MdBlock =
    | { type: 'heading'; level: number; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; ordered: boolean; items: string[] }
    | { type: 'code'; text: string }
    | { type: 'quote'; text: string }
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

/**
 * Parse markdown into a flat list of blocks. Used for both HTML and PDF output.
 */
// A fence may be indented by up to three spaces (CommonMark) and may carry an
// info string, e.g. ```bash . Indentation must not exceed the opening fence.
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*(\S*)\s*$/;
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})\s*$/;

export const markdownToBlocks = (md: string): MdBlock[] => {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const blocks: MdBlock[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        const fence = line.match(FENCE_RE);
        if (fence) {
            const marker = fence[1][0].repeat(3);
            const openIndent = (line.match(/^ */) ?? [''])[0].length;
            const code: string[] = [];
            i++;
            while (i < lines.length) {
                const close = lines[i].match(FENCE_CLOSE_RE);
                if (close && close[1][0] === marker && (lines[i].match(/^ */) ?? [''])[0].length <= openIndent + 3) {
                    i++;
                    break;
                }
                const strip = close ? lines[i].slice(marker.length) : lines[i];
                const text = strip.slice(0, openIndent).trim() === '' ? strip.slice(openIndent) : strip;
                code.push(text.replace(/\s+$/, ''));
                i++;
            }
            blocks.push({ type: 'code', text: code.join('\n') });
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
            !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])
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
        }
    }
    return parts.join('\n');
};

export const markdownToPlainText = (md: string): string => {
    return md
        .replace(/\r\n?/g, '\n')
        .replace(/```[^\n]*\n?/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*>\s?/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '• ')
        .replace(/^\s*\d+[.)]\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/(^|[^_])_([^_]+)_/g, '$1$2')
        .replace(/^\s*([-*_])\1{2,}\s*$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

/**
 * Wrap HTML body in a Word-compatible document (.doc opens in Word & Google Docs).
 *
 * Word ignores most modern CSS, so the page has to be described with the
 * mso-* properties as well. Without them Word re-flows the document and long
 * unbreakable strings (URLs, code) push the layout off the page.
 */
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

/**
 * Turn raw extracted text into simple markdown paragraphs.
 */
export const textToMarkdown = (text: string): string => {
    return text
        .replace(/\r\n?/g, '\n')
        .split(/\n{2,}/)
        .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean).join('\n'))
        .filter(Boolean)
        .join('\n\n');
};

/**
 * Turn raw extracted text into simple HTML paragraphs (for .doc export).
 */
export const textToHtml = (text: string): string => {
    return text
        .replace(/\r\n?/g, '\n')
        .split(/\n{2,}/)
        .map((block) => block.split('\n').map((l) => escapeHtml(l.trim())).filter(Boolean).join('<br>'))
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join('\n');
};
