import React, { useState } from 'react';
import { CurriculumBook, CurriculumUnit, CurriculumLesson } from '../types';
import {
  Sparkles,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Plus,
  BookOpen,
  FileText,
  Layers,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';

interface BookStructureReviewModalProps {
  isOpen: boolean;
  bookTitle: string;
  subjectName: string;
  gradeName: string;
  units: CurriculumUnit[];
  onClose: () => void;
  onApproveStructure: (approvedUnits: CurriculumUnit[]) => void;
}

export const BookStructureReviewModal: React.FC<BookStructureReviewModalProps> = ({
  isOpen,
  bookTitle,
  subjectName,
  gradeName,
  units: initialUnits,
  onClose,
  onApproveStructure
}) => {
  if (!isOpen) return null;

  const [units, setUnits] = useState<CurriculumUnit[]>(initialUnits || []);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPageStart, setEditPageStart] = useState<number>(1);
  const [editPageEnd, setEditPageEnd] = useState<number>(10);
  const [isSaved, setIsSaved] = useState(false);

  // Flatten all lessons across units for total stats
  const totalLessons = units.reduce(
    (acc, u) => acc + u.chapters.reduce((cAcc, ch) => cAcc + (ch.lessons?.length || 0), 0),
    0
  );

  const totalPages = units.reduce((acc, u) => {
    let maxPage = acc;
    u.chapters.forEach((ch) => {
      ch.lessons?.forEach((l) => {
        if (l.pageEnd && l.pageEnd > maxPage) maxPage = l.pageEnd;
      });
    });
    return maxPage;
  }, 0);

  const handleStartEditLesson = (lesson: CurriculumLesson) => {
    setEditingLessonId(lesson.id);
    setEditTitle(lesson.title);
    setEditPageStart(lesson.pageStart || 1);
    setEditPageEnd(lesson.pageEnd || 10);
  };

  const handleSaveLessonEdit = (unitId: string, chapterId: string, lessonId: string) => {
    setUnits((prevUnits) =>
      prevUnits.map((unit) => {
        if (unit.id !== unitId) return unit;
        return {
          ...unit,
          chapters: unit.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            return {
              ...ch,
              lessons: ch.lessons.map((les) => {
                if (les.id !== lessonId) return les;
                return {
                  ...les,
                  title: editTitle,
                  pageStart: editPageStart,
                  pageEnd: editPageEnd
                };
              })
            };
          })
        };
      })
    );
    setEditingLessonId(null);
  };

  const handleDeleteLesson = (unitId: string, chapterId: string, lessonId: string) => {
    setUnits((prevUnits) =>
      prevUnits.map((unit) => {
        if (unit.id !== unitId) return unit;
        return {
          ...unit,
          chapters: unit.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            return {
              ...ch,
              lessons: ch.lessons.filter((l) => l.id !== lessonId)
            };
          })
        };
      })
    );
  };

  const handleConfirmAndApprove = () => {
    onApproveStructure(units);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full my-8 space-y-6 shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-500/20 text-purple-300 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  مراجعة واعتماد الهيكل بالذكاء الاصطناعي
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {gradeName}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">{bookTitle}</h3>
              <p className="text-xs text-slate-400">مادة: {subjectName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <div className="border-l border-slate-700 pl-3">
            <span className="text-[11px] text-slate-400 font-bold block">عدد الوحدات الدراسية</span>
            <span className="text-lg font-black text-amber-400">{units.length} وحدات</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي الفصول والدروس</span>
            <span className="text-lg font-black text-emerald-400">{totalLessons} درساً مهارياً</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي أوراق صفحات الكتاب</span>
            <span className="text-lg font-black text-cyan-400">{totalPages || 85} صفحة</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">حالة التدقيق</span>
            <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              جاهز للاعتماد
            </span>
          </div>
        </div>

        {/* Review Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>جدول الهيكل التنظيمي المستخرج للوحدات والدروس وأرقام الصفحات:</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              يمكنك تعديل أرقام الصفحات أو عناوين الدروس مباشرة قبل الحفظ.
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl max-h-96 overflow-y-auto custom-scrollbar shadow-inner">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-300 font-black sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="p-3">الوحدة</th>
                  <th className="p-3">الفصل</th>
                  <th className="p-3">اسم الدرس المعتمد</th>
                  <th className="p-3 text-center">أرقام الصفحات (من - إلى)</th>
                  <th className="p-3">المحاور والمواضيع المستهدفة</th>
                  <th className="p-3 text-center">التعديل والإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-bold text-slate-200">
                {units.map((unit) =>
                  unit.chapters.map((chapter) =>
                    chapter.lessons.map((lesson) => {
                      const isEditing = editingLessonId === lesson.id;

                      return (
                        <tr key={lesson.id} className="hover:bg-slate-800/50 transition">
                          <td className="p-3 font-black text-amber-400">
                            {unit.title}
                          </td>
                          <td className="p-3 text-slate-300 font-bold">{chapter.title}</td>
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-slate-950 border border-emerald-500 text-emerald-300 rounded px-2 py-1 text-xs font-bold w-full outline-none"
                              />
                            ) : (
                              <span className="font-extrabold text-white">{lesson.title}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editPageStart}
                                  onChange={(e) => setEditPageStart(Number(e.target.value))}
                                  className="w-14 bg-slate-950 border border-emerald-500 text-center rounded px-1 py-1 text-xs font-mono font-bold text-emerald-300"
                                />
                                <span>-</span>
                                <input
                                  type="number"
                                  value={editPageEnd}
                                  onChange={(e) => setEditPageEnd(Number(e.target.value))}
                                  className="w-14 bg-slate-950 border border-emerald-500 text-center rounded px-1 py-1 text-xs font-mono font-bold text-emerald-300"
                                />
                              </div>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md font-mono text-[11px] font-black inline-block">
                                ص {lesson.pageStart || 1} - ص {lesson.pageEnd || 10}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {lesson.topics && lesson.topics.length > 0
                              ? lesson.topics.join(' ، ')
                              : 'مفاهيم الوحدة والدرس الأساسية'}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveLessonEdit(unit.id, chapter.id, lesson.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg font-bold transition flex items-center gap-1 mx-auto"
                                title="حفظ التعديل"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>حفظ</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleStartEditLesson(lesson)}
                                  className="text-slate-400 hover:text-amber-400 p-1 transition"
                                  title="تعديل الدرس أوالصفحات"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(unit.id, chapter.id, lesson.id)}
                                  className="text-slate-400 hover:text-rose-400 p-1 transition"
                                  title="حذف الدرس"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>سيتم مزامنة واعتماد هذا الهيكل التنظيمي فوراً لكافة الطلاب والمعلمين في المادة.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-5 py-2.5 rounded-xl transition w-full sm:w-auto"
            >
              إلغاء
            </button>

            <button
              onClick={handleConfirmAndApprove}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition w-full sm:w-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaved ? 'تم الاعتماد بنجاح!' : 'اعتماد الهيكل التنظيمي المراجع'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
