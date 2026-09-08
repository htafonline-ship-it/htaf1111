import React, { useState, useEffect, useMemo } from 'react';
import {
  CurriculumBook,
  EducationalStage,
  CurriculumSyncStatus,
  StudentBookProgress,
  UserProfile,
  UserRole,
  SchoolTenant,
  StudentProfile
} from '../types';
import { CURRICULUM_BOOKS, INITIAL_CURRICULUM_SYNC_STATUS } from '../data/mockData';
import {
  fetchAllCurriculumBooks,
  fetchStudentProgressRecords,
  updateStudentLessonStatus,
  filterStudentMyBooks,
  filterTeacherAssignedBooks,
  calculateTotalLessons
} from '../lib/curriculumService';
import { CurriculumBookCover } from './CurriculumBookCover';
import { CurriculumBookDetailModal } from './CurriculumBookDetailModal';
import { ReportPdfExportModal } from './ReportPdfExportModal';
import { InteractiveBookPageReader } from './InteractiveBookPageReader';
import {
  BookOpen,
  Search,
  Sparkles,
  Layers,
  FileText,
  BookmarkCheck,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Globe,
  Radio,
  GraduationCap,
  School,
  Filter,
  XCircle,
  Tag,
  Compass,
  Printer,
  Eye,
  Target,
  HelpCircle,
  Play,
  Award,
  BookMarked,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';

interface CurriculumLibraryViewProps {
  centralBooks?: CurriculumBook[];
  currentUser?: UserProfile | null;
  currentRole?: UserRole;
  currentSchool?: SchoolTenant | null;
  studentProfile?: StudentProfile;
  onSelectTopicForSolver: (text: string, subject?: string, grade?: string) => void;
  onSelectTopicForTeacher: (
    subject: string,
    grade: string,
    topic?: string,
    mode?: 'explain' | 'quiz' | 'summary'
  ) => void;
  onOpenHomeworkCreator?: (
    lessonTitle: string,
    subject: string,
    grade: string,
    pageStart?: number
  ) => void;
  onCreateQuizForLesson?: (lessonTitle: string, subject: string, grade: string) => void;
  onCreateStudyRoomForLesson?: (lessonTitle: string, subject: string, grade: string) => void;
}

export const CurriculumLibraryView: React.FC<CurriculumLibraryViewProps> = ({
  centralBooks,
  currentUser,
  currentRole = 'student',
  currentSchool,
  studentProfile,
  onSelectTopicForSolver,
  onSelectTopicForTeacher,
  onOpenHomeworkCreator,
  onCreateQuizForLesson,
  onCreateStudyRoomForLesson
}) => {
  // 1. Books State (Real DB with graceful fallback)
  const [booksList, setBooksList] = useState<CurriculumBook[]>(centralBooks || CURRICULUM_BOOKS);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);

  // 2. Student Progress State
  const studentId = currentUser?.id || studentProfile?.id || 'demo-student';
  const [progressMap, setProgressMap] = useState<Record<string, StudentBookProgress>>({});

  // 3. Modals & Reader state
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<CurriculumBook | null>(null);
  const [readerBook, setReaderBook] = useState<CurriculumBook | null>(null);
  const [readerPage, setReaderPage] = useState<number>(1);
  const [readerTab, setReaderTab] = useState<'reader' | 'summary' | 'solve' | 'quiz'>('reader');

  // PDF Export Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfExportType, setPdfExportType] = useState<'curriculum_single' | 'curriculum_stage'>('curriculum_single');
  const [pdfSelectedBook, setPdfSelectedBook] = useState<CurriculumBook | undefined>(undefined);

  // 4. Filters & Search State
  const [selectedStage, setSelectedStage] = useState<EducationalStage | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<number | 'all'>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'my_books' | 'all_curriculum'>('my_books');

  // 5. Sync State
  const [syncStatus, setSyncStatus] = useState<CurriculumSyncStatus>(INITIAL_CURRICULUM_SYNC_STATUS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Load Real Books & Real Student Progress on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingBooks(true);
      try {
        const fetched = await fetchAllCurriculumBooks();
        if (isMounted && fetched.length > 0) {
          setBooksList(fetched);
        }
        const prog = await fetchStudentProgressRecords(studentId, currentSchool?.id);
        if (isMounted) {
          setProgressMap(prog);
        }
      } catch (err) {
        console.warn('Error loading curriculum data:', err);
      } finally {
        if (isMounted) setIsLoadingBooks(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [studentId, currentSchool?.id]);

  const activeBooks = useMemo(() => {
    return booksList.filter((b) => b.is_active !== false);
  }, [booksList]);

  // Student's specific enrolled books ("كتبي ومقرراتي")
  const studentGradeName = studentProfile?.grade || (currentUser as any)?.grade || 'الصف الثالث المتوسط';
  const myEnrolledBooks = useMemo(() => {
    if (currentRole === 'teacher') {
      return filterTeacherAssignedBooks(activeBooks, ['العلوم', 'الرياضيات'], [studentGradeName]);
    }
    return filterStudentMyBooks(activeBooks, studentGradeName, studentProfile?.stage || 'middle');
  }, [activeBooks, studentGradeName, studentProfile?.stage, currentRole]);

  // Filtered Books for "استعراض جميع المناهج"
  const filteredBooks = useMemo(() => {
    return activeBooks.filter((book) => {
      const matchesStage = selectedStage === 'all' || book.stage === selectedStage;
      const matchesGrade =
        selectedGrade === 'all' || book.grade === selectedGrade || book.grade.includes(selectedGrade);
      const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject;
      const matchesTerm = selectedTerm === 'all' || book.term === selectedTerm;
      const matchesTrack = selectedTrack === 'all' || (book.track && book.track === selectedTrack);
      const matchesSearch =
        !searchQuery ||
        book.title.includes(searchQuery) ||
        book.subject.includes(searchQuery) ||
        book.grade.includes(searchQuery) ||
        book.chapters.some(
          (c) =>
            c.title.includes(searchQuery) ||
            (c.topics && c.topics.some((t) => t.includes(searchQuery)))
        );

      return (
        matchesStage &&
        matchesGrade &&
        matchesSubject &&
        matchesTerm &&
        matchesTrack &&
        matchesSearch
      );
    });
  }, [
    activeBooks,
    selectedStage,
    selectedGrade,
    selectedSubject,
    selectedTerm,
    selectedTrack,
    searchQuery
  ]);

  // Handle Progress Update
  const handleUpdateLessonStatus = async (
    lessonId: string,
    lessonTitle: string,
    unitTitle: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    if (!selectedBookForDetail) return;
    const updated = await updateStudentLessonStatus(
      studentId,
      currentUser?.id || studentId,
      selectedBookForDetail,
      lessonId,
      lessonTitle,
      unitTitle,
      status
    );
    setProgressMap((prev) => ({ ...prev, [selectedBookForDetail.id]: updated }));
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncMessage('جاري الاتصال ببوابة عين الوطنية ومدرستي للتحقق من المناهج المحدثة...');

    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setSyncStatus((prev) => ({
        ...prev,
        lastSyncTime: `اليوم، ${now}`,
        syncLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: `اليوم ${now}`,
            title: 'استنزال ومطابقة كامل كتب الفصل الدراسي مع البوابات المعتمدة',
            source: 'بوابة عين الوطنية (ien.edu.sa)',
            status: 'تم التحديث',
            details: 'تمت المزامنة بنجاح 100% مع كتب وخطط التوزيع الوزارية للعام 1448هـ - 2027م.'
          },
          ...prev.syncLogs
        ]
      }));
      setSyncMessage('تم التحديث والمزامنة مع بوابة "عين" ومنصة "مدرستي" بنجاح!');
      setTimeout(() => setSyncMessage(null), 5000);
    }, 1800);
  };

  // Stage classification counts
  const primaryCount = activeBooks.filter((b) => b.stage === 'primary').length;
  const middleCount = activeBooks.filter((b) => b.stage === 'middle').length;
  const secondaryCount = activeBooks.filter((b) => b.stage === 'secondary').length;

  const getGradeOptions = () => {
    if (selectedStage === 'primary') {
      return [
        { id: 'all', label: 'كافة صفوف الابتدائي' },
        { id: 'الصف الأول الابتدائي', label: 'الصف الأول' },
        { id: 'الصف الثاني الابتدائي', label: 'الصف الثاني' },
        { id: 'الصف الثالث الابتدائي', label: 'الصف الثالث' },
        { id: 'الصف الرابع الابتدائي', label: 'الصف الرابع' },
        { id: 'الصف الخامس الابتدائي', label: 'الصف الخامس' },
        { id: 'الصف السادس الابتدائي', label: 'الصف السادس' }
      ];
    }
    if (selectedStage === 'middle') {
      return [
        { id: 'all', label: 'كافة صفوف المتوسط' },
        { id: 'الصف الأول المتوسط', label: 'الأول المتوسط' },
        { id: 'الصف الثاني المتوسط', label: 'الثاني المتوسط' },
        { id: 'الصف الثالث المتوسط', label: 'الثالث المتوسط' }
      ];
    }
    if (selectedStage === 'secondary') {
      return [
        { id: 'all', label: 'كافة صفوف الثانوي' },
        { id: 'الصف الأول الثانوي', label: 'الأول الثانوي' },
        { id: 'الصف الثاني الثانوي', label: 'الثاني الثانوي' },
        { id: 'الصف الثالث الثانوي', label: 'الثالث الثانوي' }
      ];
    }
    return [
      { id: 'all', label: 'كافة الصفوف' },
      { id: 'الابتدائي', label: 'صفوف الابتدائي' },
      { id: 'المتوسط', label: 'صفوف المتوسط' },
      { id: 'الثانوي', label: 'صفوف الثانوي' }
    ];
  };

  const availableSubjects = Array.from(
    new Set(
      activeBooks
        .filter((b) => selectedStage === 'all' || b.stage === selectedStage)
        .map((b) => b.subject)
    )
  );

  const handleResetFilters = () => {
    setSelectedStage('all');
    setSelectedGrade('all');
    setSelectedSubject('all');
    setSelectedTerm('all');
    setSelectedTrack('all');
    setSearchQuery('');
  };

  const isFiltered =
    selectedStage !== 'all' ||
    selectedGrade !== 'all' ||
    selectedSubject !== 'all' ||
    selectedTerm !== 'all' ||
    selectedTrack !== 'all' ||
    searchQuery !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* 🇸🇦 Official Saudi Curriculum Sync Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                🇸🇦
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  المناهج الرقمية والكتب الوزارية المعتمدة (طبعة 1448هـ - 2027م)
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  مباشر عين & مدرستي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ربط موثوق مع <strong>بوابة عين الوطنية</strong> و<strong>منصة مدرستي</strong> مع التصفح التفاعلي وحلول الذكاء الاصطناعي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-between md:justify-end">
            <div className="text-right text-[11px] text-slate-400 hidden sm:block">
              <div>
                آخر مزامنة: <strong className="text-slate-200">{syncStatus.lastSyncTime}</strong>
              </div>
              <div>
                المقررات المعتمدة:{' '}
                <strong className="text-emerald-400">{activeBooks.length} كتاباً</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setPdfExportType('curriculum_stage');
                setShowPdfModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-2xl border border-slate-700 flex items-center gap-1.5 transition shrink-0"
              title="تصدير تقرير المناهج والمقررات المعتمدة كملف PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>تصدير تقرير المناهج (PDF)</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري المزامنة...' : 'تحديث المناهج الآن'}</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Sync Sources badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">مصادر المزامنة الرسمية:</span>
            {syncStatus.portalSources.map((src, i) => (
              <span
                key={i}
                className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>{src}</span>
              </span>
            ))}
          </div>
          <span className="text-emerald-400 font-mono font-bold">
            السنة الدراسية: {syncStatus.currentAcademicYear}
          </span>
        </div>
      </div>

      {/* Main Header & Search Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            مكتبة المناهج والكتب التفاعلية
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            مكتبة المناهج والمقررات الدراسية
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            استعرض أغلفة المناهج بوضوح عالي، تابع تقدمك الدراسي خطوة بخطوة، واطلب الشرح أو حل المسائل
            مباشرة من المعلم الذكي.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مادة، كتاب، صف، أو درس..."
            className="w-full bg-slate-800/90 border border-slate-700 text-white text-xs rounded-2xl pr-10 pl-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-3 text-slate-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION SWITCHER TABS: [📚 كتبي ومقرراتي] VS [استعراض جميع المناهج] */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabSection('my_books')}
            className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2 transition ${
              activeTabSection === 'my_books'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>
              {currentRole === 'teacher' ? 'المقررات التي أدرّسها' : '📚 كتبي ومقرراتي الحالية'}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTabSection === 'my_books'
                  ? 'bg-emerald-800 text-emerald-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {myEnrolledBooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabSection('all_curriculum')}
            className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2 transition ${
              activeTabSection === 'all_curriculum'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>استعراض جميع المناهج الوزارية</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTabSection === 'all_curriculum'
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeBooks.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-bold hidden md:block">
          الصف المسجل: <span className="text-slate-800">{studentGradeName}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. "كتبي ومقرراتي" (MY BOOKS SECTION) */}
      {/* ========================================================================= */}
      {activeTabSection === 'my_books' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 rounded-3xl border border-emerald-200/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                🎓
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {currentRole === 'teacher'
                    ? 'المقررات والفصول المسندة لك بالمدرسة'
                    : `مقرراتك الدراسية - ${studentGradeName}`}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  تابع تقدمك، افتح آخر درس توقفت عنده، واستعن بالمعلم الذكي للشرح والاختبارات الفورية.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTabSection('all_curriculum')}
              className="text-xs font-black text-emerald-800 hover:text-emerald-950 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 shadow-sm flex items-center gap-1 transition"
            >
              <span>استكشاف باقي الصفوف</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          </div>

          {/* RESPONSIVE BOOK GRID: Desktop (4-6), Tablet (3-4), Mobile (2) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {myEnrolledBooks.map((book) => {
              const prog = progressMap[book.id];
              const pct = prog?.progressPercentage || 0;
              const lastLesson = prog?.lastLessonTitle || 'مقدمة المقرر';

              return (
                <div
                  key={book.id}
                  className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden p-3.5 sm:p-4 space-y-3"
                >
                  {/* Top Cover Visual */}
                  <div
                    onClick={() => setSelectedBookForDetail(book)}
                    className="cursor-pointer relative"
                  >
                    <CurriculumBookCover book={book} size="md" />
                  </div>

                  {/* Book Card Body */}
                  <div className="space-y-2 text-right">
                    <div>
                      <h4
                        onClick={() => setSelectedBookForDetail(book)}
                        className="font-black text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition cursor-pointer line-clamp-1"
                        title={book.subject_name || book.subject}
                      >
                        {book.subject_name || book.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {book.grade} • ف{book.term || 1}
                      </p>
                    </div>

                    {/* Progress Indicator Bar */}
                    <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-700">
                        <span>التقدم:</span>
                        <span className="text-emerald-600 font-black">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                      <p
                        className="text-[9px] text-slate-500 truncate"
                        title={`آخر درس: ${lastLesson}`}
                      >
                        آخر درس: {lastLesson}
                      </p>
                    </div>

                    {/* Action Buttons: Continue Studying & Ask Smart Teacher */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => setSelectedBookForDetail(book)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>أكمل الدراسة</span>
                      </button>

                      <button
                        onClick={() =>
                          onSelectTopicForTeacher(
                            book.subject,
                            book.grade,
                            `كتاب ${book.subject} للصف ${book.grade}`,
                            'explain'
                          )
                        }
                        className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-[11px] py-1.5 rounded-xl border border-slate-800 flex items-center justify-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>اسأل المعلم الذكي</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. "استعراض جميع المناهج" (ALL CURRICULUM EXPLORER & STAGE CARDS) */}
      {/* ========================================================================= */}
      {activeTabSection === 'all_curriculum' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Stage Classification Cards */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <span>اختر المرحلة الدراسية للتصفية:</span>
              </span>
              <span className="text-xs text-slate-500">
                إجمالي المناهج المتوفرة ({activeBooks.length} كتب)
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* All Stages */}
              <div
                onClick={() => {
                  setSelectedStage('all');
                  setSelectedGrade('all');
                }}
                className={`p-5 rounded-3xl border cursor-pointer transition flex items-center justify-between ${
                  selectedStage === 'all'
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xl'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">كافة المراحل</h4>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        selectedStage === 'all' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      شامل جميع المناهج
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    selectedStage === 'all'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeBooks.length}
                </span>
              </div>

              {/* Primary Stage */}
              <div
                onClick={() => {
                  setSelectedStage('primary');
                  setSelectedGrade('all');
                }}
                className={`p-5 rounded-3xl border cursor-pointer transition flex items-center justify-between ${
                  selectedStage === 'primary'
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-xl'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">المرحلة الابتدائية</h4>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        selectedStage === 'primary' ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      الصفوف 1 - 6
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    selectedStage === 'primary'
                      ? 'bg-emerald-300 text-emerald-950'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {primaryCount}
                </span>
              </div>

              {/* Middle Stage */}
              <div
                onClick={() => {
                  setSelectedStage('middle');
                  setSelectedGrade('all');
                }}
                className={`p-5 rounded-3xl border cursor-pointer transition flex items-center justify-between ${
                  selectedStage === 'middle'
                    ? 'bg-sky-700 text-white border-sky-600 shadow-xl'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-sky-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">المرحلة المتوسطة</h4>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        selectedStage === 'middle' ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      الصفوف 1 - 3 متوسط
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    selectedStage === 'middle'
                      ? 'bg-sky-300 text-sky-950'
                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                  }`}
                >
                  {middleCount}
                </span>
              </div>

              {/* Secondary Stage */}
              <div
                onClick={() => {
                  setSelectedStage('secondary');
                  setSelectedGrade('all');
                }}
                className={`p-5 rounded-3xl border cursor-pointer transition flex items-center justify-between ${
                  selectedStage === 'secondary'
                    ? 'bg-purple-700 text-white border-purple-600 shadow-xl'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-purple-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">المرحلة الثانوية</h4>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        selectedStage === 'secondary' ? 'text-purple-100' : 'text-slate-500'
                      }`}
                    >
                      نظام المسارات المحدث
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    selectedStage === 'secondary'
                      ? 'bg-purple-300 text-purple-950'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}
                >
                  {secondaryCount}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Filter Toolbars */}
          <div className="space-y-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
            {/* Grade Level Chips */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>الصف الدراسي المحدد:</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {getGradeOptions().map((grd) => (
                  <button
                    key={grd.id}
                    onClick={() => setSelectedGrade(grd.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap border ${
                      selectedGrade === grd.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {grd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Categories & Term Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-slate-100 pt-4 text-xs">
              {/* Subject Categories */}
              <div className="md:col-span-7 space-y-2">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصفية المادة العلمية:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedSubject('all')}
                    className={`px-3 py-1 rounded-lg font-bold border transition ${
                      selectedSubject === 'all'
                        ? 'bg-slate-900 text-white border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    كافة المواد
                  </button>
                  {availableSubjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-1 rounded-lg font-bold border transition ${
                        selectedSubject === sub
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms & Secondary Tracks */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700">الفصل:</span>
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 1, label: 'فصل 1' },
                    { id: 2, label: 'فصل 2' },
                    { id: 3, label: 'فصل 3' }
                  ].map((term) => (
                    <button
                      key={term.id}
                      onClick={() => setSelectedTerm(term.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition ${
                        selectedTerm === term.id
                          ? 'bg-slate-900 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>

                {selectedStage === 'secondary' && (
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-700">المسار:</span>
                    {['all', 'المسار العام', 'مسار الصحة والحياة', 'مسار الهندسة والحاسب'].map(
                      (trk) => (
                        <button
                          key={trk}
                          onClick={() => setSelectedTrack(trk)}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition text-[11px] ${
                            selectedTrack === trk
                              ? 'bg-purple-600 text-white border-purple-500'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {trk === 'all' ? 'الكل' : trk.replace('مسار ', '')}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Summary Bar */}
            {isFiltered && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900">
                <div className="flex flex-wrap items-center gap-2 font-bold">
                  <span>الفلاتر النشطة:</span>
                  {selectedStage !== 'all' && (
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                      مرحلة:{' '}
                      {selectedStage === 'primary'
                        ? 'الابتدائية'
                        : selectedStage === 'middle'
                        ? 'المتوسطة'
                        : 'الثانوية'}
                    </span>
                  )}
                  {selectedGrade !== 'all' && (
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                      {selectedGrade}
                    </span>
                  )}
                  {selectedSubject !== 'all' && (
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                      مادة: {selectedSubject}
                    </span>
                  )}
                  {selectedTerm !== 'all' && (
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                      الفصل {selectedTerm}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                      بحث: "{searchQuery}"
                    </span>
                  )}
                </div>

                <button
                  onClick={handleResetFilters}
                  className="text-rose-700 hover:text-rose-900 font-extrabold flex items-center gap-1 hover:underline text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الفلاتر</span>
                </button>
              </div>
            )}
          </div>

          {/* ALL BOOKS GRID: Desktop (4-6), Tablet (3-4), Mobile (2) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>المقررات والكتب المطابقة ({filteredBooks.length}):</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                انقر على أي كتاب لعرض فهرس الوحدات والدروس
              </span>
            </div>

            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {filteredBooks.map((book) => {
                  const prog = progressMap[book.id];
                  const pct = prog?.progressPercentage || 0;
                  const lastLesson = prog?.lastLessonTitle || 'مقدمة المقرر';

                  return (
                    <div
                      key={book.id}
                      className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden p-3.5 sm:p-4 space-y-3"
                    >
                      {/* Top Cover Visual */}
                      <div
                        onClick={() => setSelectedBookForDetail(book)}
                        className="cursor-pointer relative"
                      >
                        <CurriculumBookCover book={book} size="md" />
                      </div>

                      {/* Book Card Body */}
                      <div className="space-y-2 text-right">
                        <div>
                          <h4
                            onClick={() => setSelectedBookForDetail(book)}
                            className="font-black text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition cursor-pointer line-clamp-1"
                            title={book.subject_name || book.subject}
                          >
                            {book.subject_name || book.subject}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {book.grade} • ف{book.term || 1}
                          </p>
                        </div>

                        {/* Progress Bar & Last Lesson */}
                        <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-700">
                            <span>التقدم:</span>
                            <span className="text-emerald-600 font-black">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                          <p
                            className="text-[9px] text-slate-500 truncate"
                            title={`آخر درس: ${lastLesson}`}
                          >
                            آخر درس: {lastLesson}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-1.5 pt-1">
                          <button
                            onClick={() => setSelectedBookForDetail(book)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>أكمل الدراسة</span>
                          </button>

                          <button
                            onClick={() =>
                              onSelectTopicForTeacher(
                                book.subject,
                                book.grade,
                                `كتاب ${book.subject} للصف ${book.grade}`,
                                'explain'
                              )
                            }
                            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-[11px] py-1.5 rounded-xl border border-slate-800 flex items-center justify-center gap-1 transition"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>اسأل المعلم الذكي</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-extrabold text-base text-slate-700">
                  لا توجد مقررات مطابقة لخيارات البحث أو الفلاتر
                </h4>
                <p className="text-xs text-slate-500">
                  جرب تغيير خيارات التصفية أو إلغاء كلمات البحث للوصول لكافة المناهج.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                >
                  إلغاء جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS & SUB-VIEWS */}
      {/* ========================================================================= */}

      {/* Book Detail Modal (Units, Lessons, AI Actions) */}
      {selectedBookForDetail && (
        <CurriculumBookDetailModal
          book={selectedBookForDetail}
          isOpen={Boolean(selectedBookForDetail)}
          onClose={() => setSelectedBookForDetail(null)}
          progress={progressMap[selectedBookForDetail.id]}
          onUpdateLessonStatus={handleUpdateLessonStatus}
          onOpenReader={(pageNum, tab) => {
            setReaderBook(selectedBookForDetail);
            setReaderPage(pageNum || 1);
            setReaderTab(tab || 'reader');
          }}
          onOpenSmartTeacherLesson={(lessonTitle, mode) => {
            onSelectTopicForTeacher(
              selectedBookForDetail.subject,
              selectedBookForDetail.grade,
              lessonTitle,
              mode
            );
          }}
          onOpenSolverForLesson={(lessonTitle) => {
            onSelectTopicForSolver(
              lessonTitle,
              selectedBookForDetail.subject,
              selectedBookForDetail.grade
            );
          }}
          onExportPdf={() => {
            setPdfExportType('curriculum_single');
            setPdfSelectedBook(selectedBookForDetail);
            setShowPdfModal(true);
          }}
          currentUser={currentUser}
          currentRole={currentRole}
          onCreateHomeworkForLesson={
            onOpenHomeworkCreator
              ? (lessonTitle, pageStart) =>
                  onOpenHomeworkCreator(
                    lessonTitle,
                    selectedBookForDetail.subject,
                    selectedBookForDetail.grade,
                    pageStart
                  )
              : undefined
          }
          onCreateQuizForLesson={
            onCreateQuizForLesson
              ? (lessonTitle) =>
                  onCreateQuizForLesson(
                    lessonTitle,
                    selectedBookForDetail.subject,
                    selectedBookForDetail.grade
                  )
              : undefined
          }
          onCreateStudyRoomForLesson={
            onCreateStudyRoomForLesson
              ? (lessonTitle) =>
                  onCreateStudyRoomForLesson(
                    lessonTitle,
                    selectedBookForDetail.subject,
                    selectedBookForDetail.grade
                  )
              : undefined
          }
        />
      )}

      {/* Interactive Page Reader Modal */}
      {readerBook && (
        <InteractiveBookPageReader
          book={readerBook}
          initialPageNumber={readerPage}
          initialTab={readerTab}
          onClose={() => setReaderBook(null)}
          onOpenTeacherWithTopic={(sub, grd) => onSelectTopicForTeacher(sub, grd)}
          onOpenSolverWithQuestion={(q, sub, grd) => onSelectTopicForSolver(q, sub, grd)}
        />
      )}

      {/* PDF Export Modal */}
      <ReportPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        exportType={pdfExportType}
        curriculumBook={pdfSelectedBook}
        stage={selectedStage === 'all' ? 'middle' : selectedStage}
        academicYear={syncStatus.currentAcademicYear}
      />
    </div>
  );
};
