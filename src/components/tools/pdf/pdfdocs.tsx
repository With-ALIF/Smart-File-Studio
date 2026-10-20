'use client';
import React from 'react';
import { downloadFile } from '../../../lib/utils';
import { htmlToDocBlob, textToHtml } from '../../../lib/markdown';
import { PdfTextTool, extractPdfPagesForDoc } from './pdftext';

// A4 (595.3 x 841.9pt) minus the 72pt margins used by htmlToDocBlob.
const CONTENT_WIDTH_PT = 451;
const CONTENT_HEIGHT_PT = 690;

const pageImageHtml = (src: string, width: number, height: number, alt: string): string => {
    const scale = Math.min(CONTENT_WIDTH_PT / width, CONTENT_HEIGHT_PT / height);
    const w = width * scale;
    const h = height * scale;
    // Word sizes HTML images from the pixel attributes (96dpi -> 0.75pt),
    // so pass both those and the exact point size.
    const wPx = Math.round(w / 0.75);
    const hPx = Math.round(h / 0.75);
    return `<p style="margin:0;text-align:center"><img src="${src}" alt="${alt}" width="${wPx}" height="${hPx}" style="width:${w.toFixed(1)}pt;height:${h.toFixed(1)}pt"></p>`;
};

export const PdfToDocs: React.FC = () => (
    <PdfTextTool
        hint="Upload a PDF to make a document"
        buttonLabel="Download Document"
        onExtractFile={async (file, name) => {
            const pages = await extractPdfPagesForDoc(file);
            let previousWasImage = false;
            const body = pages
                .map((page, index) => {
                    const isImage = Boolean(page.image);
                    // Keep the original page breaks around picture pages so a
                    // scan never gets mixed into the middle of a text page.
                    const breakBefore = index > 0 && (isImage || previousWasImage)
                        ? ' page-break-before:always;'
                        : '';
                    previousWasImage = isImage;
                    if (page.image) {
                        return `<div style="margin:0;${breakBefore}">${pageImageHtml(page.image, page.width, page.height, `Page ${index + 1}`)}</div>`;
                    }
                    const html = textToHtml(page.text);
                    return html ? `<div style="margin:0;${breakBefore}">${html}</div>` : '';
                })
                .join('\n');
            downloadFile(htmlToDocBlob(body, name), `${name}.doc`);
        }}
    />
);
