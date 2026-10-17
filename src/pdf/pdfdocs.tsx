import React from 'react';
import { downloadFile } from '../../lib/utils';
import { htmlToDocBlob, textToHtml } from '../../lib/markdown';
import { PdfTextTool } from './pdftext';

export const PdfToDocs: React.FC = () => (
    <PdfTextTool
        hint="Upload a PDF to make a document"
        buttonLabel="Download Document"
        onExtract={(text, name) => {
            downloadFile(htmlToDocBlob(textToHtml(text), name), `${name}.doc`);
        }}
    />
);
