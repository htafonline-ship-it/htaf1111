import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Building,
  GraduationCap,
  Sparkles,
  BarChart3,
  Printer,
  FileCode,
  ShieldCheck,
  Calendar,
  Layers,
  BookOpen,
  Star,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Download,
  Copy,
  Check,
  FolderOpen
} from 'lucide-react';
import {
  AchievementRecord,
  AchievementCertificate,
  AchievementCategory,
  AchievementApprovalStatus,
  AuthUser
} from '../../types';
import {
  fetchAchievements,
  computeSchoolAchievementStats,
  ACHIEVEMENT_CATEGORIES,
  BADGE_DEFINITIONS,
  fetchStudentBadges
} from '../../lib/achievementsService';
import { AchievementCard } from './AchievementCard';
import { AchievementFormModal } from './AchievementFormModal';
import { AchievementDetailModal } from './AchievementDetailModal';
import { AchievementCertificateModal } from './AchievementCertificateModal';
import { CertificateVerificationModal } from './CertificateVerificationModal';

interface Props {
  currentUser: AuthUser;
  currentSchool?: any;
  defaultTab?: 'my' | 'class' | 'school' | 'approvals' | 'stats';
  availableStudents?: { id: string; name: string; grade?: string; classroom?: string }[];
  availableTeachers?: { id: string; name: string; subject?: string }[];
}

export const AchievementsPortfolioView: React.FC<Props> = ({
  currentUser,
  currentSchool,
  defaultTab = 'my',
  availableStudents = [],
  availableTeachers = []
}) => {
  const schoolId = currentSchool?.id || 'school_general';
  const schoolName = currentSchool?.name || 'منصة حقائق العلوم';

  const isTeacher = currentUser.role === 'teacher';
  const isStudent = currentUser.role === 'student';
  const isSchoolAdmin = currentUser.role === 'principal' || currentUser.role === 'school_admin' || currentUser.role === 'vice_principal';
  const isCounselor = currentUser.role === 'counselor';
  const isParent = currentUser.role === 'parent';

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'my' | 'class' | 'school' | 'approvals' | 'badges' | 'stats' | 'sql'>(
    isStudent
      ? 'my'
      : isParent
      ? 'my'
      : defaultTab
  );

  // Raw Database Achievements
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<AchievementApprovalStatus | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementRecord | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementRecord | null>(null);
  const [certModalAchievement, setCertModalAchievement] = useState<AchievementRecord | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyCertCode, setVerifyCertCode] = useState('');

  // Print Portfolio Filter
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFilterApprovedOnly, setPrintFilterApprovedOnly] = useState(true);

  // Load Achievements on Mount or Tab Change
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAchievements({
        schoolId,
        // Depending on tab, we can pass initial constraints
        studentId: isStudent ? currentUser.id : undefined,
        teacherId: isTeacher && activeTab === 'my' ? currentUser.id : undefined,
        forSchoolPublishOnly: activeTab === 'school',
        forParentOfStudentId: isParent ? currentUser.id : undefined
      });
      setAchievements(data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, activeTab, currentUser.id]);

  // Check URL query for certificate verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyCode = params.get('verify_cert');
      if (verifyCode) {
        setVerifyCertCode(verifyCode);
        setIsVerifyModalOpen(true);
      }
    }
  }, []);

  // Filtered List for active tab & user criteria
  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      // Tab constraint
      if (activeTab === 'my') {
        if (isStudent) {
          const isMain = item.studentId === currentUser.id || item.creatorId === currentUser.id;
          const isPart = item.participants?.some((p) => p.studentId === currentUser.id);
          if (!isMain && !isPart) return false;
        } else if (isTeacher) {
          if (item.teacherId !== currentUser.id && item.creatorId !== currentUser.id) {
            return false;
          }
        }
      } else if (activeTab === 'approvals') {
        // Pending approvals tab
        if (isTeacher) {
          if (item.approvalStatus !== 'pending_teacher') return false;
        } else if (isSchoolAdmin) {
          if (item.approvalStatus !== 'approved_teacher' && item.approvalStatus !== 'pending_teacher') return false;
        }
      } else if (activeTab === 'school') {
        // Only approved for school publish
        if (!item.approvedForSchoolPublish || item.approvalStatus !== 'approved_school') {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Grade filter
      if (selectedGrade !== 'all' && item.grade !== selectedGrade) {
        return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && item.approvalStatus !== selectedStatus) {
        return false;
      }

      // Year filter
      if (selectedYear !== 'all' && item.academicYear !== selectedYear) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchStudent = item.studentName?.toLowerCase().includes(q);
        const matchTeacher = item.teacherName?.toLowerCase().includes(q);
        const matchSubj = item.subject?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchStudent && !matchTeacher && !matchSubj) {
          return false;
        }
      }

      return true;
    });
  }, [
    achievements,
    activeTab,
    isStudent,
    isTeacher,
    isSchoolAdmin,
    currentUser.id,
    selectedCategory,
    selectedGrade,
    selectedSubject,
    selectedStatus,
    selectedYear,
    searchQuery
  ]);

  // Statistics calculation from real database records
  const stats = useMemo(() => {
    return computeSchoolAchievementStats(achievements, schoolId);
  }, [achievements, schoolId]);

  // Pending Count Badge
  const pendingCount = useMemo(() => {
    if (isTeacher) {
      return achievements.filter((a) => a.approvalStatus === 'pending_teacher').length;
    }
    if (isSchoolAdmin) {
      return achievements.filter((a) => a.approvalStatus === 'approved_teacher' && !a.approvedForSchoolPublish).length;
    }
    return 0;
  }, [achievements, isTeacher, isSchoolAdmin]);

  return (
    <div className="w-full space-y-6 text-right select-none animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-radial from-[#0e1c3e] via-[#09122a] to-[#060b1b] border border-blue-900/50 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                الملف الرقمي المعتمد
              </span>
              <span className="text-xs text-slate-400 font-semibold">{schoolName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {isStudent
                ? 'ملف إنجازاتي الرقمي'
                : isTeacher
                ? 'ملف إنجاز المعلم والأنشطة'
                : isParent
                ? 'ملف إنجازات أبنائي'
                : 'نظام إنجازات المدرسة والتميز الرقمي'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              توثيق حقيقي للمشاريع العلمية، الأبحاث، الابتكارات، المسابقات، والشهادات المعتمدة مع نظام التحقق برمز الاستجابة السريعة (QR Code).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Verify Certificate Button */}
            <button
              onClick={() => {
                setVerifyCertCode('');
                setIsVerifyModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>تحقق من شهادة</span>
            </button>

            {/* Print Portfolio PDF */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة الملف PDF</span>
            </button>

            {/* Add Achievement Button (Students, Teachers, Admins) */}
            {(isStudent || isTeacher || isSchoolAdmin) && (
              <button
                onClick={() => {
                  setEditingAchievement(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>إضافة إنجاز جديد</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2 overflow-x-auto no-scrollbar text-xs font-black">
        {/* Tab: My Achievements / Portfolio */}
        <button
          onClick={() => setActiveTab('my')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'my'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:bg-slate-900 hover:text-cyan-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{isStudent ? 'إنجازاتي' : isTeacher ? 'ملف إنجاز المعلم' : isParent ? 'إنجازات أبنائي' : 'كافة إنجازات المدرسة'}</span>
        </button>

        {/* Tab: Classroom Achievements */}
        <button
          onClick={() => setActiveTab('class')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'class'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-900 hover:text-cyan-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إنجازات الفصل</span>
        </button>

        {/* Tab: Official School Showcase */}
        <button
          onClick={() => setActiveTab('school')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'school'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-900 hover:text-cyan-300'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>معرض إنجازات المدرسة الرسمي</span>
        </button>

        {/* Tab: Pending Approvals (For Teachers & School Admins) */}
        {(isTeacher || isSchoolAdmin) && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition relative ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-900 hover:text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>بانتظار الاعتماد</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Tab: Badges & Honors (Student only) */}
        {isStudent && (
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === 'badges'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-900 hover:text-purple-300'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>شاراتي وتكريماتي</span>
          </button>
        )}

        {/* Tab: Stats Dashboard (Teachers, Admins, Counselors) */}
        {(isTeacher || isSchoolAdmin || isCounselor) && (
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-900 hover:text-blue-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>إحصائيات الإنجازات والتميز</span>
          </button>
        )}

        {/* Tab: Stats */}
      </div>

      {/* STATS VIEW */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">إجمالي الإنجازات</div>
              <div className="text-2xl font-black text-cyan-300">{stats.totalAchievements}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">إنجازات الطلاب</div>
              <div className="text-2xl font-black text-white">{stats.studentAchievementsCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">إنجازات المعلمين</div>
              <div className="text-2xl font-black text-white">{stats.teacherAchievementsCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">المشروعات والأبحاث</div>
              <div className="text-2xl font-black text-purple-300">{stats.projectsCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">الشهادات المعتمدة</div>
              <div className="text-2xl font-black text-amber-300">{stats.certificatesCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">مرشحو التميز</div>
              <div className="text-2xl font-black text-yellow-300">{stats.excellenceNomineesCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1329] border border-blue-900/40 text-center">
              <div className="text-[11px] text-slate-400 font-bold mb-1">مرشحو الموهبة</div>
              <div className="text-2xl font-black text-pink-300">{stats.talentNomineesCount}</div>
            </div>
          </div>

          {/* Breakdown Charts (Subject & Grade) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Subject */}
            <div className="p-5 rounded-2xl bg-[#0b1329] border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>توزيع الإنجازات حسب المواد الدراسية</span>
                </h3>
              </div>
              <div className="space-y-2.5 pt-2">
                {Object.keys(stats.bySubject).length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    لا توجد بيانات مسجلة حتى الآن.
                  </p>
                ) : (
                  Object.entries(stats.bySubject).map(([subj, countVal]) => {
                    const count = Number(countVal) || 0;
                    const pct = Math.round((count / (stats.totalAchievements || 1)) * 100);
                    return (
                      <div key={subj} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{subj}</span>
                          <span>{count} إنجاز ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* By Grade */}
            <div className="p-5 rounded-2xl bg-[#0b1329] border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>توزيع الإنجازات حسب الصفوف الدراسية</span>
                </h3>
              </div>
              <div className="space-y-2.5 pt-2">
                {Object.keys(stats.byGrade).length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    لا توجد بيانات مسجلة حتى الآن.
                  </p>
                ) : (
                  Object.entries(stats.byGrade).map(([gr, countVal]) => {
                    const count = Number(countVal) || 0;
                    const pct = Math.round((count / (stats.totalAchievements || 1)) * 100);
                    return (
                      <div key={gr} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{gr}</span>
                          <span>{count} إنجاز ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* BADGES SHOWCASE VIEW (Student) */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#090f23] border border-purple-500/30">
            <h3 className="text-sm font-black text-purple-300 flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-purple-400" />
              <span>شارات التميز والوسام الرقمي المعتمد</span>
            </h3>
            <p className="text-xs text-slate-400">
              تُمنح هذه الشارات من قبل المعلمين وإدارة المدرسة تقديراً للأعمال والأنشطة النوعية المتميزة.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {BADGE_DEFINITIONS.map((b) => {
              // Check if student has this badge
              const studentBadges = fetchStudentBadges(currentUser.id);
              const isEarned = studentBadges.some((sb) => sb.badgeKey === b.key);

              return (
                <div
                  key={b.key}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    isEarned
                      ? 'bg-gradient-to-b from-purple-950/80 to-[#0c142b] border-purple-500/60 shadow-lg shadow-purple-500/20'
                      : 'bg-[#0a1126] border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="text-4xl mb-2">{b.icon}</div>
                  <div className="text-xs font-black text-white">{b.title}</div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {b.description}
                  </p>
                  <div className="mt-3">
                    {isEarned ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500 text-white font-black">
                        حصلت عليها ⭐
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold">
                        لم تُكتسب بعد
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR (For achievements list views) */}
      {(activeTab === 'my' || activeTab === 'class' || activeTab === 'school' || activeTab === 'approvals') && (
        <div className="p-4 rounded-2xl bg-[#0a1126] border border-blue-900/40 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان، الوصف، اسم الطالب، المعلم، أو المادة..."
                className="w-full bg-[#060b1a] border border-blue-900/50 focus:border-cyan-400 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-hidden"
              />
            </div>

            {/* Quick Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-[#060b1a] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-hidden w-full md:w-48"
            >
              <option value="all">كل التصنيفات (22+ نوع)</option>
              {ACHIEVEMENT_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Subject Dropdown */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-[#060b1a] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-hidden w-full md:w-36"
            >
              <option value="all">كل المواد</option>
              <option value="العلوم">العلوم</option>
              <option value="الرياضيات">الرياضيات</option>
              <option value="الفيزياء">الفيزياء</option>
              <option value="الكيمياء">الكيمياء</option>
              <option value="الأحياء">الأحياء</option>
              <option value="المهارات الرقمية">المهارات الرقمية</option>
              <option value="اللغة العربية">اللغة العربية</option>
              <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
              <option value="النشاط والابتكار المدرسي">النشاط المدرسي</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-[#060b1a] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-hidden w-full md:w-36"
            >
              <option value="all">كافة الحالات</option>
              <option value="approved_school">معتمد من المدرسة</option>
              <option value="approved_teacher">معتمد من المعلم</option>
              <option value="pending_teacher">بانتظار الاعتماد</option>
              <option value="needs_revision">يحتاج تعديل</option>
              <option value="draft">مسودة</option>
            </select>

            {/* Reset Filters */}
            {(searchQuery || selectedCategory !== 'all' || selectedSubject !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSubject('all');
                  setSelectedStatus('all');
                }}
                className="px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS CARDS GRID */}
      {(activeTab === 'my' || activeTab === 'class' || activeTab === 'school' || activeTab === 'approvals') && (
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
              <div className="text-xs font-bold">جارٍ تحميل الإنجازات المعتمدة...</div>
            </div>
          ) : filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAchievements.map((item) => (
                <AchievementCard
                  key={item.id}
                  achievement={item}
                  currentUser={currentUser}
                  onViewDetails={(ach) => setSelectedAchievement(ach)}
                  onViewCertificate={(ach) => setCertModalAchievement(ach)}
                  onCongratulate={(ach) => setSelectedAchievement(ach)}
                />
              ))}
            </div>
          ) : (
            /* Pristine Zero Mock Data Empty State */
            <div className="py-16 px-6 text-center rounded-2xl bg-[#090f23] border border-blue-900/30 space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">لا توجد إنجازات مسجلة حتى الآن</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {activeTab === 'school'
                    ? 'لم يتم اعتماد إنجازات للنشر في المعرض المدرسي الرسمي بعد.'
                    : activeTab === 'approvals'
                    ? 'لا توجد طلبات معلقة بانتظار المراجعة والاعتماد حالياً.'
                    : 'ابدأ الآن بإضافة أول إنجاز أو مشروع أو شهادة لتوثيقها في ملفك الرقمي المعتمد.'}
                </p>
              </div>

              {(isStudent || isTeacher || isSchoolAdmin) && (
                <button
                  onClick={() => {
                    setEditingAchievement(null);
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة إنجاز جديد</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT WIZARD */}
      {isFormOpen && (
        <AchievementFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAchievement(null);
          }}
          currentUser={currentUser}
          schoolId={schoolId}
          initialAchievement={editingAchievement}
          onSuccess={(saved) => {
            setAchievements((prev) => {
              const idx = prev.findIndex((a) => a.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
          }}
          availableStudents={availableStudents}
          availableTeachers={availableTeachers}
        />
      )}

      {/* MODAL: DETAIL SHOWCASE */}
      {selectedAchievement && (
        <AchievementDetailModal
          isOpen={!!selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          achievement={selectedAchievement}
          currentUser={currentUser}
          schoolName={schoolName}
          onUpdate={(updated) => {
            setSelectedAchievement(updated);
            setAchievements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          }}
          onOpenCertificate={(ach) => {
            setSelectedAchievement(null);
            setCertModalAchievement(ach);
          }}
          onEdit={(ach) => {
            setSelectedAchievement(null);
            setEditingAchievement(ach);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* MODAL: CERTIFICATE PRINTABLE VIEW */}
      {certModalAchievement && (
        <AchievementCertificateModal
          isOpen={!!certModalAchievement}
          onClose={() => setCertModalAchievement(null)}
          achievement={certModalAchievement}
          certificate={certModalAchievement.certificate}
          schoolName={schoolName}
        />
      )}

      {/* MODAL: CERTIFICATE VERIFICATION */}
      {isVerifyModalOpen && (
        <CertificateVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          initialCode={verifyCertCode}
          achievements={achievements}
        />
      )}

      {/* MODAL: PRINT PORTFOLIO OPTIONS */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 text-right">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Printer className="w-5 h-5" />
              <span>تصدير وطباعة ملف الإنجاز الشامل (PDF)</span>
            </h3>

            <p className="text-xs text-slate-300">
              اختر خيارات التصدير لإعداد التقرير المعتمد مع صفحة الغلاف وجدول الإنجازات:
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printFilterApprovedOnly}
                  onChange={(e) => setPrintFilterApprovedOnly(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="text-white font-bold">تضمين الإنجازات المعتمدة فقط</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setIsPrintModalOpen(false);
                  window.print();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow"
              >
                طباعة الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
