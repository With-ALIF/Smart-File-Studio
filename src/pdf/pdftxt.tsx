import React from 'react';
import { downloadFile } from '../../lib/utils';
import { PdfTextTool } from './pdftext';

export const PdfToTxt: React.FC = () => (
    <PdfTextTool
        hint="Upload a PDF to extract text"
        buttonLabel="Download TXT"
        onExtract={(text, name) => {
            downloadFile(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${name}.txt`);
        }}
    />
);
