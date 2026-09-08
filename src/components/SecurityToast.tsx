import React, { useEffect } from 'react';
import { ShieldAlert, X, Lock } from 'lucide-react';

interface SecurityToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const SecurityToast: React.FC<SecurityToastProps> = ({
  message,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-11/12 animate-slide-down">
      <div className="bg-slate-900 text-white border-2 border-red-500 rounded-2xl p-4 shadow-2xl shadow-red-950/40 flex items-start gap-3">
        <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 text-right">
          <div className="flex items-center gap-1.5 text-red-400 font-extrabold text-xs mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>نظام الحماية والأمان (Route Guard Middleware)</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
