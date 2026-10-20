'use client';

import Link from 'next/link';
import { BackLink, CardShell, Footer, ToolHeader } from './Layout';
import { TOOLS, sectionFor } from '../lib/tools';
import type { ToolDef } from '../types';

import { ImageResizer } from './tools/img/imgresizer';
import { ImageCropper } from './tools/img/imgcropper';
import { ImageConverter } from './tools/img/imgconverter';
import { ImageToPdf } from './tools/img/imgtopdf';
import { ImageToTxt } from './tools/img/imgtotxt';
import { SvgConverter } from './tools/img/svgconverter';

import { PdfMerge } from './tools/pdf/mergepdf';
import { PdfSplit } from './tools/pdf/splitpdf';
import { PdfWatermark } from './tools/pdf/watermarkpdf';
import { PdfInvert } from './tools/pdf/invertpdf';
import { PdfToImage } from './tools/pdf/pdfimg';
import { PdfToDocs } from './tools/pdf/pdfdocs';
import { PdfToTxt } from './tools/pdf/pdftxt';
import { PdfToMarkdown } from './tools/pdf/pdfmarkdown';

import { MdToDocs } from './tools/markdown/markdowntodocs';
import { MdToPdf } from './tools/markdown/markdowntopdf';
import { MdToTxt } from './tools/markdown/markdowntotxt';

const renderTool = (id: string) => {
    switch (id) {
        case 'img-resize': return <ImageResizer />;
        case 'img-crop': return <ImageCropper />;
        case 'img-convert': return <ImageConverter />;
        case 'img-to-pdf': return <ImageToPdf />;
        case 'img-to-txt': return <ImageToTxt />;
        case 'svg-convert': return <SvgConverter />;
        case 'pdf-merge': return <PdfMerge />;
        case 'pdf-split': return <PdfSplit />;
        case 'pdf-watermark': return <PdfWatermark />;
        case 'pdf-invert': return <PdfInvert />;
        case 'pdf-to-img': return <PdfToImage />;
        case 'pdf-to-docs': return <PdfToDocs />;
        case 'pdf-to-txt': return <PdfToTxt />;
        case 'pdf-to-md': return <PdfToMarkdown />;
        case 'md-to-docs': return <MdToDocs />;
        case 'md-to-pdf': return <MdToPdf />;
        case 'md-to-txt': return <MdToTxt />;
        default: return null;
    }
};

const CATEGORY_NAME: Record<string, string> = {
    PDF: 'PDF',
    IMAGE: 'image',
    MARKDOWN: 'Markdown',
};

export const ToolRunner = ({ tool }: { tool: ToolDef }) => {
    const related = TOOLS.filter(t => t.category === tool.category && t.id !== tool.id);

    return (
        <>
            <CardShell>
                <BackLink />
                <ToolHeader title={tool.title} subtitle={tool.subtitle ?? tool.description} />
                {renderTool(tool.id)}
            </CardShell>

            <section className="max-w-3xl mx-auto px-4 pb-12 space-y-3 text-sm text-slate-600 leading-relaxed">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                    About the {tool.title} tool
                </h2>
                <p>
                    {tool.subtitle ?? tool.description} It is part of{' '}
                    <Link href="/" className="text-sky-700 hover:underline">ALIF Tool</Link>{' '}
                    (also known as ALIF Tools, MNR Tool, MNR Tools and Tools BD) — a free
                    online toolbox for images, PDFs and Markdown files.
                </p>
                <p>
                    Open the {tool.title.toLowerCase()} tool, choose or paste your file, adjust the
                    options, then download the result. Everything runs inside your browser, so your
                    files stay on your device. There is no signup, no watermark and no cost, and it
                    works on Android, iPhone, Windows and Mac in Chrome, Edge, Firefox or Safari.
                </p>
                {related.length > 0 && (
                    <p>
                        More {CATEGORY_NAME[tool.category] ?? ''} tools:{' '}
                        {related.map((item, index) => (
                            <span key={item.id}>
                                {index > 0 && ' · '}
                                <Link
                                    href={`/${sectionFor(item.category)}/${item.id}`}
                                    className="text-sky-700 hover:underline"
                                >
                                    {item.title}
                                </Link>
                            </span>
                        ))}
                    </p>
                )}
            </section>

            <Footer />
        </>
    );
};