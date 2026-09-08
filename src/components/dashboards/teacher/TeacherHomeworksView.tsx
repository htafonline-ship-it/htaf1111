import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, HomeworkAssignment } from '../../../types';
import {
  fetchTeacherStudents,
  DbStudent,
  fetchHomeworkAssignments,
  createHomeworkAssignment
} from '../../../lib/supabase';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Award,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileSpreadsheet,
  Users,
  Search,
  BookMarked
} from 'lucide-react';

interface TeacherHomeworksViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  homeworks?: HomeworkAssignment[];
  onAddHomework?: (hw: any) => void;
  canCreateHomework?: boolean;
}

export const TeacherHomeworksView: React.FC<TeacherHomeworksViewProps> = ({
  currentUser,
  currentSchool,
  homeworks: initialHomeworks = [],
  onAddHomework,
  canCreateHomework = true
}) => {
  const [homeworkList, setHomeworkList] = useState<HomeworkAssignment[]>(initialHomeworks);
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form States
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('العلوم');
  const [gradeLevel, setGradeLevel] = useState<string>('الصف الثالث المتوسط');
  const [targetClassroom, setTargetClassroom] = useState<string>('3/أ');
  const [textbookPage, setTextbookPage] = useState<string>('45');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 259200000).toISOString().split('T')[0]
  );
  const [totalPoints, setTotalPoints] = useState<number>(5);
  const [description, setDescription] = useState<string>('');

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedHw, fetchedStudents] = await Promise.all([
        fetchHomeworkAssignments(schoolId),
        fetchTeacherStudents(schoolId, teacherId)
      ]);

      if (fetchedHw && fetchedHw.length > 0) {
        setHomeworkList(fetchedHw);
      }
      if (fetchedStudents && fetchedStudents.length > 0) {
        setStudents(fetchedStudents);
      }
    } catch (err) {
      console.warn('Error loading homeworks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, teacherId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('يرجى إدخال عنوان الواجب.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newHw = await createHomeworkAssignment({
        school_id: schoolId,
        teacher_id: teacherId,
        title: title.trim(),
        subject,
        grade_level: gradeLevel,
        due_date: dueDate,
        total_points: totalPoints,
        description: `الصفحة: ${textbookPage} | ${description}`.trim()
      });

      if (newHw) {
        setHomeworkList((prev) => [newHw, ...prev]);
        if (onAddHomework) onAddHomework(newHw);
      }
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء الواجب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList = homeworkList.filter(
    (h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="teacher-homeworks-section">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-black text-slate-900">سجل الواجبات والمهام الدراسية</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {homeworkList.length} واجب
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إسناد الواجبات المدرسية للشعب المحددة، تحديد صفحات الكتاب، ورصد التسليمات والدرجات.
          </p>
        </div>

        {canCreateHomework && (
          <button
            id="btn-create-homework"
            onClick={() => {
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ إسناد واجب جديد للفصل</span>
          </button>
        )}
      </div>

      {/* Homework List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold">جاري تحميل الواجبات...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <BookMarked className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد واجبات مسندة حالياً</h4>
          <p className="text-xs text-slate-400">اضغط على "+ إسناد واجب جديد" لإرسال التكليف للطلاب.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((hw) => (
            <div
              key={hw.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {hw.subject} — {hw.gradeLevel}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    تسليم: {hw.dueDate}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm mt-2">{hw.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{hw.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  ⭐ الدرجة: {hw.totalPoints} درجات
                </span>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{hw.submissions?.length || 0} تم التسليم</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE HOMEWORK */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">إسناد واجب جديد للفصل</h3>
                  <p className="text-[11px] text-slate-500">حفظ مباشر في Supabase وإشعار الطلاب</p>
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

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عنوان الواجب <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: حل تدريبات الحركة والقوة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المادة</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الصف</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                    <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
                    <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الشعبة المستهدفة</label>
                  <select
                    value={targetClassroom}
                    onChange={(e) => setTargetClassroom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="3/أ">شعبة 3/أ</option>
                    <option value="3/ب">شعبة 3/ب</option>
                    <option value="3/ج">شعبة 3/ج</option>
                    <option value="all">جميع الشعب</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم صفحة الكتاب</label>
                  <input
                    type="text"
                    value={textbookPage}
                    onChange={(e) => setTextbookPage(e.target.value)}
                    placeholder="مثال: ص 42"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ التسليم الأخير</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">درجة الواجب</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">التعليمات والتفاصيل</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب أرقام المسائل أو التوجيهات الخاصة بالحل..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري النشر...</span>
                    </>
                  ) : (
                    <span>نشر الواجب للطلاب</span>
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
