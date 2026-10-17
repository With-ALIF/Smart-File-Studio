import React, { useState } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import { readFileAsDataURL, downloadFile, toEnglishDigits } from '../../lib/utils';
import { SuccessModal } from '../../components/SuccessModal';

export const ImageResizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);
  const [aspectRatio, setAspectRatio] = useState(true);
  const [targetSizeKB, setTargetSizeKB] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg');
  const [success, setSuccess] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const url = await readFileAsDataURL(f);
      setPreview(url);
      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
        setOriginalDimensions({ width: img.width, height: img.height });
        // Set default output format based on input
        if (f.type === 'image/png') setOutputFormat('image/png');
        else if (f.type === 'image/webp') setOutputFormat('image/webp');
        else setOutputFormat('image/jpeg');
      };
      img.src = url;
    }
  };

  const handleResize = async () => {
    if (!file || !preview) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      
      const getBlob = (q: number) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, outputFormat, q));
      let blob = await getBlob(quality);

      const targetSize = targetSizeKB ? parseFloat(targetSizeKB) : 0;
      // Note: Quality reduction works best for JPEG/WEBP. PNG is lossless so quality param is often ignored.
      if (targetSize > 0 && blob && outputFormat !== 'image/png') {
          while (blob && blob.size > targetSize * 1024 && quality > 0.1) {
              quality -= 0.1;
              blob = await getBlob(quality);
          }
      }

      if (blob) {
          let ext = 'jpg';
          if (outputFormat === 'image/png') ext = 'png';
          else if (outputFormat === 'image/webp') ext = 'webp';
          else if (outputFormat === 'image/jpeg') ext = 'jpg';

          downloadFile(blob, `resized_${file.name.split('.')[0]}.${ext}`);
          setSuccess(true);
      }
    };
    img.src = preview;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => { setFile(null); setPreview(''); setOriginalDimensions(null); setTargetSizeKB(''); }} />
      {!preview ? (
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-cyan-500 hover:bg-cyan-50/30 transition-all bg-white">
            <input type="file" accept="image/*" onChange={onFileChange} className="hidden" id="resize-upload" />
            <label htmlFor="resize-upload" className="cursor-pointer flex flex-col items-center group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-cyan-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-cyan-600" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Click to upload image</h3>
                <p className="text-slate-500 text-xs md:text-sm">Supports PNG, JPG, WEBP</p>
            </label>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-white p-3 md:p-4 rounded-2xl flex items-center justify-center border border-slate-200 relative overflow-hidden shadow-sm">
                <div className="absolute top-4 left-4 bg-slate-900/80 text-xs px-2 py-1 rounded text-white backdrop-blur-md">
                    Original: {file?.name}
                </div>
                <img src={preview} alt="Preview" className="max-h-64 md:max-h-[500px] rounded-lg object-contain" />
                <div className="absolute bottom-4 right-4 bg-white/90 text-xs px-2 py-1 rounded text-cyan-700 font-mono shadow-sm border border-slate-100">
                    Output: {width} x {height} px
                </div>
            </div>
            <div className="space-y-4 md:space-y-6 bg-white p-4 md:p-6 rounded-2xl h-fit border border-slate-200 shadow-sm">
                <h3 className="text-base md:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2 md:pb-4">Resize Settings</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <label className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">Width (px)</label>
                        <input 
                            type="text" 
                            value={width || ''} 
                            onChange={(e) => {
                                const val = toEnglishDigits(e.target.value);
                                if (/^\d*$/.test(val)) {
                                    const newW = val === '' ? 0 : parseInt(val);
                                    setWidth(newW);
                                    if(aspectRatio && originalDimensions) {
                                      setHeight(Math.round(newW * (originalDimensions.height / originalDimensions.width)) || 0); 
                                    }
                                }
                            }} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-3 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all text-sm md:text-base" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">Height (px)</label>
                        <input 
                            type="text" 
                            value={height || ''} 
                             onChange={(e) => {
                                const val = toEnglishDigits(e.target.value);
                                if (/^\d*$/.test(val)) {
                                    const newH = val === '' ? 0 : parseInt(val);
                                    setHeight(newH);
                                    if(aspectRatio && originalDimensions) {
                                      setWidth(Math.round(newH * (originalDimensions.width / originalDimensions.height)) || 0); 
                                    }
                                }
                            }} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-3 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all text-sm md:text-base" 
                        />
                    </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 md:p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input 
                        type="checkbox" 
                        id="ratio" 
                        checked={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <label htmlFor="ratio" className="text-slate-700 text-sm font-medium">Maintain Aspect Ratio</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <label className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">Target Size (KB) <span className="text-slate-400 text-[10px]">(Optional)</span></label>
                        <input 
                            type="text" 
                            value={targetSizeKB} 
                            onChange={(e) => {
                                 const val = toEnglishDigits(e.target.value);
                                 if (/^\d*\.?\d*$/.test(val)) {
                                     setTargetSizeKB(val);
                                 }
                            }}
                            placeholder="e.g. 500"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-3 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all text-sm md:text-base" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">Output Format</label>
                        <select 
                            value={outputFormat} 
                            onChange={(e) => setOutputFormat(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-3 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all text-sm md:text-base"
                        >
                            <option value="image/jpeg">JPG / JPEG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WEBP</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2 md:pt-4">
                    <button onClick={handleResize} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 md:py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-200 text-sm md:text-base">
                        <Download className="w-5 h-5" />
                        <span>Download Resized Image</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
