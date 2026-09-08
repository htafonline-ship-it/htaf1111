import React, { useState, useEffect } from 'react';
import { CurriculumBook, BookPageAnalysisResult } from '../types';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Lightbulb,
  GraduationCap,
  RotateCcw,
  Loader2,
  X,
  Volume2,
  Check,
  Send,
  Zap,
  Target,
  Award,
  Layers,
  ArrowRight,
  Bookmark
} from 'lucide-react';

interface InteractiveBookPageReaderProps {
  book: CurriculumBook;
  initialPageNumber?: number;
  initialTab?: 'reader' | 'summary' | 'solve' | 'quiz';
  onClose: () => void;
  onOpenTeacherWithTopic?: (subject: string, grade: string) => void;
  onOpenSolverWithQuestion?: (question: string, subject: string, grade: string) => void;
}

export const InteractiveBookPageReader: React.FC<InteractiveBookPageReaderProps> = ({
  book,
  initialPageNumber = 1,
  initialTab = 'reader',
  onClose,
  onOpenTeacherWithTopic,
  onOpenSolverWithQuestion
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber || 1);
  const [pageInput, setPageInput] = useState<string>(String(initialPageNumber || 1));
  const [activeTab, setActiveTab] = useState<'reader' | 'summary' | 'solve' | 'quiz'>(initialTab);

  const [loading, setLoading] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<BookPageAnalysisResult | null>(null);

  // Practice Quiz State
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);

  // Fetch Page Analysis from Backend
  const fetchPageAnalysis = async (pageNum: number) => {
    setLoading(true);
    setSubmittedQuiz(false);
    setUserQuizAnswers({});

    // Find current chapter if available
    const chapter = book.chapters.find(
      (c) => c.pageStart && c.pageEnd && pageNum >= c.pageStart && pageNum <= c.pageEnd
    );

    try {
      const res = await fetch('/api/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          subject: book.subject,
          grade: book.grade,
          pageNumber: pageNum,
          lessonTitle: chapter ? chapter.title : ''
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAnalysisData(data.data);
      }
    } catch (err) {
      console.error('Error analyzing page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageAnalysis(currentPage);
  }, [currentPage, book.id]);

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= (book.totalPages || 200)) {
      setCurrentPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleNextPage = () => {
    if (currentPage < (book.totalPages || 200)) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setPageInput(String(next));
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setPageInput(String(prev));
    }
  };

  // Calculate quiz score
  const getQuizScore = () => {
    if (!analysisData?.practiceQuiz?.questions) return { score: 0, total: 0 };
    let correct = 0;
    analysisData.practiceQuiz.questions.forEach((q) => {
      if (userQuizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return { score: correct, total: analysisData.practiceQuiz.questions.length };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto dir-rtl">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* HEADER TOOLBAR */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold shrink-0">
              {book.coverIcon || '📚'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  🇸🇦 المنهج السعودي الرقمي
                </span>
                <span className="text-xs text-slate-400 font-bold">{book.grade}</span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-white mt-0.5">{book.title}</h3>
            </div>
          </div>

          {/* PAGE NAVIGATOR CONTROLLER */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 transition"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <form onSubmit={handlePageJump} className="flex items-center gap-1.5 px-2">
              <span className="text-xs text-slate-400 font-bold">صفحة</span>
              <input
                type="number"
                min={1}
                max={book.totalPages || 200}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-14 bg-slate-900 text-center font-black text-emerald-400 text-xs py-1 rounded-lg border border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 font-bold">من {book.totalPages || 180}</span>
              <button
                type="submit"
                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2 py-1 rounded-md mr-1 transition"
              >
                انتقال
              </button>
            </form>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= (book.totalPages || 200)}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 transition"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition mr-2"
              title="إغلاق قارئ الكتاب"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEATURE NAVIGATION TABS */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-3 flex items-center justify-start gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('reader')}
            className={`px-4 py-2.5 rounded-t-2xl font-extrabold text-xs flex items-center gap-2 border-t-2 transition whitespace-nowrap ${
              activeTab === 'reader'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>📖 قراءة واستعراض الصفحة ({currentPage})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2.5 rounded-t-2xl font-extrabold text-xs flex items-center gap-2 border-t-2 transition whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>📝 تلخيص الصفحة والأفكار الذكية</span>
          </button>

          <button
            onClick={() => setActiveTab('solve')}
            className={`px-4 py-2.5 rounded-t-2xl font-extrabold text-xs flex items-center gap-2 border-t-2 transition whitespace-nowrap ${
              activeTab === 'solve'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>✍️ حل كافة أسئلة وتمارين الصفحة</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2.5 rounded-t-2xl font-extrabold text-xs flex items-center gap-2 border-t-2 transition whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <Target className="w-4 h-4 text-purple-600" />
            <span>🎯 اختبار تجريبي لتقييم فهمك</span>
          </button>
        </div>

        {/* CONTENT STAGE */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <div className="relative inline-block">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  جاري استنزال وتحليل الصفحة ({currentPage}) بالذكاء الاصطناعي...
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  إعداد النص، التلخيص الشامل، حلول التمارين، والاختبار التجريبي المخصص لك
                </p>
              </div>
            </div>
          ) : analysisData ? (
            <>
              {/* TAB 1: BOOK PAGE DIGITAL READER */}
              {activeTab === 'reader' && (
                <div className="space-y-6">
                  {/* Digital Page Sheet Wrapper */}
                  <div className="bg-amber-50/40 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-inner space-y-6 relative overflow-hidden">
                    {/* Watermark/Header Header */}
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-4">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-amber-700" />
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 block">
                            المملكة العربية السعودية • وزارة التعليم
                          </span>
                          <h4 className="font-black text-slate-900 text-base">
                            {analysisData.pageHeading}
                          </h4>
                        </div>
                      </div>
                      <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full border border-amber-300">
                        صفحة رقم {currentPage}
                      </span>
                    </div>

                    {/* Lesson Main Text */}
                    <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4 font-sans">
                      <p className="whitespace-pre-line text-justify leading-loose">
                        {analysisData.pageTextContent}
                      </p>
                    </div>

                    {/* Key Concepts Preview Box */}
                    {analysisData.keyConceptsAndLaws && analysisData.keyConceptsAndLaws.length > 0 && (
                      <div className="bg-white/80 border border-amber-300 rounded-2xl p-4 space-y-2">
                        <h5 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span>المفاهيم الذهبية والقوانين في هذه الصفحة:</span>
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {analysisData.keyConceptsAndLaws.map((kc, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-100 text-amber-950 font-bold text-xs px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                              <span>{kc}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Navigation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-right space-y-1 transition group"
                    >
                      <div className="flex items-center justify-between font-extrabold text-sm">
                        <span>قراءة تلخيص الصفحة</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                      <p className="text-xs text-amber-800/80">أفكار ومفاهيم الصفحة مركزة في نقاط بسيطة</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('solve')}
                      className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-right space-y-1 transition group"
                    >
                      <div className="flex items-center justify-between font-extrabold text-sm">
                        <span>حل كافة أسئلة الصفحة</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                      <p className="text-xs text-blue-800/80">حلول التمارين بالخطوات والتعليل المنهجي</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('quiz')}
                      className="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-right space-y-1 transition group"
                    >
                      <div className="flex items-center justify-between font-extrabold text-sm">
                        <span>اختبار تجريبي لفهم الصفحة</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                      <p className="text-xs text-purple-800/80">3-4 أسئلة تفاعلية لقياس استيعابك فورياً</p>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PAGE SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">
                          التلخيص الشامل والذكائي لصفحة {currentPage}
                        </h4>
                        <p className="text-xs text-slate-600">
                          كتاب: {analysisData.bookTitle} • {analysisData.lessonTitle}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-amber-200/80 space-y-3">
                      <h5 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider">
                        📌 النقاط الجوهرية والملخص المباشر:
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {analysisData.pageSummary}
                      </p>
                    </div>

                    {/* Key Laws & Definitions */}
                    {analysisData.keyConceptsAndLaws && (
                      <div className="space-y-2">
                        <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span>القوانين والتعاريف الأساسية المطلوبة:</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysisData.keyConceptsAndLaws.map((kc, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5"
                            >
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-xs font-bold text-slate-800">{kc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PAGE EXERCISES SOLVED */}
              {activeTab === 'solve' && (
                <div className="space-y-6">
                  <div className="bg-blue-50/60 border border-blue-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            حل جميع أسئلة وتمارين صفحة {currentPage}
                          </h4>
                          <p className="text-xs text-slate-600">
                            محلولة ومفسرة بالخطوات بواسطة الذكاء الاصطناعي وفق المنهج
                          </p>
                        </div>
                      </div>
                      <span className="bg-blue-200 text-blue-900 text-xs font-extrabold px-3 py-1 rounded-full">
                        {analysisData.solvedExercises?.length || 0} تمارين محلولة
                      </span>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                      {analysisData.solvedExercises && analysisData.solvedExercises.map((ex, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                              {ex.exerciseNumber}
                            </span>
                            {ex.keyFormula && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {ex.keyFormula}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h5 className="font-extrabold text-sm text-slate-900">
                              سؤال التمرين: {ex.question}
                            </h5>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                              <span className="font-black text-emerald-700 block mb-1">
                                ✅ الحل المعتمد والتعليل:
                              </span>
                              <p className="whitespace-pre-line">{ex.solution}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRACTICE QUIZ FOR PAGE UNDERSTANDING */}
              {activeTab === 'quiz' && analysisData.practiceQuiz && (
                <div className="space-y-6">
                  <div className="bg-purple-50/60 border border-purple-200 rounded-3xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-200/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {analysisData.practiceQuiz.quizTitle}
                          </h4>
                          <p className="text-xs text-slate-600">
                            أجب عن الأسئلة التالية لقياس مستوى استيعابك وفهمك لهذه الصفحة (ص {currentPage})
                          </p>
                        </div>
                      </div>

                      {submittedQuiz && (
                        <div className="bg-white p-3 rounded-2xl border border-purple-300 shadow-md flex items-center gap-3 shrink-0">
                          <Award className="w-6 h-6 text-purple-600" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">نتيجة التقييم:</span>
                            <span className="text-sm font-black text-purple-900">
                              {getQuizScore().score} من {getQuizScore().total} ({Math.round((getQuizScore().score / getQuizScore().total) * 100)}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6">
                      {analysisData.practiceQuiz.questions.map((q, qIndex) => {
                        const selectedOpt = userQuizAnswers[q.id];
                        const isCorrect = selectedOpt === q.correctAnswer;

                        return (
                          <div
                            key={q.id}
                            className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-3 py-1 rounded-lg">
                                السؤال {qIndex + 1}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-sm text-slate-900">
                              {q.question}
                            </h5>

                            {/* Options */}
                            <div className="grid grid-cols-1 gap-2">
                              {q.options.map((opt, oIndex) => {
                                let optionStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                                if (selectedOpt === oIndex) {
                                  optionStyle = 'bg-purple-100 border-purple-500 text-purple-950 font-bold ring-2 ring-purple-400';
                                }

                                if (submittedQuiz) {
                                  if (oIndex === q.correctAnswer) {
                                    optionStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                                  } else if (selectedOpt === oIndex && oIndex !== q.correctAnswer) {
                                    optionStyle = 'bg-rose-100 border-rose-400 text-rose-950 font-bold';
                                  }
                                }

                                return (
                                  <button
                                    key={oIndex}
                                    disabled={submittedQuiz}
                                    onClick={() =>
                                      setUserQuizAnswers((prev) => ({ ...prev, [q.id]: oIndex }))
                                    }
                                    className={`p-3.5 rounded-xl border text-right text-xs transition flex items-center justify-between ${optionStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {selectedOpt === oIndex && !submittedQuiz && (
                                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                                    )}
                                    {submittedQuiz && oIndex === q.correctAnswer && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                    {submittedQuiz && selectedOpt === oIndex && oIndex !== q.correctAnswer && (
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Answer Explanation when submitted */}
                            {submittedQuiz && (
                              <div
                                className={`p-3 rounded-xl text-xs font-sans space-y-1 ${
                                  isCorrect ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                                }`}
                              >
                                <span className="font-extrabold block">
                                  {isCorrect ? '✨ أحسنت! إجابة صحيحة' : '💡 التفسير المنهجي للاجابة الصحيحة:'}
                                </span>
                                <p>{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit Quiz Actions */}
                    <div className="flex items-center justify-between border-t border-purple-200/60 pt-4">
                      {!submittedQuiz ? (
                        <button
                          onClick={() => setSubmittedQuiz(true)}
                          disabled={Object.keys(userQuizAnswers).length === 0}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>اعتماد وإظهار النتيجة والتعليل</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSubmittedQuiz(false);
                            setUserQuizAnswers({});
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-400" />
                          <span>إعادة الاختبار التجريبي</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* BOTTOM TEACHER & SOLVER CROSS-LINKING BAR */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>هل ترغب بطلب توضيح أكبر حول هذه الصفحة من المعلم الذكي؟</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenTeacherWithTopic && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTeacherWithTopic(book.subject, book.grade);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <GraduationCap className="w-4 h-4" />
                <span>محادثة المعلم الذكي</span>
              </button>
            )}

            {onOpenSolverWithQuestion && analysisData && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSolverWithQuestion(
                    `اشرح واحل تمرين صفحة ${currentPage} من كتاب ${book.title}: ${analysisData.solvedExercises?.[0]?.question || analysisData.pageHeading}`,
                    book.subject,
                    book.grade
                  );
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>حلال المسائل الذكي</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
