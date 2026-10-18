'use client';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, FileImage } from 'lucide-react';
import { readFileAsDataURL } from '../../../lib/utils';
import { SuccessModal } from '../../../components/SuccessModal';

export const ImageToPdf: React.FC = () => {
    const [images, setImages] = useState<{file: File, url: string}[]>([]);
    const [pageSize, setPageSize] = useState('a4');
    const [success, setSuccess] = useState(false);
    
    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files) {
            const newImages = [];
            for (let i=0; i<e.target.files.length; i++) {
                const file = e.target.files[i];
                const url = await readFileAsDataURL(file);
                newImages.push({file, url});
            }
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const generatePdf = () => {
        if(images.length === 0) return;
        const pdf = new jsPDF({ format: pageSize === 'fit' ? undefined : pageSize, unit: 'px' });
        
        images.forEach((imgData, index) => {
            if (index > 0) pdf.addPage();
            
            const imgProps = pdf.getImageProperties(imgData.url);
            let pdfWidth = pdf.internal.pageSize.getWidth();
            let pdfHeight = pdf.internal.pageSize.getHeight();
            
            if (pageSize === 'fit') {
                 if(index === 0) {
                     pdf.internal.pageSize.width = imgProps.width;
                     pdf.internal.pageSize.height = imgProps.height;
                 }
                 pdfWidth = imgProps.width;
                 pdfHeight = imgProps.height;
            }

            const ratio = imgProps.width / imgProps.height;
            const pageRatio = pdfWidth / pdfHeight;
            let finalW = pdfWidth;
            let finalH = pdfHeight;

            if (pageSize !== 'fit') {
                if(ratio > pageRatio) {
                    finalH = finalW / ratio;
                } else {
                    finalW = finalH * ratio;
                }
            }
            pdf.addImage(imgData.url, 'JPEG', (pdfWidth - finalW)/2, (pdfHeight - finalH)/2, finalW, finalH);
        });
        
        pdf.save("images.pdf");
        setSuccess(true);
    };
    
    return (
        <div className="space-y-4 md:space-y-6">
            <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => setImages([])} />
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-8 text-center hover:border-red-500 hover:bg-red-50/30 transition-all bg-white">
                <input type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" id="pdf-upload" />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center group">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                        <FileImage className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                    </div>
                    <span className="text-slate-600 font-medium text-sm md:text-base">Click to add images</span>
                </label>
            </div>
            
            {images.length > 0 && (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                        {images.map((img, i) => (
                            <div key={i} className="relative group aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                                <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                        className="text-red-600 hover:text-red-700 font-bold bg-white px-3 py-1.5 rounded-full text-xs shadow-md"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
                        <div>
                             <label className="block text-slate-500 text-xs md:text-sm mb-2 font-medium">Page Size</label>
                             <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 md:p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm md:text-base">
                                <option value="a4">A4 (Standard)</option>
                                <option value="letter">Letter</option>
                                <option value="fit">Fit to Image Size</option>
                            </select>
                        </div>
                    </div>

                    <button onClick={generatePdf} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-red-200 transition-all text-sm md:text-base">
                        <Download className="w-5 h-5" />
                        <span>Generate PDF</span>
                    </button>
                </div>
            )}
        </div>
    );
};
