import React, { useState, useRef } from 'react';
import { ProblemSolverResult, ThreeDModelInfo } from '../types';
import { ThreeDLessonViewer, PRESET_3D_MODELS } from './ThreeDLessonViewer';
import {
  Sparkles,
  Camera,
  Upload,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Lightbulb,
  FileText,
  BookmarkCheck,
  ChevronLeft,
  Image as ImageIcon,
  Send,
  Loader2,
  Volume2,
  Box,
  Heart
} from 'lucide-react';

interface AISolverViewProps {
  initialQuestion?: string;
  initialImage?: string;
}

export const AISolverView: React.FC<AISolverViewProps> = ({
  initialQuestion = '',
  initialImage = ''
}) => {
  const [questionText, setQuestionText] = useState(initialQuestion);
  const [subject, setSubject] = useState('العلوم');
  const [grade, setGrade] = useState('الصف الثالث المتوسط');
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProblemSolverResult | null>(null);
  const [userPracticeAnswers, setUserPracticeAnswers] = useState<Record<string, number>>({});
  const [showPracticeHints, setShowPracticeHints] = useState<Record<string, boolean>>({});
  const [active3DModal, setActive3DModal] = useState<ThreeDModelInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample Preset Questions for Instant Demo
  const presets = [
    {
      title: 'قلب الإنسان والأوعية الدموية (علوم 3D 🫀)',
      text: 'اشرح لي تشريح قلب الإنسان ووظيفة الأبهر الشرياني والشريان الرئوي بدقة مع العرض ثلاثي الأبعاد 3D.',
      subject: 'العلوم',
      grade: 'الصف الثالث المتوسط'
    },
    {
      title: 'معادلة تربيعية من كتاب الرياضيات ص 42',
      text: 'حل المعادلة التربيعية الآتية باكمال المربع: س² + 6س - 16 = 0',
      subject: 'الرياضيات',
      grade: 'الصف الثالث المتوسط'
    },
    {
      title: 'مسألة تسارع الحركة (فيزياء ص 75)',
      text: 'تتحرك سيارة بسرعة 15 م/ث ثم تزداد سرعتها لتصل إلى 35 م/ث خلال 4 ثوانٍ. احسب التسارع بوحدة م/ث².',
      subject: 'الفيزياء',
      grade: 'الصف الأول الثانوي'
    }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!questionText.trim() && !selectedImage) return;

    setIsLoading(true);
    setUserPracticeAnswers({});
    setShowPracticeHints({});

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: questionText.trim(),
          imageBase64: selectedImage,
          subject,
          grade
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setResult(resData.data);
      }
    } catch (err) {
      console.error('Failed to solve question:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePracticeOptionSelect = (qId: string, optionIdx: number) => {
    setUserPracticeAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const toggleHint = (qId: string) => {
    setShowPracticeHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 rounded-3xl border border-blue-500/30 shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30 mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              تقنية OCR الذكية ومناهج وزارة التعليم
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              المساعد التعليمي الذكي وحلال المسائل (AI Solver)
            </h2>
            <p className="text-blue-100 text-sm mt-2 max-w-2xl leading-relaxed">
              التقط صورة للمسألة من كتابك أو اكتبها مباشرة، وسيقوم المساعد بتحليلها خطوة بخطوة، ربطها بصفحة كتاب الوزارة، وتوليد تدريبات لتأكيد الفهم.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs text-white space-y-2 shrink-0">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>دقة عالية في التعرف على المعادلات</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-blue-100">
              <BookOpen className="w-4 h-4" />
              <span>ربط بصفحة الدرس في المنهج</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Input Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/50 border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              أدخل المسألة أو التقط صورة
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-bold focus:ring-2 focus:ring-blue-500"
              >
                <option value="الرياضيات">الرياضيات</option>
                <option value="العلوم">العلوم</option>
                <option value="الفيزياء">الفيزياء</option>
                <option value="الكيمياء">الكيمياء</option>
                <option value="اللغة العربية">اللغة العربية</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
              </select>

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-bold focus:ring-2 focus:ring-blue-500"
              >
                <option value="الصف الثالث المتوسط">الثالث المتوسط</option>
                <option value="الصف الثاني المتوسط">الثاني المتوسط</option>
                <option value="الصف الأول المتوسط">الأول المتوسط</option>
                <option value="الصف الأول الثانوي">الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الثاني الثانوي</option>
                <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
              </select>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="اكتب المسألة أو المعادلة هنا... مثال: س² + 5س + 6 = 0 أوجِد قيم س"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
            />
          </div>

          {/* Image OCR Uploader */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>أو ارفع صورة المسألة من الكتاب/الدفتر (OCR):</span>
              {selectedImage && (
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  حذف الصورة
                </button>
              )}
            </label>

            {selectedImage ? (
              <div className="relative rounded-2xl border-2 border-blue-500/50 overflow-hidden bg-slate-900 p-2 flex items-center justify-center max-h-56">
                <img
                  src={selectedImage}
                  alt="المسألة المرفوقة"
                  className="max-h-48 object-contain rounded-xl"
                />
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                  جاهز للتحليل الذكي OCR
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  انقر هنا لالتقاط صورة أو رفع ملف صور (PNG, JPG)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  يدعم قراءة خط اليد والمعادلات من كتب وزارة التعليم مباشرة
                </p>
              </div>
            )}
          </div>

          {/* Solve Button */}
          <button
            onClick={handleSolve}
            disabled={isLoading || (!questionText.trim() && !selectedImage)}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition ${
              isLoading || (!questionText.trim() && !selectedImage)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري معالجة المسألة واستخراج الخطوات...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>حل المسألة وشرح الخطوات بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>

        {/* Right / Preset Questions Sidebar */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-amber-400 text-sm flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              أمثلة سريعة للمسائل المنهجية
            </h4>
            <div className="space-y-3">
              {presets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuestionText(preset.text);
                    setSubject(preset.subject);
                    setGrade(preset.grade);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition hover:border-blue-500/50 group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                    <span>{preset.title}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                      {preset.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>يتم ربط كل إجابة برقم الصفحة والدرس في المنهج المعتمد تلقائياً.</span>
          </div>
        </div>
      </div>

      {/* RESULT SECTION */}
      {result && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0">
          {/* Result Banner */}
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full">
                  تمت المعالجة بنجاح
                </span>
                <span className="text-xs text-slate-400">المادة: {result.subject}</span>
                <span className="text-xs text-slate-400">الصعوبة: {result.difficulty}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{result.question}</h3>
            </div>

            <button
              onClick={() => speakText(result.steps.map((s) => s.explanation).join('. '))}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 self-start md:self-auto"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>استماع للشرح صوتاً</span>
            </button>
          </div>

          {/* Ministry Textbook Citation Ribbon */}
          {result.textbookCitation && (
            <div className="bg-emerald-50 border-y border-emerald-200/80 p-4 px-6 flex flex-wrap items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-900">
                    مرجع الإجابة من كتب وزارة التعليم المعتمدة:
                  </div>
                  <div className="text-xs text-emerald-800 font-semibold">
                    {result.textbookCitation.bookName} • {result.textbookCitation.grade} • {result.textbookCitation.unitName} (درس: {result.textbookCitation.lessonName})
                  </div>
                </div>
              </div>
              <div className="bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow">
                صفحة رقم {result.textbookCitation.pageNumber}
              </div>
            </div>
          )}

          {/* 3D Interactive Model Banner if available */}
          {(result.threeDModel || result.subject === 'العلوم' || result.question.includes('قلب')) && (
            <div className="mx-6 sm:mx-8 my-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-cyan-300 flex items-center justify-center font-extrabold shrink-0 shadow-lg shadow-blue-500/20">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-sm text-white">
                      {result.threeDModel ? result.threeDModel.title : 'استكشاف المجسم ثلاثي الأبعاد (3D) لهذا الدرس'}
                    </h5>
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30">
                      3D تفاعلي
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    شرح مجسم تفاعلي يتيح لك تدوير الأعضاء والجزيئات واستكشاف أجزائها مع الشرح الصوتي للذكاء الاصطناعي.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActive3DModal(result.threeDModel || PRESET_3D_MODELS.heart)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 shrink-0 transition"
              >
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300/30 animate-pulse" />
                <span>فتح المجسم 3D</span>
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-8">
            {/* Step-by-step resolution */}
            <div className="space-y-4">
              <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                خطوات الحل التفصيلية:
              </h4>

              <div className="space-y-4">
                {result.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow">
                        {step.stepNumber}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                        <p className="text-slate-700 text-xs leading-relaxed">{step.explanation}</p>
                        {step.mathFormula && (
                          <div className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-sm tracking-wide text-left dir-ltr shadow-inner">
                            {step.mathFormula}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Answer Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  النتيجة النهائية المباشرة:
                </div>
                <div className="text-2xl font-black mt-1 dir-ltr text-right">{result.finalAnswer}</div>
              </div>
              <div className="bg-slate-950/30 px-4 py-2 rounded-xl text-xs font-bold border border-white/10">
                المفهوم: {result.keyConcept}
              </div>
            </div>

            {/* Practice Questions Section */}
            {result.practiceQuestions && result.practiceQuestions.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    تدريبات تطبيقية مشابهة لتأكيد الفهم (Practice Exercises):
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    قم بإجابة الأسئلة التالية للتأكد من استيعابك الكامل للخطوات:
                  </p>
                </div>

                <div className="space-y-6">
                  {result.practiceQuestions.map((pq, qIdx) => {
                    const selectedOpt = userPracticeAnswers[pq.id];
                    const isAnswered = selectedOpt !== undefined;
                    const isCorrect = selectedOpt === pq.correctAnswer;

                    return (
                      <div
                        key={pq.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="font-bold text-slate-900 text-sm">
                            {qIdx + 1}. {pq.question}
                          </h5>
                          <button
                            onClick={() => toggleHint(pq.id)}
                            className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>تلميح</span>
                          </button>
                        </div>

                        {showPracticeHints[pq.id] && (
                          <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 font-medium">
                            💡 تلميح: {pq.hint}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {pq.options.map((opt, oIdx) => {
                            let btnStyle =
                              'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                            if (isAnswered) {
                              if (oIdx === pq.correctAnswer) {
                                btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                              } else if (selectedOpt === oIdx) {
                                btnStyle = 'bg-red-100 border-red-400 text-red-950 font-bold';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handlePracticeOptionSelect(pq.id, oIdx)}
                                className={`p-3 rounded-xl border text-right text-xs transition flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isAnswered && oIdx === pq.correctAnswer && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {isAnswered && selectedOpt === oIdx && oIdx !== pq.correctAnswer && (
                                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div
                            className={`p-3 rounded-xl text-xs font-medium border ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className="font-bold">
                              {isCorrect ? 'إجابة صحيحة رائع! 🎉 ' : 'توضيح الإجابة الصحيحة: '}
                            </span>
                            {pq.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3D Lesson Viewer Modal */}
      {active3DModal && (
        <ThreeDLessonViewer
          modelInfo={active3DModal}
          onClose={() => setActive3DModal(null)}
          isModal={true}
        />
      )}
    </div>
  );
};
