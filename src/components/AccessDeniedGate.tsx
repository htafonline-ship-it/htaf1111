import React from 'react';
import { ShieldAlert, Lock, ArrowRight, Home } from 'lucide-react';
import { UserRole } from '../types';

interface AccessDeniedGateProps {
  attemptedTab: string;
  userRole: UserRole;
  reason?: string;
  onReturnHome: () => void;
}

const roleLabels: Record<string, string> = {
  student: 'طالب',
  teacher: 'معلم',
  parent: 'ولي أمر',
  counselor: 'مرشد إرشادي',
  vice_principal: 'وكيل المدرسة',
  principal: 'مدير المدرسة',
  school_admin: 'مدير المدرسة',
  school_manager: 'مدير المدرسة',
  super_admin: 'مدير المنصة',
  platform_admin: 'مدير المنصة'
};

const tabNames: Record<string, string> = {
  'school-mgmt': 'إدارة المدرسة والإحصائيات',
  'counseling': 'الإرشاد الطلابي والسرية',
  'platform-admin': 'لوحة الأدمن العام للمنصة',
  'super_admin': 'لوحة الأدمن العام للمنصة'
};

export const AccessDeniedGate: React.FC<AccessDeniedGateProps> = ({
  attemptedTab,
  userRole,
  reason,
  onReturnHome
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white border-2 border-red-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-red-500/5 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-50 rounded-full blur-xl pointer-events-none" />

        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-bold mb-3">
          <Lock className="w-3.5 h-3.5" />
          تمت الحماية بواسطة Route Guard Middleware
        </span>

        <h3 className="text-xl font-black text-slate-900 mb-2">
          غير مصرح بالوصول لهذا المسار
        </h3>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          {reason || `المسار (${tabNames[attemptedTab] || attemptedTab}) يتطلب صلاحيات أعلى من دورك الحالي (${roleLabels[userRole] || userRole}). تم منع الوصول لحماية أمان وبيانات المنصة.`}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right text-xs space-y-2 mb-6">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200/60 pb-2">
            <span>دور الحساب الحالي:</span>
            <span className="font-extrabold text-slate-800">{roleLabels[userRole] || userRole}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>المسار المحاول:</span>
            <span className="font-extrabold text-red-600">{tabNames[attemptedTab] || attemptedTab}</span>
          </div>
        </div>

        <button
          onClick={onReturnHome}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
        >
          <Home className="w-4 h-4 text-emerald-400" />
          <span>العودة إلى لوحة المتابعة المسموحة</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
