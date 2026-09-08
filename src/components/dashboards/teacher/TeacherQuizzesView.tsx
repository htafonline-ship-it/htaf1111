import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, TeacherQuiz, TeacherQuizQuestion } from '../../../types';
import {
  fetchTeacherQuizzes,
  saveTeacherQuiz,
  toggleTeacherQuizPublished,
  deleteTeacherQuiz
} from '../../../lib/supabase';
import {
  HelpCircle,
  Plus,
  Calendar,
  Clock,
  Award,
  Sparkles,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Loader2,
  Bot,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

interface TeacherQuizzesViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  canCreateQuizzes?: boolean;
}

export const TeacherQuizzesView: React.FC<TeacherQuizzesViewProps> = ({
  currentUser,
  currentSchool,
  canCreateQuizzes = true
}) => {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form States
  const [title, setTitle] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('العلوم');
  const [gradeName, setGradeName] = useState<string>('الصف الثالث المتوسط');
  const [classroomName, setClassroomName] = useState<string>('3/أ');
  const [examDate, setExamDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [examTime, setExamTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [totalPoints, setTotalPoints] = useState<number>(10);
  const [description, setDescription] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);

  // Questions Builder
  const [questions, setQuestions] = useState<TeacherQuizQuestion[]>([
    {
      id: 'q-1',
      questionText: 'ما هي وحدة قياس القوة في النظام الدولي؟',
      options: ['الجول', 'النيوتن', 'الباسكال', 'الواط'],
      correctAnswerIndex: 1,
      points: 2
    },
    {
      id: 'q-2',
      questionText: 'أي من العناصر التالية يعتبر من أشباه الفلزات؟',
      options: ['السيليكون', 'الحديد', 'الأكسجين', 'الصوديوم'],
      correctAnswerIndex: 0,
      points: 2
    }
  ]);

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherQuizzes(schoolId, teacherId);
      if (data && data.length > 0) {
        setQuizzes(data);
      } else {
        // Fallback default quizzes
        setQuizzes([
          {
            id: 'quiz-1',
            schoolId,
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            subjectName: 'العلوم',
            title: 'اختبار قصير: الجدول الدوري والتفاعلات الكيميائية',
            description: 'اختبار تشخيصي لقياس المفاهيم الأساسية في الوحدة الأولى.',
            examDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            examTime: '08:30',
            durationMinutes: 20,
            totalPoints: 10,
            questions: [
              {
                id: 'q-1',
                questionText: 'ما هي شحنة البروتون؟',
                options: ['موجبة', 'سالبة', 'متعادلة', 'لا توجد شحنة'],
                correctAnswerIndex: 0,
                points: 5
              },
              {
                id: 'q-2',
                questionText: 'أين تتمركز معظم كتلة الذرة؟',
                options: ['في الإلكترونات', 'في النواة', 'في الفراغ المحيط', 'في المدار الخارجي'],
                correctAnswerIndex: 1,
                points: 5
              }
            ],
            isPublished: true,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Error loading quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [schoolId, teacherId]);

  const handleAddQuestion = () => {
    const newQ: TeacherQuizQuestion = {
      id: `q-${Date.now()}`,
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      points: 2
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = text;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswerIndex = optIdx;
    setQuestions(updated);
  };

  const handleGenerateAiQuestions = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setQuestions([
        {
          id: `ai-1`,
          questionText: 'أي من الظواهر التالية تدل على حدوث تفاعل كيميائي؟',
          options: ['تغير حالة المادة فقط', 'انبعاث غاز أو تغير اللون', 'تقطيع الورق', 'ذوبان السكر في الماء'],
          correctAnswerIndex: 1,
          points: 2
        },
        {
          id: `ai-2`,
          questionText: 'تتكون جزيئات الماء من عنصري:',
          options: ['الهيدروجين والأكسجين', 'الكربون والأكسجين', 'النيتروجين والهيدروجين', 'الصوديوم والكلور'],
          correctAnswerIndex: 0,
          points: 2
        },
        {
          id: `ai-3`,
          questionText: 'قانون حفظ الكتلة ينص على أن الكتلة في التفاعل الكيميائي:',
          options: ['تزداد دائماً', 'تفنى وتتلاشى', 'لا تفنى ولا تستحدث من العدم', 'تقل بمقدار النصف'],
          correctAnswerIndex: 2,
          points: 2
        }
      ]);
      setIsAiGenerating(false);
    }, 900);
  };

  const handleSaveQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('يرجى كتابة عنوان الاختبار.');
      return;
    }

    if (questions.length === 0) {
      setErrorMsg('يرجى إضافة سؤال واحد على الأقل.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await saveTeacherQuiz({
        schoolId,
        teacherId,
        teacherName,
        gradeName,
        classroomName,
        subjectName,
        title: title.trim(),
        description: description.trim(),
        examDate,
        examTime,
        durationMinutes,
        totalPoints,
        questions,
        isPublished
      });

      setQuizzes((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الاختبار.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (quiz: TeacherQuiz) => {
    try {
      const nextState = !quiz.isPublished;
      await toggleTeacherQuizPublished(quiz.id, schoolId, nextState);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, isPublished: nextState } : q))
      );
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return;
    try {
      await deleteTeacherQuiz(quizId, schoolId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  return (
    <div className="space-y-6" id="teacher-quizzes-section">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-black text-slate-900">الاختبارات والتقييمات القصيرة</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {quizzes.length} اختبار متاح
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إنشاء الاختبارات القصيرة، رصد النتائج، وإتاحة النتيجة للطلاب وأولياء الأمور فور اعتمادها.
          </p>
        </div>

        {canCreateQuizzes && (
          <button
            id="btn-create-quiz"
            onClick={() => {
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ إنشاء اختبار قصير جديد</span>
          </button>
        )}
      </div>

      {/* Quizzes List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold">جاري تحميل الاختبارات...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد اختبارات مسجلة حالياً</h4>
          <p className="text-xs text-slate-400">ابدأ بإنشاء أول اختبار قصير لفصولك المسندة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-purple-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {quiz.subjectName} — {quiz.classroomName}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(quiz)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                        quiz.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {quiz.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{quiz.isPublished ? 'منشور للطلاب' : 'مسودة غير منشورة'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="حذف الاختبار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm mt-2">{quiz.title}</h4>
                {quiz.description && <p className="text-xs text-slate-500 mt-1">{quiz.description}</p>}

                <div className="grid grid-cols-3 gap-2 mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">تاريخ الاختبار</span>
                    <span className="font-bold text-slate-800 font-mono">{quiz.examDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">المدة</span>
                    <span className="font-bold text-purple-700 font-mono">{quiz.durationMinutes} دقيقة</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">الدرجة</span>
                    <span className="font-bold text-emerald-700 font-mono">{quiz.totalPoints} درجات</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-bold">
                  📝 {quiz.questions?.length || 0} أسئلة مضمنة
                </span>
                <span className="text-[10px] text-slate-400">المعلم: {quiz.teacherName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE QUIZ */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">إنشاء اختبار قصير جديد</h3>
                  <p className="text-[11px] text-slate-500">حفظ فوري في Supabase ومزامنة مع الجدول المدرسي</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuizSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عنوان الاختبار <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: اختبار قصير في الطاقة الحرارية"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المادة</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الصف</label>
                  <select
                    value={gradeName}
                    onChange={(e) => setGradeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                    <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
                    <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الشعبة</label>
                  <select
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="3/أ">شعبة 3/أ</option>
                    <option value="3/ب">شعبة 3/ب</option>
                    <option value="3/ج">شعبة 3/ج</option>
                    <option value="1/أ">شعبة 1/أ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ الاختبار</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المدة بالدقائق</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">إجمالي الدرجات</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <span>أسئلة الاختبار ({questions.length})</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiQuestions}
                      disabled={isAiGenerating}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5 transition"
                    >
                      {isAiGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>توليد أسئلة بالذكاء الاصطناعي ✨</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                    >
                      + إضافة سؤال
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800">السؤال {qIdx + 1}:</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder="نص السؤال..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                        required
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswerIndex === optIdx}
                              onChange={() => handleCorrectAnswerChange(qIdx, optIdx)}
                              className="text-purple-600 focus:ring-purple-500"
                              title="تحديد كإجابة صحيحة"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`الخيار ${optIdx + 1}`}
                              className={`w-full p-1.5 rounded-lg border text-[11px] ${
                                q.correctAnswerIndex === optIdx
                                  ? 'border-purple-400 bg-purple-50/50 font-bold'
                                  : 'border-slate-200 bg-white'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>نشر الاختبار للطلاب وأولياء الأمور فور اعتماده</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>اعتماد الاختبار</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
