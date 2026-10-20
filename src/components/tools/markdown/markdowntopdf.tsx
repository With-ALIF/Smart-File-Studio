'use client';
import React from 'react';
import { markdownToBlocks } from '../../../lib/markdown';
import { MarkdownTool, buildPdfBytes } from './markdowntoolbase';

export const MdToPdf: React.FC = () => (
    <MarkdownTool
        fileHint="Upload Markdown to convert to PDF"
        buttonLabel="Download PDF"
        onConvert={async (text, name) => {
            const blocks = markdownToBlocks(text);
            const doc = await buildPdfBytes(blocks, name);
            doc.save(`${name}.pdf`);
        }}
    />
);
