'use client';
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { readFileAsDataURL, downloadFile, toEnglishDigits } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';
import { SuccessModal } from '../../../components/SuccessModal';

export const ImageConverter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [format, setFormat] = useState('image/png');
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    // Resize state
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);
    const [keepRatio, setKeepRatio] = useState(true);

    const handleFile = async (f: File) => {
        setFile(f);

        let src = '';
        if (f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic') {
            if (!(window as any).heic2any) {
                showToast('HEIC converter library not loaded', 'error');
                return;
            }
            try {
                showToast('Processing HEIC file...', 'success');
                const result = await (window as any).heic2any({ blob: f, toType: 'image/jpeg' });
                const blob = Array.isArray(result) ? result[0] : result;
                src = URL.createObjectURL(blob);
            } catch (err) {
                console.error(err);
                showToast('Failed to process HEIC file', 'error');
                return;
            }
        } else {
            src = await readFileAsDataURL(f);
        }

        setPreview(src);

        // Read natural dimensions to seed the width/height inputs.
        const img = new Image();
        img.onload = () => {
            setWidth(img.naturalWidth);
            setHeight(img.naturalHeight);
            setOriginalDims({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = src;
    };

    const handleConvert = () => {
        if (!preview) return;
        const img = new Image();
        img.onload = () => {
            // Fall back to the original size when the user leaves the inputs empty.
            const targetW = width > 0 ? width : img.naturalWidth;
            const targetH = height > 0 ? height : img.naturalHeight;

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            // White backdrop keeps transparent PNGs readable once flattened to JPG/BMP.
            if (format === 'image/jpeg' || format === 'image/bmp') {
                ctx!.fillStyle = '#ffffff';
                ctx!.fillRect(0, 0, targetW, targetH);
            }
            ctx?.drawImage(img, 0, 0, targetW, targetH);

            let ext = format.split('/')[1];
            if (format === 'image/jpeg') ext = 'jpg';

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        downloadFile(blob, `converted.${ext}`);
                        setSuccess(true);
                    } else {
                        showToast('Conversion failed', 'error');
                    }
                },
                format
            );
        };
        img.src = preview;
    };

    const onWidthChange = (value: string) => {
        const val = toEnglishDigits(value);
        if (!/^\d*$/.test(val)) return;
        const nextW = val === '' ? 0 : parseInt(val, 10);
        setWidth(nextW);
        if (keepRatio && originalDims && originalDims.width > 0) {
            setHeight(Math.round(nextW * (originalDims.height / originalDims.width)) || 0);
        }
    };

    const onHeightChange = (value: string) => {
        const val = toEnglishDigits(value);
        if (!/^\d*$/.test(val)) return;
        const nextH = val === '' ? 0 : parseInt(val, 10);
        setHeight(nextH);
        if (keepRatio && originalDims && originalDims.height > 0) {
            setWidth(Math.round(nextH * (originalDims.width / originalDims.height)) || 0);
        }
    };

    const resetAll = () => {
        setFile(null);
        setPreview('');
        setWidth(0);
        setHeight(0);
        setOriginalDims(null);
    };

    return (
        <div className="space-y-4 md:space-y-6">
             <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={resetAll} />
             {!preview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-green-500 hover:bg-green-50/30 transition-all bg-white">
                    <input type="file" accept="image/*,.heic" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                    }} className="hidden" id="convert-upload" />
                    <label htmlFor="convert-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload Image to Convert</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Convert to PNG, JPG, BMP, WEBP — and resize</p>
                    </label>
                </div>
             ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-8 items-start border border-slate-200 shadow-sm">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 relative">
                         <img src={preview} className="max-h-52 md:max-h-64 w-auto rounded-lg object-contain" alt="Preview" />
                         <div className="absolute bottom-2 right-2 bg-white/90 text-[10px] px-1.5 py-0.5 rounded text-slate-600 font-mono border border-slate-200">
                             {width || 0} × {height || 0}
                         </div>
                    </div>
                    <div className="flex-1 space-y-4 md:space-y-5 w-full">
                        <div>
                            <label className="block text-slate-500 text-xs md:text-sm mb-2 font-medium">Target Format</label>
                            <select 
                                value={format} 
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 md:p-4 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm md:text-base"
                            >
                                <option value="image/png">PNG</option>
                                <option value="image/jpeg">JPG / JPEG</option>
                                <option value="image/webp">WEBP</option>
                                <option value="image/bmp">BMP</option>
                                <option value="image/gif">GIF (Static)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-500 text-xs md:text-sm mb-2 font-medium">Output Size</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={width || ''}
                                        onChange={(e) => onWidthChange(e.target.value)}
                                        placeholder="Width"
                                        aria-label="Output width in pixels"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-center">Width (px)</p>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={height || ''}
                                        onChange={(e) => onHeightChange(e.target.value)}
                                        placeholder="Height"
                                        aria-label="Output height in pixels"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-center">Height (px)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mt-3">
                                <input
                                    type="checkbox"
                                    id="conv-ratio"
                                    checked={keepRatio}
                                    onChange={(e) => setKeepRatio(e.target.checked)}
                                    className="w-4 h-4 rounded text-green-600 border-slate-300 focus:ring-green-500"
                                />
                                <label htmlFor="conv-ratio" className="text-slate-700 text-xs md:text-sm font-medium cursor-pointer">
                                    Maintain Aspect Ratio
                                </label>
                            </div>

                            {originalDims && (
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Original: {originalDims.width} × {originalDims.height} px — leave as is to keep the current size.
                                </p>
                            )}
                        </div>

                        <button onClick={handleConvert} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-green-200 transition-all text-sm md:text-base">
                             <RefreshCw className="w-5 h-5" />
                             <span>Convert &amp; Download</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};