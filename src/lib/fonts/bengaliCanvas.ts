'use client';
import { NOTO_BENGALI_TTF } from './notoBengali';

/**
 * Bengali (and other complex Indic scripts) need OpenType shaping — conjunct
 * ligatures (যুক্তাক্ষর) and repositioned vowel signs are produced by the font's
 * GSUB table. jsPDF maps codepoints straight to glyphs, so it renders
 * ক + ্ + ষ as three separate glyphs instead of the ligature ক্ষ, and drops
 * pre-base matras like ি/ে to the wrong side.
 *
 * The browser's text engine (HarfBuzz) does this shaping correctly, so we
 * render Bengali runs onto a canvas with the real web font and embed them into
 * the PDF as high-resolution transparent PNGs. Latin-only text keeps the normal
 * vector path, so those PDFs stay fully selectable and small.
 */

export const BENGALI_CANVAS_FAMILY = 'NotoSansBengaliCanvas';

/** Render scale — higher is crisper but produces larger PNGs. */
const SCALE = 3;

let loaded = false;
let loading: Promise<boolean> | null = null;

/** Load the bundled Noto Sans Bengali into the document's font set (once). */
export const ensureBengaliFont = (): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof FontFace === 'undefined') return Promise.resolve(false);
    if (loaded) return Promise.resolve(true);
    if (loading) return loading;
    loading = (async () => {
        try {
            const src = `url(data:font/ttf;base64,${NOTO_BENGALI_TTF}) format('truetype')`;
            const face = new FontFace(BENGALI_CANVAS_FAMILY, src);
            await face.load();
            const anyFonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
            anyFonts?.add(face);
            loaded = true;
            return true;
        } catch (err) {
            console.error('Failed to load Bengali canvas font:', err);
            return false;
        }
    })();
    return loading;
};

const fontStack = (px: number, bold: boolean, italic: boolean): string =>
    `${italic ? 'italic ' : ''}${bold ? '700 ' : '400 '}${px}px "${BENGALI_CANVAS_FAMILY}", "Noto Sans Bengali", "Nirmala UI", "Kohinoor Bangla", sans-serif`;

let measureCtx: CanvasRenderingContext2D | null = null;
const getMeasureCtx = (): CanvasRenderingContext2D | null => {
    if (typeof document === 'undefined') return null;
    if (!measureCtx) {
        const c = document.createElement('canvas').getContext('2d');
        measureCtx = c;
    }
    return measureCtx;
};

/** Shaped advance width in pt for a Bengali run at the given font size. */
export const measureBengaliWidthPt = (text: string, sizePt: number, bold: boolean, italic: boolean): number => {
    const ctx = getMeasureCtx();
    if (!ctx) return text.length * sizePt * 0.55;
    ctx.font = fontStack(sizePt * SCALE, bold, italic);
    return ctx.measureText(text).width / SCALE;
};

export interface BengaliImage {
    dataUrl: string;
    /** Stable id for doc.addImage() so repeated runs share one PDF object. */
    alias: string;
    /** Advance width in pt — how far to move the pen after drawing. */
    advancePt: number;
    /** Offset from the pen origin to the image's top-left corner, in pt. */
    xPt: number;
    yPt: number;
    /** Image size in pt. */
    wPt: number;
    hPt: number;
}

/**
 * Same word often repeats (common words, headings, labels). Rasterising and
 * PNG-encoding each occurrence is the expensive part, so memoise the result.
 */
const imageCache = new Map<string, BengaliImage>();

/** Unique per cached image; jsPDF reuses an object when the alias repeats. */
let nextImageId = 1;

/** Drop cached rasters so consecutive conversions don't accumulate memory. */
export const clearBengaliCache = (): void => {
    imageCache.clear();
    nextImageId = 1;
};

/**
 * Render a Bengali run at the given size/color onto a transparent canvas and
 * return the PNG plus placement data. `xPt`/`yPt` are negative offsets from the
 * text pen origin (baseline start) so the caller can align it exactly like
 * doc.text() would: draw at (penX + xPt, baselineY + yPt).
 */
export const renderBengali = (
    text: string,
    sizePt: number,
    bold: boolean,
    italic: boolean,
    color: [number, number, number],
): BengaliImage | null => {
    if (typeof document === 'undefined' || !text) return null;

    const cacheKey = `${sizePt}|${bold ? 'b' : 'n'}|${italic ? 'i' : 'n'}|${color.join(',')}|${text}`;
    const cached = imageCache.get(cacheKey);
    if (cached) return cached;

    const fontPx = sizePt * SCALE;

    const measureCtx = getMeasureCtx();
    let widthPx: number;
    if (measureCtx) {
        measureCtx.font = fontStack(fontPx, bold, italic);
        widthPx = measureCtx.measureText(text).width;
    } else {
        widthPx = text.length * fontPx * 0.55;
    }

    // Generous fixed padding so tall ascenders/reph and deep descenders are
    // never clipped regardless of browser bounding-box quirks.
    const leftPad = Math.ceil(fontPx * 0.6);
    const topPad = Math.ceil(fontPx * 1.15);
    const botPad = Math.ceil(fontPx * 0.6);
    const rightPad = Math.ceil(fontPx * 0.6);
    const w = Math.max(1, leftPad + Math.ceil(widthPx) + rightPad);
    const h = Math.max(1, topPad + botPad);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.font = fontStack(fontPx, bold, italic);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillText(text, leftPad, topPad);

    let dataUrl: string;
    try {
        dataUrl = canvas.toDataURL('image/png');
    } catch (err) {
        console.error('Failed to encode Bengali run:', err);
        return null;
    }

    const image: BengaliImage = {
        dataUrl,
        alias: `bn${nextImageId++}`,
        advancePt: widthPx / SCALE,
        xPt: -leftPad / SCALE,
        yPt: -topPad / SCALE,
        wPt: w / SCALE,
        hPt: h / SCALE,
    };

    imageCache.set(cacheKey, image);
    return image;
};
