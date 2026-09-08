import React, { useState } from 'react';
import { isSupabaseConfigured, updateSupabaseConfig } from '../lib/supabase';
import { Database, Key, CheckCircle, ExternalLink, X, ShieldAlert, Sparkles } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const meta = import.meta as any;
  const currentUrl = localStorage.getItem('CUSTOM_SUPABASE_URL') || meta.env?.VITE_SUPABASE_URL || 'https://dadrrpvehryirvuckftd.supabase.co';
  const currentKey = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || meta.env?.VITE_SUPABASE_ANON_KEY || '';

  const [url, setUrl] = useState(currentUrl);
  const [key, setKey] = useState(currentKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(url, key);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-6 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg">إعداد ربط قاعدة بيانات Supabase الحقيقية</h3>
              {isSupabaseConfigured ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  متصل ومتوافق
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                  يتطلب الربط
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              كل المدارس، المستخدمين، الطلاب، والمعلمين يتم حفظهم وإدارتهم حقيقياً في مشروع Supabase
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800">
              رابط مشروع Supabase (Project URL)
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://xyzproject.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
            <p className="text-[10px] text-slate-400">مثال: https://abcdefghijklm.supabase.co</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800">
              المفتاح المفتوح (Supabase anon / public Key)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••••••••••••••••••••••"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono text-slate-700"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>إعدادات الدخول بقوقل وروابط إعادة التوجيه (Redirect URLs):</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">
              في لوحة تحكم Supabase تحت قائمة <strong className="text-slate-900">Authentication ➔ URL Configuration</strong>، أضف الروابط التالية:
            </p>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px] text-indigo-700">
              <div>Site URL: <span className="text-emerald-700 font-bold">https://htaf.online</span></div>
              <div>Redirect URLs: <span className="text-slate-800 font-bold">https://htaf.online/** , https://htaf.online/</span></div>
            </div>
            <p className="text-[11px] text-slate-500">
              تلقائياً يقوم التطبيق بالتوجيه إلى <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">https://htaf.online/</code> عند تسجيل الدخول بحساب Google.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold px-4 py-2"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              <span>حفظ واعتماد اتصال Supabase</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
