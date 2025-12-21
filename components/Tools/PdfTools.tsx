import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts, BlendMode } from 'pdf-lib';
import { Download, Layers, SplitSquareHorizontal, FileText, FilePlus, EyeOff, Move, AlignHorizontalJustifyCenter, Image as ImageIcon, Type, Upload } from 'lucide-react';
import { readFileAsArrayBuffer, downloadFile, readFileAsDataURL, toEnglishDigits } from '../../lib/utils';
import { useToast } from '../Toast';
import { SuccessModal } from '../SuccessModal';

// Declare global pdfjsLib
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

// --- PDF Merge ---
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

// --- PDF Split ---
export const PdfSplit: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [range, setRange] = useState('1');
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    const onFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            try {
                const buffer = await readFileAsArrayBuffer(f);
                const pdf = await PDFDocument.load(buffer);
                setPageCount(pdf.getPageCount());
            } catch (error) {
                showToast("Invalid PDF file", "error");
                setFile(null);
            }
        }
    };

    const handleSplit = async () => {
        if (!file) return;
        try {
            const buffer = await readFileAsArrayBuffer(file);
            const srcPdf = await PDFDocument.load(buffer);
            const newPdf = await PDFDocument.create();
            
            const parts = range.split(',').map(s => s.trim());
            const indices = new Set<number>();
            
            parts.forEach(part => {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(n => parseInt(n));
                    if (!isNaN(start) && !isNaN(end)) {
                        for(let i = start; i <= end; i++) indices.add(i - 1);
                    }
                } else {
                    const num = parseInt(part);
                    if (!isNaN(num)) indices.add(num - 1);
                }
            });
            
            const validIndices = Array.from(indices).filter(i => i >= 0 && i < pageCount).sort((a,b) => a - b);
            
            if (validIndices.length === 0) {
                showToast("No valid pages selected.", "error");
                return;
            }

            const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
            copiedPages.forEach(p => newPdf.addPage(p));
            
            const pdfBytes = await newPdf.save();
            downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), `split_${file.name}`);
            setSuccess(true);
        } catch (e) {
            console.error(e);
            showToast("Error processing PDF", "error");
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => { setFile(null); setRange('1'); }} />
            {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-orange-500 hover:bg-orange-50/30 transition-all bg-white">
                    <input type="file" accept="application/pdf" onChange={onFileLoad} className="hidden" id="split-upload" />
                    <label htmlFor="split-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <SplitSquareHorizontal className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload PDF to Split</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Extract specific pages</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <div className="mb-4 md:mb-6">
                         <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-orange-600 border border-orange-100">
                            <FileText className="w-6 h-6" />
                         </div>
                         <h3 className="text-base md:text-lg font-bold text-slate-800 break-all px-2">{file.name}</h3>
                         <p className="text-slate-500 text-xs md:text-sm">{pageCount} pages</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-4">
                        <label className="block text-left text-xs md:text-sm text-slate-500 font-medium">Pages to Extract</label>
                        <input 
                            type="text" 
                            value={range} 
                            onChange={(e) => setRange(toEnglishDigits(e.target.value))} 
                            placeholder="e.g. 1, 3, 5-10"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 md:p-4 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm md:text-base"
                        />
                        <p className="text-xs text-slate-400 text-left">Enter page numbers (e.g. 1, 2) or ranges (e.g. 1-5).</p>
                        
                        <button onClick={handleSplit} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-orange-200 transition-all text-sm md:text-base">
                            <Download className="w-5 h-5" />
                            <span>Download Extracted PDF</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PDF Watermark ---
export const PdfWatermark: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [wmType, setWmType] = useState<'text' | 'image'>('text');
    
    // Text State
    const [text, setText] = useState('CONFIDENTIAL');
    
    // Image State
    const [wmImage, setWmImage] = useState<File | null>(null);
    const [wmImagePreview, setWmImagePreview] = useState<string>('');
    
    // Shared State
    const [size, setSize] = useState(50);
    const [opacity, setOpacity] = useState(0.3);
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();
    
    // Interactable state
    const [rotation, setRotation] = useState(45);
    const [pos, setPos] = useState({ x: 50, y: 50 }); // Percentage 0-100
    const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });
    const [pdfPageSize, setPdfPageSize] = useState({ w: 0, h: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [snapX, setSnapX] = useState(false);
    const [snapY, setSnapY] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const onFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            try {
                const buffer = await readFileAsArrayBuffer(f);
                const pdf = await PDFDocument.load(buffer);
                const page = pdf.getPages()[0];
                const { width, height } = page.getSize();
                setPdfPageSize({ w: width, h: height });
                
                // A4 ratio 1/1.414. We fix width to e.g. 300px for preview
                const ratio = width/height;
                const containerWidth = Math.min(window.innerWidth - 64, 300); // Responsive width
                setPreviewDims({ w: containerWidth, h: containerWidth / ratio });
                setPos({x: 50, y: 50});
                setRotation(45);
            } catch (err) {
                showToast("Failed to load PDF", "error");
                setFile(null);
            }
        }
    };

    const onWmImageLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setWmImage(f);
            const url = await readFileAsDataURL(f);
            setWmImagePreview(url);
            setRotation(0); // Reset rotation for logos usually
        }
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Only start dragging if interacting with the watermark
        // Prevent default to avoid scroll start if possible, though touch-action handles most
        if (e.cancelable) e.preventDefault(); 
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        let newX = ((clientX - rect.left) / rect.width) * 100;
        let newY = ((clientY - rect.top) / rect.height) * 100;

        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        if (Math.abs(newX - 50) < 5) { newX = 50; setSnapX(true); } else { setSnapX(false); }
        if (Math.abs(newY - 50) < 5) { newY = 50; setSnapY(true); } else { setSnapY(false); }

        setPos({ x: newX, y: newY });
    };

    const handleApply = async () => {
        if(!file) return;
        try {
            const buffer = await readFileAsArrayBuffer(file);
            const pdf = await PDFDocument.load(buffer);
            const pages = pdf.getPages();
            
            let embeddedImage;
            let font;

            if (wmType === 'text') {
                font = await pdf.embedFont(StandardFonts.HelveticaBold);
            } else if (wmType === 'image' && wmImage) {
                const imgBuffer = await readFileAsArrayBuffer(wmImage);
                if (wmImage.type === 'image/png') {
                    embeddedImage = await pdf.embedPng(imgBuffer);
                } else {
                    embeddedImage = await pdf.embedJpg(imgBuffer);
                }
            } else if (wmType === 'image' && !wmImage) {
                 showToast("Please upload a watermark image", "error");
                 return;
            }

            pages.forEach(page => {
                const { width, height } = page.getSize();
                
                const centerX = (pos.x / 100) * width;
                const centerY = height - ((pos.y / 100) * height); 

                let xOffset = 0;
                let yOffset = 0;
                let drawOptions: any = {
                     x: centerX,
                     y: centerY,
                     opacity: opacity,
                     rotate: degrees(rotation),
                };

                if (wmType === 'text' && font) {
                    const textWidth = font.widthOfTextAtSize(text, size);
                    const textHeight = font.heightAtSize(size);
                    xOffset = -textWidth / 2;
                    yOffset = -textHeight / 2 + size * 0.15;
                    
                    const rad = rotation * (Math.PI / 180);
                    const rotX = xOffset * Math.cos(rad) - yOffset * Math.sin(rad);
                    const rotY = xOffset * Math.sin(rad) + yOffset * Math.cos(rad);

                    drawOptions.x = centerX + rotX;
                    drawOptions.y = centerY + rotY;
                    drawOptions.size = size;
                    drawOptions.font = font;
                    drawOptions.color = rgb(0.5, 0.5, 0.5);

                    page.drawText(text, drawOptions);

                } else if (wmType === 'image' && embeddedImage) {
                    const targetWidth = width * (size / 100);
                    const imgRatio = embeddedImage.width / embeddedImage.height;
                    const targetHeight = targetWidth / imgRatio;

                    xOffset = -targetWidth / 2;
                    yOffset = -targetHeight / 2;

                    const rad = rotation * (Math.PI / 180);
                    const rotX = xOffset * Math.cos(rad) - yOffset * Math.sin(rad);
                    const rotY = xOffset * Math.sin(rad) + yOffset * Math.cos(rad);

                    drawOptions.x = centerX + rotX;
                    drawOptions.y = centerY + rotY;
                    drawOptions.width = targetWidth;
                    drawOptions.height = targetHeight;
                    
                    page.drawImage(embeddedImage, drawOptions);
                }
            });

            const pdfBytes = await pdf.save();
            downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), 'watermarked.pdf');
            setSuccess(true);
        } catch(e) {
            console.error(e);
            showToast("Failed to apply watermark", "error");
        }
    };

    useEffect(() => {
        const up = () => setIsDragging(false);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchend', up);
        };
    }, []);

    const scaleFactor = pdfPageSize.w > 0 ? previewDims.w / pdfPageSize.w : 0.5;

    return (
        <div className="space-y-4 md:space-y-6">
             <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => setFile(null)} />
             {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-pink-500 hover:bg-pink-50/30 transition-all bg-white">
                    <input type="file" accept="application/pdf" onChange={onFileLoad} className="hidden" id="wm-upload" />
                    <label htmlFor="wm-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <FileText className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload PDF for Watermark</h3>
                    </label>
                </div>
             ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                     {/* Interactive Preview */}
                     <div className="bg-slate-50 p-4 md:p-6 rounded-2xl flex items-center justify-center border border-slate-200 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] select-none">
                         <div 
                            ref={containerRef}
                            className="bg-white relative shadow-xl border border-slate-200 overflow-hidden"
                            style={{ width: previewDims.w, height: previewDims.h }}
                            onMouseMove={handleDrag}
                            onTouchMove={handleDrag}
                         >
                            {/* Snap Lines */}
                            {snapX && <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-cyan-500 z-0 transform -translate-x-1/2"></div>}
                            {snapY && <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-cyan-500 z-0 transform -translate-y-1/2"></div>}
                            
                            {/* Watermark Element */}
                            <div 
                                className="absolute z-10 whitespace-nowrap font-bold text-gray-400 transform -translate-x-1/2 -translate-y-1/2 origin-center flex items-center justify-center cursor-move p-4 touch-none"
                                onMouseDown={handleDragStart}
                                onTouchStart={handleDragStart}
                                style={{ 
                                    left: `${pos.x}%`, 
                                    top: `${pos.y}%`, 
                                    opacity: opacity,
                                    transform: `translate(-50%, -50%) rotate(-${rotation}deg)`
                                }}
                            >
                                {wmType === 'text' ? (
                                    <span style={{ fontSize: `${Math.max(1, size * scaleFactor)}px`, lineHeight: 1 }}>{text}</span>
                                ) : (
                                    wmImagePreview && (
                                        <img 
                                            src={wmImagePreview} 
                                            alt="watermark" 
                                            style={{ 
                                                width: `${previewDims.w * (size / 100)}px`, 
                                                height: 'auto',
                                                maxWidth: 'none'
                                            }} 
                                            draggable={false}
                                        />
                                    )
                                )}
                            </div>
                            <div className="text-[10px] text-slate-500 absolute bottom-1 right-1 bg-white/80 px-1 rounded pointer-events-none border border-slate-200">PDF Preview</div>
                         </div>
                     </div>

                     {/* Controls */}
                     <div className="bg-white p-4 md:p-6 rounded-2xl space-y-4 md:space-y-6 border border-slate-200 h-fit shadow-sm">
                        
                        {/* Type Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setWmType('text')}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${wmType === 'text' ? 'bg-white shadow text-pink-600' : 'text-slate-500'}`}
                            >
                                <Type className="w-4 h-4" />
                                Text
                            </button>
                            <button 
                                onClick={() => setWmType('image')}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${wmType === 'image' ? 'bg-white shadow text-pink-600' : 'text-slate-500'}`}
                            >
                                <ImageIcon className="w-4 h-4" />
                                Image
                            </button>
                        </div>

                        {wmType === 'text' ? (
                            <div>
                                <label className="block text-slate-500 mb-2 font-medium text-xs md:text-sm">Watermark Text</label>
                                <input 
                                    value={text} 
                                    onChange={(e) => setText(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 md:p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all text-sm md:text-base"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-slate-500 mb-2 font-medium text-xs md:text-sm">Upload Logo / Image</label>
                                <input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={onWmImageLoad}
                                    className="block w-full text-xs md:text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs md:file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                />
                                <p className="text-xs text-slate-400 mt-1">Supports PNG (transparent) and JPG.</p>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-slate-500 mb-2 font-medium text-xs md:text-sm">Orientation & Position</label>
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => setRotation(0)} className="flex-1 bg-slate-50 p-2 rounded border border-slate-200 text-xs md:text-sm hover:bg-slate-100">0°</button>
                                <button onClick={() => setRotation(45)} className="flex-1 bg-slate-50 p-2 rounded border border-slate-200 text-xs md:text-sm hover:bg-slate-100">45°</button>
                                <button onClick={() => setRotation(90)} className="flex-1 bg-slate-50 p-2 rounded border border-slate-200 text-xs md:text-sm hover:bg-slate-100">90°</button>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={rotation} 
                                onChange={(e) => setRotation(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-500 mb-1 font-medium text-xs md:text-sm">Size</label>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    value={size} 
                                    onChange={(e) => setSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 mb-1 font-medium text-xs md:text-sm">Opacity</label>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1" 
                                    step="0.1"
                                    value={opacity} 
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <button onClick={handleApply} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-pink-200 transition-all text-sm md:text-base">
                             <Download className="w-5 h-5" />
                             <span>Download Watermarked PDF</span>
                        </button>
                    </div>
                </div>
             )}
        </div>
    );
};

// --- PDF Invert ---
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
            
            // This is a "fake" invert by adding a black overlay with difference blend mode
            // True inversion requires rasterization or complex filter ops not fully supported in pdf-lib easily
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

// --- PDF to Image ---
export const PdfToImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<{blob: Blob, url: string, page: number}[]>([]);
    const [processing, setProcessing] = useState(false);
    const [processed, setProcessed] = useState(false);
    const { showToast } = useToast();

    // Cleanup URLs
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
                // Use a reasonable scale for preview/download balance. 
                // 1.5 or 2 is good for quality.
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
        // Sequential download to avoid browser throttling
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