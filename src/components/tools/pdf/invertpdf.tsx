'use client';
import React, { useState } from 'react';
import { PDFDocument, rgb, BlendMode } from 'pdf-lib';
import { EyeOff, FileText } from 'lucide-react';
import { readFileAsArrayBuffer, downloadFile } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';
import { SuccessModal } from '../../../components/SuccessModal';

export const PdfInvert: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    const handleInvert = async () => {
        if (!file) return;
        try {
            const buffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(buffer);
            const pages = pdfDoc.getPages();
            
            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    color: rgb(1, 1, 1),
                    blendMode: BlendMode.Difference,
                });
            });

            const pdfBytes = await pdfDoc.save();
            downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), `inverted_${file.name}`);
            setSuccess(true);
        } catch (e) {
            console.error(e);
            showToast("Failed to invert PDF", "error");
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => setFile(null)} />
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-slate-500 hover:bg-slate-50/30 transition-all bg-white">
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="hidden" id="invert-upload" />
                    <label htmlFor="invert-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <EyeOff className="w-6 h-6 md:w-8 md:h-8 text-slate-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload PDF to Invert</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Invert colors (Dark Mode)</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <div className="mb-6">
                         <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-600 border border-slate-100">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 break-all px-2">{file.name}</h3>
                        <p className="text-slate-500 text-sm">Ready to invert colors</p>
                    </div>
                    <button onClick={handleInvert} className="w-full max-w-sm mx-auto bg-slate-800 hover:bg-slate-900 text-white py-3.5 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-slate-200 transition-all text-sm md:text-base">
                        <EyeOff className="w-5 h-5" />
                        <span>Invert & Download</span>
                    </button>
                </div>
            )}
        </div>
    );
};
