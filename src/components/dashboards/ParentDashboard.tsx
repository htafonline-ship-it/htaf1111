import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  AuthUser,
  SchoolTenant,
  LinkedChild,
  AttendanceRecord,
  HomeworkAssignment,
  StudentNote,
  ClassSchedulePeriod
} from '../../types';
import {
  fetchParentLinkedStudents,
  fetchStudentAttendanceForChild,
  fetchStudentHomeworkForChild,
  fetchStudentNotesForChild,
  fetchClassSchedules,
  fetchParentMeetingRequests
} from '../../lib/supabase';
import {
  Users,
  Award,
  Clock,
  Sliders,
  ShieldCheck,
  Send,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  BookOpen,
  UserPlus,
  RefreshCw,
  Phone,
  MessageCircle,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { ParentLinkChildrenGate } from '../parent/ParentLinkChildrenGate';
import { ParentMeetingModal } from '../parent/ParentMeetingModal';
import { AchievementsPortfolioView } from '../achievements/AchievementsPortfolioView';

interface ParentDashboardProps {
  profile?: StudentProfile;
  onUpdateScreenTime?: (newLimitMinutes: number) => void;
  currentUser?: AuthUser | null;
  currentSchool?: SchoolTenant | null;
  onOpenLinkChildrenModal?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  profile,
  onUpdateScreenTime,
  currentUser = null,
  currentSchool = null
}) => {
  // Linked Children State
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(true);
  const [showLinkGate, setShowLinkGate] = useState<boolean>(false);

  // Active Child Real Data States
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [homeworkList, setHomeworkList] = useState<HomeworkAssignment[]>([]);
  const [notesList, setNotesList] = useState<StudentNote[]>([]);
  const [scheduleList, setScheduleList] = useState<ClassSchedulePeriod[]>([]);
  const [isLoadingChildData, setIsLoadingChildData] = useState<boolean>(false);

  // Screen Time & AI Daily Limit State
  const [screenLimit, setScreenLimit] = useState<number>(120);

  // Meeting Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState<boolean>(false);

  // Direct Message State
  const [counselorMsg, setCounselorMsg] = useState('');
  const [counselorMsgSent, setCounselorMsgSent] = useState(false);

  // Active child
  const selectedChild = children[selectedChildIndex] || null;

  // Load parent's linked children from Supabase
  const loadLinkedChildren = async () => {
    if (!currentUser?.id) {
      setIsLoadingChildren(false);
      return;
    }

    setIsLoadingChildren(true);
    try {
      const list = await fetchParentLinkedStudents(currentUser.id, currentUser.email);
      setChildren(list);
      if (list.length > 0 && selectedChildIndex >= list.length) {
        setSelectedChildIndex(0);
      }
    } catch (err) {
      console.warn('Error loading parent linked students:', err);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  useEffect(() => {
    loadLinkedChildren();
  }, [currentUser?.id]);

  // Load real data for the currently selected child
  useEffect(() => {
    if (!selectedChild) return;

    let isMounted = true;
    const loadChildData = async () => {
      setIsLoadingChildData(true);
      try {
        const [att, hw, notes, sched] = await Promise.all([
          fetchStudentAttendanceForChild(selectedChild.schoolId, selectedChild.studentId),
          fetchStudentHomeworkForChild(selectedChild.schoolId, selectedChild.gradeName),
          fetchStudentNotesForChild(selectedChild.schoolId, selectedChild.studentId),
          fetchClassSchedules(selectedChild.schoolId, undefined, selectedChild.gradeName, selectedChild.classroomName)
        ]);

        if (isMounted) {
          setAttendanceRecords(att);
          setHomeworkList(hw);
          setNotesList(notes);
          setScheduleList(sched);
        }
      } catch (err) {
        console.warn('Error loading real child data:', err);
      } finally {
        if (isMounted) setIsLoadingChildData(false);
      }
    };

    loadChildData();
    return () => {
      isMounted = false;
    };
  }, [selectedChild?.studentId, selectedChild?.schoolId]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScreenLimit(val);
    if (onUpdateScreenTime) {
      onUpdateScreenTime(val);
    }
  };

  const handleSendCounselorMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselorMsg.trim()) return;
    setCounselorMsgSent(true);
    setCounselorMsg('');
    setTimeout(() => setCounselorMsgSent(false), 5000);
  };

  // If parent has clicked "Add Child" or has 0 children after loading
  if (!isLoadingChildren && (children.length === 0 || showLinkGate)) {
    return (
      <ParentLinkChildrenGate
        currentUser={currentUser || { id: 'temp', name: 'ولي أمر', role: 'parent' }}
        currentSchool={currentSchool}
        onChildLinkedSuccess={() => {
          setShowLinkGate(false);
          loadLinkedChildren();
        }}
        onCancel={children.length > 0 ? () => setShowLinkGate(false) : undefined}
      />
    );
  }

  // Attendance statistics calculation
  const totalAttendanceDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentDays = attendanceRecords.filter((a) => a.status === 'absent' || a.status === 'unexcused_absence').length;
  const lateDays = attendanceRecords.filter((a) => a.status === 'late').length;
  const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

  // School WhatsApp URL
  const schoolPhoneClean = (selectedChild?.schoolPhone || '').replace(/\D/g, '');
  const schoolWhatsAppUrl = schoolPhoneClean
    ? `https://wa.me/${schoolPhoneClean.startsWith('0') ? '966' + schoolPhoneClean.slice(1) : schoolPhoneClean}`
    : null;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
            👨‍👩‍👧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">لوحة متابعة ولي الأمر</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                متابعة معتمدة
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              متابعة الأداء الأكاديمي، الحضور والغياب، الواجبات، والجدول المدرسي مع التواصل المباشر مع المدرسة.
            </p>
          </div>
        </div>

        {/* Action: Add another child */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLinkGate(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>ربط ابن/ابنة إضافي</span>
          </button>
        </div>
      </div>

      {/* Children Tabs / Switcher */}
      {children.length > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 px-2 shrink-0">الأبناء المرتبطون:</span>
          <div className="flex items-center gap-2">
            {children.map((child, idx) => {
              const isSelected = idx === selectedChildIndex;
              return (
                <button
                  key={child.studentId}
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition shrink-0 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-base">{child.avatar || '👨‍🎓'}</span>
                  <span>{child.fullName}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {child.gradeName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Child Details Overview Card */}
      {selectedChild && (
        <div className="bg-gradient-to-l from-emerald-50 via-teal-50 to-white rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl font-black flex items-center justify-center shadow">
              {selectedChild.avatar || '👨‍🎓'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">{selectedChild.fullName}</h3>
                <span className="text-[11px] font-bold bg-emerald-200/70 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  رقم الهوية: {selectedChild.studentNumber}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                <span>المدرسة: <strong className="text-slate-900">{selectedChild.schoolName}</strong></span>
                <span>•</span>
                <span>الصف والفصل: <strong className="text-slate-900">{selectedChild.gradeName} ({selectedChild.classroomName})</strong></span>
                <span>•</span>
                <span>العام الدراسي: <strong className="text-slate-900">{selectedChild.academicYear || '1447 - 1448 هـ'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsMeetingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Calendar className="w-4 h-4" />
              <span>طلب لقاء / استفسار</span>
            </button>

            {schoolWhatsAppUrl && (
              <a
                href={schoolWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب المدرسة</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Academic, Attendance & Schedule (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Attendance Stats Cards */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                سجل الانضباط المدرسي والحضور
              </h3>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
                نسبة الحضور: {attendanceRate}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-center space-y-1">
                <span className="text-[11px] font-bold text-emerald-800">أيام الحضور</span>
                <div className="text-2xl font-black text-emerald-900">{presentDays}</div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-center space-y-1">
                <span className="text-[11px] font-bold text-rose-800">أيام الغياب</span>
                <div className="text-2xl font-black text-rose-900">{absentDays}</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 text-center space-y-1">
                <span className="text-[11px] font-bold text-amber-800">مرات التأخير</span>
                <div className="text-2xl font-black text-amber-900">{lateDays}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-600">إجمالي الأيام المسجلة</span>
                <div className="text-2xl font-black text-slate-900">{totalAttendanceDays}</div>
              </div>
            </div>

            {/* Attendance Log List */}
            {attendanceRecords.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 block">آخر الأيام المسجلة:</span>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {attendanceRecords.slice(0, 5).map((rec) => (
                    <div key={rec.id} className="py-2 flex items-center justify-between">
                      <div className="text-slate-700">
                        <span className="font-bold">{rec.date}</span>
                        {rec.notes && <span className="text-slate-400 mr-2">({rec.notes})</span>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status === 'present' ? 'حاضر' : rec.status === 'late' ? 'متأخر' : 'غائب'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Homework & Assignments */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                الواجبات والمهام المدرسية المسندة
              </h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {homeworkList.length} مهام
              </span>
            </div>

            {homeworkList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                لا توجد واجبات معلقة حالياً لهذا الصف.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {homeworkList.map((hw) => (
                  <div key={hw.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-xs">{hw.title}</div>
                      <div className="text-[11px] text-slate-500">
                        المادة: <strong className="text-slate-700">{hw.subject}</strong> • موعد التسليم: {hw.dueDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {hw.totalPoints} درجات
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          hw.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : hw.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {hw.status === 'graded' ? 'تم التصحيح' : hw.status === 'submitted' ? 'تم التسليم' : 'قيد الحل'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher & Counselor Notes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              الملاحظات السلوكية والتحفيزية من المعلمين
            </h3>

            {notesList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                لا توجد ملاحظات سلوكية أو إرشادية مسجلة حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {notesList.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          n.noteType === 'positive'
                            ? 'bg-emerald-100 text-emerald-800'
                            : n.noteType === 'academic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {n.noteType === 'positive' ? 'سلوك متميز' : n.noteType === 'academic' ? 'ملاحظة أكاديمية' : 'تنبيه'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{n.content}</p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>المعلم: {n.teacherName || 'معلم الصف'} {n.subjectName ? `(${n.subjectName})` : ''}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Screen Time & AI Usage Manager */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                إدارة وقت الاستخدام والحد اليومي للذكاء الاصطناعي
              </h3>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
                تحكم آمن وذكائي
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Screen Limit Slider */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>الحد اليومي المسموح لاستخدام المنصة:</span>
                  <span className="text-emerald-700 font-extrabold text-sm">{screenLimit} دقيقة</span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="240"
                  step="15"
                  value={screenLimit}
                  onChange={handleSliderChange}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>30 دقيقة</span>
                  <span>120 دقيقة (موصى به)</span>
                  <span>240 دقيقة</span>
                </div>
              </div>

              {/* Usage Stat Pill */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="text-xs font-bold text-slate-300">حالة المراقبة:</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">مفعلة بانتظام</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  تتم مراقبة محادثات الذكاء الاصطناعي وحجب أي محتوى غير لائق تلقائياً لضمان بيئة تعليمية آمنة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Communication & Class Schedule (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Meeting / Inquiry Button Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-emerald-700/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-400/30">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base">حجز موعد أو استفسار</h3>
            </div>
            <p className="text-xs text-slate-200">
              يمكنك طلب مقابلة حضورية بالمدرسة أو اتصال هاتفي أو لقاء مرئي مع المرشد الطلابي أو معلم المادة.
            </p>
            <button
              onClick={() => setIsMeetingModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-slate-100 transition shadow"
            >
              تقديم طلب مقابلة جديدة
            </button>
          </div>

          {/* Direct Message to Counselor */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              رسالة مباشرة للإرشاد الطلابي
            </h3>
            <p className="text-xs text-slate-500">
              اكتب رسالة مباشرة للموجه الطلابي لمتابعة حالة الطالب/ة وسيقوم بالتواصل معك عبر المنصة أو الهاتف.
            </p>

            <form onSubmit={handleSendCounselorMsg} className="space-y-3">
              <textarea
                rows={4}
                value={counselorMsg}
                onChange={(e) => setCounselorMsg(e.target.value)}
                placeholder="اكتب استفسارك أو ملاحظتك هنا..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>إرسال للموجه الطلابي</span>
              </button>

              {counselorMsgSent && (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl font-bold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم إرسال رسالتك بنجاح وسيتواصل معك الموجه الطلابي.</span>
                </div>
              )}
            </form>
          </div>

          {/* Weekly Class Schedule */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              الجدول الدراسي الأسبوعي
            </h3>

            {scheduleList.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                لم يتم رفع الحصص الدراسية لهذا الفصل بعد.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
                {scheduleList.slice(0, 7).map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{p.subject}</span>
                      <span className="text-[11px] text-slate-400 block">{p.dayOfWeek} • الحصة {p.periodNumber}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      {p.startTime} - {p.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Child Achievements & Honors Section */}
      {selectedChild && (
        <div className="pt-6 border-t border-slate-200">
          <AchievementsPortfolioView
            currentUser={
              currentUser || {
                id: 'parent_user',
                name: 'ولي أمر الطالب/ة ' + (selectedChild.fullName || ''),
                role: 'parent',
                email: ''
              }
            }
            currentSchool={currentSchool}
            defaultTab="school"
          />
        </div>
      )}

      {/* Meeting Modal */}
      {selectedChild && isMeetingModalOpen && (
        <ParentMeetingModal
          isOpen={isMeetingModalOpen}
          onClose={() => setIsMeetingModalOpen(false)}
          currentUser={currentUser || { id: 'temp', name: 'ولي الأمر', role: 'parent' }}
          child={selectedChild}
        />
      )}
    </div>
  );
};
