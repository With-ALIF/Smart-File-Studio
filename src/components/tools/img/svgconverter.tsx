'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardPaste,
    Download,
    Eraser,
    FileCode,
    Info,
    Loader2,
    Lock,
    RotateCcw,
    ShieldCheck,
    UploadCloud
} from 'lucide-react';
import { downloadFile, toEnglishDigits } from '../../../lib/utils';
import { useToast } from '../../../components/Toast';
import { SuccessModal } from '../../../components/SuccessModal';
import {
    MAX_OUTPUT_DIMENSION,
    PreparedSvg,
    SVG_DEFAULT_QUALITY,
    SVG_MAX_BYTES,
    SvgFormat,
    buildOutputFilename,
    convertSvgToBlob,
    fitOutputDimensions,
    formatBytes,
    formatSupportsTransparency,
    getFormatExtension,
    isFormatSupported,
    nextPaint,
    prepareSvgSource,
    validateOutputDimensions,
    validateSvgFile
} from '../../../lib/svg';

type ConverterStatus = 'idle' | 'converting' | 'ready' | 'error';

type InputMode = 'upload' | 'paste';

interface OutputBlob {
    blob: Blob;
    url: string;
    filename: string;
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0BA6DF" />
      <stop offset="100%" stop-color="#2C4B9B" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="18" fill="url(#g)" />
  <circle cx="50" cy="50" r="26" fill="#ffffff" opacity="0.9" />
  <path d="M38 50 L46 60 L64 40" stroke="#0BA6DF" stroke-width="7" fill="none" stroke-linecap="round" />
  <text x="108" y="48" font-family="sans-serif" font-size="26" font-weight="700" fill="#2C4B9B">ALIF</text>
  <text x="108" y="72" font-family="sans-serif" font-size="14" fill="#64748B">TOOLS</text>
</svg>`;

const FORMATS: SvgFormat[] = ['png', 'jpeg', 'webp'];

const FORMAT_TILE: Record<SvgFormat, { label: string; mime: string }> = {
    png: { label: 'PNG', mime: 'image/png' },
    jpeg: { label: 'JPG', mime: 'image/jpeg' },
    webp: { label: 'WebP', mime: 'image/webp' }
};

const PREVIEW_CHECKERBOARD: React.CSSProperties = {
    backgroundImage:
        'linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
};

const controlClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all text-sm md:text-base';

export const SvgConverter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prepared, setPrepared] = useState<PreparedSvg | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [format, setFormat] = useState<SvgFormat>('png');
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [aspectRatio, setAspectRatio] = useState(true);
    const [transparent, setTransparent] = useState(true);
    const [background, setBackground] = useState('#ffffff');
    const [quality, setQuality] = useState(SVG_DEFAULT_QUALITY);
    const [status, setStatus] = useState<ConverterStatus>('idle');
    const [output, setOutput] = useState<OutputBlob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [webpSupported, setWebpSupported] = useState(true);
    const [success, setSuccess] = useState(false);
    const [inputMode, setInputMode] = useState<InputMode>('upload');
    const [pastedCode, setPastedCode] = useState('');

    const sourceUrlRef = useRef<string | null>(null);
    const outputUrlRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        setWebpSupported(isFormatSupported('webp'));
    }, []);

    const replaceUrl = useCallback((ref: React.MutableRefObject<string | null>, next: string | null) => {
        if (ref.current) URL.revokeObjectURL(ref.current);
        ref.current = next;
    }, []);

    useEffect(
        () => () => {
            if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
            if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
        },
        []
    );

    const reset = useCallback(() => {
        replaceUrl(sourceUrlRef, null);
        replaceUrl(outputUrlRef, null);
        setFile(null);
        setPrepared(null);
        setSourceUrl(null);
        setWidth(0);
        setHeight(0);
        setFormat('png');
        setAspectRatio(true);
        setTransparent(true);
        setBackground('#ffffff');
        setQuality(SVG_DEFAULT_QUALITY);
        setStatus('idle');
        setOutput(null);
        setError(null);
        setWarning(null);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [replaceUrl]);

    const loadFile = useCallback(
        async (candidate: File) => {
            const fileError = validateSvgFile(candidate);
            if (fileError) {
                setError(fileError);
                setStatus('error');
                setPrepared(null);
                setOutput(null);
                replaceUrl(sourceUrlRef, null);
                setSourceUrl(null);
                setFile(null);
                showToast(fileError, 'error');
                return;
            }

            setStatus('converting');
            setError(null);
            setWarning(null);

            try {
                const text = await candidate.text();
                const result = prepareSvgSource(text);
                const fitted = fitOutputDimensions(result.dimensions);
                const url = URL.createObjectURL(new Blob([result.markup], { type: 'image/svg+xml;charset=utf-8' }));

                replaceUrl(sourceUrlRef, url);
                setSourceUrl(url);
                setFile(candidate);
                setPrepared(result);
                setWidth(fitted.width);
                setHeight(fitted.height);

                setWarning(
                    result.strippedElements > 0
                        ? `${result.strippedElements} unsafe or unsupported element${result.strippedElements === 1 ? '' : 's'} (script, animation or external reference) ${result.strippedElements === 1 ? 'was' : 'were'} removed before rendering.`
                        : null
                );
            } catch (err) {
                const message = err instanceof Error ? err.message : 'This SVG could not be read.';
                setError(message);
                setStatus('error');
                setPrepared(null);
                setOutput(null);
                setFile(null);
                replaceUrl(sourceUrlRef, null);
                setSourceUrl(null);
                showToast(message, 'error');
            }
        },
        [replaceUrl, showToast]
    );

    const loadPastedCode = useCallback(async () => {
        const code = pastedCode.trim();
        if (!code) {
            const message = 'Paste your SVG code first.';
            setError(message);
            setStatus('error');
            showToast(message, 'error');
            return;
        }
        if (new Blob([code]).size > SVG_MAX_BYTES) {
            const message = `Pasted code is too large. The maximum supported size is ${formatBytes(SVG_MAX_BYTES)}.`;
            setError(message);
            setStatus('error');
            showToast(message, 'error');
            return;
        }
        await loadFile(new File([code], 'pasted.svg', { type: 'image/svg+xml' }));
    }, [loadFile, pastedCode, showToast]);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        e.target.value = '';
        if (selected) await loadFile(selected);
    };

    const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const dropped = e.dataTransfer?.files?.[0];
        if (dropped) await loadFile(dropped);
    };

    const activeBackground = formatSupportsTransparency(format) && transparent ? null : background;

    useEffect(() => {
        if (!prepared) {
            setStatus('idle');
            setOutput(null);
            return;
        }

        let cancelled = false;

        const run = async () => {
            setStatus('converting');

            const sizeError = validateOutputDimensions(width, height);
            if (sizeError) {
                replaceUrl(outputUrlRef, null);
                setOutput(null);
                setError(sizeError);
                setStatus('error');
                return;
            }

            await nextPaint();
            if (cancelled) return;

            try {
                const blob = await convertSvgToBlob({
                    source: prepared.markup,
                    format,
                    width,
                    height,
                    background: activeBackground,
                    quality
                });

                if (cancelled) return;

                const url = URL.createObjectURL(blob);
                replaceUrl(outputUrlRef, url);
                setOutput({
                    blob,
                    url,
                    filename: buildOutputFilename(file?.name ?? 'image.svg', getFormatExtension(format))
                });
                setError(null);
                setStatus('ready');
            } catch (err) {
                if (cancelled) return;
                replaceUrl(outputUrlRef, null);
                setOutput(null);
                setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
                setStatus('error');
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [prepared, format, width, height, activeBackground, quality, file, replaceUrl]);

    const handleDownload = () => {
        if (!output) {
            showToast('Nothing to download yet.', 'error');
            return;
        }
        downloadFile(output.blob, output.filename);
        setSuccess(true);
    };

    const dropzoneClass = isDragging
        ? 'border-violet-500 bg-violet-50/60 ring-4 ring-violet-100'
        : 'border-slate-300 hover:border-violet-500 hover:bg-violet-50/30';

    const previewPanel =
        'bg-slate-50 border border-slate-200 rounded-2xl p-3 md:p-4 flex items-center justify-center overflow-hidden shadow-sm relative';

    return (
        <div className="space-y-4 md:space-y-6">
            <SuccessModal
                isOpen={success}
                onClose={() => setSuccess(false)}
                onReset={reset}
                title="Conversion Complete!"
                message="Your image has been converted and the download has started."
            />

            <div className="text-center">
                <p className="flex items-center justify-center gap-1.5 text-[11px] md:text-xs text-emerald-700 font-medium">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Your files never leave your device. All conversions happen locally in your browser.
                </p>
            </div>

            {!prepared ? (
                <div className="space-y-3 md:space-y-4">
                    <div role="group" aria-label="Input method" className="flex justify-center">
                        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto sm:min-w-[340px]">
                            <button
                                type="button"
                                aria-pressed={inputMode === 'upload'}
                                onClick={() => setInputMode('upload')}
                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                                    inputMode === 'upload' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <UploadCloud className="w-4 h-4" />
                                Upload File
                            </button>
                            <button
                                type="button"
                                aria-pressed={inputMode === 'paste'}
                                onClick={() => setInputMode('paste')}
                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                                    inputMode === 'paste' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <ClipboardPaste className="w-4 h-4" />
                                Paste Code
                            </button>
                        </div>
                    </div>

                    {inputMode === 'upload' ? (
                    <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                    }}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                    }}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center transition-all bg-white ${dropzoneClass}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".svg,image/svg+xml"
                        onChange={onFileChange}
                        className="sr-only peer"
                        id="svg-convert-upload"
                    />
                    <label
                        htmlFor="svg-convert-upload"
                        className="cursor-pointer flex flex-col items-center group peer-focus-visible:ring-4 peer-focus-visible:ring-violet-200 rounded-xl"
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <UploadCloud className="w-6 h-6 md:w-8 md:h-8 text-violet-600" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">
                            {isDragging ? 'Drop your SVG here' : 'Drag & drop or click to upload'}
                        </h3>
                        <p className="text-slate-500 text-xs md:text-sm">Only .svg files, up to {formatBytes(SVG_MAX_BYTES)}</p>
                    </label>
                    </div>
                    ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="svg-paste" className="block text-xs md:text-sm text-slate-500 font-medium">
                                Paste your SVG markup
                            </label>
                            <span className="text-[11px] text-slate-400 shrink-0" aria-live="polite">
                                {pastedCode.length.toLocaleString()} characters
                            </span>
                        </div>
                        <textarea
                            id="svg-paste"
                            value={pastedCode}
                            onChange={(e) => setPastedCode(e.target.value)}
                            placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <circle cx="50" cy="50" r="40" fill="#0BA6DF" />\n</svg>'}
                            rows={8}
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="w-full min-h-[180px] bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs md:text-sm text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all resize-y"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setPastedCode(SAMPLE_SVG)}
                                className="sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-colors border border-slate-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                                Try a sample
                            </button>
                            <button
                                type="button"
                                onClick={() => setPastedCode('')}
                                disabled={!pastedCode}
                                className="sm:w-auto bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                                <Eraser className="w-4 h-4" />
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => { void loadPastedCode(); }}
                                disabled={!pastedCode.trim()}
                                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 md:py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-violet-200 text-sm md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                                <FileCode className="w-5 h-5" />
                                <span>Load SVG Code</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Pasted code goes through the same safety checks as uploaded files — scripts and external references are removed.
                        </p>
                    </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 md:px-4 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileCode className="w-4 h-4 text-violet-600 shrink-0" />
                            <span className="text-sm font-semibold text-slate-700 truncate">{file?.name}</span>
                            <span className="text-xs text-slate-500 shrink-0">{formatBytes(file?.size ?? 0)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={reset}
                            className="flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-800 bg-white border border-violet-200 hover:border-violet-400 rounded-lg px-3 py-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    </div>

                    {warning && (
                        <div className="flex items-start gap-2 text-xs md:text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                            <span>{warning}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <div className={previewPanel}>
                            <div className="absolute top-3 left-3 bg-slate-900/80 text-[11px] px-2 py-1 rounded text-white backdrop-blur-md">
                                Original SVG
                            </div>
                            <div
                                className="w-full h-56 md:h-72 rounded-xl overflow-hidden flex items-center justify-center"
                                style={PREVIEW_CHECKERBOARD}
                            >
                                {sourceUrl && (
                                    <img
                                        src={sourceUrl}
                                        alt="Original SVG preview"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                )}
                            </div>
                            <div className="absolute bottom-3 right-3 bg-white/90 text-[11px] px-2 py-1 rounded text-slate-600 font-mono shadow-sm border border-slate-200">
                                {prepared.dimensions.width} × {prepared.dimensions.height} px
                            </div>
                        </div>

                        <div className="space-y-4 md:space-y-5 bg-white p-4 md:p-5 rounded-2xl h-fit border border-slate-200 shadow-sm">
                            <h3 className="text-base md:text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 md:pb-3">
                                Output Settings
                            </h3>

                            <div>
                                <span className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">
                                    Format
                                </span>
                                <div role="group" aria-label="Output format" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                                    {FORMATS.map((item) => {
                                        const disabled = item === 'webp' && !webpSupported;
                                        const active = format === item;
                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                disabled={disabled}
                                                aria-pressed={active}
                                                onClick={() => setFormat(item)}
                                                className={`py-2 rounded-lg text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                    active ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {FORMAT_TILE[item].label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-400 font-mono">
                                    {FORMAT_TILE[format].mime}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <label htmlFor="svg-width" className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">
                                        Width (px)
                                    </label>
                                    <input
                                        id="svg-width"
                                        type="text"
                                        inputMode="numeric"
                                        value={width || ''}
                                        onChange={(e) => {
                                            const val = toEnglishDigits(e.target.value);
                                            if (!/^\d*$/.test(val)) return;
                                            const nextWidth = val === '' ? 0 : parseInt(val, 10);
                                            setWidth(nextWidth);
                                            if (aspectRatio && prepared) {
                                                setHeight(
                                                    Math.round(nextWidth * (prepared.dimensions.height / prepared.dimensions.width)) || 0
                                                );
                                            }
                                        }}
                                        className={controlClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="svg-height" className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">
                                        Height (px)
                                    </label>
                                    <input
                                        id="svg-height"
                                        type="text"
                                        inputMode="numeric"
                                        value={height || ''}
                                        onChange={(e) => {
                                            const val = toEnglishDigits(e.target.value);
                                            if (!/^\d*$/.test(val)) return;
                                            const nextHeight = val === '' ? 0 : parseInt(val, 10);
                                            setHeight(nextHeight);
                                            if (aspectRatio && prepared) {
                                                setWidth(
                                                    Math.round(nextHeight * (prepared.dimensions.width / prepared.dimensions.height)) || 0
                                                );
                                            }
                                        }}
                                        className={controlClass}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="svg-ratio"
                                    checked={aspectRatio}
                                    onChange={(e) => {
                                        const locked = e.target.checked;
                                        setAspectRatio(locked);
                                        if (locked && prepared && width > 0) {
                                            setHeight(
                                                Math.round(width * (prepared.dimensions.height / prepared.dimensions.width)) || 0
                                            );
                                        }
                                    }}
                                    className="w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                />
                                <label htmlFor="svg-ratio" className="text-slate-700 text-sm font-medium cursor-pointer">
                                    Keep Aspect Ratio
                                </label>
                            </div>

                            {formatSupportsTransparency(format) && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="svg-transparent"
                                        checked={transparent}
                                        onChange={(e) => setTransparent(e.target.checked)}
                                        className="w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                    />
                                    <label htmlFor="svg-transparent" className="text-slate-700 text-sm font-medium cursor-pointer">
                                        Transparent background
                                    </label>
                                </div>
                            )}

                            <div>
                                <label htmlFor="svg-background" className="block text-xs md:text-sm text-slate-500 mb-1 md:mb-2 font-medium">
                                    Background colour
                                    {activeBackground === null && <span className="text-violet-500"> (transparent)</span>}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={background}
                                        onChange={(e) => setBackground(e.target.value)}
                                        aria-label="Background colour picker"
                                        className="w-12 h-11 shrink-0 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                    />
                                    <input
                                        id="svg-background"
                                        type="text"
                                        value={background}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setBackground(val);
                                        }}
                                        className={`${controlClass} font-mono`}
                                    />
                                </div>
                                {format === 'jpeg' && (
                                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
                                        <Info className="w-3.5 h-3.5 shrink-0" />
                                        JPEG does not support transparency, so a solid colour is always used.
                                    </p>
                                )}
                            </div>

                            {format !== 'png' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1 md:mb-2">
                                        <label htmlFor="svg-quality" className="block text-xs md:text-sm text-slate-500 font-medium">
                                            Quality
                                        </label>
                                        <span className="text-xs font-bold text-violet-700">{quality}</span>
                                    </div>
                                    <input
                                        id="svg-quality"
                                        type="range"
                                        min={1}
                                        max={100}
                                        value={quality}
                                        onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                        <span>Smaller file</span>
                                        <span>Best quality</span>
                                    </div>
                                </div>
                            )}

                            <p className="text-[11px] text-slate-400">
                                Max output: {MAX_OUTPUT_DIMENSION}px per side.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base md:text-lg font-bold text-slate-800">Converted Preview</h3>
                            {status === 'converting' && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-violet-600" role="status" aria-live="polite">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Converting…
                                </span>
                            )}
                            {status === 'ready' && output && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600" role="status" aria-live="polite">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Ready
                                </span>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5" role="alert">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={previewPanel}>
                            <div className="absolute top-3 left-3 bg-slate-900/80 text-[11px] px-2 py-1 rounded text-white backdrop-blur-md">
                                {FORMAT_TILE[format].label} · {width} × {height} px
                            </div>
                            <div
                                className="w-full h-56 md:h-80 lg:h-[440px] rounded-xl overflow-hidden flex items-center justify-center"
                                style={PREVIEW_CHECKERBOARD}
                            >
                                {output ? (
                                    <img
                                        src={output.url}
                                        alt={`Converted ${FORMAT_TILE[format].label} preview`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center text-slate-400 px-4">
                                        <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs md:text-sm">
                                            {status === 'converting' ? 'Rendering preview…' : 'No output available.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {output && (
                                <div className="absolute bottom-3 right-3 bg-white/90 text-[11px] px-2 py-1 rounded text-slate-600 font-mono shadow-sm border border-slate-200">
                                    {formatBytes(output.blob.size)}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={!output || status === 'converting'}
                                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 md:py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-violet-200 text-sm md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                                <Download className="w-5 h-5" />
                                <span>Download {output ? `.${getFormatExtension(format)}` : ''}</span>
                            </button>
                            <button
                                type="button"
                                onClick={reset}
                                className="sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 md:py-4 px-5 rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-200 text-sm md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span>Reset</span>
                            </button>
                        </div>

                        {output && (
                            <p className="text-[11px] text-slate-400 text-center break-all font-mono">{output.filename}</p>
                        )}
                    </div>
                </div>
            )}

            {!prepared && error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                </div>
            )}

            {!prepared && !error && (
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-slate-400">
                    <span>Original size up to {formatBytes(SVG_MAX_BYTES)}</span>
                    <span>PNG &amp; WebP keep transparency</span>
                    <span>No upload, ever</span>
                </div>
            )}
        </div>
    );
};
