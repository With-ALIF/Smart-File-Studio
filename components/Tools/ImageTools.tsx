import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { jsPDF } from 'jspdf';
import { Download, Sparkles, RefreshCw, FileImage, Scissors, Image as ImageIcon, Send, Construction } from 'lucide-react';
import { readFileAsDataURL, downloadFile, toEnglishDigits } from '../../lib/utils';
import { describeImage } from '../../services/gemini';
import { useToast } from '../Toast';
import { SuccessModal } from '../SuccessModal';

// --- Helper: Latex Renderer ---
const LatexRenderer: React.FC<{ text: string }> = ({ text }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [katexLoaded, setKatexLoaded] = useState(false);

    // Wait for KaTeX to load
    useEffect(() => {
        const checkKatex = () => {
            if ((window as any).katex) {
                setKatexLoaded(true);
            }
        };

        checkKatex();
        const interval = setInterval(checkKatex, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !katexLoaded) return;

        const renderMath = () => {
             const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
             containerRef.current!.innerHTML = '';
             parts.forEach(part => {
                 if (part.startsWith('$$') && part.endsWith('$$')) {
                     const math = part.slice(2, -2);
                     const el = document.createElement('div');
                     el.className = "my-3 overflow-x-auto text-center";
                     try { (window as any).katex.render(math, el, { displayMode: true, throwOnError: false, output: 'html' }); } 
                     catch(e) { el.textContent = math; }
                     containerRef.current!.appendChild(el);
                 } else if (part.startsWith('$$') && part.endsWith('$$')) { // Corrected from original code logic duplication check
                     const math = part.slice(1, -1);
                     const el = document.createElement('span');
                     try { (window as any).katex.render(math, el, { displayMode: false, throwOnError: false, output: 'html' }); } 
                     catch(e) { el.textContent = math; }
                     containerRef.current!.appendChild(el);
                 } else if (part.startsWith('$') && part.endsWith('$')) {
                     const math = part.slice(1, -1);
                     const el = document.createElement('span');
                     try { (window as any).katex.render(math, el, { displayMode: false, throwOnError: false, output: 'html' }); } 
                     catch(e) { el.textContent = math; }
                     containerRef.current!.appendChild(el);
                 } else {
                     const span = document.createElement('span');
                     span.innerHTML = part.replace(/\n/g, '<br/>');
                     containerRef.current!.appendChild(span);
                 }
             });
        };

        renderMath();
    }, [text, katexLoaded]);

    if (!katexLoaded) return <div className="whitespace-pre-line text-slate-700 text-sm">{text.replace(/\$\$/g, '').replace(/\$/g, '')}</div>;

    return <div ref={containerRef} className="text-slate-700 leading-relaxed space-y-2 font-medium text-sm md:text-base" />;
};

// --- Image Resizer ---
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
  const { showToast } = useToast();

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

// --- Image Cropper ---
export const ImageCropper: React.FC = () => {
    const [src, setSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [success, setSuccess] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const { showToast } = useToast();
  
    const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const url = await readFileAsDataURL(e.target.files[0]);
        setSrc(url);
      }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 16 / 9, width, height), width, height);
        setCrop(crop);
        setCompletedCrop(crop);
    };

    const setRatio = (ratio: number) => {
        if(imgRef.current) {
            const { width, height } = imgRef.current;
            const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, ratio, width, height), width, height);
            setCrop(newCrop);
            setCompletedCrop(newCrop);
        }
    };
  
    const getCroppedImg = () => {
      if (!completedCrop || !imgRef.current) return;
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext('2d');
  
      if (ctx) {
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0, completedCrop.width * scaleX, completedCrop.height * scaleY
        );
        
        canvas.toBlob((blob) => {
            if(blob) {
                downloadFile(blob, 'cropped-image.png');
                setSuccess(true);
            }
        }, 'image/png');
      }
    };
  
    return (
      <div className="space-y-4 md:space-y-6">
        <SuccessModal isOpen={success} onClose={() => setSuccess(false)} onReset={() => setSrc(null)} />
        {!src ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-purple-500 hover:bg-purple-50/30 transition-all bg-white">
                <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" id="crop-upload" />
                <label htmlFor="crop-upload" className="cursor-pointer flex flex-col items-center group">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                        <Scissors className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Click to upload image</h3>
                    <p className="text-slate-500 text-xs md:text-sm">Crop nicely with presets</p>
                </label>
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
                <div className="flex-1 bg-white p-4 md:p-6 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={undefined}>
                        <img src={src} onLoad={onImageLoad} ref={imgRef} alt="Crop me" className="max-h-[50vh] md:max-h-[60vh] object-contain" />
                    </ReactCrop>
                </div>
                <div className="w-full lg:w-80 bg-white p-4 md:p-6 rounded-2xl h-fit border border-slate-200 shadow-sm space-y-4 md:space-y-6">
                     <h3 className="text-base md:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2 md:pb-4">Crop Settings</h3>
                     <div>
                        <label className="block text-xs md:text-sm text-slate-500 mb-2 md:mb-3 font-medium">Aspect Ratio</label>
                        <div className="grid grid-cols-3 gap-2">
                             <button onClick={() => setRatio(1)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">1:1</button>
                             <button onClick={() => setRatio(16/9)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">16:9</button>
                             <button onClick={() => setRatio(4/3)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">4:3</button>
                             <button onClick={() => setRatio(9/16)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">9:16</button>
                             <button onClick={() => setRatio(2/3)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">2:3</button>
                             <button onClick={() => setCrop(undefined)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">Free</button>
                        </div>
                     </div>
                    <button onClick={getCroppedImg} className="w-full px-4 py-3 md:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-purple-200 transition-all text-sm md:text-base">
                        <Download className="w-5 h-5" />
                        <span>Download Crop</span>
                    </button>
                </div>
            </div>
        )}
      </div>
    );
};

// --- Image Converter ---
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

// --- Image to PDF ---
export const ImageToPdf: React.FC = () => {
    const [images, setImages] = useState<{file: File, url: string}[]>([]);
    const [pageSize, setPageSize] = useState('a4');
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();
    
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
        // @ts-ignore
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

// --- AI Image Describer ---
export const ImageDescriber: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [question, setQuestion] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if(!image) return;
        setLoading(true);
        try {
            const base64 = image.split(',')[1];
            // Pass the question to the describeImage function
            const result = await describeImage(base64, fileType, question);
            // Remove asterisks from the result
            const cleanResult = result.replace(/\*/g, '');
            setDescription(cleanResult);
        } catch(e) {
            setDescription("Failed to analyze image.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {!image ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-12 text-center hover:border-violet-500 hover:bg-violet-50/30 transition-all bg-white relative overflow-hidden">
                     {/* Under Construction Banner */}
                     <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-sm">
                        <Construction className="w-3 h-3" />
                        <span>Under Construction</span>
                     </div>

                     <input type="file" accept="image/*" onChange={async (e) => {
                        if(e.target.files?.[0]) {
                            setFileType(e.target.files[0].type);
                            setImage(await readFileAsDataURL(e.target.files[0]));
                            setDescription('');
                            setQuestion('');
                        }
                    }} className="hidden" id="ai-upload" />
                    <label htmlFor="ai-upload" className="cursor-pointer flex flex-col items-center group">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                             <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-violet-600" />
                        </div>
                        <span className="text-slate-600 font-medium text-sm md:text-base">Upload Image (Photo)</span>
                    </label>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                     <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center relative">
                         {/* Under Construction Badge on Preview */}
                         <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-sm z-10">
                            <Construction className="w-3 h-3" />
                            <span>Beta</span>
                         </div>
                        <img src={image} className="max-h-64 md:max-h-80 mx-auto rounded-lg object-contain" alt="Target" />
                     </div>
                     <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col border border-slate-200 shadow-sm">
                        <h3 className="text-base md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="text-violet-500 w-5 h-5" />
                            AI Analyst & Solver (Bengali)
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-xs md:text-sm text-slate-500 mb-2 font-medium">Ask a question (Optional)</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="প্রশ্ন জিজ্ঞাসা করুন..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all text-sm md:text-base"
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
                                />
                                <Send className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50 rounded-xl p-4 overflow-y-auto max-h-48 md:max-h-60 mb-4 border border-slate-200">
                            {loading ? (
                                <div className="flex items-center justify-center h-full gap-2">
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" />
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce delay-150" />
                                </div>
                            ) : (
                                description ? (
                                    <LatexRenderer text={description} />
                                ) : (
                                    <div className="text-center text-slate-400 text-xs md:text-sm py-8">
                                        <p>Click 'Analyze' to start.</p>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={handleAnalyze} 
                                disabled={loading}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg text-sm md:text-base ${loading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200'}`}
                            >
                                {loading ? 'Thinking...' : 'Analyze'}
                            </button>
                             <button 
                                onClick={() => { setImage(null); setDescription(''); setQuestion(''); }}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors text-sm md:text-base"
                            >
                                Reset
                            </button>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};