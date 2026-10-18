export type SvgFormat = 'png' | 'jpeg' | 'webp';

export interface SvgDimensions {
  width: number;
  height: number;
}

export interface PreparedSvg {
  markup: string;
  dimensions: SvgDimensions;
  strippedElements: number;
}

export interface SvgConvertOptions {
  source: string;
  format: SvgFormat;
  width: number;
  height: number;
  background: string | null;
  quality: number;
}

export const SVG_MAX_BYTES = 10 * 1024 * 1024;

export const SVG_DEFAULT_QUALITY = 90;

export const MAX_OUTPUT_DIMENSION = 8000;

export const MAX_OUTPUT_PIXELS = 40_000_000;

export const FALLBACK_SVG_DIMENSIONS: SvgDimensions = { width: 512, height: 512 };

const FORMAT_MIME: Record<SvgFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const FORMAT_EXTENSION: Record<SvgFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
};

const FORMAT_LABEL: Record<SvgFormat, string> = {
  png: 'PNG',
  jpeg: 'JPG',
  webp: 'WebP',
};

const FORBIDDEN_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
  'handler',
  'listener',
  'set',
  'animate',
  'animatetransform',
  'animatemotion',
  'discard',
  'feimage',
]);

const URL_ATTRIBUTES = new Set(['src', 'href', 'xlink:href', 'xml:href']);

const DANGEROUS_VALUE = /(?:javascript|vbscript|data\s*:\s*text\/html|expression\s*\()/i;

const SAFE_DATA_URI = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i;

export const getFormatMime = (format: SvgFormat): string => FORMAT_MIME[format];

export const getFormatExtension = (format: SvgFormat): string => FORMAT_EXTENSION[format];

export const getFormatLabel = (format: SvgFormat): string => FORMAT_LABEL[format];

export const formatSupportsTransparency = (format: SvgFormat): boolean => format !== 'jpeg';

export const formatBytes = (bytes: number): string => {
  if (!isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${index === 0 ? value : value.toFixed(1)} ${units[index]}`;
};

export const isSvgFile = (file: File): boolean =>
  /\.svg$/i.test(file.name) || file.type === 'image/svg+xml' || file.type === 'image/svg';

export const validateSvgFile = (file: File | null): string | null => {
  if (!file) return 'No file selected.';
  if (!isSvgFile(file)) return 'Unsupported file type. Please choose an SVG file (.svg).';
  if (file.size === 0) return 'This file is empty. Please choose a different SVG file.';
  if (file.size > SVG_MAX_BYTES) {
    return `This file is too large. The maximum supported size is ${formatBytes(SVG_MAX_BYTES)}.`;
  }
  return null;
};

export const clampDimension = (value: number): number =>
  Math.min(Math.max(Math.round(value), 1), MAX_OUTPUT_DIMENSION);

export const validateOutputDimensions = (width: number, height: number): string | null => {
  if (!isFinite(width) || !isFinite(height) || width < 1 || height < 1) {
    return 'Width and height must be at least 1 pixel.';
  }
  if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION) {
    return `Width and height cannot exceed ${MAX_OUTPUT_DIMENSION} pixels.`;
  }
  if (width * height > MAX_OUTPUT_PIXELS) {
    return `That output is too large (${Math.round(width * height / 1000000)} megapixels). Please use smaller dimensions.`;
  }
  return null;
};

export const fitOutputDimensions = (dimensions: SvgDimensions): SvgDimensions => {
  const width = Math.max(1, Math.round(dimensions.width));
  const height = Math.max(1, Math.round(dimensions.height));
  const scale = Math.min(
    1,
    MAX_OUTPUT_DIMENSION / width,
    MAX_OUTPUT_DIMENSION / height,
    Math.sqrt(MAX_OUTPUT_PIXELS / (width * height))
  );
  if (scale >= 1) return { width, height };
  return { width: clampDimension(width * scale), height: clampDimension(height * scale) };
};

export const buildOutputFilename = (sourceName: string, extension: string): string => {
  const base = sourceName.replace(/\.svg$/i, '');
  const safe = base.replace(/[^a-z0-9._-]+/gi, '-').replace(/^[-.]+|[-.]+$/g, '');
  return `${safe || 'image'}-converted.${extension}`;
};

export const isFormatSupported = (format: SvgFormat): boolean => {
  if (format !== 'webp') return true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

const UNIT_SCALE: Record<string, number> = {
  '': 1,
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
};

const parseLength = (value: string | null): number | null => {
  if (!value) return null;
  const match = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-z%]*)\s*$/.exec(value);
  if (!match) return null;
  const amount = parseFloat(match[1]);
  if (!isFinite(amount) || amount <= 0) return null;
  const unit = match[2].toLowerCase();
  if (unit === '%') return null;
  const scale = UNIT_SCALE[unit];
  if (scale === undefined) return null;
  const pixels = amount * scale;
  return isFinite(pixels) && pixels > 0 ? pixels : null;
};

export const readSvgDimensions = (svg: Element): SvgDimensions | null => {
  const width = parseLength(svg.getAttribute('width'));
  const height = parseLength(svg.getAttribute('height'));

  if (width && height) return { width: Math.round(width), height: Math.round(height) };

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => isFinite(n)) && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }

  if (width) return { width: Math.round(width), height: Math.round(width) };
  if (height) return { width: Math.round(height), height: Math.round(height) };

  return null;
};

const isSafeUrl = (value: string): boolean => {
  const url = value.trim();
  if (url.startsWith('#')) return true;
  if (SAFE_DATA_URI.test(url)) return true;
  return false;
};

const sanitizeCss = (css: string): string =>
  css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/url\(\s*(['"]?)([^)]*?)\1\s*\)/gi, (match, _quote, target) =>
      isSafeUrl(target) ? match : 'none'
    );

const sanitizeAttributes = (element: Element): number => {
  let removed = 0;
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value ?? '';

    if (name.startsWith('on')) {
      element.removeAttribute(attribute.name);
      removed += 1;
      continue;
    }

    if (URL_ATTRIBUTES.has(name)) {
      if (!isSafeUrl(value)) {
        element.removeAttribute(attribute.name);
        removed += 1;
      }
      continue;
    }

    if (DANGEROUS_VALUE.test(value)) {
      element.removeAttribute(attribute.name);
      removed += 1;
      continue;
    }

    if (name === 'style') {
      const safe = sanitizeCss(value);
      if (safe !== value) {
        if (safe.trim()) element.setAttribute(attribute.name, safe);
        else element.removeAttribute(attribute.name);
        removed += 1;
      }
      continue;
    }
  }
  return removed;
};

const sanitizeTree = (node: Element): number => {
  let removed = 0;
  for (const child of Array.from(node.children)) {
    const tagName = child.localName.toLowerCase();

    if (FORBIDDEN_TAGS.has(tagName)) {
      node.removeChild(child);
      removed += 1;
      continue;
    }

    removed += sanitizeAttributes(child);

    if (tagName === 'style') {
      child.textContent = sanitizeCss(child.textContent ?? '');
      continue;
    }

    removed += sanitizeTree(child);
  }
  return removed;
};

export const prepareSvgSource = (raw: string): PreparedSvg => {
  const source = (raw ?? '').replace(/^\uFEFF/, '').trim();
  if (!source) {
    throw new Error('This file is empty. Please choose a different SVG file.');
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
    throw new Error('This SVG declares a DOCTYPE or entity, which is not allowed for safety reasons.');
  }

  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');

  if (doc.getElementsByTagNameNS('*', 'parsererror').length > 0) {
    throw new Error('This file is not a valid SVG. Please check the markup and try again.');
  }

  const root = doc.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg') {
    throw new Error('This file is not a valid SVG. The root element must be <svg>.');
  }

  const strippedElements = sanitizeTree(root);

  const dimensions = readSvgDimensions(root) ?? FALLBACK_SVG_DIMENSIONS;
  const fitted = fitOutputDimensions(dimensions);

  root.setAttribute('width', String(fitted.width));
  root.setAttribute('height', String(fitted.height));

  const markup = new XMLSerializer().serializeToString(root);

  return { markup, dimensions: fitted, strippedElements };
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Your browser could not render this SVG.'));
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            reject(new Error('Your browser could not export this image. Please try a smaller size.'));
            return;
          }
          resolve(blob);
        },
        mime,
        quality
      );
    } catch {
      reject(new Error('Your browser refused to export this image format.'));
    }
  });

export const nextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });

export const convertSvgToBlob = async (options: SvgConvertOptions): Promise<Blob> => {
  const sizeError = validateOutputDimensions(options.width, options.height);
  if (sizeError) throw new Error(sizeError);

  const width = clampDimension(options.width);
  const height = clampDimension(options.height);

  if (options.format === 'webp' && !isFormatSupported('webp')) {
    throw new Error('This browser cannot export WebP images. Please choose PNG or JPG.');
  }

  if (options.format === 'jpeg' && options.background === null) {
    throw new Error('JPEG does not support transparency. Please pick a background colour.');
  }

  const svgBlob = new Blob([options.source], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  let image: HTMLImageElement;
  try {
    image = await loadImage(svgUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas rendering is not available in this browser.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, width, height);
  }

  try {
    ctx.drawImage(image, 0, 0, width, height);
  } catch {
    throw new Error('This SVG could not be drawn onto the canvas.');
  }

  const quality = Math.min(Math.max(options.quality, 1), 100) / 100;
  return canvasToBlob(canvas, getFormatMime(options.format), quality);
};