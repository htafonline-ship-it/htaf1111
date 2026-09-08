import React, { useState, useRef, useEffect } from 'react';
import { TeacherChatMessage, CurriculumBook, HomeworkCitation, ThreeDModelInfo } from '../types';
import { AddHomeworkModal } from './AddHomeworkModal';
import { ThreeDLessonViewer, PRESET_3D_MODELS } from './ThreeDLessonViewer';
import {
  Bot,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  BookOpen,
  RotateCcw,
  Loader2,
  Lightbulb,
  GraduationCap,
  PlusCircle,
  FileText,
  Box,
  Eye,
  Layers,
  Heart
} from 'lucide-react';

interface SmartTeacherViewProps {
  centralBooks?: CurriculumBook[];
  initialSubject?: string;
  initialGrade?: string;
  initialTopic?: string;
  initialMode?: 'explain' | 'quiz' | 'summary';
}

export const SmartTeacherView: React.FC<SmartTeacherViewProps> = ({
  centralBooks,
  initialSubject,
  initialGrade,
  initialTopic,
  initialMode = 'explain'
}) => {
  const [subject, setSubject] = useState(initialSubject || 'العلوم');
  const [grade, setGrade] = useState(initialGrade || 'الصف الثالث المتوسط');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [active3DModal, setActive3DModal] = useState<ThreeDModelInfo | null>(null);

  // Sync initial props if changed
  useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
    if (initialGrade) setGrade(initialGrade);
    if (initialTopic) {
      const modeText =
        initialMode === 'quiz'
          ? `أريد اختباراً تفاعلياً يقيس فهمي لدرس: ${initialTopic}`
          : initialMode === 'summary'
          ? `لخص لي المفاهيم والقوانين الرئيسية في درس: ${initialTopic}`
          : `اشرح لي بالتفصيل درس: ${initialTopic} من كتاب ${initialSubject || subject}`;

      setInput(modeText);
    }
  }, [initialSubject, initialGrade, initialTopic, initialMode]);

  const [messages, setMessages] = useState<TeacherChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'teacher',
      text: 'أهلاً بك يا بطل! أنا المعلم الذكي في منصة «هتاف العاصمي» التعليمية. يسعدني أن أصحبك في رحلة استكشاف الدروس العلمية بالشرح التفاعلي والمجسمات ثلاثية الأبعاد (3D). عن أي درس ترغب في الحديث اليوم؟',
      timestamp: 'الآن',
      threeDModel: PRESET_3D_MODELS.heart,
      checkQuestion: {
        id: 'cq-start',
        question: 'اختبر استيعابك المبدئي للقلب: ما هو الشريان الأكبر في الجسم الذي يوزع الدم المؤكسج من البطين الأيسر؟',
        options: ['الشريان الرئوي', 'الأبهر (Aorta)', 'الوريد الأجوف العلوي', 'الوريد الرئوي'],
        correctAnswer: 1,
        explanation: 'الشريان الأبهر (Aorta) هو أكبر شريان وينطلق من البطين الأيسر ليغذي كافة أجهزة وجسم الإنسان بالدم النقي.'
      },
      suggestedPrompts: [
        'اشرح لي تشريح ووظيفة قلب الإنسان 3D 🫀',
        'ما الفرق بين الشريان والوريد في الدورة الدموية؟',
        'اعرض لي التركيب الجزيئي للماء H₂O 3D 🧪'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: TeacherChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'student',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/smart-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ sender: m.sender, text: m.text })),
          subject,
          grade
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const teacherMsg: TeacherChatMessage = {
          id: `msg-t-${Date.now()}`,
          sender: 'teacher',
          text: resData.data.text,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          checkQuestion: resData.data.checkQuestion,
          suggestedPrompts: resData.data.suggestedPrompts,
          threeDModel: resData.data.threeDModel
        };
        setMessages((prev) => [...prev, teacherMsg]);
      }
    } catch (err) {
      console.error('Failed to get teacher response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerCheckQuestion = (qId: string, optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleHomeworkSubmit = (citation: HomeworkCitation) => {
    const homeworkMsg: TeacherChatMessage = {
      id: `msg-hw-${Date.now()}`,
      sender: 'teacher',
      text: `📌 تم تعيين واجب دراسي جديد: ${citation.title}`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      homeworkCitation: citation
    };
    setMessages((prev) => [...prev, homeworkMsg]);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">المعلم الذكي التفاعلي (Smart Teacher)</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                جلسة تفاعلية
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              جلسات تعليمية تفاعلية تبسط الدروس وتطرح أسئلة توجيهية لقياس استيعاب الطالب فوراً.
            </p>
          </div>
        </div>

        {/* Filters & 3D Presets */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setActive3DModal(PRESET_3D_MODELS.heart)}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20 animate-pulse" />
            <span>قلب الإنسان 3D</span>
          </button>

          <button
            onClick={() => setActive3DModal(PRESET_3D_MODELS.molecule)}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span>جزيء H₂O 3D</span>
          </button>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="العلوم">مادة العلوم</option>
            <option value="الرياضيات">مادة الرياضيات</option>
            <option value="الفيزياء">مادة الفيزياء</option>
            <option value="الكيمياء">مادة الكيمياء</option>
            <option value="اللغة العربية">اللغة العربية</option>
            <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
          </select>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="الصف الثالث المتوسط">الثالث المتوسط</option>
            <option value="الصف الثاني المتوسط">الثاني المتوسط</option>
            <option value="الصف الأول المتوسط">الأول المتوسط</option>
            <option value="الصف الأول الثانوي">الأول الثانوي</option>
          </select>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 h-[520px] flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => {
            const isTeacher = msg.sender === 'teacher';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isTeacher ? 'me-auto' : 'ms-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow ${
                    isTeacher
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isTeacher ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Bubble Content */}
                <div className="space-y-3 flex-1">
                  <div
                    className={`p-5 rounded-2xl text-sm leading-relaxed ${
                      isTeacher
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tr-none'
                        : 'bg-emerald-600 text-white font-medium rounded-tl-none shadow'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-xs">
                        {isTeacher ? 'المعلم الذكي (منصة هتاف العاصمي)' : 'أنت (الطالب)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${isTeacher ? 'text-slate-400' : 'text-emerald-200'}`}>
                          {msg.timestamp}
                        </span>
                        {isTeacher && (
                          <button
                            onClick={() => speakText(msg.text)}
                            className="text-slate-400 hover:text-emerald-600 transition"
                            title="استماع"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Attached 3D Interactive Model Banner */}
                  {isTeacher && msg.threeDModel && (
                    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 rounded-2xl border border-blue-500/40 shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-cyan-300 flex items-center justify-center font-black">
                            <Box className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                              شرح تفاعلي مجسم (3D Model)
                            </span>
                            <h4 className="text-xs font-black text-white">{msg.threeDModel.title}</h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-500/20 text-cyan-200 border border-cyan-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                          تفاعلي
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {msg.threeDModel.summary}
                      </p>

                      <button
                        onClick={() => setActive3DModal(msg.threeDModel!)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>فتح واستكشاف المجسم ثلاثي الأبعاد (3D)</span>
                      </button>
                    </div>
                  )}

                  {/* Concept Check Question Card */}
                  {isTeacher && msg.checkQuestion && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>سؤال التأكد من الفهم المباشر:</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{msg.checkQuestion.question}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.checkQuestion.options.map((opt, oIdx) => {
                          const userAns = userAnswers[msg.checkQuestion!.id];
                          const isAnswered = userAns !== undefined;
                          const isCorrect = userAns === msg.checkQuestion!.correctAnswer;

                          let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-100/50';
                          if (isAnswered) {
                            if (oIdx === msg.checkQuestion!.correctAnswer) {
                              btnClass = 'bg-emerald-600 text-white font-bold border-emerald-600';
                            } else if (userAns === oIdx) {
                              btnClass = 'bg-red-100 text-red-900 border-red-300 font-bold';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleAnswerCheckQuestion(msg.checkQuestion!.id, oIdx)}
                              className={`p-2.5 text-right rounded-xl border text-xs transition flex items-center justify-between ${btnClass}`}
                            >
                              <span>{opt}</span>
                              {isAnswered && oIdx === msg.checkQuestion!.correctAnswer && (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {userAnswers[msg.checkQuestion.id] !== undefined && (
                        <div className="p-2.5 rounded-xl bg-white text-xs text-slate-800 border border-emerald-200 font-medium">
                          💡 <span className="font-bold">التوضيح:</span> {msg.checkQuestion.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attached Homework Citation Card */}
                  {msg.homeworkCitation && (
                    <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-4 rounded-2xl space-y-3 border border-emerald-500/40 shadow-lg">
                      <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black text-amber-300">{msg.homeworkCitation.title}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                          {msg.homeworkCitation.sourceType === 'curriculum' ? '📚 من المقرر الوزاري' : '🌐 موضوع خارجي'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 space-y-1">
                        {msg.homeworkCitation.bookName && (
                          <p className="text-[11px] font-semibold text-slate-300">
                            الكتاب: <span className="text-white">{msg.homeworkCitation.bookName}</span> | الدرس: <span className="text-emerald-300">{msg.homeworkCitation.lessonName}</span>
                          </p>
                        )}
                        {msg.homeworkCitation.externalTopic && (
                          <p className="text-[11px] font-semibold text-slate-300">
                            الموضوع الخارجي: <span className="text-emerald-300">{msg.homeworkCitation.externalTopic}</span> ({msg.homeworkCitation.subject})
                          </p>
                        )}
                        <p className="text-xs text-slate-200">{msg.homeworkCitation.description}</p>
                      </div>

                      {msg.homeworkCitation.questions && msg.homeworkCitation.questions.length > 0 && (
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">أسئلة الواجب المطلوب حلها:</span>
                          {msg.homeworkCitation.questions.map((q, qIdx) => (
                            <p key={qIdx} className="text-xs text-amber-100 font-medium">• {q}</p>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pt-1">
                        <span className="text-amber-300">⭐ الدرجة: {msg.homeworkCitation.totalPoints} درجات</span>
                        <span className="text-slate-400">📅 التسليم: {msg.homeworkCitation.dueDate}</span>
                      </div>
                    </div>
                  )}

                  {/* Suggested Prompts */}
                  {isTeacher && msg.suggestedPrompts && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestedPrompts.map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(promptText)}
                          className="bg-slate-100 hover:bg-emerald-100 hover:text-emerald-950 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
                        >
                          💬 {promptText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl me-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 shadow">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tr-none text-xs text-slate-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>المعلم الذكي يفكر ويصيغ لك الإجابة والسؤال التوجيهي...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowHomeworkModal(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-3 rounded-2xl text-xs flex items-center gap-1.5 border border-emerald-200 transition shrink-0"
            title="إضافة واجب دراسي (يدوي أو بالذكاء الاصطناعي)"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">إضافة واجب</span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اسأل المعلم الذكي أي سؤال في الدرس..."
            className="flex-1 bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-2xl text-white font-bold transition flex items-center justify-center shadow-md ${
              isLoading || !input.trim()
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Add Homework Modal */}
      <AddHomeworkModal
        isOpen={showHomeworkModal}
        onClose={() => setShowHomeworkModal(false)}
        onSubmitHomework={handleHomeworkSubmit}
        centralBooks={centralBooks}
      />

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
