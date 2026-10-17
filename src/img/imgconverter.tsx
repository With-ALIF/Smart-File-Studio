import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { readFileAsDataURL, downloadFile } from '../../lib/utils';
import { useToast } from '../../components/Toast';
import { SuccessModal } from '../../components/SuccessModal';

export const ImageConverter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [format, setFormat] = useState('image/png');
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    const handleConvert = () => {
        if (!preview) return;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            
            let ext = format.split('/')[1];
            if(format === 'image/jpeg') ext = 'jpg';

            canvas.toBlob((blob) => {
                if(blob) {
                    downloadFile(blob, `converted.${ext}`);
                    setSuccess(true);
                }
            }, format);
        };
        img.src = preview;
    };

    return (
        <div className="space-y-4 md:space-y-6">
             <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => { setFile(null); setPreview(''); }} />
             {!preview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-green-500 hover:bg-green-50/30 transition-all bg-white">
                    <input type="file" accept="image/*,.heic" onChange={async (e) => {
                        if(e.target.files?.[0]) {
                            const f = e.target.files[0];
                            setFile(f);
                            
                            // Check for HEIC file
                            if (f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic') {
                                if ((window as any).heic2any) {
                                    try {
                                        showToast("Processing HEIC file...", "success");
                                        const result = await (window as any).heic2any({
                                            blob: f,
                                            toType: "image/jpeg",
                                        });
                                        const blob = Array.isArray(result) ? result[0] : result;
                                        setPreview(URL.createObjectURL(blob));
                                    } catch (err) {
                                        console.error(err);
                                        showToast("Failed to process HEIC file", "error");
                                    }
                                } else {
                                    showToast("HEIC converter library not loaded", "error");
                                }
                            } else {
                                // Standard image handling
                                setPreview(await readFileAsDataURL(f));
                            }
                        }
                    }} className="hidden" id="convert-upload" />
                    <label htmlFor="convert-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Upload Image to Convert</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Convert to PNG, JPG, BMP, WEBP</p>
                    </label>
                </div>
             ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-8 items-center border border-slate-200 shadow-sm">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                         <img src={preview} className="max-h-52 md:max-h-64 w-auto rounded-lg object-contain" alt="Preview" />
                    </div>
                    <div className="flex-1 space-y-4 md:space-y-6 w-full">
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
                        <button onClick={handleConvert} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 md:py-4 rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-green-200 transition-all text-sm md:text-base">
                             <RefreshCw className="w-5 h-5" />
                             <span>Convert & Download</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
