import React from 'react';
import { UserRole, SchoolTenant, AuthUser } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  Sparkles,
  GraduationCap,
  School,
  BookOpen,
  ChevronDown,
  BrainCircuit,
  Bot,
  MessageSquare,
  Crown,
  LogIn,
  LogOut,
  ShieldAlert,
  Building2,
  X,
  Layers,
  ChevronLeft,
  ScanLine,
  FileCheck2,
  MapPin,
  User,
  Plus,
  RefreshCw,
  Radar,
  Award,
  QrCode,
  Info,
  UserPlus
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface SidebarProps {
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
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenManualAddSchool?: () => void;
  onRefreshSchools?: () => Promise<void> | void;
  isRefreshingSchools?: boolean;
  onOpenSchoolBarcode?: () => void;
  onOpenAboutApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  isMobileOpen,
  onCloseMobile,
  onOpenManualAddSchool,
  onRefreshSchools,
  isRefreshingSchools = false,
  onOpenSchoolBarcode,
  onOpenAboutApp
}) => {
  const isPlatformAdmin = currentRole === 'super_admin' || currentRole === 'platform_admin';
  const isSchoolAdminOrPrincipal =
    currentRole === 'principal' ||
    currentRole === 'vice_principal' ||
    currentRole === 'school_admin' ||
    currentRole === 'school_manager';
  const isTeacher = currentRole === 'teacher';
  const isStudent = currentRole === 'student';
  const isCounselor = currentRole === 'counselor';

  const roleDisplayNames: Record<string, string> = {
    student: 'طالب',
    teacher: 'معلم',
    parent: 'ولي أمر',
    counselor: 'مرشد إرشادي',
    vice_principal: 'وكيل المدرسة',
    principal: 'مدير المدرسة',
    school_admin: 'مدير المدرسة',
    school_manager: 'مدير المدرسة',
    super_admin: 'مدير المنصة (Super Admin)',
    platform_admin: 'مدير المنصة (Super Admin)'
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#080f24] text-slate-100 border-l border-blue-900/40 select-none relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="p-4 border-b border-blue-900/40 flex items-center justify-between relative z-10">
        <div
          onClick={() => handleTabClick('dashboard')}
          className="flex items-center cursor-pointer group"
          id="sidebar-brand-link"
        >
          <BrandLogo size="md" showText={true} showVersion={true} />
        </div>

        {/* Mobile Close Button */}
        <button
          id="close-mobile-sidebar-btn"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* School Badge / Switcher */}
      {currentSchool && (
        <div className="px-4 py-3 bg-[#0a132c]/70 border-b border-blue-900/30 relative z-10">
          <div className="text-[10px] font-bold text-blue-300/70 uppercase mb-1 flex items-center justify-between">
            <span>المدرسة المعتمدة</span>
            {isPlatformAdmin && <span className="text-cyan-400 font-extrabold">Super Admin</span>}
          </div>

          {isPlatformAdmin ? (
            <div className="relative">
              <button
                id="platform-admin-school-toggle-btn"
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 bg-[#070e24] hover:bg-[#0c183a] text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-blue-800/40 transition font-bold shadow-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <School className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{currentSchool.name}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isSchoolDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSchoolDropdownOpen && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-[#091228] border border-blue-800/60 rounded-xl shadow-2xl py-1 z-50 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] text-cyan-300 font-bold border-b border-blue-900/50 flex items-center justify-between">
                    <span>التبديل بين المدارس ({schools.length})</span>
                    {onRefreshSchools && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRefreshSchools();
                        }}
                        disabled={isRefreshingSchools}
                        className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1 text-[10px] transition disabled:opacity-50"
                        title="تحديث ومزامنة المدارس"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingSchools ? 'animate-spin' : ''}`} />
                        <span>تحديث</span>
                      </button>
                    )}
                  </div>
                  
                  {onOpenManualAddSchool && (
                    <button
                      onClick={() => {
                        setIsSchoolDropdownOpen(false);
                        onOpenManualAddSchool();
                      }}
                      className="w-full text-right px-3 py-2 text-xs flex items-center gap-2 text-emerald-400 hover:bg-emerald-950/40 border-b border-blue-900/40 font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مدرسة جديدة يدوياً</span>
                    </button>
                  )}

                  {schools.map((sch) => (
                    <button
                      key={sch.id}
                      onClick={() => {
                        onSchoolChange(sch);
                        setIsSchoolDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-950/80 transition ${
                        sch.id === currentSchool.id ? 'text-cyan-300 font-bold bg-cyan-950/60' : 'text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-semibold">{sch.name}</p>
                        <p className="text-[10px] text-slate-400">{sch.location}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-950 text-cyan-300 rounded font-semibold shrink-0 ms-1 border border-blue-800/40">
                        {sch.slug}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#070e24] text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-blue-900/40 font-bold shadow-xs">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <p className="truncate text-xs">{currentSchool.name}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{currentSchool.location}</p>
              </div>
            </div>
          )}

          {/* Quick School Barcode Button */}
          {onOpenSchoolBarcode && (
            <button
              onClick={() => {
                onOpenSchoolBarcode();
                onCloseMobile();
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/80 to-purple-950/80 hover:from-cyan-900 hover:to-purple-900 border border-cyan-500/30 text-cyan-300 hover:text-white text-[11px] font-black transition active:scale-95 shadow-xs"
              title="عرض وتحميل كرت ورمز باركود المدرسة الذكي"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>باركود المدرسة الذكي QR</span>
            </button>
          )}
        </div>
      )}

      {/* AI Quick Solver CTA Banner */}
      <div className="p-3 relative z-10">
        <button
          id="sidebar-ai-solver-cta-btn"
          onClick={() => {
            onOpenSolver();
            onCloseMobile();
          }}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold p-3 rounded-2xl shadow-lg shadow-cyan-500/20 flex items-center justify-between transition-all transform active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ScanLine className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="text-right">
              <div className="text-xs font-black">حلاّل المسائل الذكي</div>
              <div className="text-[10px] text-cyan-100 font-medium">تحليل المسائل بالـ OCR</div>
            </div>
          </div>
          <span className="bg-cyan-950 text-cyan-300 text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs border border-cyan-400/40">
            OCR
          </span>
        </button>
      </div>

      {/* Navigation Links (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 no-scrollbar relative z-10">
        {/* Core & Learning Section */}
        <div>
          <div className="px-3 py-1 text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">
            التعليم والذكاء الاصطناعي
          </div>
          <div className="space-y-1 mt-1">
            {/* Dashboard */}
            <button
              id="sidebar-nav-dashboard"
              onClick={() => handleTabClick('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                  : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>لوحة المتابعة الرئيسية</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* AI Solver */}
            {(isStudent || isTeacher || isSchoolAdminOrPrincipal || isPlatformAdmin) && (
              <button
                id="sidebar-nav-solver"
                onClick={() => handleTabClick('solver')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'solver'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                    : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ScanLine className={`w-4 h-4 shrink-0 ${activeTab === 'solver' ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>حلال المسائل و OCR</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                  activeTab === 'solver' ? 'bg-cyan-500 text-slate-950' : 'bg-blue-950 text-cyan-400 border border-blue-800/40'
                }`}>
                  AI
                </span>
              </button>
            )}

            {/* Smart Teacher */}
            {(isStudent || isTeacher || isSchoolAdminOrPrincipal || isPlatformAdmin) && (
              <button
                id="sidebar-nav-smart-teacher"
                onClick={() => handleTabClick('smart-teacher')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'smart-teacher'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/30 text-purple-300 border border-purple-400/50 shadow-md shadow-purple-500/15 font-black'
                    : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-purple-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className={`w-4 h-4 shrink-0 ${activeTab === 'smart-teacher' ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>المعلم الذكي</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                  activeTab === 'smart-teacher' ? 'bg-purple-500 text-slate-950' : 'bg-purple-950 text-purple-300 border border-purple-800/40'
                }`}>
                  تفاعلي
                </span>
              </button>
            )}

            {/* Curriculum Library */}
            {(isStudent || isTeacher || isSchoolAdminOrPrincipal || isPlatformAdmin) && (
              <button
                id="sidebar-nav-curriculum"
                onClick={() => handleTabClick('curriculum')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'curriculum'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                    : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'curriculum' ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>مكتبة المناهج والكتب الوزارية</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {/* Kingdom Schools Radar */}
            <button
              id="sidebar-nav-schools-radar"
              onClick={() => handleTabClick('schools-radar')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                activeTab === 'schools-radar' || activeTab === 'radar'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                  : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radar className={`w-4 h-4 shrink-0 ${activeTab === 'schools-radar' || activeTab === 'radar' ? 'text-cyan-400 animate-pulse' : 'text-cyan-400/80'}`} />
                <span>رادار ربط مدارس المملكة</span>
              </div>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-500/40">
                LIVE
              </span>
            </button>

            {/* Appreciation Letters & Certificates */}
            <button
              id="sidebar-nav-appreciation-letters"
              onClick={() => handleTabClick('appreciation-letters')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                activeTab === 'appreciation-letters' || activeTab === 'appreciation'
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/30 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/15 font-black'
                  : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className={`w-4 h-4 shrink-0 ${activeTab === 'appreciation-letters' || activeTab === 'appreciation' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>خطابات الشكر وشهادات التقدير</span>
              </div>
              <span className="bg-amber-950 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/40">
                تكريم
              </span>
            </button>

            {/* Achievements & Digital Portfolio */}
            <button
              id="sidebar-nav-achievements"
              onClick={() => handleTabClick('achievements')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-cyan-500/20 via-blue-600/30 to-indigo-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                  : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'achievements' ? 'text-cyan-400 animate-spin' : 'text-cyan-400'}`} />
                <span>ملف الإنجاز الرقمي والتميز</span>
              </div>
              <span className="bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-cyan-500/40">
                معتمد QR
              </span>
            </button>
          </div>
        </div>

        {/* Communication Section */}
        <div>
          <div className="px-3 py-1 text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">
            التواصل والمجموعات
          </div>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-nav-messaging"
              onClick={() => handleTabClick('messaging')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                activeTab === 'messaging'
                  ? 'bg-gradient-to-r from-rose-500/20 to-purple-600/30 text-rose-300 border border-rose-400/50 shadow-md shadow-rose-500/15 font-black'
                  : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'messaging' ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>المحادثات والتواصل</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Profile & Dynamic Fields Section */}
        <div>
          <div className="px-3 py-1 text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">
            الحساب والملف الشخصي
          </div>
          <div className="space-y-1 mt-1">
            {/* Profile & Dynamic Fields Section */}
            <button
              id="sidebar-nav-profile"
              onClick={() => handleTabClick('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                  : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>الملف الشخصي والخانات</span>
              </div>
              <span className="bg-cyan-950 text-cyan-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-cyan-500/40">
                ديناميكي
              </span>
            </button>

            {/* About App PWA Nav Item */}
            {onOpenAboutApp && (
              <button
                id="sidebar-nav-about-app"
                onClick={() => {
                  onOpenAboutApp();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200"
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>عن تطبيق حقائق العلوم</span>
                </div>
                <span className="bg-gradient-to-r from-cyan-900/60 to-blue-900/60 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                  v3.2 PWA
                </span>
              </button>
            )}
          </div>
        </div>

        {/* School Management & Counseling Section */}
        {(isSchoolAdminOrPrincipal || isCounselor || isPlatformAdmin) && (
          <div>
            <div className="px-3 py-1 text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">
              الإدارة والإرشاد
            </div>
            <div className="space-y-1 mt-1">
              {/* School Management */}
              {isSchoolAdminOrPrincipal && (
                <button
                  id="sidebar-nav-school-mgmt"
                  onClick={() => handleTabClick('school-mgmt')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                    activeTab === 'school-mgmt'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/15 font-black'
                      : 'text-slate-300 hover:bg-[#0c183a]/70 hover:text-cyan-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <School className={`w-4 h-4 shrink-0 ${activeTab === 'school-mgmt' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>إدارة المدرسة والإحصائيات</span>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}

              {/* Counseling */}
              {(isCounselor || isSchoolAdminOrPrincipal) && (
                <button
                  id="sidebar-nav-counseling"
                  onClick={() => handleTabClick('counseling')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                    activeTab === 'counseling'
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/30 text-indigo-300 border border-indigo-400/50 shadow-md shadow-indigo-500/15 font-black'
                      : 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>الإرشاد الطلابي والسرية</span>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}

              {/* Kharj Schools Directory & Invitations */}
              <button
                id="sidebar-nav-kharj-schools"
                onClick={() => handleTabClick('kharj-schools')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'kharj-schools'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-600/30 text-emerald-300 border border-emerald-400/50 shadow-md shadow-emerald-500/15 font-black'
                    : 'text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مدارس ومراكز الخرج</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  دعوات
                </span>
              </button>

              {/* Platform Admin */}
              {isPlatformAdmin && (
                <button
                  id="sidebar-nav-platform-admin"
                  onClick={() => handleTabClick('platform-admin')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                    activeTab === 'platform-admin' || activeTab === 'super_admin'
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/30 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/15 font-black'
                      : 'text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>لوحة الأدمن العام (Super Admin)</span>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Card / Login Footer */}
      <div className="p-3 border-t border-blue-900/40 bg-[#060c1d] relative z-10">
        {/* PWA In-App Install Card */}
        <PWAInstallButton variant="sidebar" className="mb-2.5" />

        {currentUser ? (
          <div className="space-y-2">
            <div
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-2.5 p-2 bg-[#09132c] hover:bg-[#0d1a3c] rounded-xl border border-blue-900/50 shadow-xs cursor-pointer transition group"
              title="عرض وتعديل الملف الشخصي"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 shadow-xs">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName?.[0] || 'ح'
                )}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-black text-slate-100 group-hover:text-cyan-300 transition-colors truncate">{currentUser.fullName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="bg-blue-950 text-cyan-300 border border-blue-800/50 text-[9px] font-bold px-1.5 py-0.2 rounded">
                    {roleDisplayNames[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>
              <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </div>

            <button
              id="sidebar-logout-btn"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-900/40 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              id="sidebar-register-btn"
              onClick={() => {
                onOpenLoginModal('register');
                onCloseMobile();
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <UserPlus className="w-4 h-4 text-emerald-200" />
              <span>تسجيل حساب جديد</span>
            </button>
            <button
              id="sidebar-login-btn"
              onClick={() => {
                onOpenLoginModal('login');
                onCloseMobile();
              }}
              className="w-full bg-[#0d1c44] hover:bg-[#13275c] border border-blue-800/60 text-slate-200 hover:text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Right Sidebar */}
      <aside
        id="desktop-right-sidebar"
        className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 z-30 shadow-2xl"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Right side slide-in) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end" id="mobile-sidebar-drawer">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Container (Right side) */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
