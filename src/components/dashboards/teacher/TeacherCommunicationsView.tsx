import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, TeacherCommunication } from '../../../types';
import {
  fetchTeacherCommunications,
  sendTeacherCommunication,
  fetchTeacherStudents,
  DbStudent
} from '../../../lib/supabase';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  User,
  AlertTriangle,
  Bell,
  CheckCircle2,
  X,
  Loader2,
  Mail,
  MessageSquare
} from 'lucide-react';

interface TeacherCommunicationsViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  canMessageParents?: boolean;
}

export const TeacherCommunicationsView: React.FC<TeacherCommunicationsViewProps> = ({
  currentUser,
  currentSchool,
  canMessageParents = true
}) => {
  const [communications, setCommunications] = useState<TeacherCommunication[]>([]);
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [targetType, setTargetType] = useState<
    'class_announcement' | 'student_msg' | 'parent_msg' | 'homework_alert' | 'quiz_alert'
  >('class_announcement');
  const [gradeName, setGradeName] = useState<string>('الصف الثالث المتوسط');
  const [classroomName, setClassroomName] = useState<string>('3/أ');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [comms, fetchedStudents] = await Promise.all([
        fetchTeacherCommunications(schoolId, teacherId),
        fetchTeacherStudents(schoolId, teacherId)
      ]);

      if (comms && comms.length > 0) {
        setCommunications(comms);
      } else {
        // Fallback default comms
        setCommunications([
          {
            id: 'comm-1',
            schoolId,
            teacherId,
            teacherName,
            targetType: 'class_announcement',
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            title: 'تذكير: إحضار أدوات التجربة المعملية ليوم الأحد',
            content: 'نرجو من جميع الطلاب إحضار المعطف المعملي ودفتر التجارب لإجراء تجربة تفاعلات الأكسدة.',
            isUrgent: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'comm-2',
            schoolId,
            teacherId,
            teacherName,
            targetType: 'quiz_alert',
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            title: 'تنبيه موعد الاختبار القصير الثاني',
            content: 'سيعقد الاختبار القصير لمادة العلوم يوم الأربعاء القادم في الحصة الثالثة.',
            isUrgent: true,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      }

      if (fetchedStudents && fetchedStudents.length > 0) {
        setStudents(fetchedStudents);
        setSelectedStudentId(fetchedStudents[0].id);
      }
    } catch (err) {
      console.warn('Error loading comms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, teacherId]);

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !content.trim()) {
      setErrorMsg('يرجى ملء عنوان ونص الرسالة/الإعلان.');
      return;
    }

    let targetStudentName = '';
    if (targetType === 'student_msg' || targetType === 'parent_msg') {
      const st = students.find((s) => s.id === selectedStudentId);
      if (st) {
        targetStudentName = st.full_name;
      }
    }

    setIsSubmitting(true);
    try {
      const created = await sendTeacherCommunication({
        schoolId,
        teacherId,
        teacherName,
        targetType,
        gradeName,
        classroomName,
        targetId: selectedStudentId || undefined,
        targetName: targetStudentName || undefined,
        title: title.trim(),
        content: content.trim(),
        isUrgent
      });

      setCommunications((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setTitle('');
      setContent('');
      setIsUrgent(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال التواصل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetBadge = (type: string) => {
    switch (type) {
      case 'class_announcement':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">إعلان فصلي 📢</span>;
      case 'student_msg':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">رسالة لطالب 🧑‍🎓</span>;
      case 'parent_msg':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">رسالة لولي أمر 👨‍👦</span>;
      case 'homework_alert':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">تنبيه واجب 📚</span>;
      case 'quiz_alert':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">تنبيه اختبار ⏱️</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">تواصل</span>;
    }
  };

  return (
    <div className="space-y-6" id="teacher-comms-section">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-black text-slate-900">التواصل المدرسي والإعلانات الصفية</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              {communications.length} رسالة وإعلان
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إرسال إعلانات الشعب، رسائل التوجيه الفردية للطلاب، ومراسلة أولياء الأمور عبر المنصة المعتمدة.
          </p>
        </div>

        {canMessageParents && (
          <button
            id="btn-create-comm"
            onClick={() => {
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ إرسال إعلان أو رسالة جديدة</span>
          </button>
        )}
      </div>

      {/* Communications Feed */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold">جاري تحميل سجل التواصل...</p>
        </div>
      ) : communications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد رسائل أو إعلانات مرسلة</h4>
          <p className="text-xs text-slate-400">يمكنك الضغط على الزر أعلاه لإرسال أول إعلان لفصولك.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => (
            <div
              key={comm.id}
              className={`bg-white rounded-3xl p-5 border shadow-sm transition flex flex-col justify-between space-y-3 ${
                comm.isUrgent ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTargetBadge(comm.targetType)}
                  {comm.isUrgent && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      عاجل
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(comm.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-600">
                  {comm.gradeName} — شعبة {comm.classroomName}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{comm.title}</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {comm.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>المعلم المرسل: {comm.teacherName}</span>
                {comm.targetName && <span className="font-bold text-teal-700">المستلم: {comm.targetName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SEND COMMUNICATION */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">إرسال إعلان أو رسالة</h3>
                  <p className="text-[11px] text-slate-500">توثيق مباشر في السجل المدرسي الرسمي</p>
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

            <form onSubmit={handleSendSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نوع التواصل المستهدف</label>
                <select
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                >
                  <option value="class_announcement">إعلان عام لجميع طلاب الفصل 📢</option>
                  <option value="student_msg">رسالة خاصة لطالب معين 🧑‍🎓</option>
                  <option value="parent_msg">رسالة لولي أمر الطالب 👨‍👦</option>
                  <option value="homework_alert">تنبيه واجب وموعد تسليم 📚</option>
                  <option value="quiz_alert">تنبيه موعد اختبار ⏱️</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              {(targetType === 'student_msg' || targetType === 'parent_msg') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    اختر الطالب المعني <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    required
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.student_number || 'STD'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عنوان الإعلان / الموضوع <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تعليمات الاختبار الشفوي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  نص الرسالة / الإعلان <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب التوجيهات أو الرسالة هنا..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <label className="flex items-center gap-2 text-xs font-bold text-rose-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>تمييز كإشعار عاجل ذو أولوية قصوى 🚨</span>
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال فوري</span>
                    </>
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
