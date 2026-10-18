'use client';
import React from 'react';
import { downloadFile } from '../../../lib/utils';
import { markdownToHtml, htmlToDocBlob } from '../../../lib/markdown';
import { MarkdownTool } from './markdowntoolbase';

export const MdToDocs: React.FC = () => (
    <MarkdownTool
        fileHint="Upload Markdown to convert to a document"
        buttonLabel="Download Document"
        onConvert={(text, name) => {
            const html = markdownToHtml(text);
            downloadFile(htmlToDocBlob(html, name), `${name}.doc`);
        }}
    />
);
