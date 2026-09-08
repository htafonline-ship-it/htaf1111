import React from 'react';
import { UserRole, SchoolTenant, AuthUser } from '../types';
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
  User
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  currentSchool: SchoolTenant | null;
  schools: SchoolTenant[];
  onSchoolChange: (school: SchoolTenant) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSolver: () => void;
  currentUser: AuthUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentSchool,
  schools,
  onSchoolChange,
  activeTab,
  setActiveTab,
  onOpenSolver,
  currentUser,
  onOpenLoginModal,
  onLogout
}) => {
  const isPlatformAdmin = currentRole === 'super_admin' || currentRole === 'platform_admin';
  const isSchoolAdminOrPrincipal = currentRole === 'principal' || currentRole === 'vice_principal' || currentRole === 'school_admin' || currentRole === 'school_manager';
  const isTeacher = currentRole === 'teacher';
  const isStudent = currentRole === 'student';
  const isParent = currentRole === 'parent';
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
    super_admin: 'مدير المنصة (الأدمن العام)',
    platform_admin: 'مدير المنصة (الأدمن العام)'
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-800 shadow-sm border-b border-slate-200">
      {/* Top Banner: School Announcement / Circular Preview (if present) */}
      {currentSchool && currentSchool.circulars && currentSchool.circulars.length > 0 && isSchoolAdminOrPrincipal && (
        <div className="bg-blue-50 text-blue-900 px-4 py-1.5 text-xs flex items-center justify-between border-b border-blue-100">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
              تعميم مدرسة {currentSchool.name.split(' ')[0]}
            </span>
            <span className="truncate font-medium">{currentSchool.circulars[0].title}</span>
          </div>
          <button
            onClick={() => setActiveTab('school-mgmt')}
            className="text-blue-700 hover:text-blue-900 underline font-bold text-[11px] shrink-0 me-2"
          >
            عرض التعاميم الرسمية
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-6 h-6 text-white font-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-cyan-400 flex items-center gap-1.5">
                    هتاف العاصمي
                  </h1>
                  <span className="bg-cyan-950 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-800/50">
                    منصة ذكية v3.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  منصة تعليمية ذكية للمدارس والمناهج
                </p>
              </div>
            </div>

            {/* Current School Badge or Multi-Tenant Selector */}
            {currentSchool && (
              <div className="hidden md:flex items-center ms-4 border-r border-slate-200 pr-4">
                {isPlatformAdmin ? (
                  /* Multi-tenant selector ONLY for Platform Admin */
                  <div className="relative group">
                    <button className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-xl border border-slate-200 transition">
                      <School className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold max-w-[150px] truncate">{currentSchool.name}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                      <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        المدارس المسجلة بالمنصة (Platform Admin)
                      </div>
                      {schools.map((sch) => (
                        <button
                          key={sch.id}
                          onClick={() => onSchoolChange(sch)}
                          className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                            sch.id === currentSchool.id ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate">
                            <div>{sch.name}</div>
                            <div className="text-[10px] text-slate-400">{sch.location}</div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                            {sch.slug}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Static School Badge for regular users */
                  <div className="flex items-center gap-2 bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-xl border border-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-extrabold max-w-[180px] truncate">{currentSchool.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSolver}
              className="relative group bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-white animate-pulse" />
              <span className="hidden md:inline">حلال المسائل الذكي</span>
              <span className="md:hidden">AI Solver</span>
              <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                OCR
              </span>
            </button>

            {/* User Profile / Auth State */}
            {currentUser ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-sm border border-slate-800 transition">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-[11px] overflow-hidden border border-white/20 shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName?.[0] || 'ح'
                    )}
                  </div>
                  <div className="text-right hidden sm:block max-w-[140px] truncate">
                    <div className="font-bold truncate text-[11px]">{currentUser.fullName}</div>
                    <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span>{roleDisplayNames[currentUser.role] || currentUser.role}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ms-0.5" />
                </button>

                {/* Logged In Dropdown Menu */}
                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-black text-slate-800">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-medium dir-ltr text-right">{currentUser.email || currentUser.username}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        الدور: {roleDisplayNames[currentUser.role] || currentUser.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-right px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-50 text-blue-600 font-bold transition mt-1"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>الملف الشخصي والخانات المخصصة</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full text-right px-3 py-2 text-xs flex items-center gap-2 hover:bg-red-50 text-red-600 font-bold transition border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-2 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Filtered strictly by Role */}
        <nav className="flex space-x-reverse space-x-1 sm:space-x-2 border-t border-slate-100 pt-2 pb-2.5 overflow-x-auto no-scrollbar">
          {/* Dashboard Tab - Available to all logged in users */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>لوحة المتابعة</span>
          </button>

          {/* AI Solver - Student, Teacher, Principal, Platform Admin */}
          {(isStudent || isTeacher || isSchoolAdminOrPrincipal || isPlatformAdmin) && (
            <button
              onClick={() => setActiveTab('solver')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'solver'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>حلال المسائل و OCR</span>
            </button>
          )}

          {/* Smart Teacher - Student, Teacher, Principal */}
          {(isStudent || isTeacher || isSchoolAdminOrPrincipal || isPlatformAdmin) && (
            <button
              onClick={() => setActiveTab('smart-teacher')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'smart-teacher'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>المعلم الذكي</span>
            </button>
          )}

          {/* Curriculum Library - Student, Teacher, Principal, Platform Admin */}
          {(isStudent || isTeacher || isSchoolAdminOrPrincipal || isPlatformAdmin) && (
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'curriculum'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>مكتبة الكتب الوزارية والمناهج</span>
            </button>
          )}

          {/* School Management - Principal / School Admin ONLY */}
          {isSchoolAdminOrPrincipal && (
            <button
              onClick={() => setActiveTab('school-mgmt')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'school-mgmt'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <School className="w-4 h-4" />
              <span>إدارة المدرسة والإحصائيات</span>
            </button>
          )}

          {/* Messaging - All Roles */}
          <button
            onClick={() => setActiveTab('messaging')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'messaging'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>المحادثات والتواصل</span>
          </button>

          {/* Counseling - Counselor or Principal */}
          {(isCounselor || isSchoolAdminOrPrincipal) && (
            <button
              onClick={() => setActiveTab('counseling')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'counseling'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>الإرشاد الطلابي والسرية</span>
            </button>
          )}

          {/* Platform Admin / Super Admin Tab ONLY for Platform Admin */}
          {isPlatformAdmin && (
            <button
              onClick={() => setActiveTab('platform-admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'platform-admin' || activeTab === 'super_admin'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-amber-900 bg-amber-100 hover:bg-amber-200'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>لوحة الأدمن العام (Platform Admin)</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

