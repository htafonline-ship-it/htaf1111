import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePWA } from './usePWA';

export const PWAUpdateModal: React.FC = () => {
  const { hasUpdate, updateApp } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!hasUpdate || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="تنبيه تحديث المنصة"
      className="fixed bottom-5 left-5 right-5 sm:right-auto sm:max-w-md z-[9998] animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0c183a] via-[#091530] to-[#060e22] border border-cyan-400/50 shadow-2xl shadow-cyan-950/80 text-right">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">يوجد تحديث جديد للتطبيق</h4>
            <p className="text-[11px] text-cyan-200/80">
              يتوفر إصدار أحدث لمنصة حقائق العلوم مع تحسينات وسرعة فائقة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={updateApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث الآن</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="إغلاق مؤقتاً"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
