import React from 'react';
import { ImageIcon, Scissors, RefreshCw, FileText, Sparkles, Layers, SplitSquareHorizontal, EyeOff, FileCode, Presentation, FileType, ImagePlus } from 'lucide-react';
import { ToolDef, ToolType, ToolCategory } from '../types';

export const TOOLS: ToolDef[] = [
    { 
        id: ToolType.IMG_RESIZE, 
        title: 'Image Resizer', 
        description: 'Scale pixels/ratio', 
        category: ToolCategory.IMAGE, 
        icon: 'resize',
        color: 'text-sky-500',
        bg: 'bg-sky-50'
    },
    { 
        id: ToolType.IMG_CROP, 
        title: 'Image Cropper', 
        description: 'Trim borders', 
        category: ToolCategory.IMAGE, 
        icon: 'crop',
        color: 'text-rose-500',
        bg: 'bg-rose-50'
    },
    { 
        id: ToolType.IMG_CONVERT, 
        title: 'Image Converter', 
        description: 'Format changer', 
        category: ToolCategory.IMAGE, 
        icon: 'convert',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
    },
    { 
        id: ToolType.IMG_TO_PDF, 
        title: 'Image to PDF', 
        description: 'Make PDF', 
        category: ToolCategory.IMAGE, 
        icon: 'pdf',
        color: 'text-red-500',
        bg: 'bg-red-50'
    }, 
    { 
        id: ToolType.PDF_MERGE, 
        title: 'Merge PDF', 
        description: 'Combine files', 
        category: ToolCategory.PDF, 
        icon: 'merge',
        color: 'text-indigo-500',
        bg: 'bg-indigo-50'
    },
    { 
        id: ToolType.PDF_SPLIT, 
        title: 'Split PDF', 
        description: 'Extract pages', 
        category: ToolCategory.PDF, 
        icon: 'split',
        color: 'text-amber-500',
        bg: 'bg-amber-50'
    },
    { 
        id: ToolType.PDF_TO_IMG, 
        title: 'PDF to Image', 
        description: 'Save pages as JPG', 
        category: ToolCategory.PDF, 
        icon: 'pdfimg',
        color: 'text-pink-500',
        bg: 'bg-pink-50'
    },
    { 
        id: ToolType.PDF_WATERMARK, 
        title: 'Watermark PDF', 
        description: 'Stamp text', 
        category: ToolCategory.PDF, 
        icon: 'watermark',
        color: 'text-cyan-500',
        bg: 'bg-cyan-50'
    },
];

export const getIcon = (iconName: string, className: string) => {
    switch(iconName) {
        case 'resize': return <ImageIcon className={className} />;
        case 'crop': return <Scissors className={className} />;
        case 'convert': return <RefreshCw className={className} />;
        case 'pdf': return <FileText className={className} />;
        case 'merge': return <Layers className={className} />;
        case 'split': return <SplitSquareHorizontal className={className} />;
        case 'watermark': return <FileText className={className} />;        
        case 'pdfimg': return <ImagePlus className={className} />;
        default: return <ImageIcon className={className} />;
    }
};
