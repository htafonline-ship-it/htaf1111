import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, StudentNote, StudentNoteType } from '../../../types';
import {
  fetchStudentNotes,
  addStudentNote,
  deleteStudentNote,
  fetchTeacherStudents,
  DbStudent
} from '../../../lib/supabase';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  User,
  GraduationCap,
  X,
  Loader2,
  Tag
} from 'lucide-react';

interface TeacherNotesViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  canAddNotes?: boolean;
}

export const TeacherNotesView: React.FC<TeacherNotesViewProps> = ({
  currentUser,
  currentSchool,
  canAddNotes = true
}) => {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [noteType, setNoteType] = useState<StudentNoteType>('ملاحظة دراسية');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteSubject, setNoteSubject] = useState<string>('العلوم');
  const [noteImportance, setNoteImportance] = useState<'عادي' | 'هام' | 'عاجل'>('عادي');
  const [isParentVisible, setIsParentVisible] = useState<boolean>(true);
  const [isStudentVisible, setIsStudentVisible] = useState<boolean>(true);
  const [isAdminOnly, setIsAdminOnly] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedNotes, fetchedStudents] = await Promise.all([
        fetchStudentNotes(schoolId, undefined, teacherId),
        fetchTeacherStudents(schoolId, teacherId)
      ]);

      if (fetchedStudents && fetchedStudents.length > 0) {
        setStudents(fetchedStudents);
        if (!selectedStudentId) {
          setSelectedStudentId(fetchedStudents[0].id);
        }
      }

      if (fetchedNotes && fetchedNotes.length > 0) {
        setNotes(fetchedNotes);
      } else {
        // Fallback default notes
        setNotes([
          {
            id: 'note-1',
            schoolId,
            studentId: 'std-101',
            studentName: 'عبدالله محمد الشمري',
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            noteType: 'تميز',
            title: 'مشاركة ممتازة في نشاط الجدول الدوري',
            content: 'أظهر الطالب فهماً عميقاً لخصائص الفلزات واللافلزات وشارك بفاعلية في التجارب المعملية.',
            subjectName: 'العلوم',
            importanceLevel: 'عادي',
            isParentVisible: true,
            isStudentVisible: true,
            isAdminOnly: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'note-2',
            schoolId,
            studentId: 'std-102',
            studentName: 'سلطان فهد القحطاني',
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            noteType: 'واجب غير مكتمل',
            title: 'عدم تسليم تقرير تجربة الأحماض والقواعد',
            content: 'تأخر الطالب في تسليم التقرير الأسبوعي المطلوب ليوم الأحد. نأمل المتابعة المنزلية.',
            subjectName: 'العلوم',
            importanceLevel: 'هام',
            isParentVisible: true,
            isStudentVisible: true,
            isAdminOnly: false,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'note-3',
            schoolId,
            studentId: 'std-103',
            studentName: 'خالد عبدالعزيز العتيبي',
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/ب',
            noteType: 'تحسن',
            title: 'تحسن ملحوظ في درجات الاختبار القصير',
            content: 'حصل على الدرجة الكاملة 10/10 في اختبار التفاعلات الكيميائية بعد جلسات المراجعة.',
            subjectName: 'العلوم',
            importanceLevel: 'عادي',
            isParentVisible: true,
            isStudentVisible: true,
            isAdminOnly: false,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Error loading notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, teacherId]);

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetStudent = students.find((s) => s.id === selectedStudentId);
    if (!targetStudent) {
      setErrorMsg('يرجى اختيار الطالب المعني بالملاحظة.');
      return;
    }

    if (!noteTitle.trim() || !noteContent.trim()) {
      setErrorMsg('يرجى ملء عنوان الملاحظة وتفاصيلها.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addStudentNote({
        schoolId,
        studentId: targetStudent.id,
        studentName: targetStudent.full_name,
        teacherId,
        teacherName,
        gradeName: targetStudent.grade_name,
        classroomName: targetStudent.classroom_name,
        noteType,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        subjectName: noteSubject,
        importanceLevel: noteImportance,
        isParentVisible: isAdminOnly ? false : isParentVisible,
        isStudentVisible: isAdminOnly ? false : isStudentVisible,
        isAdminOnly
      });

      setNotes((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNoteTitle('');
      setNoteContent('');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الملاحظة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة من سجل الطالب؟')) return;
    try {
      await deleteStudentNote(noteId, schoolId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || n.noteType === typeFilter;
    const matchesImportance = importanceFilter === 'all' || n.importanceLevel === importanceFilter;

    return matchesSearch && matchesType && matchesImportance;
  });

  const getBadgeColorForType = (type: StudentNoteType) => {
    switch (type) {
      case 'تميز':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'تحسن':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'واجب غير مكتمل':
      case 'تأخر':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ضعف في مادة':
      case 'سلوك':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6" id="teacher-notes-section">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-black text-slate-900">سجل وملاحظات الطلاب الأكاديمية والسلوكية</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {notes.length} ملاحظة مسجلة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            توثيق التميز، التحسن الأكاديمي، الواجبات غير المكتملة، السلوك، مع التحكم الكامل في إظهارها لولي الأمر أو الطالب.
          </p>
        </div>

        {canAddNotes && (
          <button
            id="btn-add-note-main"
            onClick={() => {
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة ملاحظة جديدة لطالب</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الطالب أو نص الملاحظة..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">جميع أنواع الملاحظات</option>
            <option value="تميز">تميز وتفوق ⭐</option>
            <option value="تحسن">تحسن أكاديمي 📈</option>
            <option value="ملاحظة دراسية">ملاحظة دراسية 📚</option>
            <option value="واجب غير مكتمل">واجب غير مكتمل ⚠️</option>
            <option value="ضعف في مادة">ضعف في مادة 📉</option>
            <option value="سلوك">سلوك وانضباط 👤</option>
            <option value="حضور">حضور وغياب ⏱️</option>
          </select>
        </div>

        <div>
          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">جميع مستويات الأهمية</option>
            <option value="عادي">عادي</option>
            <option value="هام">هام</option>
            <option value="عاجل">عاجل 🚨</option>
          </select>
        </div>
      </div>

      {/* Notes Cards List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold">جاري تحميل سجل الملاحظات...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد ملاحظات مطابقة لمعايير البحث</h4>
          <p className="text-xs text-slate-400">يمكنك الضغط على "+ إضافة ملاحظة جديدة" لتدوين أول ملاحظة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 transition flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getBadgeColorForType(
                        note.noteType
                      )}`}
                    >
                      {note.noteType}
                    </span>
                    {note.importanceLevel === 'عاجل' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        عاجل
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(note.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                {/* Title & Student */}
                <div className="mt-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{note.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-bold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{note.studentName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({note.gradeName} - {note.classroomName})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2 leading-relaxed">
                  {note.content}
                </p>
              </div>

              {/* Footer / Privacy Badges & Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-2 flex-wrap">
                  {note.isParentVisible && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px]">
                      ✓ ولي الأمر
                    </span>
                  )}
                  {note.isStudentVisible && (
                    <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold text-[10px]">
                      ✓ الطالب
                    </span>
                  )}
                  {note.isAdminOnly && (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> سرية للإدارة
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="حذف الملاحظة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD STUDENT NOTE */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">إضافة ملاحظة جديدة للطالب</h3>
                  <p className="text-[11px] text-slate-500">حفظ فوري في السجل الأكاديمي</p>
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

            <form onSubmit={handleAddNoteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اختر الطالب من الفصول المسندة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} — {st.grade_name} ({st.classroom_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نوع الملاحظة</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as StudentNoteType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="ملاحظة دراسية">ملاحظة دراسية 📚</option>
                    <option value="تميز">تميز وتفوق ⭐</option>
                    <option value="تحسن">تحسن أكاديمي 📈</option>
                    <option value="واجب غير مكتمل">واجب غير مكتمل ⚠️</option>
                    <option value="ضعف في مادة">ضعف في مادة 📉</option>
                    <option value="سلوك">سلوك وانضباط 👤</option>
                    <option value="حضور">حضور وغياب ⏱️</option>
                    <option value="تأخر">تأخر صباحي ⏰</option>
                    <option value="ملاحظة عامة">ملاحظة عامة 📝</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المادة المرتبطة</label>
                  <input
                    type="text"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                    placeholder="العلوم"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الملاحظة</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="مثال: إتقان مفاهيم الطاقة والحرارة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">تفاصيل الملاحظة</label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="اكتب التوصيات والتفاصيل للمعلم وولي الأمر..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">مستوى الأهمية</label>
                <div className="flex items-center gap-3">
                  {(['عادي', 'هام', 'عاجل'] as const).map((imp) => (
                    <label key={imp} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="importance_main"
                        value={imp}
                        checked={noteImportance === imp}
                        onChange={() => setNoteImportance(imp)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>{imp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-800">خيارات الرؤية والمشاركة:</div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isParentVisible}
                      onChange={(e) => setIsParentVisible(e.target.checked)}
                      disabled={isAdminOnly}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>إتاحة المشاهدة لولي الأمر عبر المنصة</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStudentVisible}
                      onChange={(e) => setIsStudentVisible(e.target.checked)}
                      disabled={isAdminOnly}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>إتاحة المشاهدة للطالب في لوحته</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-rose-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAdminOnly}
                      onChange={(e) => {
                        setIsAdminOnly(e.target.checked);
                        if (e.target.checked) {
                          setIsParentVisible(false);
                          setIsStudentVisible(false);
                        }
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>خاصة بالإدارة المدرسية والإرشاد الطلابي فقط</span>
                  </label>
                </div>
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ الملاحظة</span>
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
