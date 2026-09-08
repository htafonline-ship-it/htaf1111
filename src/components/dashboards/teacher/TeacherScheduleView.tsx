import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, ClassSchedulePeriod, DayOfWeek } from '../../../types';
import {
  fetchClassSchedules,
  saveSchedulePeriod,
  updateSchedulePeriod,
  deleteSchedulePeriod,
  copyWeeklySchedule
} from '../../../lib/supabase';
import {
  Calendar,
  Clock,
  Plus,
  Copy,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  BookOpen,
  MapPin,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface TeacherScheduleViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  canManageSchedule?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  currentUser,
  currentSchool,
  canManageSchedule = true
}) => {
  const [schedules, setSchedules] = useState<ClassSchedulePeriod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<ClassSchedulePeriod | null>(null);

  // Form State
  const [gradeName, setGradeName] = useState<string>('الصف الثالث المتوسط');
  const [classroomName, setClassroomName] = useState<string>('3/أ');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('الأحد');
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [subjectName, setSubjectName] = useState<string>('العلوم');
  const [startTime, setStartTime] = useState<string>('07:30');
  const [endTime, setEndTime] = useState<string>('08:15');
  const [room, setRoom] = useState<string>('معمل العلوم 1');
  const [isRepeatedWeekly, setIsRepeatedWeekly] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copy Schedule Form
  const [sourceClass, setSourceClass] = useState<{ grade: string; class: string }>({
    grade: 'الصف الثالث المتوسط',
    class: '3/أ'
  });
  const [targetClass, setTargetClass] = useState<{ grade: string; class: string }>({
    grade: 'الصف الثالث المتوسط',
    class: '3/ب'
  });
  const [isCopying, setIsCopying] = useState<boolean>(false);

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClassSchedules(schoolId, teacherId);
      if (data && data.length > 0) {
        setSchedules(data);
      } else {
        // Default template schedule
        const defaultPeriods: ClassSchedulePeriod[] = [
          {
            id: 'p-1',
            schoolId,
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            dayOfWeek: 'الأحد',
            periodNumber: 1,
            subjectName: 'العلوم العامة',
            startTime: '07:30',
            endTime: '08:15',
            room: 'معمل العلوم 1',
            isRepeatedWeekly: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'p-2',
            schoolId,
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            dayOfWeek: 'الأحد',
            periodNumber: 3,
            subjectName: 'العلوم العامة',
            startTime: '09:15',
            endTime: '10:00',
            room: 'معمل العلوم 1',
            isRepeatedWeekly: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'p-3',
            schoolId,
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/ب',
            dayOfWeek: 'الإثنين',
            periodNumber: 2,
            subjectName: 'العلوم العامة',
            startTime: '08:20',
            endTime: '09:05',
            room: 'معمل الفيزياء',
            isRepeatedWeekly: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'p-4',
            schoolId,
            teacherId,
            teacherName,
            gradeName: 'الصف الأول الثانوي',
            classroomName: '1/أ',
            dayOfWeek: 'الثلاثاء',
            periodNumber: 4,
            subjectName: 'الأحياء والبيئة',
            startTime: '10:05',
            endTime: '10:50',
            room: 'معمل الأحياء',
            isRepeatedWeekly: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'p-5',
            schoolId,
            teacherId,
            teacherName,
            gradeName: 'الصف الثالث المتوسط',
            classroomName: '3/أ',
            dayOfWeek: 'الأربعاء',
            periodNumber: 2,
            subjectName: 'العلوم العامة',
            startTime: '08:20',
            endTime: '09:05',
            room: 'معمل العلوم 1',
            isRepeatedWeekly: true,
            createdAt: new Date().toISOString()
          }
        ];
        setSchedules(defaultPeriods);
      }
    } catch (err) {
      console.warn('Error loading schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [schoolId, teacherId]);

  const handleOpenAddModal = (periodNum?: number, day?: DayOfWeek) => {
    setEditingPeriod(null);
    if (periodNum) setPeriodNumber(periodNum);
    if (day) setDayOfWeek(day);
    setStatusMsg(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (period: ClassSchedulePeriod) => {
    setEditingPeriod(period);
    setGradeName(period.gradeName);
    setClassroomName(period.classroomName);
    setDayOfWeek(period.dayOfWeek);
    setPeriodNumber(period.periodNumber);
    setSubjectName(period.subjectName);
    setStartTime(period.startTime);
    setEndTime(period.endTime);
    setRoom(period.room || '');
    setIsRepeatedWeekly(period.isRepeatedWeekly);
    setStatusMsg(null);
    setIsAddModalOpen(true);
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصة من الجدول؟')) return;
    try {
      await deleteSchedulePeriod(periodId, schoolId);
      setSchedules((prev) => prev.filter((p) => p.id !== periodId));
    } catch (err) {
      console.error('Error deleting period:', err);
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      if (editingPeriod) {
        // Update
        await updateSchedulePeriod(editingPeriod.id, schoolId, {
          gradeName,
          classroomName,
          dayOfWeek,
          periodNumber,
          subjectName,
          startTime,
          endTime,
          room,
          isRepeatedWeekly
        });

        setSchedules((prev) =>
          prev.map((p) =>
            p.id === editingPeriod.id
              ? {
                  ...p,
                  gradeName,
                  classroomName,
                  dayOfWeek,
                  periodNumber,
                  subjectName,
                  startTime,
                  endTime,
                  room,
                  isRepeatedWeekly
                }
              : p
          )
        );
        setStatusMsg({ type: 'success', text: 'تم تحديث بيانات الحصة بنجاح.' });
      } else {
        // Create
        const created = await saveSchedulePeriod({
          schoolId,
          teacherId,
          teacherName,
          gradeName,
          classroomName,
          dayOfWeek,
          periodNumber,
          subjectName,
          startTime,
          endTime,
          room,
          isRepeatedWeekly
        });

        setSchedules((prev) => [...prev, created]);
        setStatusMsg({ type: 'success', text: 'تم إضافة الحصة للجدول بنجاح.' });
      }

      setTimeout(() => {
        setIsAddModalOpen(false);
        setStatusMsg(null);
      }, 1000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء الحفظ.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCopying(true);
    try {
      const count = await copyWeeklySchedule(
        schoolId,
        teacherId,
        { gradeName: sourceClass.grade, classroomName: sourceClass.class },
        { gradeName: targetClass.grade, classroomName: targetClass.class }
      );

      if (count > 0) {
        await loadSchedules();
        alert(`تم نسخ ${count} حصص بنجاح إلى الشعبة ${targetClass.class}`);
        setIsCopyModalOpen(false);
      } else {
        alert('لم يتم العثور على حصص في الشعبة المصدر، أو حدث تعذر في النسخ.');
      }
    } catch (err) {
      console.error('Error copying schedule:', err);
    } finally {
      setIsCopying(false);
    }
  };

  // Find period for cell
  const getPeriodForSlot = (day: DayOfWeek, periodNum: number) => {
    return schedules.find(
      (p) =>
        p.dayOfWeek === day &&
        p.periodNumber === periodNum &&
        (selectedClassFilter === 'all' || p.classroomName === selectedClassFilter)
    );
  };

  const uniqueClasses = Array.from(new Set(schedules.map((s) => s.classroomName)));

  return (
    <div className="space-y-6" id="teacher-schedule-section">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-black text-slate-900">الجدول الدراسي الأسبوعي للحصص</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {schedules.length} حصة أسبوعية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الحصص، القاعات، الأوقات، نسخ الجدول بين الفصول، والتكرار الأسبوعي التلقائي.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManageSchedule && (
            <>
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>نسخ جدول أسبوعي لفصل آخر</span>
              </button>

              <button
                id="btn-add-period"
                onClick={() => handleOpenAddModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة حصة للجدول</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter by class */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span>تصفية حسب الفصل:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
          >
            <option value="all">جميع الفصول والشعب المسندة</option>
            {uniqueClasses.map((c, idx) => (
              <option key={idx} value={c}>
                شعبة {c}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>توقيت الدوام المدرسي: 07:00 ص - 01:30 م</span>
        </div>
      </div>

      {/* Timetable Grid View */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold">جاري تحميل الجدول الدراسي...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-xs font-black text-slate-600 border-l border-slate-200 w-24">
                    اليوم / الحصة
                  </th>
                  {PERIOD_NUMBERS.map((pNum) => (
                    <th key={pNum} className="p-3 text-xs font-black text-slate-700 border-l border-slate-200">
                      <div>الحصة {pNum}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {pNum === 1
                          ? '07:30'
                          : pNum === 2
                          ? '08:20'
                          : pNum === 3
                          ? '09:15'
                          : pNum === 4
                          ? '10:05'
                          : pNum === 5
                          ? '11:10'
                          : pNum === 6
                          ? '12:00'
                          : '12:50'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-extrabold text-slate-800 text-xs bg-slate-50/80 border-l border-slate-200">
                      {day}
                    </td>

                    {PERIOD_NUMBERS.map((periodNum) => {
                      const period = getPeriodForSlot(day, periodNum);
                      return (
                        <td
                          key={periodNum}
                          className="p-2 border-l border-slate-200 align-top h-24 max-w-[140px]"
                        >
                          {period ? (
                            <div className="h-full bg-gradient-to-b from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-2 text-right flex flex-col justify-between shadow-sm relative group">
                              <div>
                                <div className="font-black text-indigo-950 text-xs truncate">
                                  {period.subjectName}
                                </div>
                                <div className="text-[10px] font-bold text-indigo-700 mt-0.5">
                                  شعبة {period.classroomName}
                                </div>
                                {period.room && (
                                  <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{period.room}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-indigo-100">
                                <span className="text-[9px] text-indigo-600 font-mono">
                                  {period.startTime} - {period.endTime}
                                </span>

                                {canManageSchedule && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                      onClick={() => handleOpenEditModal(period)}
                                      className="p-1 rounded bg-white hover:bg-indigo-100 text-indigo-700 shadow-sm"
                                      title="تعديل"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePeriod(period.id)}
                                      className="p-1 rounded bg-white hover:bg-rose-100 text-rose-600 shadow-sm"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAddModal(periodNum, day)}
                              className="w-full h-full border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-indigo-600 transition group p-2"
                              title="إضافة حصة هنا"
                            >
                              <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition" />
                              <span className="text-[10px] opacity-0 group-hover:opacity-100 mt-1">حصة فارغة</span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT PERIOD */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingPeriod ? 'تعديل حصة في الجدول' : 'إضافة حصة جديدة للجدول'}
                  </h3>
                  <p className="text-[11px] text-slate-500">حفظ مباشر في قاعدة بيانات Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الصف الدراسي</label>
                  <select
                    value={gradeName}
                    onChange={(e) => setGradeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                    <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
                    <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الفصل / الشعبة</label>
                  <select
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="3/أ">3/أ</option>
                    <option value="3/ب">3/ب</option>
                    <option value="3/ج">3/ج</option>
                    <option value="1/أ">1/أ</option>
                    <option value="1/ب">1/ب</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اليوم</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم الحصة</label>
                  <select
                    value={periodNumber}
                    onChange={(e) => setPeriodNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    {PERIOD_NUMBERS.map((p) => (
                      <option key={p} value={p}>
                        الحصة {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">المادة الدراسية</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="مثال: العلوم، الأحياء، الفيزياء"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">وقت البداية</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">وقت النهاية</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">القاعة / المعمل</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="معمل 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <label className="flex items-center gap-2 text-xs font-bold text-indigo-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRepeatedWeekly}
                    onChange={(e) => setIsRepeatedWeekly(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>تكرار هذه الحصة أسبوعياً طوال الفصل الدراسي</span>
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
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingPeriod ? 'حفظ التعديلات' : 'إضافة الحصة'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: COPY SCHEDULE TO ANOTHER CLASS */}
      {/* ========================================================= */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">نسخ جدول أسبوعي لفصل آخر</h3>
                  <p className="text-[11px] text-slate-500">تكرار الحصص والأوقات بضغطة زر واحدة</p>
                </div>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCopyScheduleSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-700">1. الفصل المصدر (المراد نسخ حصصه):</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={sourceClass.grade}
                    onChange={(e) => setSourceClass({ ...sourceClass, grade: e.target.value })}
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="الصف"
                  />
                  <input
                    type="text"
                    value={sourceClass.class}
                    onChange={(e) => setSourceClass({ ...sourceClass, class: e.target.value })}
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    placeholder="الشعبة (مثال: 3/أ)"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2 text-xs">
                <div className="font-bold text-indigo-900">2. الفصل الهدف (المراد إنشاء الجدول فيه):</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={targetClass.grade}
                    onChange={(e) => setTargetClass({ ...targetClass, grade: e.target.value })}
                    className="p-2 bg-white border border-indigo-200 rounded-lg text-xs"
                    placeholder="الصف"
                  />
                  <input
                    type="text"
                    value={targetClass.class}
                    onChange={(e) => setTargetClass({ ...targetClass, class: e.target.value })}
                    className="p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                    placeholder="الشعبة (مثال: 3/ب)"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCopying}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isCopying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري النسخ...</span>
                    </>
                  ) : (
                    <span>تأكيد النسخ</span>
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
