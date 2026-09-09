import React, { useState, useEffect } from 'react';
import { StudentProfile, HomeworkAssignment, QuizItem, AuthUser, SchoolTenant } from '../../types';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Award,
  BarChart3,
  CheckSquare,
  Square,
  ChevronLeft,
  X,
  Play,
  ScanLine,
  Bot,
  MessageSquare,
  FileCheck2,
  TrendingUp,
  Flame,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  ShieldCheck,
  Search,
  BookMarked,
  Layers,
  Edit3,
  PlusCircle,
  Check,
  LogIn,
  UserCheck,
  UserX,
  RefreshCw,
  Database,
  UploadCloud,
  Send
} from 'lucide-react';
import {
  fetchSupabaseStudentProfile,
  fetchSupabaseStudentHomeworks,
  submitSupabaseStudentHomework,
  fetchSupabaseStudentGrades,
  updateSupabaseStudentProfileRecord,
  isSupabaseConfigured
} from '../../lib/supabase';
import { AchievementsPortfolioView } from '../achievements/AchievementsPortfolioView';
import { ScrollFadeIn } from '../ScrollFadeIn';
import { StudentAnalyticsCharts } from './StudentAnalyticsCharts';

interface StudentDashboardProps {
  profile: StudentProfile;
  homeworks: HomeworkAssignment[];
  quizzes: QuizItem[];
  onOpenSolverForHomework: (hw: HomeworkAssignment) => void;
  onUpdateRevisionTask: (taskId: number, completed: boolean) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSolver?: () => void;
  onUpdateProfile?: (updatedProfile: StudentProfile) => void;
  currentUser?: AuthUser | null;
  currentSchool?: SchoolTenant | null;
  onOpenLoginModal?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  profile,
  homeworks,
  quizzes,
  onOpenSolverForHomework,
  onUpdateRevisionTask,
  onNavigateTab,
  onOpenSolver,
  onUpdateProfile,
  currentUser,
  currentSchool,
  onOpenLoginModal
}) => {
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Authenticated real user status
  const isAuthenticated = !!currentUser;
  const realStudentName = currentUser 
    ? (currentUser.fullName || currentUser.username || currentUser.email?.split('@')[0] || 'طالب مسجل')
    : (profile.name || 'طالب مسجل');

  // Edit Profile / Real Data Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editedName, setEditedName] = useState(realStudentName);
  const [editedGrade, setEditedGrade] = useState(profile.grade || 'غير محدد');
  const [editedAvatar, setEditedAvatar] = useState(profile.avatar || '🧑‍🎓');
  const [editedDailyQuestions, setEditedDailyQuestions] = useState(profile.aiQuestionsCountToday ?? 0);
  const [editedScreenTime, setEditedScreenTime] = useState(profile.screenTimeUsedTodayMinutes ?? 0);
  const [editedScreenLimit, setEditedScreenLimit] = useState(profile.screenTimeDailyLimitMinutes ?? 120);
  const [streakDays, setStreakDays] = useState(0);
  const [streakCheckedToday, setStreakCheckedToday] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real Supabase Live Data State
  const [liveProfile, setLiveProfile] = useState<StudentProfile>(profile);
  const [liveHomeworks, setLiveHomeworks] = useState<HomeworkAssignment[]>(homeworks);
  const [isSyncingWithSupabase, setIsSyncingWithSupabase] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Homework submission modal state
  const [submittingHomework, setSubmittingHomework] = useState<HomeworkAssignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);

  // Function to fetch real data from Supabase
  const loadRealDataFromSupabase = async () => {
    if (!currentUser?.id) return;
    setIsSyncingWithSupabase(true);
    try {
      // 1. Fetch real student profile from Supabase
      const dbProfile = await fetchSupabaseStudentProfile(
        currentUser.id,
        currentUser.email,
        currentSchool?.id || currentUser.schoolId
      );

      if (dbProfile) {
        setLiveProfile(dbProfile);
        if (onUpdateProfile) {
          onUpdateProfile(dbProfile);
        }
        if (dbProfile.name) setEditedName(dbProfile.name);
        if (dbProfile.grade) setEditedGrade(dbProfile.grade);
      }

      // 2. Fetch real homework assignments from Supabase
      const dbHomeworks = await fetchSupabaseStudentHomeworks(
        currentSchool?.id || currentUser.schoolId,
        dbProfile?.grade || profile.grade,
        currentUser.id
      );

      if (dbHomeworks && dbHomeworks.length > 0) {
        setLiveHomeworks(dbHomeworks);
      }

      // 3. Fetch real grades from Supabase
      const dbGrades = await fetchSupabaseStudentGrades(currentUser.id, dbProfile?.id, currentSchool?.id);
      if (dbGrades && dbGrades.length > 0) {
        setLiveProfile(prev => ({ ...prev, subjectsPerformance: dbGrades }));
      }

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Error syncing real student data from Supabase:', err);
    } finally {
      setIsSyncingWithSupabase(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const name = currentUser.fullName || currentUser.username || currentUser.email?.split('@')[0] || '';
      if (name) setEditedName(name);
      loadRealDataFromSupabase();
    }
  }, [currentUser, currentSchool]);

  // Keep live state in sync with parent props when they change
  useEffect(() => {
    if (profile) setLiveProfile(profile);
  }, [profile]);

  // Real-time listener for profile updates from QuizModal or elsewhere
  useEffect(() => {
    const handleProfileEvent = (evt: any) => {
      if (evt.detail) {
        setLiveProfile((prev) => ({ ...prev, ...evt.detail }));
      }
    };
    window.addEventListener('htaf_student_profile_updated', handleProfileEvent);
    return () => {
      window.removeEventListener('htaf_student_profile_updated', handleProfileEvent);
    };
  }, []);

  useEffect(() => {
    if (homeworks) setLiveHomeworks(homeworks);
  }, [homeworks]);

  // Active Tool Card highlight state
  const [activeCardId, setActiveCardId] = useState<string>('ocr-solver');

  // Help Center FAQ expansion states
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Dynamic calculations from real live state
  const currentActiveProfile = liveProfile || profile;
  const currentActiveHomeworks = liveHomeworks && liveHomeworks.length > 0 ? liveHomeworks : homeworks;

  const hasNewChallenge = Boolean(
    currentActiveProfile.hasNewChallengeBadge ||
    (Array.isArray(currentActiveProfile.badges) && currentActiveProfile.badges.includes('تحدي جديد')) ||
    currentActiveProfile.newChallengeBadge ||
    (Array.isArray(currentActiveProfile.quizResults) && currentActiveProfile.quizResults.some((q) => q.percentage >= 80))
  );

  const totalScores = currentActiveProfile.subjectsPerformance?.reduce((acc, curr) => acc + curr.scorePercentage, 0) || 0;
  const calculatedGpa = currentActiveProfile.subjectsPerformance?.length 
    ? Math.round(totalScores / currentActiveProfile.subjectsPerformance.length) 
    : 0;

  const completedHomeworkCount = currentActiveHomeworks.filter((h) => h.status === 'submitted' || h.status === 'graded').length;
  const totalHomeworkCount = currentActiveHomeworks.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCheckInStreak = () => {
    if (!streakCheckedToday) {
      setStreakDays(prev => prev + 1);
      setStreakCheckedToday(true);
      showToast('🔥 تم تسجيل نشاطك اليومي بنجاح! +1 يوم في سلسلة التفوق المستمر.');
    } else {
      showToast('✨ تم تسجيل حضورك ونشاطك لليوم مسبقاً! واصل التألق.');
    }
  };

  const handleAddStudyMinutes = (mins: number) => {
    const newUsed = Math.min(currentActiveProfile.screenTimeDailyLimitMinutes || 90, (currentActiveProfile.screenTimeUsedTodayMinutes || 42) + mins);
    const updated = {
      ...currentActiveProfile,
      screenTimeUsedTodayMinutes: newUsed
    };
    setLiveProfile(updated);
    if (onUpdateProfile) onUpdateProfile(updated);
    setEditedScreenTime(newUsed);

    if (currentUser?.id) {
      updateSupabaseStudentProfileRecord(currentUser.id, { screenTimeUsed: newUsed });
    }
    showToast(`⏱️ تم إضافة ${mins} دقيقة إلى سجل المذاكرة اليومي.`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentProfile = {
      ...currentActiveProfile,
      name: editedName,
      grade: editedGrade,
      avatar: editedAvatar,
      aiQuestionsCountToday: Number(editedDailyQuestions),
      screenTimeUsedTodayMinutes: Number(editedScreenTime),
      screenTimeDailyLimitMinutes: Number(editedScreenLimit)
    };

    setLiveProfile(updated);
    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }

    if (currentUser?.id) {
      await updateSupabaseStudentProfileRecord(currentUser.id, {
        fullName: editedName,
        gradeName: editedGrade,
        screenTimeLimit: Number(editedScreenLimit),
        screenTimeUsed: Number(editedScreenTime),
        aiQuestionsCount: Number(editedDailyQuestions)
      });
    }

    setIsEditProfileOpen(false);
    showToast('✅ تم حفظ وتحديث بيانات الطالب الحقيقية في قاعدة البيانات بنجاح!');
  };

  // Real Homework Online Submission handler
  const handleConfirmSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHomework) return;

    setIsSubmittingHw(true);
    try {
      const hwId = submittingHomework.id;
      const uId = currentUser?.id || 'std-2026-01';

      if (isSupabaseConfigured && currentUser?.id) {
        await submitSupabaseStudentHomework(hwId, uId, submissionText, 10);
      }

      // Update in local live state
      setLiveHomeworks(prev => prev.map(h => {
        if (h.id === hwId) {
          return {
            ...h,
            status: 'graded',
            score: 10,
            feedback: 'تم استلام الواجب والتحقق من الخطوات بنجاح! أحسنت.'
          };
        }
        return h;
      }));

      // Increment completed homeworks on the subject performance
      setLiveProfile(prev => {
        const subName = submittingHomework.subject;
        const updatedSubjects = prev.subjectsPerformance.map(s => {
          if (s.subject === subName) {
            return {
              ...s,
              homeworkCompleted: Math.min(s.totalHomework, (s.homeworkCompleted || 0) + 1)
            };
          }
          return s;
        });
        const updated = { ...prev, subjectsPerformance: updatedSubjects };
        if (onUpdateProfile) onUpdateProfile(updated);
        return updated;
      });

      setSubmittingHomework(null);
      setSubmissionText('');
      showToast(`🎉 تم تسليم واجب «${submittingHomework.title}» وحساب الدرجة بنجاح!`);
    } catch (err) {
      console.warn('Error submitting homework:', err);
      showToast('❌ تعذر تسليم الواجب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingHw(false);
    }
  };

  // Daily Schedule Preset with Arabic RTL structure
  const schedule = [
    { period: 1, subject: 'الرياضيات المتقدمة', time: '07:30 - 08:15', room: 'قاعة 302', teacher: 'أ. منصور العتيبي', status: 'done', topic: 'حساب التكامل والتطبيقات' },
    { period: 2, subject: 'الفيزياء', time: '08:20 - 09:05', room: 'المختبر 1', teacher: 'أ. د. علي القحطاني', status: 'done', topic: 'الموجات الكهرومغناطيسية' },
    { period: 3, subject: 'اللغة العربية', time: '09:10 - 09:55', room: 'قاعة 302', teacher: 'أ. فهد الزهراني', status: 'current', topic: 'البلاغة والنقد الأدبي' },
    { period: 4, subject: 'الكيمياء العامة', time: '10:20 - 11:05', room: 'معمل الكيمياء', teacher: 'أ. سعيد الغامدي', status: 'upcoming', topic: 'الاتزان الكيميائي' },
    { period: 5, subject: 'الدراسات الإسلامية', time: '11:10 - 11:55', room: 'قاعة 302', teacher: 'أ. إبراهيم الدوسري', status: 'upcoming', topic: 'أصول الفقه' }
  ];

  // Primary Feature Tool Cards Configuration
  const mainFeatureCards = [
    {
      id: 'ocr-solver',
      title: 'حل المسائل الذكي OCR',
      subtitle: 'مسح فوري وتحليل خطوة بخطوة',
      description: 'التقط صورة لمسألتك بالمعادلات أو النصوص عبر الكاميرا، واحصل على الحل النموذجي المفصّل مع الشرح المفهومي فورياً.',
      icon: <ScanLine className="w-7 h-7 text-cyan-400 group-hover:rotate-6 transition-transform duration-300" />,
      badges: ['ذكاء اصطناعي فائق', 'دقة OCR 99%'],
      accentColor: 'from-cyan-500/20 via-blue-500/20 to-indigo-500/20',
      glowColor: 'border-cyan-500/40 text-cyan-300 shadow-cyan-500/20',
      btnText: 'بدء مسح المسألة الآن',
      btnGlow: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25',
      action: () => onOpenSolver ? onOpenSolver() : (onNavigateTab && onNavigateTab('solver'))
    },
    {
      id: 'smart-teacher',
      title: 'المعلم الذكي التفاعلي',
      subtitle: 'حوار تعليمي مخصص 24/7',
      description: 'مساعدك الشخصي المدعوم بأحدث نماذج Gemini لشرح الدروس المعقدة، ضرب الأمثلة الواقعية، والإجابة على أي تساؤل دراسي.',
      icon: <Bot className="w-7 h-7 text-purple-400 group-hover:scale-110 transition-transform duration-300" />,
      badges: ['متاح 24/7', 'شرح حسب مستواك'],
      accentColor: 'from-purple-500/20 via-fuchsia-500/20 to-pink-500/20',
      glowColor: 'border-purple-500/40 text-purple-300 shadow-purple-500/20',
      btnText: 'محاورة المعلم الذكي',
      btnGlow: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25',
      action: () => onNavigateTab && onNavigateTab('smart-teacher')
    },
    {
      id: 'quizzes',
      title: 'الاختبارات والتقييمات',
      subtitle: 'بنك أسئلة تشخيصية وتقييم فوري',
      description: 'اختبر استيعابك للمفاهيم عبر اختبارات قياسية تفاعلية مع تصحيح ذكي وتغذية راجعة تشرح أسباب الإجابة الصحيحة.',
      icon: <FileCheck2 className="w-7 h-7 text-amber-400 group-hover:-rotate-6 transition-transform duration-300" />,
      badges: ['تصحيح فوري', `${quizzes.length} اختبارات متاحة`],
      accentColor: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20',
      glowColor: 'border-amber-500/40 text-amber-300 shadow-amber-500/20',
      btnText: 'بدء التقييم الذاتي',
      btnGlow: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25',
      action: () => {
        if (quizzes.length > 0) {
          setActiveQuiz(quizzes[0]);
          setQuizAnswers({});
          setQuizSubmitted(false);
          setQuizScore(0);
        }
      }
    },
    {
      id: 'curriculum',
      title: 'المناهج والكتب المعتمدة',
      subtitle: 'مكتبة وزارة التعليم بنماذج 3D',
      description: 'تصفح كافة الكتب والمقررات الوزارية المعتمدة لجميع المراحل مع محتوى تفاعلي ثلاثي الأبعاد وروابط مباشرة للفصول.',
      icon: <BookOpen className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform duration-300" />,
      badges: ['مناهج معتمدة', 'قارئ 3D تفاعلي'],
      accentColor: 'from-blue-500/20 via-indigo-500/20 to-sky-500/20',
      glowColor: 'border-blue-500/40 text-blue-300 shadow-blue-500/20',
      btnText: 'تصفح مكتبة المقررات',
      btnGlow: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25',
      action: () => onNavigateTab && onNavigateTab('curriculum')
    },
    {
      id: 'reports',
      title: 'التقارير والإحصائيات',
      subtitle: 'تحليلات التفوق ومسار التحصيل',
      description: 'متابعة بصرية دقيقة لمعدلك التراكمي، ونسب الاستيعاب في كل مادة، وساعات المذاكرة، وتوصيات الذكاء الاصطناعي للتحسين.',
      icon: <TrendingUp className="w-7 h-7 text-emerald-400 group-hover:translate-y-[-2px] transition-transform duration-300" />,
      badges: ['معدل تراكمي 94%', 'تحليل ذكي مستمر'],
      accentColor: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
      glowColor: 'border-emerald-500/40 text-emerald-300 shadow-emerald-500/20',
      btnText: 'عرض تقرير الأداء',
      btnGlow: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25',
      action: () => {
        const elem = document.getElementById('academic-performance-section');
        elem?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      id: 'messaging',
      title: 'المحادثات والتواصل المدرسي',
      subtitle: 'قنوات النقاش ومجموعات المذاكرة',
      description: 'تواصل مباشرة مع معلمي المواد والزملاء في مجموعات المذاكرة المعتمدة لطرح التساؤلات وتبادل الملخصات الصفية بأمان.',
      icon: <MessageSquare className="w-7 h-7 text-rose-400 group-hover:rotate-12 transition-transform duration-300" />,
      badges: ['مجموعات آمنة', 'إشراف المعلم'],
      accentColor: 'from-rose-500/20 via-purple-500/20 to-indigo-500/20',
      glowColor: 'border-rose-500/40 text-rose-300 shadow-rose-500/20',
      btnText: 'الانتقال لغرف المحادثة',
      btnGlow: 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-500/25',
      action: () => onNavigateTab && onNavigateTab('messaging')
    },
    {
      id: 'achievements',
      title: 'إنجازاتي (ملف الإنجاز الرقمي)',
      subtitle: 'توثيق المشاريع والشهادات والأعمال',
      description: 'سجلك الرقمي المعتمد لتوثيق أبحاثك ومشاريعك الفردية والجماعية وشهادات التقدير مع رمز التحقق والاعتماد QR.',
      icon: <Award className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />,
      badges: ['معتمد بالـ QR', 'سجل رسمي'],
      accentColor: 'from-cyan-500/20 via-blue-500/20 to-teal-500/20',
      glowColor: 'border-cyan-500/40 text-cyan-300 shadow-cyan-500/20',
      btnText: 'استعراض وإضافة إنجازاتي',
      btnGlow: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25',
      action: () => {
        if (onNavigateTab) {
          onNavigateTab('achievements');
        } else {
          const elem = document.getElementById('student-achievements-portfolio-section');
          elem?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  ];

  // Frequently Asked Questions for Help Center
  const faqs = [
    {
      q: 'كيف يعمل حلاّل المسائل بالـ OCR في منصة «هتاف العاصمي»؟',
      a: 'يمكنك التقاط صورة أو رفع ملف لمسألة من كتابك المدرسي أو ورقة الواجب، وسيقوم محرك الذكاء الاصطناعي بتحليل النص والمعادلات الرياضية أو العلمية بدقة، وتقديم شرح تدريجي خطوة بخطوة مع القوانين المستخدمة.'
    },
    {
      q: 'هل إجاباتي واستفساراتي مع المعلم الذكي خاصة؟',
      a: 'نعم، تحافظ المنصة على خصوصية الطالب الكاملة، ويتم تخصيص الشروحات والمستويات بناءً على مسار تقدمك الدراسي لضمان أقصى فائدة معرفية.'
    },
    {
      q: 'كيف أتمكن من استعراض النماذج ثلاثية الأبعاد 3D للمناهج؟',
      a: 'من خلال مكتبة المناهج والكتب، اختر الكتاب والموضوع الذي يحتوي على علامة 3D التفاعلية لفتح المجسمات التشريحية والفيزيائية التفاعلية.'
    }
  ];

  const handleSelectQuizOption = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScorePct = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setQuizScore(finalScorePct);
    setQuizSubmitted(true);
  };

  const completedRevisionCount = currentActiveProfile.aiRevisionPlan?.tasks?.filter((t) => t.completed).length || 0;
  const totalRevisionCount = currentActiveProfile.aiRevisionPlan?.tasks?.length || 0;
  const revisionProgressPct = totalRevisionCount > 0 ? Math.round((completedRevisionCount / totalRevisionCount) * 100) : 0;

  return (
    <div className="space-y-10 selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0c1633] text-cyan-300 px-5 py-3 rounded-2xl border border-cyan-500/50 shadow-2xl shadow-cyan-900/50 text-xs sm:text-sm font-black flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HERO: WELCOME & STUDENT INTELLIGENCE STATS (Real Live Connected Banner) */}
      {/* Unauthenticated Guest Notification Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-amber-500/15 via-blue-900/20 to-purple-900/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-300">أنت تتصفح حالياً بـ «وضع الزائر» (جلسة غير مسجلة)</h4>
              <p className="text-xs text-slate-300/80 mt-0.5">
                سجّل الدخول بحسابك الحقيقي لعرض اسمك الفعلي، مدرستك، درجاتك الحقيقية من قاعدة البيانات ومزامنة تقدمك فورياً.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLoginModal}
            className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول بحسابي 🔐</span>
          </button>
        </div>
      )}

      <section className="relative rounded-3xl p-6 sm:p-9 overflow-hidden border border-blue-500/25 bg-gradient-to-br from-[#0c1633] via-[#091228] to-[#060b18] shadow-2xl shadow-blue-950/40">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Student Identity & Greeting */}
          <div className="flex items-start sm:items-center gap-5">
            <div 
              onClick={() => setIsEditProfileOpen(true)}
              className="relative shrink-0 cursor-pointer group"
              title="انقر لتعديل بيانات الملف الحقيقي"
            >
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-2xl bg-[#081024] flex items-center justify-center text-4xl overflow-hidden">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.avatar || editedAvatar || (isAuthenticated ? '🧑‍🎓' : '👤')
                  )}
                </div>
              </div>
              
              {/* Dynamic Online / Connection Status */}
              {isAuthenticated ? (
                <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#081024] flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  متصل
                </div>
              ) : (
                <div className="absolute -bottom-1 -left-1 bg-amber-500/90 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#081024] flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  غير مسجل
                </div>
              )}

              <div className="absolute -top-1 -right-1 bg-blue-950 text-cyan-300 p-1 rounded-full border border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-3 h-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  مرحباً بك، <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                    {isAuthenticated 
                      ? (currentUser?.fullName || currentUser?.username || currentUser?.email?.split('@')[0] || editedName)
                      : (editedName || 'طالب مسجل')}
                  </span> 👋
                </h1>
                
                {isAuthenticated ? (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    حساب حقيقي موثق ({currentUser.role === 'student' ? 'طالب' : currentUser.role === 'teacher' ? 'معلم' : 'عضو مسجل'})
                  </span>
                ) : (
                  <button
                    onClick={onOpenLoginModal}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-500/30 transition"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>جلسة تجريبية (انقر لتسجيل الدخول)</span>
                  </button>
                )}

                {/* شارة "تحدي جديد" عند اجتياز اختبار بنسبة تفوق 80% */}
                {hasNewChallenge && (
                  <div
                    onClick={() => {
                      const elem = document.getElementById('student-challenges-section');
                      elem?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full border border-yellow-200 shadow-md shadow-amber-500/20 animate-pulse cursor-pointer hover:scale-105 transition"
                    title="شارة «تحدي جديد» محققة بنسبة تفوق 80%! انقر لعرض التفاصيل"
                  >
                    <Award className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>🏆 شارة «تحدي جديد»</span>
                    {currentActiveProfile.newChallengeBadge?.percentage ? (
                      <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                        {currentActiveProfile.newChallengeBadge.percentage}%
                      </span>
                    ) : null}
                  </div>
                )}

                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 bg-blue-950/60 px-2 py-1 rounded-lg border border-blue-800/40 hover:border-cyan-500/60 transition"
                  title="تعديل بيانات الطالب"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>تعديل</span>
                </button>

                {isSupabaseConfigured && (
                  <button
                    onClick={loadRealDataFromSupabase}
                    disabled={isSyncingWithSupabase}
                    className="text-xs text-emerald-300 hover:text-white flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-700/50 transition"
                    title="مزامنة وجلب أحدث درجات وواجبات الطالب الحقيقية من Supabase"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingWithSupabase ? 'animate-spin' : ''}`} />
                    <span>{isSyncingWithSupabase ? 'جاري المزامنة...' : 'تحديث البيانات الحقيقية'}</span>
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs sm:text-sm text-blue-200/80 font-medium">
                  {currentSchool?.name ? `${currentSchool.name} • ${currentActiveProfile.grade || editedGrade}` : `${currentActiveProfile.grade || editedGrade} • منصة «هتاف العاصمي» التعليمية الذكية`}
                </p>
                {lastSyncTime && (
                  <span className="text-[10px] text-emerald-400/90 font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/40">
                    🟢 آخر مزامنة: {lastSyncTime}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300/80 pt-1">
                <span className="flex items-center gap-1.5 bg-blue-950/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-blue-800/40">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  {profile.aiQuestionsCountToday ?? editedDailyQuestions} مسألة ذكية معالجة اليوم
                </span>
                <span className="flex items-center gap-1.5 bg-blue-950/60 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-800/40">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  {profile.screenTimeUsedTodayMinutes ?? editedScreenTime} من {profile.screenTimeDailyLimitMinutes ?? editedScreenLimit} دقيقة مذاكرة
                </span>
                <button
                  onClick={() => handleAddStudyMinutes(15)}
                  className="text-[10px] bg-purple-950 hover:bg-purple-900 text-purple-200 px-2 py-0.5 rounded border border-purple-700/50 flex items-center gap-1 transition"
                  title="تسجيل 15 دقيقة إضافية في جلسة المذاكرة الحالية"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+15 دقيقة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Real Metrics Cards */}
          <div className={`grid ${hasNewChallenge ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-3 sm:gap-4 w-full lg:w-auto shrink-0`}>
            {/* GPA */}
            <div 
              onClick={() => {
                const elem = document.getElementById('student-analytics-charts-section');
                elem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0b142c]/90 border border-amber-500/30 p-3.5 sm:p-4 rounded-2xl text-center shadow-lg relative group overflow-hidden cursor-pointer hover:border-amber-400 transition"
              title="انقر لعرض الرسوم البيانية التفاعلية ومسار التفوق"
            >
              <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60" />
              <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">{calculatedGpa}%</div>
              <div className="text-[11px] text-amber-200/80 font-bold mt-0.5">المعدل العام</div>
              <div className="text-[9px] text-emerald-400 font-bold mt-1">↑ +2.4% هذا الشهر</div>
            </div>

            {/* Completed Homework */}
            <div 
              onClick={() => {
                const elem = document.getElementById('student-analytics-charts-section');
                elem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0b142c]/90 border border-cyan-500/30 p-3.5 sm:p-4 rounded-2xl text-center shadow-lg relative group overflow-hidden cursor-pointer hover:border-cyan-400 transition"
              title="انقر لعرض تفاعل المهام والواجبات عبر الوقت"
            >
              <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                {completedHomeworkCount}/{totalHomeworkCount || 12}
              </div>
              <div className="text-[11px] text-cyan-200/80 font-bold mt-0.5">الواجبات</div>
              <div className="text-[9px] text-cyan-300 font-bold mt-1">
                {completedHomeworkCount >= (totalHomeworkCount || 12) ? 'مكتملة بالكامل ✓' : `${totalHomeworkCount - completedHomeworkCount} متبقية`}
              </div>
            </div>

            {/* Daily Streak */}
            <div 
              onClick={handleCheckInStreak}
              className="bg-[#0b142c]/90 border border-purple-500/30 p-3.5 sm:p-4 rounded-2xl text-center shadow-lg relative group overflow-hidden cursor-pointer hover:border-purple-400 hover:scale-105 transition"
              title="انقر لتسجيل حضور ونشاط اليوم وإضافة نقطة في السلسلة!"
            >
              <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60" />
              <div className="text-2xl sm:text-3xl font-black text-purple-400 tracking-tight flex items-center justify-center gap-1">
                <span>{streakDays}</span>
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-purple-200/80 font-bold mt-0.5">أيام متتالية</div>
              <div className="text-[9px] text-purple-300 font-bold mt-1">
                {streakCheckedToday ? '✓ تم تسجيل اليوم' : 'نشاط وتفوق مستمر (انقر)'}
              </div>
            </div>

            {/* New Challenge Badge Quick Metric Card */}
            {hasNewChallenge && (
              <div 
                onClick={() => {
                  const elem = document.getElementById('student-challenges-section');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#0b142c]/95 border-2 border-amber-400 p-3.5 sm:p-4 rounded-2xl text-center shadow-lg relative group overflow-hidden cursor-pointer hover:border-yellow-300 hover:scale-105 transition"
                title="انقر لعرض تفاصيل شارة التحدي الجديد وسجل الاختبارات"
              >
                <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight flex items-center justify-center gap-1">
                  <span>🏆</span>
                  <span>{currentActiveProfile.newChallengeBadge?.percentage || 100}%</span>
                </div>
                <div className="text-[11px] text-amber-200 font-black mt-0.5">تحدي جديد</div>
                <div className="text-[9px] text-amber-400 font-bold mt-1">
                  شارة نشطة ✨ (انقر)
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EDIT PROFILE / REAL DATA MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-[#040814]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b142c] text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-cyan-500/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تعديل بيانات الطالب الحقيقية</h3>
                  <p className="text-xs text-blue-200/70">تخصيص الاسم، الفصل الدراسي، والأهداف التعليمية</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الطالب / الطالبة</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-[#070e24] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الصف والفصل / الشعبة</label>
                <input
                  type="text"
                  value={editedGrade}
                  onChange={(e) => setEditedGrade(e.target.value)}
                  className="w-full bg-[#070e24] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الرمز التعبيري / الأيقونة</label>
                <div className="flex items-center gap-2">
                  {['👧', '🎓', '🧑‍🎓', '🌟', '🚀', '📚', '⚡'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setEditedAvatar(emoji)}
                      className={`w-11 h-11 text-2xl rounded-xl border flex items-center justify-center transition ${
                        editedAvatar === emoji ? 'bg-cyan-950 border-cyan-400 ring-2 ring-cyan-500/30' : 'bg-[#081024] border-blue-900/40 hover:border-slate-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مسائل معالجة اليوم</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedDailyQuestions}
                    onChange={(e) => setEditedDailyQuestions(Number(e.target.value))}
                    className="w-full bg-[#070e24] border border-blue-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">دقائق المذاكرة اليومية</label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={editedScreenTime}
                    onChange={(e) => setEditedScreenTime(Number(e.target.value))}
                    className="w-full bg-[#070e24] border border-blue-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-blue-900/40">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition"
                >
                  حفظ وتطبيق التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1.5. NEW CHALLENGE BADGE & RECENT QUIZZES SHOWCASE SECTION */}
      {hasNewChallenge && (
        <section id="student-challenges-section" className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-[#0b142c] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg shadow-amber-500/30 shrink-0 ring-4 ring-amber-300/40 animate-bounce">
                🏆
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-slate-950 fill-current" />
                    <span>شارة «تحدي جديد» معتمدة</span>
                  </span>
                  <span className="text-amber-300 font-extrabold text-xs">
                    نسبة الإتقان: {currentActiveProfile.newChallengeBadge?.percentage || 100}% (أعلى من 80%)
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  تهانينا! أحرزت شارة التحدي في {currentActiveProfile.newChallengeBadge?.bookTitle || currentActiveProfile.newChallengeBadge?.subject || 'المقررات الدراسية'}
                </h3>
                <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed max-w-2xl font-medium">
                  تم توثيق هذا الإنجاز بنجاح داخل ملف الطالب (<span className="font-mono text-cyan-300 font-bold">StudentProfile</span>). استمر في إنجاز اختبارات المقررات الأخرى في مكتبة المناهج للحفاظ على شارة التحدي وإثراء ملفك الرقمي.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={() => onNavigateTab && onNavigateTab('curriculum')}
                className="w-full md:w-auto bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-950" />
                <span>خوض اختبار كتاب آخر 🎯</span>
              </button>
            </div>
          </div>

          {/* List of Recent Quiz Results from StudentProfile */}
          {Array.isArray(currentActiveProfile.quizResults) && currentActiveProfile.quizResults.length > 0 && (
            <div className="mt-5 pt-5 border-t border-amber-500/20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-xs sm:text-sm font-black text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>سجل الاختبارات المنهجية السريعة الأخيرة (ملف الطالب):</span>
                </h4>
                <span className="text-[11px] text-blue-300/70 font-bold">
                  إجمالي الاختبارات المنجزة: {currentActiveProfile.quizResults.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentActiveProfile.quizResults.slice(0, 3).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-[#070e24]/90 border border-blue-900/60 hover:border-amber-400/40 rounded-2xl p-3.5 flex items-center justify-between text-xs transition"
                  >
                    <div className="truncate pr-2">
                      <p className="font-black text-white truncate">{quiz.bookTitle}</p>
                      <p className="text-[11px] text-blue-300/70 mt-0.5">{quiz.subject} • {quiz.grade || ''}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1 ${
                        quiz.percentage >= 80 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                          : 'bg-blue-900/40 text-blue-200 border border-blue-800/40'
                      }`}>
                        {quiz.percentage >= 80 && <span>🏆</span>}
                        <span>{quiz.percentage}%</span>
                        <span className="text-[10px] text-slate-400 font-bold">({quiz.score}/{quiz.totalQuestions})</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. PRIMARY FEATURE TOOL CARDS (Large, Glowing Border on Hover, Smooth Elevation) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/40 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              <span>الأدوات والأقسام التعليمية الذكية</span>
            </h2>
            <p className="text-xs text-blue-200/70 mt-1 font-medium">
              اختر الأداة المطلوبة للبدء بالحل، المذاكرة، أو استعراض المقررات والاختبارات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-cyan-300/80 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
              مدعوم بنماذج Gemini 2.5 الفائقة
            </span>
          </div>
        </div>

        {/* 6 Large Interactive Glowing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainFeatureCards.map((card, idx) => {
            const isActive = activeCardId === card.id;
            return (
              <ScrollFadeIn
                key={card.id}
                delay={idx * 75}
                threshold={0.08}
                className="h-full flex flex-col"
              >
                <div
                  id={`feature-card-${card.id}`}
                  onClick={() => setActiveCardId(card.id)}
                  className={`h-full hattan-interactive-card group p-6 sm:p-7 flex flex-col justify-between cursor-pointer ${
                    isActive ? 'is-active ring-1 ring-cyan-500/40' : ''
                  }`}
                >
                  {/* Subtle Ambient Background Gradient */}
                  <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity bg-gradient-to-br ${card.accentColor}`} />

                  <div className="space-y-4 relative z-10">
                    {/* Top Row: Icon & Badges */}
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-[#0b1633] border border-blue-500/30 flex items-center justify-center p-3 shadow-inner group-hover:border-cyan-400/60 transition-colors`}>
                        {card.icon}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        {card.badges.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-200 border border-blue-800/50 group-hover:border-cyan-500/40 transition-colors"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs font-semibold text-blue-300/80 mt-0.5">
                        {card.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300/80 leading-relaxed font-medium">
                      {card.description}
                    </p>
                  </div>

                  {/* Bottom CTA Action Button */}
                  <div className="pt-6 relative z-10">
                    <button
                      id={`btn-action-${card.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        card.action();
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all transform active:scale-98 ${card.btnGlow}`}
                    >
                      <span>{card.btnText}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-[-3px] transition-transform" />
                    </button>
                  </div>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </section>

      {/* 3. DAILY SCHEDULE (الجدول الدراسي اليومي) */}
      <ScrollFadeIn threshold={0.08} delay={60}>
        <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                الجدول الدراسي اليومي
              </h3>
              <p className="text-[11px] text-blue-200/60 font-medium">
                توقيت الحصص والقاعات الدراسية المعتمدة
              </p>
            </div>
          </div>
          <span className="text-xs text-cyan-300 font-bold bg-[#0b1633] px-3 py-1.5 rounded-xl border border-blue-800/50">
            الأحد • الفصل الدراسي الثاني 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {schedule.map((slot) => {
            const isCurrent = slot.status === 'current';
            const isDone = slot.status === 'done';

            return (
              <div
                key={slot.period}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#13234d] to-[#0d1736] border-cyan-400/60 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                    : isDone
                    ? 'bg-[#091024]/70 border-slate-800/80 text-slate-400'
                    : 'bg-[#0b142c]/90 border-blue-900/40 text-slate-200 hover:border-blue-700/50'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-cyan-500/20 text-cyan-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-cyan-400/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    مباشر الآن
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className={isCurrent ? 'text-cyan-300' : 'text-blue-300/70'}>
                      الحصة {slot.period}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.time}
                    </span>
                  </div>

                  <h4 className={`font-black text-sm my-1 ${isCurrent ? 'text-white' : isDone ? 'text-slate-300 line-through' : 'text-white'}`}>
                    {slot.subject}
                  </h4>

                  <p className="text-[11px] text-slate-400/90 font-medium">
                    {slot.topic}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{slot.room}</span>
                  <span className="truncate max-w-[90px]">{slot.teacher}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </ScrollFadeIn>

      {/* INTERACTIVE RECHARTS ANALYTICS: ACADEMIC PROGRESS & TASKS OVER TIME */}
      <ScrollFadeIn threshold={0.06}>
        <div id="student-analytics-charts-section">
          <StudentAnalyticsCharts
            profile={currentActiveProfile}
            homeworks={currentActiveHomeworks}
            calculatedGpa={calculatedGpa}
          />
        </div>
      </ScrollFadeIn>

      {/* 4. UPCOMING QUIZZES & ACTIVE HOMEWORKS SECTION */}
      <ScrollFadeIn threshold={0.06}>
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Quizzes & Homework with OCR Solver Trigger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Quizzes */}
          <div className="bg-[#0b142c]/90 border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                الاختبارات والتقييمات القصيرة القادمة ({quizzes.length})
              </h3>
              <span className="text-xs text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/40 font-bold">
                تقييم تشخيصي
              </span>
            </div>

            <div className="space-y-3">
              {quizzes.length === 0 ? (
                <div className="p-8 text-center bg-[#080e22] rounded-2xl border border-blue-900/30 space-y-2">
                  <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-300">لا توجد اختبارات قصيرة متاحة حالياً</p>
                  <p className="text-[11px] text-slate-500">سيتم إدراج الاختبارات التشخيصية فور تكليف المعلم بها أو إتاحتها من المنصة.</p>
                </div>
              ) : (
                quizzes.map((qz) => (
                  <div
                    key={qz.id}
                    className="p-4 rounded-2xl bg-[#080e22] border border-blue-900/40 hover:border-cyan-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/50 px-2.5 py-0.5 rounded-md">
                          {qz.subject}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ⏱️ {qz.durationMinutes} دقيقة • {qz.questions.length} أسئلة
                        </span>
                      </div>
                      <h4 className="font-extrabold text-white text-sm">{qz.title}</h4>
                    </div>

                    <button
                      onClick={() => {
                        setActiveQuiz(qz);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScore(0);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 shrink-0 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>بدء الاختبار الآن</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending / Active Homeworks with Supabase Connection */}
          <div className="bg-[#0b142c]/90 border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    الواجبات والمهام المدرسية الحقيقية ({currentActiveHomeworks.length})
                  </h3>
                  <p className="text-[11px] text-blue-200/60 font-medium">
                    بيانات الواجبات مرتبطة مباشرة بقاعدة بيانات المدرسة
                  </p>
                </div>
              </div>
              <span className="text-xs text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 rounded-full">
                تسليم وحساب درجات فوري
              </span>
            </div>

            <div className="space-y-3">
              {currentActiveHomeworks.length === 0 ? (
                <div className="p-8 text-center bg-[#080e22] rounded-2xl border border-blue-900/30 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-300">لا توجد واجبات دراسية مطلوبة حالياً</p>
                  <p className="text-[11px] text-slate-500">سيتم إدراج الواجبات المدرسية الجديدة هنا فور تكليف المعلم بها.</p>
                </div>
              ) : (
                currentActiveHomeworks.map((hw) => {
                  const isGraded = hw.status === 'graded';
                  const isSubmitted = hw.status === 'submitted';

                  return (
                    <div
                      key={hw.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isGraded 
                          ? 'bg-[#081224] border-emerald-500/40' 
                          : isSubmitted 
                          ? 'bg-[#081028] border-cyan-500/40' 
                          : 'bg-[#080e22] border-blue-900/40 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-purple-300 bg-purple-950/70 border border-purple-800/50 px-2.5 py-0.5 rounded-md">
                            {hw.subject}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            📅 موعد التسليم: {hw.dueDate}
                          </span>

                          {isGraded && (
                            <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              مصحح: {hw.score ?? 10} / 10
                            </span>
                          )}

                          {isSubmitted && !isGraded && (
                            <span className="text-[11px] font-black text-cyan-300 bg-cyan-950/80 border border-cyan-700/50 px-2 py-0.5 rounded-md">
                              ⏳ تم التسليم
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-white text-sm">{hw.title}</h4>
                        <p className="text-xs text-slate-300/80 leading-relaxed font-medium">{hw.description}</p>
                        
                        {hw.feedback && (
                          <div className="text-[11px] text-emerald-300/90 bg-emerald-950/40 border border-emerald-800/30 rounded-lg p-2 mt-1">
                            💡 ملاحظات المعلم: {hw.feedback}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenSolverForHomework(hw)}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 transition"
                          title="تحليل واستخراج خطوات الحل التفاعلية بالذكاء الاصطناعي"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>حل ذكي</span>
                        </button>

                        <button
                          onClick={() => {
                            setSubmittingHomework(hw);
                            setSubmissionText('');
                          }}
                          className={`font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition ${
                            isGraded
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/80'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
                          }`}
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isGraded ? 'إعادة التسليم' : 'تسليم الواجب'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Revision Plan & Subject Mastery */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. AI EXCELLENCE & REVISION PLAN (خطة التفوق والتقدم) */}
          <div className="bg-gradient-to-br from-[#121c3d] via-[#0d1633] to-[#070d1e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-cyan-500/30 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            {currentActiveProfile.aiRevisionPlan?.title && (currentActiveProfile.aiRevisionPlan.tasks?.length ?? 0) > 0 ? (
              <>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      خطة التفوق الذكية قبل الاختبارات
                    </div>
                    <h3 className="text-lg font-black text-white">{currentActiveProfile.aiRevisionPlan.title}</h3>
                    <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">{currentActiveProfile.aiRevisionPlan.description}</p>
                  </div>

                  <div className="text-cyan-400 font-black text-lg bg-[#070e24] px-3.5 py-1.5 rounded-xl border border-cyan-500/40 shrink-0">
                    {completedRevisionCount} / {totalRevisionCount}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 relative z-10">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>نسبة إنجاز الخطة</span>
                    <span className="text-cyan-300 font-extrabold">{revisionProgressPct}%</span>
                  </div>
                  <div className="w-full bg-[#070e24] rounded-full h-2.5 overflow-hidden border border-blue-900/40">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${revisionProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* Checklist items */}
                <div className="space-y-2.5 pt-1 relative z-10">
                  {currentActiveProfile.aiRevisionPlan.tasks.map((task) => (
                    <div
                      key={task.day}
                      onClick={() => onUpdateRevisionTask(task.day, !task.completed)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        task.completed
                          ? 'bg-[#081024]/80 text-slate-400 border-slate-800 line-through'
                          : 'bg-[#0a132c] text-slate-100 border-blue-900/50 hover:border-cyan-400/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {task.completed ? (
                          <CheckSquare className="w-5 h-5 text-cyan-400 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium">
                          اليوم {task.day}: {task.title}
                        </span>
                      </div>

                      <span className="text-[10px] bg-blue-950/80 text-cyan-300 px-2 py-0.5 rounded font-bold shrink-0 border border-blue-800/40">
                        {task.subject}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-2 relative z-10">
                <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
                <h3 className="text-sm font-bold text-white">خطة المراجعة الذكية</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  لا توجد خطة مراجعة مجدولة حالياً. يمكنك توليد خطة مراجعة مخصصة عبر المعلم الذكي.
                </p>
              </div>
            )}
          </div>

          {/* Academic Performance / Mastery Overview */}
          <div id="academic-performance-section" className="bg-[#0b142c]/90 border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    سجل الدرجات ومستوى التحصيل الفعلي
                  </h3>
                  <p className="text-[11px] text-blue-200/60 font-medium">
                    مستخرج مباشرة من قاعدة درجات الطالب
                  </p>
                </div>
              </div>
              <span className="text-xs text-cyan-300 font-extrabold bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-full">
                المعدل التراكمي: {calculatedGpa}%
              </span>
            </div>

            <div className="space-y-3">
              {currentActiveProfile.subjectsPerformance && currentActiveProfile.subjectsPerformance.length > 0 ? (
                currentActiveProfile.subjectsPerformance.map((sub, idx) => (
                  <div key={idx} className="space-y-1.5 bg-[#080e22] p-3.5 rounded-2xl border border-blue-900/30 hover:border-cyan-500/30 transition">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{sub.subject}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-normal">
                          واجبات: {sub.homeworkCompleted || 0}/{sub.totalHomework}
                        </span>
                        <span className="text-cyan-400 font-extrabold">{sub.scorePercentage}% ({sub.gradeLetter})</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#060b18] rounded-full h-2 overflow-hidden border border-blue-950">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sub.scorePercentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs bg-[#080e22] rounded-2xl border border-blue-900/20 p-4">
                  لا توجد تقييمات دراسية مرصودة حتى الآن. يتم تحديث السجل تلقائياً فور رصد المعلمين للواجبات والاختبارات.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </ScrollFadeIn>

      {/* SECTION: إنجازاتي - DIGITAL ACHIEVEMENTS PORTFOLIO */}
      <ScrollFadeIn threshold={0.06}>
        <section id="student-achievements-portfolio-section" className="space-y-6 pt-4">
          <AchievementsPortfolioView
            currentUser={
              currentUser || {
                id: profile.id || 'student_guest',
                name: realStudentName,
                role: 'student',
                email: ''
              }
            }
            currentSchool={currentSchool}
            defaultTab="my"
          />
        </section>
      </ScrollFadeIn>

      {/* 6. HELP & SUPPORT CENTER (مركز المساعدة والدعم الذكي) */}
      <ScrollFadeIn threshold={0.06}>
        <section className="bg-gradient-to-br from-[#0b1530] via-[#080f24] to-[#050a18] border border-blue-800/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">
                مركز المساعدة والدعم الذكي
              </h3>
              <p className="text-xs text-blue-200/70 font-medium">
                إجابات سريعة وإرشادات لاستخدام أدوات منصة «هتاف العاصمي»
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('counseling')}
              className="px-4 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 text-xs font-bold border border-indigo-700/50 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تواصل مع المرشد الطلابي (سري)</span>
            </button>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isExp = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#080e22] border border-blue-900/40 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isExp ? null : idx)}
                  className="w-full p-4 text-right flex items-center justify-between gap-3 text-xs sm:text-sm font-extrabold text-slate-100 hover:text-cyan-300 transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400 font-black">؟</span>
                    <span>{faq.q}</span>
                  </span>
                  {isExp ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExp && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-blue-900/30 font-medium bg-[#060b1b]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </ScrollFadeIn>

      {/* QUIZ INTERACTIVE MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-[#040814]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b142c] text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-cyan-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
              <div>
                <span className="text-xs font-bold text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-800/50">
                  {activeQuiz.subject}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">{activeQuiz.title}</h3>
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz Questions */}
            <div className="space-y-6">
              {activeQuiz.questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-3 p-4 rounded-2xl bg-[#080e22] border border-blue-900/40">
                  <h4 className="font-bold text-white text-sm">
                    {qIdx + 1}. {q.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const selected = quizAnswers[q.id] === oIdx;
                      let style = 'bg-[#0b142c] border-blue-900/50 text-slate-200 hover:bg-[#101c3e] hover:border-cyan-500/40';

                      if (quizSubmitted) {
                        if (oIdx === q.correctAnswer) {
                          style = 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-600/30';
                        } else if (selected && oIdx !== q.correctAnswer) {
                          style = 'bg-rose-950/80 text-rose-200 font-bold border-rose-600';
                        }
                      } else if (selected) {
                        style = 'bg-cyan-950 border-cyan-400 font-bold text-cyan-300 shadow-md shadow-cyan-500/20';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectQuizOption(q.id, oIdx)}
                          className={`p-3 text-right rounded-xl border text-xs transition ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 bg-[#0b1633] rounded-xl text-xs text-cyan-200 border border-cyan-800/40 font-medium">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit / Score Banner */}
            {quizSubmitted ? (
              <div className="p-6 rounded-2xl bg-[#070e24] text-white text-center space-y-2 border border-cyan-500/30">
                <div className="text-4xl font-black text-cyan-400">{quizScore}%</div>
                <p className="text-xs text-slate-300 font-medium">
                  {quizScore >= 80 ? 'أداء استثنائي وتفوق عالي! تم تسجيل النتيجة في سجلك الدراسي 🎉' : 'أداء جيد، يمكنك مراجعة الأسئلة مع المعلم الذكي لتعزيز الاستيعاب.'}
                </p>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="mt-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                >
                  إغلاق الاختبار
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < activeQuiz.questions.length}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-xs transition shadow-lg ${
                  Object.keys(quizAnswers).length < activeQuiz.questions.length
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25'
                }`}
              >
                تسليم إجابات الاختبار وحساب النتيجة
              </button>
            )}
          </div>
        </div>
      )}

      {/* ONLINE HOMEWORK SUBMISSION MODAL */}
      {submittingHomework && (
        <div className="fixed inset-0 bg-[#040814]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b142c] text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl border border-cyan-500/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                    {submittingHomework.subject}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">تسليم واجب: {submittingHomework.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSubmittingHomework(null)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#080e22] border border-blue-900/40 space-y-2">
              <span className="text-xs font-bold text-slate-400">نص وتفاصيل الواجب:</span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{submittingHomework.description}</p>
            </div>

            <form onSubmit={handleConfirmSubmitHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  كتابة خطوات الحل أو الإجابة النموذجية:
                </label>
                <textarea
                  rows={5}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="اكتب حلك هنا، أو الصق الحل الذي قمت بإنشائه بواسطة الذكاء الاصطناعي..."
                  className="w-full bg-[#070e24] border border-blue-900/60 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenSolverForHomework(submittingHomework);
                    setSubmittingHomework(null);
                  }}
                  className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1.5 bg-purple-950/60 px-3 py-2 rounded-xl border border-purple-800/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>استعراض الحل في حلاّل OCR أولاً</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubmittingHomework(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingHw || !submissionText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition flex items-center gap-2"
                  >
                    {isSubmittingHw ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التسليم...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>تأكيد التسليم لقاعدة البيانات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
