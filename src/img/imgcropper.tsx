import React, { useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Download, Scissors } from 'lucide-react';
import { readFileAsDataURL, downloadFile } from '../../lib/utils';
import { SuccessModal } from '../../components/SuccessModal';

export const ImageCropper: React.FC = () => {
    const [src, setSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [success, setSuccess] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
  
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
