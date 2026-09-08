import React, { useState } from 'react';
import { Download, CheckCircle2, Share2, Smartphone, PlusSquare, X } from 'lucide-react';
import { usePWA } from './usePWA';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'pill';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed as standalone
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold ${className}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>التطبيق مثبت كـ PWA</span>
        </div>
      );
    }
    // For header or pill, hide button cleanly once installed
    return null;
  }

  // Handle Chrome / Android / Desktop installation
  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await installApp();
      setIsInstalling(false);
      if (success && onInstalled) {
        onInstalled();
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // If neither Android installable nor iOS, suppress unneeded UI
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          id="pwa-install-btn-header"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`relative group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-60 cursor-pointer ${className}`}
          title="تثبيت منصة حقائق العلوم كتطبيق مستقل"
        >
          <Download className="w-3.5 h-3.5 text-cyan-200 group-hover:animate-bounce" />
          <span>تثبيت التطبيق</span>
          <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            PWA
          </span>
        </button>
      )}

      {variant === 'sidebar' && (
        <div className={`p-3 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-blue-950/40 to-slate-900 border border-cyan-500/30 shadow-lg shadow-cyan-950/50 ${className}`}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">تطبيق حقائق العلوم</h4>
              <p className="text-[10px] text-cyan-300/80">ثبّته للوصول السريع بدون متصفح</p>
            </div>
          </div>
          <button
            id="pwa-install-btn-sidebar"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت التطبيق</span>
          </button>
        </div>
      )}

      {variant === 'pill' && (
        <button
          id="pwa-install-btn-pill"
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>تثبيت التطبيق</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-blue-950/80 to-slate-900/90 border border-cyan-500/40 shadow-xl ${className}`}>
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">تطبيق حقائق العلوم PWA</span>
                <span className="text-[10px] bg-cyan-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded">
                  سريع ومستقل
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/70">
                استمتع بتجربة تطبيق الجوال السلسة وشاشة كاملة بدون شريط المتصفح
              </p>
            </div>
          </div>
          <button
            id="pwa-install-btn-banner"
            onClick={handleInstallClick}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق الآن</span>
          </button>
        </div>
      )}

      {/* iOS Safari Guided Install Modal (Requirement 4: iPhone & iPad users only) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0e1a3d] to-[#070e24] border border-cyan-500/40 p-6 text-right shadow-2xl shadow-cyan-950/80">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mb-4 shadow-lg shadow-cyan-500/30 mx-auto">
              <div className="w-full h-full rounded-[14px] bg-[#070e22] flex items-center justify-center text-cyan-300">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>

            <h3 className="text-base font-black text-center text-white mb-2">
              تثبيت «حقائق العلوم» على iPhone / iPad
            </h3>

            <p className="text-xs text-cyan-200/70 text-center mb-5">
              يعمل التطبيق كبرنامج مستقل على شاشتك الرئيسية بخطوتين بسيطتين:
            </p>

            <div className="space-y-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 mb-5 text-xs text-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">الخطوة 1: </span>
                  <span>اضغط على زر المشاركة <strong className="text-cyan-300">(Share)</strong> في شريط متصفح Safari السفلي.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-800">
                <div className="p-1.5 rounded-lg bg-cyan-600/30 text-cyan-400 shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">الخطوة 2: </span>
                  <span>مرر للأسفل واختر <strong className="text-cyan-300">«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
