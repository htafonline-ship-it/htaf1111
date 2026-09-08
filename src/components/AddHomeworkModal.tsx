import React, { useState } from 'react';
import { CurriculumBook, HomeworkCitation } from '../types';
import { CURRICULUM_BOOKS } from '../data/mockData';
import {
  BookOpen,
  Sparkles,
  FileText,
  X,
  CheckCircle2,
  Globe,
  PenTool,
  Clock,
  Award,
  Layers,
  HelpCircle,
  Loader2
} from 'lucide-react';

interface AddHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitHomework: (citation: HomeworkCitation) => void;
  centralBooks?: CurriculumBook[];
}

export const AddHomeworkModal: React.FC<AddHomeworkModalProps> = ({
  isOpen,
  onClose,
  onSubmitHomework,
  centralBooks = CURRICULUM_BOOKS
}) => {
  if (!isOpen) return null;

  const activeBooks = centralBooks.filter((b) => b.is_active !== false);

  // Form Mode: Manual vs AI
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai'>('ai');

  // Source Type: Curriculum vs External
  const [sourceType, setSourceType] = useState<'curriculum' | 'external'>('curriculum');

  // Curriculum Selectors
  const [selectedBookId, setSelectedBookId] = useState<string>(activeBooks[0]?.id || '');
  const selectedBook = activeBooks.find((b) => b.id === selectedBookId) || activeBooks[0];

  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const selectedChapter = selectedBook?.chapters?.[selectedChapterIdx];

  const [selectedTopic, setSelectedTopic] = useState<string>(
    selectedChapter?.topics?.[0] || 'المفهوم الأساسي للدرس'
  );

  // External Inputs
  const [externalSubject, setExternalSubject] = useState<string>('الحاسب والتكنولوجيا');
  const [externalTopic, setExternalTopic] = useState<string>('تطبيقات الذكاء الاصطناعي في التعليم');

  // Common Homework Form Fields
  const [title, setTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('بعد 3 أيام');
  const [totalPoints, setTotalPoints] = useState<number>(10);
  const [description, setDescription] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([
    'السؤال الأول: عرف المفاهيم الأساسية الواردة في هذا الدرس.',
    'السؤال الثاني: اشرح الخطوات العملية للتطبيق على أمثلة واصلة.',
    'السؤال الثالث: اذكر فائدتين رئيسيتين لهذا الدرس في الحياة العملية.'
  ]);

  // AI Generation Loading state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Auto-fill title based on selection if title is empty
  const currentSubject = sourceType === 'curriculum' ? (selectedBook?.subject || 'المادة') : externalSubject;
  const currentTopicName = sourceType === 'curriculum' ? selectedTopic : externalTopic;

  const handleGenerateAIQuestions = () => {
    setIsGeneratingAI(true);
    setAiSuccessMsg(null);

    setTimeout(() => {
      setIsGeneratingAI(false);
      const generatedTitle = `واجب ذكي: ${currentTopicName}`;
      setTitle(generatedTitle);
      setDescription(`واجب تقييمي نشط تم إنشاؤه آلياً بواسطة محرك «هتاف العاصمي» للذكاء الاصطناعي حول درس "${currentTopicName}".`);
      setQuestions([
        `1. استخرج من درس (${currentTopicName}) أهم نقطتين تحليلية ووضحهما بالتفصيل.`,
        `2. قم بتقديم مثال تطبيقي عملي يجسد مفاهيم ${currentTopicName}.`,
        `3. ما الرابط الأكاديمي بين هذا الدرس والدروس السابقة في مادة ${currentSubject}؟`
      ]);
      setAiSuccessMsg('تم توليد الأسئلة والتقييم بنجاح بواسطة نماذج الذكاء الاصطناعي!');
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle = title.trim() || `واجب درس: ${currentTopicName}`;
    const finalDescription = description.trim() || `واجب تطبيقي على درس ${currentTopicName}. يرجى تسليمه في الموعد المترتب.`;

    const citation: HomeworkCitation = {
      id: `hw-cit-${Date.now()}`,
      title: finalTitle,
      subject: currentSubject,
      sourceType,
      bookName: sourceType === 'curriculum' ? selectedBook?.title : undefined,
      chapterName: sourceType === 'curriculum' ? selectedChapter?.title : undefined,
      lessonName: sourceType === 'curriculum' ? selectedTopic : undefined,
      externalTopic: sourceType === 'external' ? externalTopic : undefined,
      creationMethod,
      dueDate,
      totalPoints,
      description: finalDescription,
      questions: questions.filter((q) => q.trim().length > 0)
    };

    onSubmitHomework(citation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                إضافة واجب دراسي في المحادثة
              </h3>
              <p className="text-xs text-slate-500">
                يمكنك إنشاء واجب وتعيينه إما من كتب المقرر الرسمي أو من موضوع خارجي، يدوياً أو بذكاء «هتاف العاصمي» الاصطناعي.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Source Type (Curriculum vs External) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              1. تحديد مصدر الدرس (المقرر الوزاري أو موضوع خارجي):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceType('curriculum')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  sourceType === 'curriculum'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>من الكتب والمناهج الرسمية</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('external')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  sourceType === 'external'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>موضوع خارجي / إثرائي</span>
              </button>
            </div>
          </div>

          {/* Curriculum Selectors OR External Inputs */}
          {sourceType === 'curriculum' ? (
            <div className="bg-emerald-50/40 border border-emerald-200/80 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">الكتاب / المقرر:</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => {
                      setSelectedBookId(e.target.value);
                      setSelectedChapterIdx(0);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {activeBooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.coverIcon} {book.title} ({book.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">الفصل / الوحدة:</label>
                  <select
                    value={selectedChapterIdx}
                    onChange={(e) => setSelectedChapterIdx(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {selectedBook?.chapters?.map((ch, idx) => (
                      <option key={ch.id || idx} value={idx}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الدرس المستهدف:</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {selectedChapter?.topics?.map((top, idx) => (
                    <option key={idx} value={top}>
                      📌 {top}
                    </option>
                  )) || <option value="درس عام">الدرس العام</option>}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/40 border border-blue-200/80 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">المادة الدراسية:</label>
                  <input
                    type="text"
                    value={externalSubject}
                    onChange={(e) => setExternalSubject(e.target.value)}
                    placeholder="مثال: البرمجة أو الحاسب الآلي"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الموضوع الخارجي:</label>
                  <input
                    type="text"
                    value={externalTopic}
                    onChange={(e) => setExternalTopic(e.target.value)}
                    placeholder="مثال: الشبكات العصبية الاصطناعية"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 2: Creation Method (Manual vs AI) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              2. طريقة إعداد الواجب والأسئلة:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCreationMethod('manual')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  creationMethod === 'manual'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-4 h-4 text-amber-600" />
                <span>إدخال يدوي مباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setCreationMethod('ai')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  creationMethod === 'ai'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>توليد بالذكاء الاصطناعي</span>
              </button>
            </div>
          </div>

          {/* AI Generation Trigger Box */}
          {creationMethod === 'ai' && (
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-950 text-white p-4 rounded-2xl space-y-3 border border-indigo-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black">مولد الواجبات الذكي (AI Homework Engine)</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAIQuestions}
                  disabled={isGeneratingAI}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>توليد أسئلة الدرس الآن</span>
                    </>
                  )}
                </button>
              </div>

              {aiSuccessMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Title & Settings Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الواجب:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`مثال: واجب ${currentTopicName}`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة الكلية:</label>
              <input
                type="number"
                value={totalPoints}
                onChange={(e) => setTotalPoints(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">موعد التسليم المتوقع:</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="مثال: غداً الساعة 8 مساءً"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والإرشادات:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توجيهات حل الواجب للطلاب..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Editable Questions List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>أسئلة الواجب ({questions.length}):</span>
              <button
                type="button"
                onClick={() => setQuestions((prev) => [...prev, `سؤال ${prev.length + 1}: `])}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                + إضافة سؤال جديد
              </button>
            </label>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuestions((prev) => prev.map((item, i) => (i === idx ? val : item)));
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>نشر الواجب في المحادثة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
