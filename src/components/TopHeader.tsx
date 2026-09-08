import React from 'react';
import { UserRole, SchoolTenant, AuthUser } from '../types';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  Menu,
  Sparkles,
  School,
  Building2,
  ChevronDown,
  LogIn,
  LogOut,
  GraduationCap,
  Bot,
  BookOpen,
  MessageSquare,
  ShieldAlert,
  Crown,
  Bell,
  ScanLine,
  MapPin,
  User,
  QrCode,
  Info,
  UserPlus
} from 'lucide-react';

interface TopHeaderProps {
  currentRole: UserRole;
  currentSchool: SchoolTenant | null;
  schools: SchoolTenant[];
  onSchoolChange: (school: SchoolTenant) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSolver: () => void;
  currentUser: AuthUser | null;
  onOpenLoginModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
  onOpenSchoolBarcode?: () => void;
  onOpenAboutApp?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  currentSchool,
  schools,
  onSchoolChange,
  activeTab,
  setActiveTab,
  onOpenSolver,
  currentUser,
  onOpenLoginModal,
  onLogout,
  onOpenMobileSidebar,
  onOpenSchoolBarcode,
  onOpenAboutApp
}) => {
  const isPlatformAdmin = currentRole === 'super_admin' || currentRole === 'platform_admin';
  const isSchoolAdminOrPrincipal =
    currentRole === 'principal' ||
    currentRole === 'vice_principal' ||
    currentRole === 'school_admin' ||
    currentRole === 'school_manager';

  const tabLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    dashboard: { label: 'لوحة المتابعة الرئيسية', icon: <GraduationCap className="w-4 h-4 text-cyan-400" /> },
    solver: { label: 'حلال المسائل الذكي بالـ OCR', icon: <ScanLine className="w-4 h-4 text-cyan-400" /> },
    'smart-teacher': { label: 'المعلم الذكي التفاعلي', icon: <Bot className="w-4 h-4 text-purple-400" /> },
    curriculum: { label: 'مكتبة المناهج والكتب الوزارية', icon: <BookOpen className="w-4 h-4 text-blue-400" /> },
    'school-mgmt': { label: 'إدارة المدرسة والإحصائيات', icon: <School className="w-4 h-4 text-cyan-400" /> },
    messaging: { label: 'المحادثات والتواصل المدرسي', icon: <MessageSquare className="w-4 h-4 text-rose-400" /> },
    counseling: { label: 'الإرشاد الطلابي والسرية', icon: <ShieldAlert className="w-4 h-4 text-indigo-400" /> },
    'kharj-schools': { label: 'دليل مدارس ومراكز الخرج ودعوات الارتباط', icon: <MapPin className="w-4 h-4 text-emerald-400" /> },
    'platform-admin': { label: 'لوحة مدير المنصة (Platform Admin)', icon: <Crown className="w-4 h-4 text-amber-400" /> },
    super_admin: { label: 'لوحة مدير المنصة (Platform Admin)', icon: <Crown className="w-4 h-4 text-amber-400" /> },
    profile: { label: 'الملف الشخصي والحساب', icon: <User className="w-4 h-4 text-cyan-400" /> }
  };

  const currentTabInfo = tabLabels[activeTab] || { label: 'الرئيسية', icon: <GraduationCap className="w-4 h-4 text-cyan-400" /> };

  return (
    <header className="sticky top-0 z-20 bg-[#080f24]/90 backdrop-blur-md text-slate-100 border-b border-blue-900/40 shadow-lg">
      {/* Top Banner: School Announcement / Circular Preview (if present) */}
      {currentSchool && currentSchool.circulars && currentSchool.circulars.length > 0 && isSchoolAdminOrPrincipal && (
        <div className="bg-[#0b1633] text-cyan-200 px-4 py-1.5 text-xs flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] shrink-0 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              تعميم {currentSchool.name.split(' ')[0]}
            </span>
            <span className="truncate font-medium">{currentSchool.circulars[0].title}</span>
          </div>
          <button
            onClick={() => setActiveTab('school-mgmt')}
            className="text-cyan-300 hover:text-cyan-100 underline font-bold text-[11px] shrink-0 me-2"
          >
            عرض التعاميم الرسمية
          </button>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Right Section: Mobile Menu Trigger + Current Section Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              id="topheader-mobile-menu-btn"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-1.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-[#0d1838] transition border border-blue-900/40 flex items-center gap-2"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
              <BrandLogo size="xs" glow={false} />
            </button>

            {/* Active Tab Page Title Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0d1a3a] flex items-center justify-center border border-blue-800/50 shadow-inner">
                {currentTabInfo.icon}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                  {currentTabInfo.label}
                </h2>
                {currentSchool && (
                  <p className="text-[11px] text-blue-300/70 font-medium hidden sm:block">
                    {currentSchool.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Left Section: Quick AI Solver Button & User Menu & PWA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA In-App Install Button */}
            <PWAInstallButton variant="header" />

            {/* About App Modal Launcher */}
            {onOpenAboutApp && (
              <button
                id="topheader-about-app-btn"
                onClick={onOpenAboutApp}
                className="p-2 rounded-xl bg-[#091533] hover:bg-[#0e2254] text-cyan-300 hover:text-white border border-cyan-500/30 transition flex items-center gap-1 text-xs font-bold"
                title="عن تطبيق حقائق العلوم PWA"
              >
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">عن التطبيق</span>
              </button>
            )}

            {onOpenSchoolBarcode && (
              <button
                id="topheader-barcode-btn"
                onClick={onOpenSchoolBarcode}
                className="bg-[#091533] hover:bg-[#0e2254] text-cyan-300 hover:text-white font-black px-2.5 sm:px-3.5 py-2 rounded-xl text-xs border border-cyan-500/30 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title={currentSchool ? `عرض وتحميل باركود ${currentSchool.name}` : 'باركود المدرسة الذكي'}
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">باركود المدرسة</span>
              </button>
            )}

            {/* AI Solver Quick Launch with Neon Glow */}
            <button
              id="topheader-solver-btn"
              onClick={onOpenSolver}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold px-3 sm:px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition transform active:scale-95 border border-cyan-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white animate-pulse" />
              <span className="hidden sm:inline">حلاّل المسائل</span>
              <span className="bg-cyan-950 text-cyan-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-cyan-400/40">
                OCR
              </span>
            </button>

            {/* User Dropdown / Login */}
            {currentUser ? (
              <div className="relative group">
                <button
                  id="topheader-user-menu-btn"
                  className="flex items-center gap-2 bg-[#09132c] hover:bg-[#0e1c40] text-white text-xs px-3 py-1.5 rounded-xl shadow-xs border border-blue-900/50 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-white text-[11px] overflow-hidden border border-white/20 shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName?.[0] || 'ح'
                    )}
                  </div>
                  <div className="text-right hidden md:block max-w-[120px] truncate">
                    <span className="font-bold truncate text-[11px] block">{currentUser.fullName}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#091228] border border-blue-800/60 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50">
                  <div className="px-3 py-2 border-b border-blue-900/50 bg-[#070e22]">
                    <p className="text-xs font-black text-white">{currentUser.fullName}</p>
                    <p className="text-[10px] text-blue-300/70 truncate dir-ltr text-right">{currentUser.email || currentUser.username}</p>
                  </div>
                  <button
                    id="topheader-dropdown-profile-btn"
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-right px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-950/60 text-cyan-300 font-bold transition mt-1"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>الملف الشخصي والحساب</span>
                  </button>
                  <button
                    id="topheader-dropdown-logout-btn"
                    onClick={onLogout}
                    className="w-full text-right px-3 py-2 text-xs flex items-center gap-2 hover:bg-rose-950/40 text-rose-400 font-bold transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="topheader-register-btn"
                  onClick={() => onOpenLoginModal('register')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md shadow-emerald-900/40 flex items-center gap-1.5 transition active:scale-95 border border-emerald-400/40"
                  title="تسجيل حساب جديد بالمنصة"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden xs:inline">تسجيل جديد</span>
                  <span className="xs:hidden">تسجيل</span>
                </button>
                <button
                  id="topheader-login-btn"
                  onClick={() => onOpenLoginModal('login')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>دخول</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
