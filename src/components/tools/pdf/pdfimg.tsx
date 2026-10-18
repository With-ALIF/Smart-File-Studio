'use client';
import React, { useEffect, useState } from 'react';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { readFileAsArrayBuffer, downloadFile } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';

export const PdfToImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<{blob: Blob, url: string, page: number}[]>([]);
    const [processing, setProcessing] = useState(false);
    const [processed, setProcessed] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        return () => {
            images.forEach(img => URL.revokeObjectURL(img.url));
        };
    }, [images]);

    const handleConvert = async () => {
        if (!file || !window.pdfjsLib) return;
        setProcessing(true);
        setImages([]);
        setProcessed(false);
        showToast("Processing pages...", "success");
        
        try {
            const buffer = await readFileAsArrayBuffer(file);
            const pdf = await window.pdfjsLib.getDocument(buffer).promise;
            const pageCount = pdf.numPages;
            const newImages: {blob: Blob, url: string, page: number}[] = [];
            
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                await new Promise<void>(resolve => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            newImages.push({ 
                                blob, 
                                url: URL.createObjectURL(blob), 
                                page: i 
                            });
                        }
                        resolve();
                    }, 'image/jpeg', 0.85);
                });
            }
            setImages(newImages);
            setProcessed(true);
        } catch (e) {
            console.error(e);
            showToast("Failed to convert PDF to images", "error");
        } finally {
            setProcessing(false);
        }
    };

    const downloadSingle = (img: {blob: Blob, page: number}) => {
        downloadFile(img.blob, `${file?.name.replace('.pdf', '')}_page_${img.page}.jpg`);
    };

    const downloadAll = async () => {
        if(images.length === 0) return;
        for(const img of images) {
            downloadSingle(img);
            await new Promise(r => setTimeout(r, 300));
        }
    };

    const reset = () => {
        setFile(null);
        setImages([]);
        setProcessed(false);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-pink-500 hover:bg-pink-50/30 transition-all bg-white">
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="hidden" id="pdfimg-upload" />
                    <label htmlFor="pdfimg-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload PDF</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Convert pages to JPG images</p>
                    </label>
                </div>
            ) : !processed ? (
                <div className="bg-white p-4 md:p-6 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <div className="mb-6">
                         <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-pink-600 border border-pink-100">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 break-all px-2">{file.name}</h3>
                        <p className="text-slate-500 text-sm">Convert all pages to images</p>
                    </div>
                    <button 
                        onClick={handleConvert} 
                        disabled={processing}
                        className="w-full max-w-sm mx-auto bg-pink-600 hover:bg-pink-700 text-white py-3.5 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-pink-200 transition-all text-sm md:text-base disabled:opacity-70 disabled:cursor-wait"
                    >
                        {processing ? (
                            <span className="animate-pulse">Converting Pages...</span>
                        ) : (
                            <>
                                <ImageIcon className="w-5 h-5" />
                                <span>Convert to Images</span>
                            </>
                        )}
                    </button>
                    {!processing && (
                        <button onClick={reset} className="mt-4 text-slate-500 text-sm hover:text-slate-700 underline">
                            Cancel / Upload Different File
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 pb-4">
                        <div className="w-full md:w-auto overflow-hidden">
                             <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-pink-500 shrink-0" />
                                <span className="break-all">{file.name}</span>
                             </h3>
                             <p className="text-slate-500 text-xs md:text-sm">{images.length} pages converted</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={reset} className="flex-1 md:flex-none px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 text-xs md:text-sm">
                                Reset
                            </button>
                            <button onClick={downloadAll} className="flex-1 md:flex-none px-4 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 shadow-md shadow-pink-200 flex items-center justify-center gap-2 text-xs md:text-sm">
                                <Download className="w-4 h-4" />
                                Download All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col gap-2 group hover:shadow-md transition-all">
                                <div className="relative aspect-[1/1.414] overflow-hidden rounded-lg bg-white border border-slate-200">
                                    <img src={img.url} className="w-full h-full object-contain" alt={`Page ${img.page}`} />
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        Pg {img.page}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => downloadSingle(img)}
                                    className="w-full py-2 bg-white border border-slate-200 hover:border-pink-300 hover:bg-pink-50 text-slate-700 hover:text-pink-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
