# 🚀 ALIF Tools
 ![MIT License](https://img.shields.io/badge/license-MIT-green)
 ![Made with React](https://img.shields.io/badge/react-18-blue)
 ![TypeScript](https://img.shields.io/badge/typescript-yes-blue) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)


**ALIF Tools** is a modern, fast, and privacy-focused online platform for
processing PDF and image files with ease.  
It is designed to be simple, secure, and completely free for everyone.
---

## 🌐 [Live Demo](https://alif-tools.vercel.app/) · 🗄️ [Server Repo](https://github.com/With-ALIF/alif-tools)

---
 
## 🌟 Features


- 🖼️ Image resizing, cropping & format conversion  
- 📄 PDF merge, split & convert  
- ⚡ Fast and lightweight processing  
- 🔐 Privacy-first (files are not stored permanently)  
- 💻 No installation required – works directly in the browser  
- 🆓 100% free to use  

---

## 🎯 Mission

To provide fast, reliable, and easy-to-use online tools that help users
process PDF and image files efficiently while ensuring privacy, quality,
and accessibility.

---

## 🚀 Vision

To become a trusted all-in-one digital tool platform powered by modern
web technologies and AI, accessible to users worldwide.

---

## 🧑‍💻 Founder

**Alif**  
Founder & Web Developer  

A passionate web developer focused on building simple, fast, and
privacy-friendly digital tools that solve real-world problems and
improve everyday productivity.

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript  
- **Styling:** Tailwind CSS  
- **Build Tool:** Vite  
- **Icons:** Lucide React  

---

## 🔐 Privacy & Security

User privacy is a top priority at ALIF Tools.  
All uploaded files are processed instantly and are never stored
permanently. Files are automatically removed once processing is
completed.

---

## 📈 Future Plans

ALIF Tools is continuously evolving.  
More advanced tools, smarter workflows, and AI-powered features are
planned to enhance productivity and user experience in future updates.

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome!  
Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is open-source and available under the **MIT License**.

---

⭐ If you like this project, don’t forget to give it a star!


Project Structure
```
.
├── components/
│   ├── Layout.tsx
│   ├── SuccessModal.tsx
│   └── Toast.tsx
│
├── lib/
│   ├── markdown.ts
│   ├── svg.ts
│   ├── tools.tsx
│   ├── translate.ts
│   └── utils.ts
│
├── services/
│   └── gemini.ts
│
├── src/
│   ├── img/
│   │   ├── imgconverter.tsx
│   │   ├── imgcropper.tsx
│   │   ├── imgdescriber.tsx
│   │   ├── imgresizer.tsx
│   │   ├── imgtopdf.tsx
│   │   ├── imgtotxt.tsx
│   │   └── svgconverter.tsx
│   ├── markdown/
│   │   ├── markdowntodocs.tsx
│   │   ├── markdowntoolbase.tsx
│   │   ├── markdowntopdf.tsx
│   │   └── markdowntotxt.tsx
│   ├── pdf/
│   │   ├── invertpdf.tsx
│   │   ├── mergepdf.tsx
│   │   ├── pdfdocs.tsx
│   │   ├── pdfimg.tsx
│   │   ├── pdfjsGlobal.ts
│   │   ├── pdfmarkdown.tsx
│   │   ├── pdftext.tsx
│   │   ├── pdftxt.tsx
│   │   ├── splitpdf.tsx
│   │   └── watermarkpdf.tsx
│   ├── About.tsx
│   └── Connect.tsx
│
├── public/
│   └── favicon.svg
│
├── .gitignore
├── App.tsx
├── README.md
├── index.css
├── index.html
├── index.tsx
├── package.json
├── tsconfig.json
├── types.ts
├── vercel.json
└── vite.config.ts

```

## 🧰 Available Tools

### 📄 PDF Tools
- Merge PDF
- Split PDF
- PDF to Image
- Image to PDF
- PDF to Docs (.doc)
- PDF to TXT
- PDF to Markdown

### 🖼️ Image Tools
- Resize Image
- Crop Image
- Convert Format
- SVG Converter (SVG → PNG, JPG, WebP)
- Image to PDF
- Image to Text (OCR)

### 📝 Markdown Tools
- Markdown to Docs (.doc)
- Markdown to PDF
- Markdown to TXT

## ⚙️ How It Works
```
1. Upload your file  
2. Choose a tool  
3. Process instantly  
4. Download result  
5. Files auto-deleted for privacy
```

## 🧑‍💻 Local Development

### Prerequisites
- Node.js >= 18
- npm / yarn / pnpm

### Installation
```bash
git clone https://github.com/With-ALIF/alif-tools.git
cd alif-tools
npm install
npm run dev
```
## ❓ FAQ

**Are my files stored?**  
No. Files are processed locally and deleted instantly.

**Is it free?**  
Yes, 100% free.
