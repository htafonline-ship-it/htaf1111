import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';

export const InteractiveScrollNavigator: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop || 0;
          const scrollHeight = Math.max(
            docEl.scrollHeight,
            body.scrollHeight,
            docEl.clientHeight
          );
          const clientHeight = window.innerHeight || docEl.clientHeight || 1;
          const maxScroll = Math.max(1, scrollHeight - clientHeight);
          const progress = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));

          setScrollProgress(progress);
          setIsAtTop(scrollTop < 60);
          setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 60);
          setIsVisible(maxScroll > 60); // Show controller whenever page is scrollable

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    // Check repeatedly in case content loads dynamically
    const interval = setInterval(handleScroll, 800);
    handleScroll();

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const performScroll = (yTarget: number) => {
    try {
      window.scrollTo({ top: yTarget, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, yTarget);
    }
    try {
      document.documentElement.scrollTo({ top: yTarget, behavior: 'smooth' });
    } catch {
      document.documentElement.scrollTop = yTarget;
    }
    try {
      document.body.scrollTo({ top: yTarget, behavior: 'smooth' });
    } catch {
      document.body.scrollTop = yTarget;
    }
  };

  const scrollToTop = () => {
    performScroll(0);
  };

  const scrollToBottom = () => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(docEl.scrollHeight, body.scrollHeight, 10000);
    performScroll(scrollHeight);
  };

  const scrollStepDown = () => {
    const currentY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const step = Math.max(300, Math.round((window.innerHeight || 800) * 0.7));
    performScroll(currentY + step);
  };

  const scrollStepUp = () => {
    const currentY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const step = Math.max(300, Math.round((window.innerHeight || 800) * 0.7));
    performScroll(Math.max(0, currentY - step));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Top Scroll Indicator Line */}
      <div
        id="scroll-progress-indicator-track"
        className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-blue-950/40"
      >
        <div
          id="scroll-progress-indicator-bar"
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Interactive Scroll Controller (التحكم التفاعلي في النزول والطلوع) */}
      <div
        id="interactive-scroll-controller"
        className="fixed bottom-6 left-6 z-40 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-[#09122a]/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 transition-all duration-300 select-none animate-in fade-in"
      >
        {/* Scroll To Top Button (الطلوع للأعلى بالكامل) */}
        <button
          id="scroll-to-top-extreme-btn"
          onClick={scrollToTop}
          disabled={isAtTop}
          title="الطلوع إلى أعلى الصفحة مباشرة (Home)"
          className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 group"
          aria-label="الطلوع للأعلى"
        >
          <ChevronsUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-cyan-400" />
        </button>

        {/* Step Up Button (صعود خطوة) */}
        <button
          id="scroll-step-up-btn"
          onClick={scrollStepUp}
          disabled={isAtTop}
          title="صعود خطوة للأعلى (Page Up)"
          className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 group"
          aria-label="صعود للأعلى"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
        </button>

        {/* Scroll Progress Percentage Badge */}
        <div
          id="scroll-percentage-badge"
          className="px-2 py-1 my-0.5 rounded-lg bg-[#060b18] border border-blue-900/50 text-[10px] font-black text-cyan-400 font-mono tracking-tighter"
          title={`موضع التمرير الحالي: ${scrollProgress}%`}
        >
          {scrollProgress}%
        </div>

        {/* Step Down Button (نزول خطوة) */}
        <button
          id="scroll-step-down-btn"
          onClick={scrollStepDown}
          disabled={isAtBottom}
          title="نزول خطوة للأسفل (Page Down)"
          className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 group"
          aria-label="نزول للأسفل"
        >
          <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>

        {/* Scroll To Bottom Button (النزول لأسفل الصفحة بالكامل) */}
        <button
          id="scroll-to-bottom-extreme-btn"
          onClick={scrollToBottom}
          disabled={isAtBottom}
          title="النزول إلى نهاية الصفحة مباشرة (End)"
          className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 group"
          aria-label="النزول للأسفل"
        >
          <ChevronsDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform text-cyan-400" />
        </button>
      </div>
    </>
  );
};
