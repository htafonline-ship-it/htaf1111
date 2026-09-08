import React from 'react';
import { WifiOff, ShieldAlert, RefreshCw } from 'lucide-react';
import { usePWA } from './usePWA';

export const PWAOfflineNotice: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2.5 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-lg z-[9999] animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-950/95 border border-amber-500/50 text-amber-100 shadow-2xl backdrop-blur-md text-right">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">لا يوجد اتصال بالإنترنت</span>
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                وضع التصفح فقط
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80">
              تحقق من الاتصال ثم أعد المحاولة. تم إيقاف تعديل بيانات الطلاب مؤقتاً لضمان أمان قاعدة البيانات.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3 h-3" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    </div>
  );
};
