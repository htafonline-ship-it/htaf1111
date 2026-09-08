import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, AttendanceRecord, AttendanceStatus } from '../../../types';
import {
  fetchAttendanceRecords,
  saveAttendanceBatch,
  fetchTeacherStudents,
  DbStudent
} from '../../../lib/supabase';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface TeacherAttendanceViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  canRecordAttendance?: boolean;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  currentUser,
  currentSchool,
  canRecordAttendance = true
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedGrade, setSelectedGrade] = useState<string>('الصف الثالث المتوسط');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('3/أ');

  const [students, setStudents] = useState<DbStudent[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  // Load students & existing attendance for this slot
  const loadClassAndAttendance = async () => {
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const [fetchedStudents, existingRecords] = await Promise.all([
        fetchTeacherStudents(schoolId, teacherId, selectedClassroom),
        fetchAttendanceRecords(schoolId, selectedDate, selectedPeriod, selectedGrade, selectedClassroom)
      ]);

      const classStudents = fetchedStudents.filter(
        (s) => !selectedClassroom || s.classroom_name === selectedClassroom
      );

      setStudents(classStudents);

      // Populate attendance map
      const newMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
      classStudents.forEach((st) => {
        const record = existingRecords.find((r) => r.studentId === st.id);
        if (record) {
          newMap[st.id] = { status: record.status, notes: record.notes || '' };
        } else {
          // Default all present initially
          newMap[st.id] = { status: 'حاضر', notes: '' };
        }
      });

      setAttendanceMap(newMap);
    } catch (err) {
      console.warn('Error loading attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassAndAttendance();
  }, [schoolId, selectedDate, selectedPeriod, selectedClassroom]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    students.forEach((st) => {
      updated[st.id] = {
        status: 'حاضر',
        notes: attendanceMap[st.id]?.notes || ''
      };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const recordsToSave = students.map((st) => ({
        schoolId,
        teacherId,
        teacherName,
        gradeName: st.grade_name || selectedGrade,
        classroomName: st.classroom_name || selectedClassroom,
        date: selectedDate,
        periodNumber: selectedPeriod,
        studentId: st.id,
        studentName: st.full_name,
        status: attendanceMap[st.id]?.status || 'حاضر',
        notes: attendanceMap[st.id]?.notes || ''
      }));

      await saveAttendanceBatch(recordsToSave);
      setSaveStatus({
        success: true,
        message: `تم حفظ واعتماد كشف الحضور بنجاح لـ (${students.length}) طالب في قاعدة بيانات Supabase.`
      });
    } catch (err: any) {
      setSaveStatus({
        success: false,
        message: err.message || 'حدث خطأ أثناء حفظ كشف الحضور.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Stats
  const total = students.length;
  const presentCount = students.filter((s) => attendanceMap[s.id]?.status === 'حاضر').length;
  const absentCount = students.filter((s) => attendanceMap[s.id]?.status === 'غائب').length;
  const excusedCount = students.filter((s) => attendanceMap[s.id]?.status === 'غائب بعذر').length;
  const lateCount = students.filter((s) => attendanceMap[s.id]?.status === 'متأخر').length;

  return (
    <div className="space-y-6" id="teacher-attendance-section">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-black text-slate-900">رصد الحضور والغياب اليومي والحصص</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              تحديث فوري
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل سريع للحضور لكل حصة، مع إمكانية توثيق التأخر والغياب بعذر وحفظ الكشف في السجل العام للمدرسة.
          </p>
        </div>

        {canRecordAttendance && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllPresent}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition"
            >
              ✓ تحديد الكل حاضر
            </button>

            <button
              id="btn-save-attendance"
              onClick={handleSaveAttendance}
              disabled={isSaving || students.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ في Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>اعتماد وحفظ الكشف</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">التاريخ</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">الحصة</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <option key={p} value={p}>
                الحصة {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">الصف الدراسي</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
          >
            <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
            <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
            <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
            <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">الفصل / الشعبة</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
          >
            <option value="3/أ">شعبة 3/أ</option>
            <option value="3/ب">شعبة 3/ب</option>
            <option value="3/ج">شعبة 3/ج</option>
            <option value="1/أ">شعبة 1/أ</option>
          </select>
        </div>
      </div>

      {/* Save Status Alert */}
      {saveStatus && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            saveStatus.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {saveStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي الطلاب</span>
          <span className="text-xl font-black text-slate-900">{total}</span>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center">
          <span className="text-[11px] font-bold text-emerald-700 block">الحاضرون</span>
          <span className="text-xl font-black text-emerald-800">{presentCount}</span>
        </div>
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-center">
          <span className="text-[11px] font-bold text-rose-700 block">الغياب</span>
          <span className="text-xl font-black text-rose-800">{absentCount}</span>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center">
          <span className="text-[11px] font-bold text-amber-700 block">تأخر / عذر</span>
          <span className="text-xl font-black text-amber-800">{lateCount + excusedCount}</span>
        </div>
      </div>

      {/* Students Attendance List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold">جاري تحميل بيانات الشعبة...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا يوجد طلاب مسجلون في هذه الشعبة</h4>
          <p className="text-xs text-slate-400">
            يمكنك إضافة طلاب إلى شعبة {selectedClassroom} من قسم "طلابي".
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700">
              قائمة طلاب {selectedGrade} ({selectedClassroom}) — الحصة {selectedPeriod}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{selectedDate}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {students.map((st, index) => {
              const currentStatus = attendanceMap[st.id]?.status || 'حاضر';
              const currentNote = attendanceMap[st.id]?.notes || '';

              return (
                <div
                  key={st.id}
                  className="p-4 hover:bg-slate-50/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{st.full_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {st.student_number || 'STD-0000'}
                      </span>
                    </div>
                  </div>

                  {/* Status Selector Pills */}
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'حاضر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                        currentStatus === 'حاضر'
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حاضر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'غائب')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                        currentStatus === 'غائب'
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>غائب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'غائب بعذر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                        currentStatus === 'غائب بعذر'
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>بعذر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'متأخر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                        currentStatus === 'متأخر'
                          ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>متأخر</span>
                    </button>

                    {/* Quick note input */}
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => handleNotesChange(st.id, e.target.value)}
                      placeholder="ملاحظة الحصة..."
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] w-32 focus:w-48 transition-all outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
