import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { ToastProvider } from '../components/Toast';

const SITE_URL = 'https://alif-tools.mnr.bd';
const SITE_NAME = 'ALIF Tool';
const OG_IMAGE = '/og-image.png';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} — Free Online Image, PDF & Markdown Tools`,
        template: `%s | ${SITE_NAME}`,
    },
    description:
        'ALIF Tool is a free online toolkit to resize, crop and convert images, merge, split and watermark PDFs, and convert Markdown to PDF or DOC. Fast, private and 100% free — no signup.',
    keywords: [
        'alif tool', 'alif tools', 'tool alif', 'mnr tool', 'mnr tools', 'alif-tools',
        'free online tools', 'image resizer', 'image cropper', 'image converter',
        'image to pdf', 'svg to png', 'pdf merge', 'pdf split', 'pdf watermark',
        'pdf to image', 'pdf to word', 'pdf to txt', 'pdf to markdown',
        'markdown to pdf', 'markdown to doc', 'markdown to txt',
        'pdf tools', 'image tools', 'online file tools', 'bangla tools',
    ],
    authors: [{ name: 'ALIF' }],
    creator: 'ALIF',
    publisher: 'ALIF Tool',
    applicationName: SITE_NAME,
    category: 'technology',
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${SITE_URL}/`,
        languages: { en: `${SITE_URL}/`, 'x-default': `${SITE_URL}/` },
    },
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },
    manifest: '/site.webmanifest',
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_US',
        url: `${SITE_URL}/`,
        title: `${SITE_NAME} — Free Online Image, PDF & Markdown Tools`,
        description:
            'Free online toolkit for images, PDFs and Markdown. Resize, crop, convert, merge, split and watermark — fast, private and free.',
        images: [
            { url: OG_IMAGE, width: 1200, height: 630, alt: 'ALIF Tool — free online image, PDF and Markdown tools' },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${SITE_NAME} — Free Online Image, PDF & Markdown Tools`,
        description:
            'Free online toolkit for images, PDFs and Markdown. Resize, crop, convert, merge, split and watermark — fast, private and free.',
        images: [OG_IMAGE],
    },
    other: {
        'application-name': SITE_NAME,
        'apple-mobile-web-app-title': SITE_NAME,
        'format-detection': 'telephone=no',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#111827',
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            alternateName: ['Alif Tools', 'ALIF TOOLS', 'MNR Tool', 'MNR Tools'],
            description: 'Free online toolkit for image, PDF and Markdown processing.',
            inLanguage: 'en',
            publisher: { '@id': `${SITE_URL}/#organization` },
        },
        {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/favicon.svg`,
                width: 64,
                height: 64,
            },
            image: `${SITE_URL}${OG_IMAGE}`,
            sameAs: [
                'https://github.com/With-ALIF',
                'https://www.facebook.com/withALIF',
                'https://instagram.com/withalif_2025',
            ],
        },
        {
            '@type': 'WebApplication',
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
            image: `${SITE_URL}${OG_IMAGE}`,
            description:
                'Free browser-based tools to resize, crop and convert images, merge, split and watermark PDFs, and convert Markdown files — all processed locally in your browser.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            featureList: [
                'Image Resizer', 'Image Cropper', 'Image Converter', 'Image to PDF',
                'SVG Converter', 'Image to Text (OCR)',
                'Merge PDF', 'Split PDF', 'PDF Watermark', 'PDF to Image',
                'PDF to DOC', 'PDF to TXT', 'PDF to Markdown',
                'Markdown to PDF', 'Markdown to DOC', 'Markdown to TXT',
            ],
        },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Hind+Siliguri:wght@300;400;500;600;700&family=Audiowide&family=Delius&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/react-image-crop/10.0.9/ReactCrop.min.css"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
                    integrity="sha384-n8MVd4RsNIU0tAv4ct0tNaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
                    crossOrigin="anonymous"
                />
                <script
                    src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
                    integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8"
                    crossOrigin="anonymous"
                />
                <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js" />
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" />
                <script src="https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js" />
                <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" />
                <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.pdfjsLib && (window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');`,
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="bg-sky-50">
                <ToastProvider>
                    <div className="min-h-screen flex flex-col bg-sky-50">
                        <div className="flex-grow">{children}</div>
                    </div>
                </ToastProvider>
                </body>
        </html>
    );
}