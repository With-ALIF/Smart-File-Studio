export enum ToolCategory {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  MARKDOWN = 'MARKDOWN'
}

export enum ToolType {
  IMG_RESIZE = 'img-resize',
  IMG_CROP = 'img-crop',
  IMG_TO_PDF = 'img-to-pdf',
  IMG_CONVERT = 'img-convert',
  IMG_DESCRIBE = 'img-describe',
  IMG_TO_TXT = 'img-to-txt',
  SVG_CONVERT = 'svg-convert',
  PDF_SPLIT = 'pdf-split',
  PDF_MERGE = 'pdf-merge',
  PDF_WATERMARK = 'pdf-watermark',
  PDF_INVERT = 'pdf-invert',
  PDF_TO_IMG = 'pdf-to-img',
  PDF_TO_DOCS = 'pdf-to-docs',
  PDF_TO_TXT = 'pdf-to-txt',
  PDF_TO_MD = 'pdf-to-md',
  MD_TO_DOCS = 'md-to-docs',
  MD_TO_PDF = 'md-to-pdf',
  MD_TO_TXT = 'md-to-txt',
  WORD_TO_PDF = 'word-to-pdf',
  PPT_TO_PDF = 'ppt-to-pdf',
  HTML_TO_PDF = 'html-to-pdf'
}

export interface ToolDef {
  id: ToolType;
  title: string;
  description: string;
  subtitle?: string;
  category: ToolCategory;
  icon: string;
  color: string;
  bg: string;
}

export interface FileWithPreview extends File {
  preview?: string;
}