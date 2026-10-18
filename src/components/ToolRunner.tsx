'use client';

import { BackLink, CardShell, Footer, ToolHeader } from './Layout';
import { sectionFor } from '../lib/tools';
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

export const ToolRunner = ({ tool }: { tool: ToolDef }) => (
    <>
        <CardShell>
            <BackLink />
            <ToolHeader title={tool.title} subtitle={tool.subtitle ?? tool.description} />
            {renderTool(tool.id)}
        </CardShell>
        <Footer />
    </>
);