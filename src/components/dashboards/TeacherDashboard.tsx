import React, { useState } from 'react';
import {
  AuthUser,
  SchoolTenant,
  HomeworkAssignment,
  QuizItem,
  TeacherPermissions
} from '../../types';
import { SupabaseSchoolUserLink } from '../../lib/supabase';
import { TeacherStudentsView } from './teacher/TeacherStudentsView';
import { TeacherScheduleView } from './teacher/TeacherScheduleView';
import { TeacherNotesView } from './teacher/TeacherNotesView';
import { TeacherAttendanceView } from './teacher/TeacherAttendanceView';
import { TeacherQuizzesView } from './teacher/TeacherQuizzesView';
import { TeacherHomeworksView } from './teacher/TeacherHomeworksView';
import { TeacherCommunicationsView } from './teacher/TeacherCommunicationsView';
import { TeacherAppreciationLettersView } from './teacher/TeacherAppreciationLettersView';
import { AchievementsPortfolioView } from '../achievements/AchievementsPortfolioView';
import {
  Users,
  Calendar,
  FileText,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Megaphone,
  Database,
  GraduationCap,
  Sparkles,
  School,
  UserCheck,
  ShieldCheck,
  Award
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser?: AuthUser | null;
  currentSchool?: SchoolTenant | null;
  userSchoolLink?: SupabaseSchoolUserLink | null;
  homeworks?: HomeworkAssignment[];
  onAddHomework?: (hw: HomeworkAssignment) => void;
  onAddQuiz?: (quiz: QuizItem) => void;
  onOpenInviteStudentModal?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser = null,
  currentSchool = null,
  userSchoolLink = null,
  homeworks = [],
  onAddHomework,
  onAddQuiz,
  onOpenInviteStudentModal
}) => {
  const [activeTab, setActiveTab] = useState<
    'students' | 'schedule' | 'notes' | 'homeworks' | 'quizzes' | 'attendance' | 'communications' | 'appreciation' | 'achievements' | 'db_migration'
  >('students');

  const [permissions, setPermissions] = useState<TeacherPermissions>({
    canAddStudent: true,
    canEditStudent: true,
    canManageSchedule: true,
    canRecordAttendance: true,
    canAddNotes: true,
    canCreateHomework: true,
    canCreateQuizzes: true,
    canMessageParents: true
  });

  const teacherName = currentUser?.fullName || userSchoolLink?.full_name || 'المعلم المعتمد';
  const schoolName = currentSchool?.name || 'مدرسة النموذجية الأهلية';

  const tabs = [
    {
      id: 'students',
      label: 'طلابي والفصول',
      icon: Users,
      badge: 'الأساس'
    },
    {
      id: 'schedule',
      label: 'الجدول الدراسي',
      icon: Calendar,
      badge: 'أسبوعي'
    },
    {
      id: 'notes',
      label: 'سجل الملاحظات والسلوك',
      icon: FileText,
      badge: 'متابعة'
    },
    {
      id: 'homeworks',
      label: 'الواجبات والمهام',
      icon: BookOpen,
      badge: 'تكليفات'
    },
    {
      id: 'quizzes',
      label: 'الاختبارات القصيرة',
      icon: HelpCircle,
      badge: 'تقييم'
    },
    {
      id: 'attendance',
      label: 'رصد الحضور والغياب',
      icon: CheckCircle2,
      badge: 'حصص'
    },
    {
      id: 'communications',
      label: 'التواصل والإعلانات',
      icon: Megaphone,
      badge: 'مباشر'
    },
    {
      id: 'appreciation',
      label: 'خطابات الشكر والشهادات',
      icon: Award,
      badge: 'تكريم رسمي'
    },
    {
      id: 'achievements',
      label: 'ملف إنجاز المعلم والأنشطة',
      icon: Sparkles,
      badge: 'إنجازاتي المعتمدة'
    }
  ];


  return (
    <div className="space-y-6" id="teacher-operational-dashboard">
      {/* Top Banner & Context Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                حساب تعليمي معتمد
              </span>

              <span className="bg-white/10 text-slate-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                {schoolName}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              لوحة تحكم المعلم والمعلمة — {teacherName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              منظومة متكاملة لإدارة الطلاب، الحصص، رصد الحضور اليومي، الملاحظات الأكاديمية والسلوكية، الواجبات، بنك الاختبارات، وإصدار شهادات وخطابات التقدير.
            </p>
          </div>

          {/* Quick Context Stats */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm self-stretch md:self-auto justify-around">
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-400 block font-bold">الفصول المسندة</span>
              <span className="text-lg font-black text-white">4 فصول</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-400 block font-bold">المادة الأساسية</span>
              <span className="text-lg font-black text-emerald-400">العلوم العامة</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-400 block font-bold">حالة المزامنة</span>
              <span className="text-lg font-black text-indigo-400 font-mono">100% RLS</span>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold ml-2 whitespace-nowrap">إجراءات سريعة:</span>
          <button
            onClick={() => setActiveTab('students')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            إضافة وإدارة الطلاب
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
            إضافة حصة للجدول
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            تدوين ملاحظة دراسية/سلوكية
          </button>
          <button
            onClick={() => setActiveTab('homeworks')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-300" />
            إنشاء واجب مدرسي
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            رصد حضور الحصة
          </button>
          <button
            onClick={() => setActiveTab('appreciation')}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            شهادات وخطابات الشكر
          </button>
        </div>
      </div>

      {/* Operational Navigation Tabs */}
      <div className="bg-white rounded-3xl p-2.5 border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-[760px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-teacher-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-3.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Component */}
      <div className="transition-all duration-150">
        {activeTab === 'students' && (
          <TeacherStudentsView
            currentUser={currentUser}
            currentSchool={currentSchool}
            canAddStudent={permissions.canAddStudent}
            canEditStudent={permissions.canEditStudent}
            canAddNotes={permissions.canAddNotes}
          />
        )}

        {activeTab === 'schedule' && (
          <TeacherScheduleView
            currentUser={currentUser}
            currentSchool={currentSchool}
            canManageSchedule={permissions.canManageSchedule}
          />
        )}

        {activeTab === 'notes' && (
          <TeacherNotesView
            currentUser={currentUser}
            currentSchool={currentSchool}
            canAddNotes={permissions.canAddNotes}
          />
        )}

        {activeTab === 'homeworks' && (
          <TeacherHomeworksView
            currentUser={currentUser}
            currentSchool={currentSchool}
            homeworks={homeworks}
            onAddHomework={onAddHomework}
            canCreateHomework={permissions.canCreateHomework}
          />
        )}

        {activeTab === 'quizzes' && (
          <TeacherQuizzesView
            currentUser={currentUser}
            currentSchool={currentSchool}
            canCreateQuizzes={permissions.canCreateQuizzes}
          />
        )}

        {activeTab === 'attendance' && (
          <TeacherAttendanceView
            currentUser={currentUser}
            currentSchool={currentSchool}
            canRecordAttendance={permissions.canRecordAttendance}
          />
        )}

        {activeTab === 'communications' && (
          <TeacherCommunicationsView
            currentUser={currentUser}
            currentSchool={currentSchool}
            canMessageParents={permissions.canMessageParents}
          />
        )}

        {activeTab === 'appreciation' && (
          <TeacherAppreciationLettersView
            currentUser={currentUser}
            currentSchool={currentSchool}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsPortfolioView
            currentUser={
              currentUser || {
                id: userSchoolLink?.user_id || 'teacher_user',
                name: teacherName,
                role: 'teacher',
                email: ''
              }
            }
            currentSchool={currentSchool}
            defaultTab="my"
          />
        )}
      </div>
    </div>
  );
};
