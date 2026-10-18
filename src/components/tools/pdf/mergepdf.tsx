'use client';
import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Layers, FilePlus } from 'lucide-react';
import { readFileAsArrayBuffer, downloadFile } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';
import { SuccessModal } from '../../../components/SuccessModal';

export const PdfMerge: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    const handleMerge = async () => {
        if(files.length < 2) return;
        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const buffer = await readFileAsArrayBuffer(file);
                const pdf = await PDFDocument.load(buffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const pdfBytes = await mergedPdf.save();
            downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged.pdf');
            setSuccess(true);
        } catch (e) {
            console.error(e);
            showToast("Failed to merge PDFs", "error");
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => setFiles([])} />
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all bg-white">
                <input 
                    type="file" 
                    multiple 
                    accept="application/pdf" 
                    onChange={(e) => e.target.files && setFiles([...files, ...Array.from(e.target.files)])} 
                    className="hidden" 
                    id="merge-upload" 
                />
                <label htmlFor="merge-upload" className="cursor-pointer flex flex-col items-center group">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                        <FilePlus className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Click to upload PDFs</h3>
                    <p className="text-slate-500 text-xs md:text-sm">Select multiple files</p>
                </label>
            </div>
            
            {files.length > 0 && (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-slate-800 font-bold mb-4 text-sm md:text-base">Selected Files ({files.length})</h3>
                    <ul className="space-y-2 mb-6 text-slate-600 max-h-48 md:max-h-60 overflow-y-auto">
                        {files.map((f, i) => (
                            <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 gap-2">
                                <span className="truncate text-xs md:text-sm font-medium flex-1 min-w-0">{i + 1}. {f.name}</span>
                                <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-600 text-xs md:text-sm font-bold shrink-0">Remove</button>
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleMerge} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-blue-200 transition-all text-sm md:text-base">
                         <Layers className="w-5 h-5" />
                         <span>Merge & Download</span>
                    </button>
                </div>
            )}
        </div>
    );
};
