'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Moon, Sun, FileText, Shield, Cookie,
  RotateCcw, Mail, ChevronRight, BookOpen
} from 'lucide-react';

function CoachingLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <Image src="/coaching-icon.png" alt="Intense Learners" width={40} height={40} className={className} priority />
  );
}

const LEGAL_PAGES = [
  { href: '/privacy-policy',   label: 'Privacy Policy',   icon: Shield    },
  { href: '/terms-of-service', label: 'Terms of Service', icon: FileText  },
  { href: '/cookie-policy',    label: 'Cookie Policy',    icon: Cookie    },
  { href: '/refund-policy',    label: 'Refund Policy',    icon: RotateCcw },
];

export default function LegalPageLayout({
  title,
  icon,
  lastUpdated,
  sections,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  lastUpdated: string;
  sections: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dm, setDm] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? '');
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDm(saved);
    if (saved) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const next = !dm;
    setDm(next);
    localStorage.setItem('darkMode', next.toString());
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  useEffect(() => {
    const handler = () => {
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) current = s.id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dm ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {/* ── Top nav ── */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl ${dm ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/')}
            className={`flex items-center gap-2 font-semibold transition-all group flex-shrink-0 ${dm ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${dm ? 'bg-gray-800 group-hover:bg-indigo-900/50' : 'bg-gray-100 group-hover:bg-indigo-100'}`}>
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-sm">Back to Home</span>
          </button>

          <button onClick={() => router.push('/')} className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <CoachingLogo />
            </div>
            <span className={`font-bold text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Intense Learners</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl hover:scale-110 transition-all flex-shrink-0 ${dm ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </nav>

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border-b border-white/5">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="flex items-start gap-4 sm:gap-5 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center flex-shrink-0 text-white">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
              <p className="text-purple-300/80 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
                <span className="w-1 h-1 bg-purple-400 rounded-full" />
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          <p className="text-purple-100/70 text-sm sm:text-base max-w-2xl leading-relaxed mb-7">
            This document applies to all users of Intense Learners — students, teachers, and visitors — across our website, mobile experience, and related services.
          </p>

          {/* Legal page cross-links */}
          <div className="flex flex-wrap gap-2">
            {LEGAL_PAGES.map(p => (
              <button
                key={p.href}
                onClick={() => router.push(p.href)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                  p.label === title
                    ? 'bg-white text-indigo-900 border-white shadow-sm'
                    : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20 hover:text-white'
                }`}
              >
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Mobile TOC toggle */}
        <button
          onClick={() => setTocOpen(!tocOpen)}
          className={`lg:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl border font-semibold text-sm mb-4 transition-all ${dm ? 'bg-gray-900 border-gray-800 text-gray-200 hover:border-gray-700' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'}`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            On this page
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${tocOpen ? 'rotate-90' : ''}`} />
        </button>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 sm:gap-10">

          {/* Table of Contents */}
          <aside className={`${tocOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-24 self-start`}>
            <div className={`rounded-2xl border p-4 sm:p-5 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                <BookOpen className="w-3.5 h-3.5" /> Contents
              </p>
              <nav className="space-y-0.5">
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                      activeSection === s.id
                        ? dm
                          ? 'bg-indigo-900/50 text-indigo-300 font-semibold border-l-2 border-indigo-400 pl-4'
                          : 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-500 pl-4'
                        : dm
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>

              <div className={`mt-5 pt-4 border-t ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                <Link
                  href="/contact"
                  className={`flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors ${dm ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Questions? Contact us
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className={`legal-content rounded-2xl border p-5 sm:p-8 lg:p-10 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            {children}
          </article>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-gray-800 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
          <p>© 2026 Intense Learners. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {LEGAL_PAGES.map(p => (
              <button key={p.href} onClick={() => router.push(p.href)} className="hover:text-gray-300 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* ─── Scroll margin for all sections ─── */
        .legal-content section {
          scroll-margin-top: 100px;
        }

        /* ─── Headings ─── */
        .legal-content h2 {
          font-size: 1.25rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 0.875rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid ${dm ? '#1f2937' : '#f3f4f6'};
          color: ${dm ? '#f1f5f9' : '#111827'};
          scroll-margin-top: 100px;
        }
        .legal-content h2:first-child {
          margin-top: 0;
        }
        .legal-content h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.625rem;
          color: ${dm ? '#e2e8f0' : '#1f2937'};
        }
        .legal-content h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: ${dm ? '#cbd5e1' : '#374151'};
        }

        /* ─── Body text ─── */
        .legal-content p {
          font-size: 0.9375rem;
          line-height: 1.8;
          margin-bottom: 0.875rem;
          color: ${dm ? '#94a3b8' : '#4b5563'};
        }

        /* ─── Lists ─── */
        .legal-content ul,
        .legal-content ol {
          margin: 0.75rem 0 1rem 0;
          padding-left: 1.375rem;
          font-size: 0.9375rem;
          line-height: 1.75;
          color: ${dm ? '#94a3b8' : '#4b5563'};
        }
        .legal-content li {
          margin-bottom: 0.45rem;
          padding-left: 0.25rem;
        }
        .legal-content ul { list-style-type: disc; }
        .legal-content ol { list-style-type: decimal; }

        /* ─── Inline elements ─── */
        .legal-content strong {
          font-weight: 600;
          color: ${dm ? '#e2e8f0' : '#111827'};
        }
        .legal-content a {
          color: ${dm ? '#818cf8' : '#4f46e5'};
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .legal-content a:hover {
          color: ${dm ? '#a5b4fc' : '#4338ca'};
        }
        .legal-content code {
          font-family: 'Fira Mono', monospace;
          font-size: 0.825rem;
          padding: 0.15rem 0.4rem;
          border-radius: 0.375rem;
          background: ${dm ? '#1e293b' : '#f1f5f9'};
          color: ${dm ? '#94a3b8' : '#334155'};
        }

        /* ─── Tables ─── */
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          font-size: 0.875rem;
        }
        .legal-content th,
        .legal-content td {
          border: 1px solid ${dm ? '#1f2937' : '#e5e7eb'};
          padding: 0.65rem 0.875rem;
          text-align: left;
          color: ${dm ? '#94a3b8' : '#4b5563'};
        }
        .legal-content th {
          background: ${dm ? '#111827' : '#f9fafb'};
          font-weight: 700;
          font-size: 0.8125rem;
          color: ${dm ? '#e2e8f0' : '#111827'};
        }
        .legal-content tr:nth-child(even) td {
          background: ${dm ? '#0f172a' : '#fafafa'};
        }

        /* ─── Callout boxes ─── */
        .legal-content .callout {
          border-radius: 0.875rem;
          padding: 1rem 1.25rem;
          margin: 1.25rem 0;
          font-size: 0.875rem;
          line-height: 1.65;
          border-left-width: 3px;
        }
        .legal-content .callout-info {
          background: ${dm ? 'rgba(99,102,241,0.08)' : '#eef2ff'};
          border-color: ${dm ? '#4f46e5' : '#818cf8'};
          color: ${dm ? '#a5b4fc' : '#4338ca'};
        }
        .legal-content .callout-warn {
          background: ${dm ? 'rgba(245,158,11,0.08)' : '#fffbeb'};
          border-color: ${dm ? '#d97706' : '#fbbf24'};
          color: ${dm ? '#fcd34d' : '#92400e'};
        }
        .legal-content .callout-success {
          background: ${dm ? 'rgba(16,185,129,0.08)' : '#f0fdf4'};
          border-color: ${dm ? '#059669' : '#86efac'};
          color: ${dm ? '#6ee7b7' : '#166534'};
        }
        .legal-content .callout-error {
          background: ${dm ? 'rgba(239,68,68,0.08)' : '#fef2f2'};
          border-color: ${dm ? '#dc2626' : '#fca5a5'};
          color: ${dm ? '#fca5a5' : '#991b1b'};
        }

        /* ─── Callout box inner elements inherit color ─── */
        .legal-content .callout p {
          color: inherit;
          margin-bottom: 0;
          font-size: 0.875rem;
        }

        /* ─── Infobox cards (grid in refund page etc) ─── */
        .legal-content .info-card {
          border-radius: 0.875rem;
          padding: 1.25rem;
          border: 1px solid ${dm ? '#1f2937' : '#e5e7eb'};
          background: ${dm ? '#111827' : '#f9fafb'};
        }

        /* ─── Sections spacing ─── */
        .legal-content section {
          margin-bottom: 0.5rem;
        }

        /* ─── Section inner space-y ─── */
        .legal-content section > * + * {
          margin-top: 0.75rem;
        }
      `}</style>
    </div>
  );
}