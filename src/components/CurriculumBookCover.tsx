import React, { useState } from 'react';
import { CurriculumBook, EducationalStage } from '../types';
import { BookOpen, Sparkles, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CurriculumBookCoverProps {
  book: CurriculumBook;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

// Subject Color & Aesthetic Palettes for Saudi MoE Textbooks
interface SubjectTheme {
  primaryGradient: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  patternType: 'geometry' | 'science' | 'arabic' | 'code' | 'grid' | 'islamic';
  icon: string;
  subjectArabic: string;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  الرياضيات: {
    primaryGradient: 'from-emerald-700 via-teal-800 to-cyan-950',
    accentBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    patternType: 'geometry',
    icon: '📐',
    subjectArabic: 'الرياضيات'
  },
  العلوم: {
    primaryGradient: 'from-emerald-800 via-green-900 to-teal-950',
    accentBg: 'bg-green-500',
    badgeBg: 'bg-green-400/20 text-green-300 border-green-400/30',
    badgeText: 'text-green-300',
    borderColor: 'border-green-500/40',
    patternType: 'science',
    icon: '🌿',
    subjectArabic: 'العلوم'
  },
  الفيزياء: {
    primaryGradient: 'from-blue-700 via-indigo-900 to-slate-950',
    accentBg: 'bg-blue-500',
    badgeBg: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    badgeText: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    patternType: 'science',
    icon: '⚛️',
    subjectArabic: 'الفيزياء'
  },
  الكيمياء: {
    primaryGradient: 'from-cyan-700 via-blue-900 to-slate-950',
    accentBg: 'bg-cyan-500',
    badgeBg: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
    badgeText: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    patternType: 'science',
    icon: '🧪',
    subjectArabic: 'الكيمياء'
  },
  الأحياء: {
    primaryGradient: 'from-teal-700 via-emerald-900 to-slate-950',
    accentBg: 'bg-teal-500',
    badgeBg: 'bg-teal-400/20 text-teal-300 border-teal-400/30',
    badgeText: 'text-teal-300',
    borderColor: 'border-teal-500/40',
    patternType: 'science',
    icon: '🧬',
    subjectArabic: 'الأحياء'
  },
  'لغتي الجميلة': {
    primaryGradient: 'from-amber-800 via-rose-950 to-slate-950',
    accentBg: 'bg-amber-500',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    patternType: 'arabic',
    icon: '📖',
    subjectArabic: 'لغتي الجميلة'
  },
  'اللغة العربية': {
    primaryGradient: 'from-rose-800 via-red-950 to-slate-950',
    accentBg: 'bg-rose-500',
    badgeBg: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
    badgeText: 'text-rose-300',
    borderColor: 'border-rose-500/40',
    patternType: 'arabic',
    icon: '✒️',
    subjectArabic: 'اللغة العربية'
  },
  'الدراسات الاجتماعية': {
    primaryGradient: 'from-amber-700 via-orange-900 to-yellow-950',
    accentBg: 'bg-amber-500',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    patternType: 'geometry',
    icon: '🌍',
    subjectArabic: 'الدراسات الاجتماعية'
  },
  'المهارات الرقمية': {
    primaryGradient: 'from-violet-700 via-purple-900 to-slate-950',
    accentBg: 'bg-violet-500',
    badgeBg: 'bg-violet-400/20 text-violet-300 border-violet-400/30',
    badgeText: 'text-violet-300',
    borderColor: 'border-violet-500/40',
    patternType: 'code',
    icon: '💻',
    subjectArabic: 'المهارات الرقمية'
  },
  'الدراسات الإسلامية': {
    primaryGradient: 'from-emerald-800 via-teal-950 to-slate-950',
    accentBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    patternType: 'islamic',
    icon: '🕌',
    subjectArabic: 'الدراسات الإسلامية'
  },
  'اللغة الإنجليزية': {
    primaryGradient: 'from-sky-700 via-blue-900 to-indigo-950',
    accentBg: 'bg-sky-500',
    badgeBg: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
    badgeText: 'text-sky-300',
    borderColor: 'border-sky-500/40',
    patternType: 'grid',
    icon: '🔤',
    subjectArabic: 'English'
  }
};

const DEFAULT_THEME: SubjectTheme = {
  primaryGradient: 'from-slate-800 via-slate-900 to-slate-950',
  accentBg: 'bg-emerald-500',
  badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  badgeText: 'text-emerald-300',
  borderColor: 'border-slate-700',
  patternType: 'geometry',
  icon: '📚',
  subjectArabic: 'المقرر الدراسي'
};

export const CurriculumBookCover: React.FC<CurriculumBookCoverProps> = ({
  book,
  size = 'md',
  className = '',
  showBadge = true
}) => {
  const [imageError, setImageError] = useState(false);

  const matchedSubjectKey =
    Object.keys(SUBJECT_THEMES).find(
      (k) => book.subject.includes(k) || (book.book_name && book.book_name.includes(k))
    ) || '';

  const theme = matchedSubjectKey ? SUBJECT_THEMES[matchedSubjectKey] : DEFAULT_THEME;

  const stageLabel =
    book.stage === 'primary'
      ? 'المرحلة الابتدائية'
      : book.stage === 'middle'
      ? 'المرحلة المتوسطة'
      : 'المرحلة الثانوية';

  const termLabel =
    book.term === 1
      ? 'الفصل الدراسي الأول'
      : book.term === 2
      ? 'الفصل الدراسي الثاني'
      : 'الفصل الدراسي الثالث';

  // If a valid official cover image URL is available and hasn't errored
  if (book.cover_image_url && !imageError) {
    return (
      <div
        className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md bg-slate-900 border border-slate-700/60 transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
      >
        <img
          src={book.cover_image_url}
          alt={book.title || book.subject}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {/* Subtle Spine & Shadow Layer */}
        <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-1 bg-white/20 pointer-events-none" />
        {showBadge && book.isLatestSync && (
          <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
            طبعة 1448هـ
          </div>
        )}
      </div>
    );
  }

  // Authentic, High-Clarity Saudi Ministry of Education Vector Cover Design
  return (
    <div
      className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-lg bg-gradient-to-b ${theme.primaryGradient} text-white border ${theme.borderColor} flex flex-col justify-between p-3.5 sm:p-4 select-none group-hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] ${className}`}
    >
      {/* Background Islamic / Geometric Subtle Watermark Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Book Spine 3D Effect (Left Binding Strip) */}
      <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-1 bg-white/25 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.2)]" />

      {/* Top Header: Saudi Ministry of Education Header & Term Badge */}
      <div className="relative z-10 space-y-1.5 border-b border-white/10 pb-2">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold text-white/90">
          <div className="flex items-center gap-1">
            <span className="text-xs">🇸🇦</span>
            <span className="tracking-wide">وزارة التعليم</span>
          </div>
          <span className="text-[9px] bg-white/15 px-2 py-0.5 rounded-full font-bold border border-white/20">
            طبعة 1448هـ
          </span>
        </div>

        <div className="flex items-center justify-between text-[9px] text-white/70">
          <span>{stageLabel}</span>
          <span className="font-bold text-white/90">{termLabel}</span>
        </div>
      </div>

      {/* Center Display: Large Subject Icon, Embellishment & Bold Subject Typography */}
      <div className="relative z-10 my-auto text-center space-y-2 py-2">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl flex items-center justify-center text-3xl sm:text-4xl transform transition-transform group-hover:scale-110">
            {book.coverIcon || theme.icon}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-black shadow">
            ✓
          </div>
        </div>

        <div className="space-y-0.5 px-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md leading-tight line-clamp-2">
            {book.subject_name || book.subject}
          </h3>
          <p className="text-[11px] sm:text-xs font-extrabold text-white/80 line-clamp-1">
            {book.grade}
          </p>
          {book.track && (
            <span className="inline-block mt-1 bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20">
              {book.track}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Verification Badge & Page Count */}
      <div className="relative z-10 border-t border-white/15 pt-2 flex items-center justify-between text-[9px] text-white/80">
        <div className="flex items-center gap-1 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>منهج سعودي معتمد</span>
        </div>
        <span className="bg-black/30 px-2 py-0.5 rounded-md font-mono font-bold text-white/90">
          {book.totalPages || 150} ص
        </span>
      </div>
    </div>
  );
};
