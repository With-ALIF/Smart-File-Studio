import React from 'react';
import { downloadFile } from '../../lib/utils';
import { textToMarkdown } from '../../lib/markdown';
import { PdfTextTool } from './pdftext';

export const PdfToMarkdown: React.FC = () => (
    <PdfTextTool
        hint="Upload a PDF to convert to Markdown"
        buttonLabel="Download Markdown"
        onExtract={(text, name) => {
            downloadFile(new Blob([textToMarkdown(text)], { type: 'text/markdown;charset=utf-8' }), `${name}.md`);
        }}
    />
);
