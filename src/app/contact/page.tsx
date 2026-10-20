'use client';
import React, { useState } from "react";
import Link from 'next/link';
import {
  Globe,
  Mail, Send,
  Github,
  MessageSquare,
  ArrowUpRight,
  ChevronLeft,
} from "lucide-react";

const channels = [
  {
    icon: Globe,
    label: "Website",
    value: "alif.mnr.bd",
    href: "https://alif.mnr.bd",
    color: "text-[#0BA6DF]",
    bg: "bg-sky-50",
  },
  {
    icon: Mail,
    label: "Email",
    value: "alifbrur16@gmail.com",
    href: "mailto:alifbrur16@gmail.com",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Github,
    label: "GitHub",
    value: "With-ALIF",
    href: "https://github.com/With-ALIF",
    color: "text-slate-700",
    bg: "bg-slate-100",
  },
];

const Connect: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = () => {
    const subject = encodeURIComponent(`Message from ${name || "a visitor"} — ALIF Tools`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
    );
    return `mailto:alifbrur16@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = mailtoHref();
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20">
      <Link href="/"
        className="inline-flex items-center gap-1 text-sky-500 hover:text-sky-600 mb-4 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </Link>
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 md:p-10 space-y-14">

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 flex items-center justify-center text-[#0BA6DF]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800">
            Connect With Us
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Have a question, feedback, or a tool idea? We'd love to hear from
            you. Reach out through any channel below — we usually reply as
            soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target={channel.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all"
            >
              <div
                className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${channel.bg} ${channel.color}`}
              >
                <channel.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 font-medium uppercase">
                  {channel.label}
                </p>
                <p className="break-words font-bold leading-snug text-slate-800">
                  {channel.value}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-[#0BA6DF] transition-colors" />
            </a>
          ))}
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 text-center">
            Send a Message
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#0BA6DF] focus:outline-none text-sm md:text-base"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#0BA6DF] focus:outline-none text-sm md:text-base"
              />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Write your message..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#0BA6DF] focus:outline-none text-sm md:text-base"
            />
            <button
              type="submit"
              className="w-full bg-[#0BA6DF] hover:bg-[#0a94c7] text-white py-3.5 md:py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-sky-200 transition-all text-sm md:text-base"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
            <p className="text-xs text-center text-slate-400">
              This opens your email app — your message is never stored on our
              servers.
            </p>
          </form>
        </div>

      </div>
    </section>
  );
};

export default Connect;
