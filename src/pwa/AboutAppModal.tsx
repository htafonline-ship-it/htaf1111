import React, { useState } from 'react';
import {
  Info,
  X,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  School,
  Wifi,
  WifiOff,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';
import { SchoolTenant } from '../types';
import { usePWA } from './usePWA';
import { PWAInstallButton } from './PWAInstallButton';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchool: SchoolTenant | null;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  isOpen,
  onClose,
  currentSchool,
}) => {
  const { isInstalled, isOnline, hasUpdate, isCheckingUpdate, checkForUpdate, updateApp } = usePWA();
  const [checkResult, setCheckResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualCheck = async () => {
    setCheckResult(null);
    const found = await checkForUpdate();
    if (found) {
      setCheckResult('يتوفر تحديث جديد! يمكنك التحديث الآن.');
    } else {
      setCheckResult('أنت تستخدم أحدث إصدار معتمد من المنصة.');
    }
    setTimeout(() => setCheckResult(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0e1a3d] via-[#091530] to-[#050e24] border border-cyan-500/30 p-6 sm:p-7 text-right shadow-2xl shadow-cyan-950/90 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-cyan-500/20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/25 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#070e22] flex items-center justify-center overflow-hidden">
              <img
                src="/pwa-192x192.png"
                alt="شعار حقائق العلوم"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">حقائق العلوم</h2>
              <span className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-black px-2 py-0.5 rounded-full">
                تطبيق PWA الذكي
              </span>
            </div>
            <p className="text-xs text-blue-200/70 font-medium mt-0.5">
              المنصة التعليمية المتكاملة لربط المدارس والطلاب والمعلمين
            </p>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Version */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">الإصدار الحالي:</span>
            <span className="text-xs font-black text-cyan-300 font-mono">v3.2.0 (PWA)</span>
          </div>

          {/* Connection Status */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">حالة الاتصال:</span>
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300">متصل بالإنترنت</span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-amber-300">غير متصل</span>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                </>
              )}
            </div>
          </div>

          {/* Current School */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 sm:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <School className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>المدرسة المعتمدة:</span>
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[240px]">
              {currentSchool?.name || 'المنصة العامة (جميع المدارس)'}
            </span>
          </div>

          {/* Installation Mode */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 sm:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>وضع التشغيل:</span>
            </div>
            <span className="text-xs font-bold text-cyan-300">
              {isInstalled ? 'تطبيق ويب تقدمي مثبت (Standalone App)' : 'وضع المتصفح (متاح للتثبيت)'}
            </span>
          </div>
        </div>

        {/* Update Checker Action */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900 border border-cyan-500/30 mb-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <h4 className="text-xs font-black text-white">التحقق من التحديثات</h4>
              <p className="text-[11px] text-cyan-200/70">
                مزامنة أحدث ملفات الواجهة والخدمات تلقائياً
              </p>
            </div>
            <button
              onClick={handleManualCheck}
              disabled={isCheckingUpdate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdate ? 'جارِ الفحص...' : 'فحص الآن'}</span>
            </button>
          </div>

          {hasUpdate && (
            <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                ✨ يتوفر إصدار جديد وجاهز للتطبيق
              </span>
              <button
                onClick={updateApp}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                تحديث الآن
              </button>
            </div>
          )}

          {checkResult && (
            <p className="text-xs text-cyan-300 mt-2 font-medium animate-in fade-in">
              {checkResult}
            </p>
          )}
        </div>

        {/* Install Button Section if not installed */}
        {!isInstalled && (
          <div className="mb-5">
            <PWAInstallButton variant="banner" onInstalled={onClose} />
          </div>
        )}

        {/* Features & Architectural Assurance */}
        <div className="space-y-2.5 text-[11px] text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>معايير الأمان وحفظ البيانات:</span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <span>بيانات الطلاب والمعلمين مشفرة وتأتي حصرياً من قاعدة بيانات Supabase المؤمنة بسياسات RLS، ولا تُخزن بشكل غير آمن.</span>
          </div>
          <div className="flex items-start gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
            <span>جاهزية كاملة للتحويل كحزمة أندرويد وiOS عبر Capacitor دون المساس بالتصميم الحالي.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>منصة حقائق العلوم التعليمية الذكية © 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
