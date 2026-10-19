'use client';
import React from 'react';
import { downloadFile } from '../../../lib/utils';
import { markdownToHtml, htmlToDocBlob, markdownToPlainText } from '../../../lib/markdown';
import { MarkdownTool } from './markdowntoolbase';

export const MdToDocs: React.FC = () => (
    <MarkdownTool
        fileHint="Upload Markdown to convert to a document"
        buttonLabel="Download Document"
        outputLabel="Document preview"
        getOutputText={markdownToPlainText}
        getOutputHtml={markdownToHtml}
        renderPreview={(text) => (
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }} />
        )}
        onConvert={(text, name) => {
            const html = markdownToHtml(text);
            downloadFile(htmlToDocBlob(html, name), `${name}.doc`);
        }}
    />
);
