import React from 'react';
import { Sliders, Sparkles } from 'lucide-react';
import { UserRole, AuthUser } from '../../types';

interface AdminDynamicBarProps {
  currentRole: UserRole;
  currentUser: AuthUser | null;
  activeTab: string;
  dynamicBlocksCount: number;
  onOpenCustomizer: () => void;
}

const TAB_ARABIC_NAMES: Record<string, string> = {
  dashboard: 'لوحة المتابعة الرئيسية',
  curriculum: 'المناهج والمقررات الرقمية',
  'smart-teacher': 'المعلم الذكي',
  solver: 'المساعد وحلال المسائل',
  messaging: 'مركز الرسائل والتواصل',
  'school-mgmt': 'الإدارة المدرسية',
  'kharj-schools': 'مدارس الخرج',
  counseling: 'التوجيه والإرشاد',
  profile: 'الملف الشخصي',
  super_admin: 'لوحة الإدارة العامة'
};

export const AdminDynamicBar: React.FC<AdminDynamicBarProps> = ({
  currentRole,
  currentUser,
  activeTab,
  dynamicBlocksCount,
  onOpenCustomizer
}) => {
  const isAdmin =
    currentRole === 'super_admin' ||
    currentRole === 'platform_admin' ||
    currentRole === 'admin' ||
    currentRole === 'principal' ||
    currentRole === 'vice_principal' ||
    currentRole === 'school_admin' ||
    currentRole === 'school_manager' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'platform_admin' ||
    currentUser?.role === 'school_admin';

  if (!isAdmin) return null;

  const currentTabLabel = TAB_ARABIC_NAMES[activeTab] || 'الصفحة الحالية';

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-cyan-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="font-black text-cyan-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          <span>أدوات تخصيص وتنسيق الحقول الإدارية:</span>
        </span>
        <span className="text-slate-300 font-medium hidden sm:inline">
          {currentTabLabel} • ({dynamicBlocksCount} أقسام مخصصة)
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCustomizer}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-3.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm transition transform hover:scale-[1.02] border border-cyan-400/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
          <span>تخصيص وإضافة خانات لهذه الصفحة</span>
        </button>
      </div>
    </div>
  );
};

