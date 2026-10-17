import React from 'react';
import { ImageIcon, Scissors, RefreshCw, FileText, Sparkles, Layers, SplitSquareHorizontal, EyeOff, FileCode, Presentation, FileType, ImagePlus, ScanText } from 'lucide-react';
import { ToolDef, ToolType, ToolCategory } from '../types';

export const TOOLS: ToolDef[] = [
    { 
        id: ToolType.IMG_RESIZE, 
        title: 'Image Resizer', 
        description: 'Scale pixels/ratio', 
        subtitle: 'Resize images by pixels or percentage instantly.',
        category: ToolCategory.IMAGE, 
        icon: 'resize',
        color: 'text-sky-500',
        bg: 'bg-sky-50'
    },
    { 
        id: ToolType.IMG_CROP, 
        title: 'Image Cropper', 
        description: 'Trim borders', 
        subtitle: 'Crop and trim image borders with ease.',
        category: ToolCategory.IMAGE, 
        icon: 'crop',
        color: 'text-rose-500',
        bg: 'bg-rose-50'
    },
    { 
        id: ToolType.IMG_CONVERT, 
        title: 'Image Converter', 
        description: 'Format changer', 
        subtitle: 'Convert images between JPG, PNG, and WebP.',
        category: ToolCategory.IMAGE, 
        icon: 'convert',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
    },
    { 
        id: ToolType.IMG_TO_PDF, 
        title: 'Image to PDF', 
        description: 'Make PDF', 
        subtitle: 'Turn one or more images into a single PDF.',
        category: ToolCategory.IMAGE, 
        icon: 'pdf',
        color: 'text-red-500',
        bg: 'bg-red-50'
    }, 
    { 
        id: ToolType.SVG_CONVERT, 
        title: 'SVG Converter', 
        description: 'SVG to PNG/JPG/WebP', 
        subtitle: 'Convert SVG files to PNG, JPG, and WebP instantly.',
        category: ToolCategory.IMAGE, 
        icon: 'svg',
        color: 'text-violet-500',
        bg: 'bg-violet-50'
    },
    { 
        id: ToolType.PDF_MERGE, 
        title: 'Merge PDF', 
        description: 'Combine files', 
        subtitle: 'Combine multiple PDF files into one.',
        category: ToolCategory.PDF, 
        icon: 'merge',
        color: 'text-indigo-500',
        bg: 'bg-indigo-50'
    },
    { 
        id: ToolType.PDF_SPLIT, 
        title: 'Split PDF', 
        description: 'Extract pages', 
        subtitle: 'Extract selected pages into a new PDF.',
        category: ToolCategory.PDF, 
        icon: 'split',
        color: 'text-amber-500',
        bg: 'bg-amber-50'
    },
    { 
        id: ToolType.PDF_TO_IMG, 
        title: 'PDF to Image', 
        description: 'Save pages as JPG', 
        subtitle: 'Save PDF pages as high-quality images.',
        category: ToolCategory.PDF, 
        icon: 'pdfimg',
        color: 'text-pink-500',
        bg: 'bg-pink-50'
    },
    { 
        id: ToolType.PDF_WATERMARK, 
        title: 'Watermark PDF', 
        description: 'Stamp text', 
        subtitle: 'Stamp text watermarks on your PDF pages.',
        category: ToolCategory.PDF, 
        icon: 'watermark',
        color: 'text-cyan-500',
        bg: 'bg-cyan-50'
    },
    { 
        id: ToolType.PDF_TO_DOCS, 
        title: 'PDF to Docs', 
        description: 'Editable document', 
        subtitle: 'Turn PDF text into an editable Word document.',
        category: ToolCategory.PDF, 
        icon: 'pdfdoc',
        color: 'text-blue-500',
        bg: 'bg-blue-50'
    },
    { 
        id: ToolType.PDF_TO_TXT, 
        title: 'PDF to TXT', 
        description: 'Extract text', 
        subtitle: 'Extract all text from a PDF as a .txt file.',
        category: ToolCategory.PDF, 
        icon: 'pdftxt',
        color: 'text-slate-500',
        bg: 'bg-slate-50'
    },
    { 
        id: ToolType.PDF_TO_MD, 
        title: 'PDF to Markdown', 
        description: 'Extract as .md', 
        subtitle: 'Extract PDF text and save it as Markdown.',
        category: ToolCategory.PDF, 
        icon: 'pdfmd',
        color: 'text-violet-500',
        bg: 'bg-violet-50'
    },
    { 
        id: ToolType.MD_TO_DOCS, 
        title: 'Markdown to Docs', 
        description: 'Convert .md to Word', 
        subtitle: 'Convert Markdown notes into an editable document.',
        category: ToolCategory.MARKDOWN, 
        icon: 'mddoc',
        color: 'text-blue-500',
        bg: 'bg-blue-50'
    },
    { 
        id: ToolType.MD_TO_PDF, 
        title: 'Markdown to PDF', 
        description: 'Export as PDF', 
        subtitle: 'Turn Markdown into a clean, paginated PDF.',
        category: ToolCategory.MARKDOWN, 
        icon: 'mdpdf',
        color: 'text-rose-500',
        bg: 'bg-rose-50'
    },
    { 
        id: ToolType.MD_TO_TXT, 
        title: 'Markdown to TXT', 
        description: 'Strip formatting', 
        subtitle: 'Convert Markdown into plain text.',
        category: ToolCategory.MARKDOWN, 
        icon: 'mdtxt',
        color: 'text-slate-500',
        bg: 'bg-slate-50'
    },
    { 
        id: ToolType.IMG_TO_TXT, 
        title: 'Image to Text', 
        description: 'OCR text extract', 
        subtitle: 'Read and copy text from images using OCR.',
        category: ToolCategory.IMAGE, 
        icon: 'ocr',
        color: 'text-orange-500',
        bg: 'bg-orange-50'
    },
];

export const getIcon = (iconName: string, className: string) => {
    switch(iconName) {
        case 'resize': return <ImageIcon className={className} />;
        case 'crop': return <Scissors className={className} />;
        case 'convert': return <RefreshCw className={className} />;
        case 'svg': return <FileCode className={className} />;
        case 'pdf': return <FileText className={className} />;
        case 'merge': return <Layers className={className} />;
        case 'split': return <SplitSquareHorizontal className={className} />;
        case 'watermark': return <FileText className={className} />;        
        case 'pdfimg': return <ImagePlus className={className} />;
        case 'pdfdoc': return <FileText className={className} />;
        case 'pdftxt': return <FileText className={className} />;
        case 'pdfmd': return <FileCode className={className} />;
        case 'mddoc': return <FileText className={className} />;
        case 'mdpdf': return <FileType className={className} />;
        case 'mdtxt': return <FileCode className={className} />;
        case 'ocr': return <ScanText className={className} />;
        default: return <ImageIcon className={className} />;
    }
};
