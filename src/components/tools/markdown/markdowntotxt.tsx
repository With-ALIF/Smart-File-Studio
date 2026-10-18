'use client';
import React from 'react';
import { downloadFile } from '../../../lib/utils';
import { markdownToPlainText } from '../../../lib/markdown';
import { MarkdownTool } from './markdowntoolbase';

export const MdToTxt: React.FC = () => (
    <MarkdownTool
        fileHint="Upload Markdown to convert to TXT"
        buttonLabel="Download TXT"
        onConvert={(text, name) => {
            const out = markdownToPlainText(text);
            downloadFile(new Blob([out], { type: 'text/plain;charset=utf-8' }), `${name}.txt`);
        }}
    />
);
