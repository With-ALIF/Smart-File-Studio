import React from "react";
import { Link } from "react-router-dom";
import {
  FileImage,
  FileText,
  FileCode,
  ShieldCheck,
  Zap,
  Gift,
  Smartphone,
  Upload,
  Wand2,
  Download,
  Trash2,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

const toolGroups = [
  {
    icon: FileImage,
    title: "Image Tools",
    color: "text-sky-600",
    bg: "bg-sky-50",
    tools: [
      "Image Resizer",
      "Image Cropper",
      "Image Converter (JPG · PNG · WebP)",
      "Image to PDF",
      "SVG Converter",
      "Image to Text (OCR)",
    ],
  },
  {
    icon: FileText,
    title: "PDF Tools",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    tools: [
      "Merge PDF",
      "Split PDF",
      "Watermark PDF",
      "PDF to Image",
      "PDF to Docs",
      "PDF to TXT",
      "PDF to Markdown",
    ],
  },
  {
    icon: FileCode,
    title: "Markdown Tools",
    color: "text-violet-600",
    bg: "bg-violet-50",
    tools: [
      "Markdown to Docs",
      "Markdown to PDF",
      "Markdown to TXT",
    ],
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Privacy First",
    text: "Everything runs inside your browser. Your files are never uploaded to a server.",
  },
  {
    icon: Zap,
    title: "Fast & Lightweight",
    text: "Instant, in-browser processing with no waiting queues and no downloads to staff.",
  },
  {
    icon: Gift,
    title: "100% Free",
    text: "Every tool is completely free to use, with no sign-up, no limits and no watermarks.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    text: "Use it on desktop, tablet or phone — no installation or account required.",
  },
];

const steps = [
  { icon: Upload, title: "Upload", text: "Choose your file or paste your content." },
  { icon: Wand2, title: "Convert", text: "Pick a tool and let it process instantly." },
  { icon: Download, title: "Download", text: "Save the result, ready to use." },
  { icon: Trash2, title: "Auto Clean", text: "Nothing is stored — your data stays with you." },
];

const About: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sky-500 hover:text-sky-600 mb-4 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </Link>
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 md:p-10 space-y-16">

        {/* Header */}
        <div className="text-center space-y-5">
          <img
            src="/favicon.svg"
            alt="ALIF Tools Logo"
            className="w-28 h-28 mx-auto rounded-2xl object-contain border border-slate-100 shadow-sm bg-white p-1"
          />

          <h1 className="text-4xl font-extrabold text-slate-800">
            About ALIF Tools
          </h1>

          <div>
            <h3 className="text-2xl font-bold text-slate-800">Md Abdullah Al Khalid Alif</h3>
            <p className="text-sm text-slate-500">
              Founder & Web Developer
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
            A passionate web developer dedicated to building simple, fast,
            and privacy-friendly digital tools that solve real-world
            problems and make everyday tasks easier for everyone.
          </p>
        </div>

        {/* About Content */}
        <div className="space-y-6 text-slate-600 text-sm leading-relaxed max-w-4xl mx-auto">
          <p>
            <strong>ALIF Tools</strong> is a modern, browser-based utility
            platform designed to simplify everyday work with{" "}
            <strong>images, PDFs, and Markdown</strong>. It is built for
            students, professionals, and everyday users who want quick
            results without installing complicated software.
          </p>

          <p>
            From resizing and converting images to merging, splitting and
            extracting text from PDFs, and turning Markdown into polished
            documents — every tool runs instantly and reliably through a
            clean, intuitive, and user-friendly interface.
          </p>

          <p>
            We take <strong>privacy and security</strong> seriously. All
            processing happens locally on your device, so your files never
            leave your browser. Nothing is uploaded, stored, or shared —
            your data stays yours.
          </p>
        </div>

        {/* Tool Categories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 text-center">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {toolGroups.map((group) => (
              <div
                key={group.title}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${group.bg} ${group.color}`}
                >
                  <group.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {group.title}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {group.tools.map((tool) => (
                    <li key={tool} className="flex items-start gap-2">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${group.color} bg-current shrink-0`} />
                      <span>{tool}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 text-center">
            Why Choose ALIF Tools?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-[#0BA6DF] border border-slate-100 shadow-sm">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="text-center space-y-3 bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center text-[#0BA6DF] border border-slate-100 shadow-sm relative">
                  <step.icon className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0BA6DF] text-white text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">
              🎯 Our Mission
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To provide fast, reliable, and easy-to-use online tools that
              help users work with images, PDFs, and documents efficiently
              while maintaining privacy, quality, and accessibility.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">
              🚀 Our Vision
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To become a trusted all-in-one digital tool platform powered
              by modern web technologies and AI, accessible to users
              worldwide.
            </p>
          </div>
        </div>

        {/* Future Note */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#0BA6DF] uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            Always Improving
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            ALIF Tools is constantly evolving. More advanced tools, smarter
            workflows, and AI-powered features are planned to enhance
            productivity and user experience in upcoming updates.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;
