import React, { useState } from 'react';
import {
  CurriculumBook,
  CurriculumChapter,
  CurriculumLesson,
  StudentBookProgress,
  UserRole,
  UserProfile
} from '../types';
import { CurriculumBookCover } from './CurriculumBookCover';
import {
  X,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  Play,
  FileText,
  Target,
  Camera,
  Share2,
  PlusCircle,
  Users,
  Printer,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Award,
  Layers,
  Lightbulb,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface CurriculumBookDetailModalProps {
  book: CurriculumBook;
  isOpen: boolean;
  onClose: () => void;
  progress?: StudentBookProgress;
  onUpdateLessonStatus: (
    lessonId: string,
    lessonTitle: string,
    unitTitle: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => void;
  onOpenReader: (pageNum: number, tab?: 'reader' | 'summary' | 'solve' | 'quiz') => void;
  onOpenSmartTeacherLesson: (lessonTitle: string, mode: 'explain' | 'quiz' | 'summary') => void;
  onOpenSolverForLesson: (lessonTitle: string) => void;
  onExportPdf: () => void;
  currentUser?: UserProfile | null;
  currentRole?: UserRole;
  // Teacher actions
  onCreateHomeworkForLesson?: (lessonTitle: string, pageStart?: number) => void;
  onCreateQuizForLesson?: (lessonTitle: string) => void;
  onCreateStudyRoomForLesson?: (lessonTitle: string) => void;
}

export const CurriculumBookDetailModal: React.FC<CurriculumBookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  progress,
  onUpdateLessonStatus,
  onOpenReader,
  onOpenSmartTeacherLesson,
  onOpenSolverForLesson,
  onExportPdf,
  currentUser,
  currentRole = 'student',
  onCreateHomeworkForLesson,
  onCreateQuizForLesson,
  onCreateStudyRoomForLesson
}) => {
  if (!isOpen) return null;

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    book.chapters.forEach((ch, idx) => {
      init[ch.id] = idx === 0; // expand first chapter by default
    });
    return init;
  });

  const [selectedSummaryLesson, setSelectedSummaryLesson] = useState<{
    title: string;
    chapterTitle: string;
    pageStart?: number;
  } | null>(null);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const progressPercentage = progress?.progressPercentage || 0;
  const completedLessons = progress?.completedLessons || 0;
  const totalLessons = progress?.totalLessons || Math.max(book.chapters.length, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              📚
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {book.subject_name || book.subject} - {book.grade}
              </h3>
              <p className="text-[11px] text-slate-400">
                {book.editionYear} • المنهج السعودي الرقمي المعتمد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
          {/* Top Hero Section: Book Info & Progress Card */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-6 sm:p-7 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            {/* Book Cover */}
            <div className="w-36 sm:w-44 shrink-0 mx-auto md:mx-0">
              <CurriculumBookCover book={book} />
            </div>

            {/* Details & Metadata */}
            <div className="flex-1 space-y-4 text-right">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                    {book.subject_name || book.subject}
                  </span>
                  <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {book.grade}
                  </span>
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    الفصل الدراسي {book.term || 1}
                  </span>
                  {book.track && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {book.track}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{book.title}</h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>طبعة وزارة التعليم المعتمدة</span>
                  <span>•</span>
                  <span>{book.totalPages || 150} صفحة</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">بوابة عين الوطنية & مدرستي</span>
                </p>
              </div>

              {/* Real Progress Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>معدل إنجاز الطالب في المقرر:</span>
                  </span>
                  <span className="text-emerald-600 font-black">{progressPercentage}% مكتمل</span>
                </div>

                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(progressPercentage, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    تم إتمام <strong>{completedLessons}</strong> من <strong>{totalLessons}</strong> درس
                  </span>
                  {progress?.lastLessonTitle && (
                    <span className="text-emerald-800 font-bold">
                      آخر درس: {progress.lastLessonTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => onOpenReader(1, 'reader')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تصفح وحل صفحات الكتاب</span>
                </button>

                <button
                  onClick={() => onOpenSmartTeacherLesson(book.title, 'explain')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>✨ اسأل المعلم الذكي</span>
                </button>

                <button
                  onClick={onExportPdf}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>تقرير المقرر (PDF)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chapters and Interactive Lessons Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>فصول ودروس المقرر الدراسي ({book.chapters.length} فصول):</span>
              </h3>
              <span className="text-xs text-slate-500">
                اضغط على أي درس للبدء، الشرح، أو حل المسائل
              </span>
            </div>

            <div className="space-y-4">
              {book.chapters.map((chapter, chIdx) => {
                const isExpanded = expandedChapters[chapter.id] ?? (chIdx === 0);

                // Build lesson items from chapter
                const lessonList: { id: string; title: string; pageStart?: number; pageEnd?: number; topics: string[] }[] =
                  chapter.lessons && chapter.lessons.length > 0
                    ? chapter.lessons.map((l) => ({
                        id: l.id,
                        title: l.title,
                        pageStart: l.pageStart,
                        pageEnd: l.pageEnd,
                        topics: l.topics || []
                      }))
                    : (chapter.topics || []).map((top, tIdx) => ({
                        id: `${chapter.id}-lesson-${tIdx}`,
                        title: top,
                        pageStart: chapter.pageStart ? chapter.pageStart + tIdx * 4 : 10,
                        pageEnd: chapter.pageStart ? chapter.pageStart + (tIdx + 1) * 4 : 14,
                        topics: [top]
                      }));

                return (
                  <div
                    key={chapter.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Chapter Header Accordion */}
                    <div
                      onClick={() => toggleChapter(chapter.id)}
                      className="p-4 sm:p-5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition border-b border-slate-200/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                          {chIdx + 1}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                            {chapter.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {chapter.pageStart && chapter.pageEnd
                              ? `الصفحات (${chapter.pageStart} - ${chapter.pageEnd})`
                              : ''}{' '}
                            • {lessonList.length} دروس تعليمية
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                          {isExpanded ? 'طي الفصول' : 'عرض الدروس'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Lessons List in Chapter */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 divide-y divide-slate-100 space-y-3">
                        {lessonList.map((lesson, lIdx) => {
                          const status = progress?.lessonStatusMap?.[lesson.id] || 'not_started';
                          const isCompleted = status === 'completed';
                          const isInProgress = status === 'in_progress';

                          return (
                            <div
                              key={lesson.id}
                              className={`pt-3 first:pt-0 p-3 sm:p-4 rounded-xl transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                                isCompleted
                                  ? 'bg-emerald-50/50 border border-emerald-200/60'
                                  : isInProgress
                                  ? 'bg-amber-50/50 border border-amber-200/60'
                                  : 'bg-white hover:bg-slate-50 border border-slate-100'
                              }`}
                            >
                              {/* Left: Lesson Info */}
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {isCompleted ? (
                                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                      ✓
                                    </div>
                                  ) : isInProgress ? (
                                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold animate-pulse">
                                      ▶
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                                      {lIdx + 1}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-extrabold text-sm text-slate-900">
                                      {lesson.title}
                                    </h5>
                                    {lesson.pageStart && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                                        ص {lesson.pageStart}
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">
                                        مكتمل بنجاح
                                      </span>
                                    )}
                                  </div>

                                  {lesson.topics && lesson.topics.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                                      {lesson.topics.map((t, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px]"
                                        >
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Actions for Students & Teachers */}
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                {/* Student Progress Status Toggle */}
                                <button
                                  onClick={() =>
                                    onUpdateLessonStatus(
                                      lesson.id,
                                      lesson.title,
                                      chapter.title,
                                      isCompleted ? 'not_started' : 'completed'
                                    )
                                  }
                                  className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                                    isCompleted
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                  title="تحديد الدرس كمكتمل في سجلك"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isCompleted ? 'مكتمل ✓' : 'تحديد كمكتمل'}</span>
                                </button>

                                {/* AI Smart Actions */}
                                <button
                                  onClick={() =>
                                    onOpenSmartTeacherLesson(
                                      `${lesson.title} من كتاب ${book.subject}`,
                                      'explain'
                                    )
                                  }
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                                  title="شرح الدرس خطوة بخطوة بالذكاء الاصطناعي"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>اشرح لي</span>
                                </button>

                                <button
                                  onClick={() =>
                                    onOpenSmartTeacherLesson(
                                      `${lesson.title} من كتاب ${book.subject}`,
                                      'quiz'
                                    )
                                  }
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                                  title="اختبار تفاعلي سريع للدرس"
                                >
                                  <Target className="w-3.5 h-3.5 text-purple-600" />
                                  <span>اختبرني</span>
                                </button>

                                <button
                                  onClick={() =>
                                    onOpenSolverForLesson(
                                      `مسألة من درس ${lesson.title} في كتاب ${book.subject}`
                                    )
                                  }
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                                  title="حل مسألة من هذا الدرس مع التوضيح"
                                >
                                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                                  <span>حل مسألة</span>
                                </button>

                                <button
                                  onClick={() =>
                                    setSelectedSummaryLesson({
                                      title: lesson.title,
                                      chapterTitle: chapter.title,
                                      pageStart: lesson.pageStart
                                    })
                                  }
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                                  title="ملخص النقاط والقوانين الأساسية للدرس"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                                  <span>ملخص</span>
                                </button>

                                {lesson.pageStart && (
                                  <button
                                    onClick={() => onOpenReader(lesson.pageStart || 1, 'reader')}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                                    title="فتح صفحة الدرس مباشرة في قارئ الكتب"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>ص {lesson.pageStart}</span>
                                  </button>
                                )}

                                {/* TEACHER SPECIFIC ACTION DROPDOWN/BUTTONS */}
                                {(currentRole === 'teacher' || currentRole === 'school_admin') && (
                                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
                                    {onCreateHomeworkForLesson && (
                                      <button
                                        onClick={() =>
                                          onCreateHomeworkForLesson(lesson.title, lesson.pageStart)
                                        }
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                                        title="إنشاء واجب مدرسي للطلاب من هذا الدرس"
                                      >
                                        <PlusCircle className="w-3 h-3" />
                                        <span>إنشاء واجب</span>
                                      </button>
                                    )}

                                    {onCreateQuizForLesson && (
                                      <button
                                        onClick={() => onCreateQuizForLesson(lesson.title)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                                        title="إنشاء اختبار للطلاب من هذا الدرس"
                                      >
                                        <Target className="w-3 h-3" />
                                        <span>إنشاء اختبار</span>
                                      </button>
                                    )}

                                    {onCreateStudyRoomForLesson && (
                                      <button
                                        onClick={() => onCreateStudyRoomForLesson(lesson.title)}
                                        className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                                        title="فتح غرفة مذاكرة ومناقشة تفاعلية لهذا الدرس"
                                      >
                                        <Users className="w-3 h-3" />
                                        <span>غرفة مذاكرة</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>منصة هتاف العاصمي للتعليم الذكي • متوافقة مع المناهج الوزارية 1448هـ</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Quick Lesson Summary Popup Modal */}
      {selectedSummaryLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  📝
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    ملخص الدرس: {selectedSummaryLesson.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {book.subject} • {selectedSummaryLesson.chapterTitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSummaryLesson(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-emerald-800">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span>المفاهيم والأفكار الأساسية:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
                  <li>التعريف الأكاديمي الشامل لـ {selectedSummaryLesson.title} وتطبيقاته اليومية.</li>
                  <li>القوانين والمعادلات الرياضية والعلمية المرتبطة بمحتوى الدرس.</li>
                  <li>خطوات الحل المنهجية المعتمدة في اختبارات وزارة التعليم.</li>
                </ul>
              </div>

              <div className="space-y-1.5 border-t border-slate-200 pt-3">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-blue-800">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>إرشادات التفوق وسؤال متكرر:</span>
                </h4>
                <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                  ركز على فهم العلاقة بين المتغيرات وحل التمارين التقييمية في نهاية الوحدة، واطلب من
                  المساعد الذكي توليد أسئلة تماثل اختبارات «نافس» الوزارية.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  const lesson = selectedSummaryLesson;
                  setSelectedSummaryLesson(null);
                  onOpenSmartTeacherLesson(lesson.title, 'explain');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>شرح تفاعلي كامل مع المعلم الذكي</span>
              </button>

              <button
                onClick={() => setSelectedSummaryLesson(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
