import React from 'react';
import { markdownToBlocks } from '../../lib/markdown';
import { MarkdownTool, buildPdfBytes } from './markdowntoolbase';

export const MdToPdf: React.FC = () => (
    <MarkdownTool
        fileHint="Upload Markdown to convert to PDF"
        buttonLabel="Download PDF"
        onConvert={(text, name) => {
            const blocks = markdownToBlocks(text);
            const doc = buildPdfBytes(blocks, name);
            doc.save(`${name}.pdf`);
        }}
    />
);
