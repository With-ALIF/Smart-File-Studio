import React from "react";

const About: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-10 space-y-16">

        {/* Header */}
        <div className="text-center space-y-5">
          <img
            src="https://raw.githubusercontent.com/With-ALIF/With-ALIF/main/photo.jpg"
            alt="ALIF Tools Logo"
            className="w-28 h-28 mx-auto rounded-full object-cover border shadow-sm"
          />

          <h1 className="text-4xl font-extrabold text-slate-800">
            About ALIF Tools
          </h1>

          <div>
            <h3 className="text-2xl font-bold text-slate-800">Alif</h3>
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
            <strong>ALIF Tools</strong> is a modern web-based utility platform
            designed to simplify everyday PDF and image-related tasks.
            It is built for students, professionals, and everyday users
            who want quick results without complicated software.
          </p>

          <p>
            The platform offers powerful tools such as image resizing,
            cropping, format conversion, PDF merging, splitting,
            compression, and more — all through a clean, intuitive,
            and user-friendly interface.
          </p>

          <p>
            We take <strong>privacy and security</strong> seriously.
            Uploaded files are processed instantly and are never stored
            permanently. All data is automatically removed once the task
            is completed.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">
              🎯 Our Mission
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To provide fast, reliable, and easy-to-use online tools that
              help users process PDF and image files efficiently while
              maintaining privacy, quality, and accessibility.
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
        <p className="text-center text-xs text-slate-500 max-w-3xl mx-auto">
          ALIF Tools is constantly evolving. More advanced tools,
          smarter workflows, and AI-powered features are planned
          to enhance productivity and user experience in upcoming updates.
        </p>

      </div>
    </section>
  );
};

export default About;
