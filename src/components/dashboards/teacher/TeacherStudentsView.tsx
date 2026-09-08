import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, StudentNote, StudentNoteType } from '../../../types';
import {
  DbStudent,
  fetchTeacherStudents,
  addStudentByTeacher,
  updateStudentByTeacher,
  checkDuplicateStudent,
  fetchStudentNotes,
  addStudentNote,
  isSupabaseConfigured
} from '../../../lib/supabase';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  GraduationCap,
  Plus,
  X,
  Loader2,
  Calendar,
  Eye,
  ShieldAlert,
  Edit2
} from 'lucide-react';

interface TeacherStudentsViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  canAddStudent?: boolean;
  canEditStudent?: boolean;
  canAddNotes?: boolean;
}

export const TeacherStudentsView: React.FC<TeacherStudentsViewProps> = ({
  currentUser,
  currentSchool,
  canAddStudent = true,
  canEditStudent = true,
  canAddNotes = true
}) => {
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<DbStudent | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<DbStudent | null>(null);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);

  // Form States for Add Student
  const [newFullName, setNewFullName] = useState<string>('');
  const [newStudentNumber, setNewStudentNumber] = useState<string>('');
  const [newGradeName, setNewGradeName] = useState<string>('الصف الثالث المتوسط');
  const [newClassroomName, setNewClassroomName] = useState<string>('3/أ');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newParentPhone, setNewParentPhone] = useState<string>('');
  const [newParentEmail, setNewParentEmail] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState<boolean>(false);

  // Form States for Add Note
  const [noteType, setNoteType] = useState<StudentNoteType>('ملاحظة دراسية');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteSubject, setNoteSubject] = useState<string>('العلوم');
  const [noteImportance, setNoteImportance] = useState<'عادي' | 'هام' | 'عاجل'>('عادي');
  const [isParentVisible, setIsParentVisible] = useState<boolean>(true);
  const [isStudentVisible, setIsStudentVisible] = useState<boolean>(true);
  const [isAdminOnly, setIsAdminOnly] = useState<boolean>(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const schoolId = currentSchool?.id || 'al-namouthajya';
  const teacherId = currentUser?.id || 'teacher-default';
  const teacherName = currentUser?.fullName || 'المعلم المعتمد';

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherStudents(schoolId, teacherId);
      if (data && data.length > 0) {
        setStudents(data);
      } else {
        // Fallback default assigned class roster if newly registered
        setStudents([
          {
            id: 'std-101',
            school_id: schoolId,
            grade_name: 'الصف الثالث المتوسط',
            classroom_name: '3/أ',
            full_name: 'عبدالله محمد الشمري',
            email: 'abdullah.sh@school.edu.sa',
            student_number: 'STD-100234',
            parent_phone: '0551234567',
            parent_email: 'parent.sh@gmail.com',
            teacher_id: teacherId,
            status: 'active',
            created_at: new Date().toISOString()
          },
          {
            id: 'std-102',
            school_id: schoolId,
            grade_name: 'الصف الثالث المتوسط',
            classroom_name: '3/أ',
            full_name: 'سلطان فهد القحطاني',
            email: 'sultan.q@school.edu.sa',
            student_number: 'STD-100235',
            parent_phone: '0552345678',
            parent_email: 'parent.q@gmail.com',
            teacher_id: teacherId,
            status: 'active',
            created_at: new Date().toISOString()
          },
          {
            id: 'std-103',
            school_id: schoolId,
            grade_name: 'الصف الثالث المتوسط',
            classroom_name: '3/ب',
            full_name: 'خالد عبدالعزيز العتيبي',
            email: 'khaled.ot@school.edu.sa',
            student_number: 'STD-100236',
            parent_phone: '0553456789',
            parent_email: 'parent.ot@gmail.com',
            teacher_id: teacherId,
            status: 'active',
            created_at: new Date().toISOString()
          },
          {
            id: 'std-104',
            school_id: schoolId,
            grade_name: 'الصف الأول الثانوي',
            classroom_name: '1/أ',
            full_name: 'ريان منصور الدوسري',
            email: 'rayan.d@school.edu.sa',
            student_number: 'STD-100237',
            parent_phone: '0554567890',
            parent_email: 'parent.d@gmail.com',
            teacher_id: teacherId,
            status: 'active',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Error loading teacher students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [schoolId, teacherId]);

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newFullName.trim() || !newEmail.trim() || !newGradeName.trim() || !newClassroomName.trim()) {
      setFormError('يرجى ملء جميع الحقول الإلزامية (اسم الطالب، البريد، الصف، الفصل).');
      return;
    }

    setIsSubmittingStudent(true);
    try {
      // 1. Check duplicate locally or via Supabase
      const dup = await checkDuplicateStudent(schoolId, newStudentNumber, newEmail);
      if (dup.exists) {
        setFormError(dup.reason || 'يوجد طالب مسجل مسبقاً بنفس البيانات.');
        setIsSubmittingStudent(false);
        return;
      }

      const created = await addStudentByTeacher({
        school_id: schoolId,
        grade_name: newGradeName,
        classroom_name: newClassroomName,
        full_name: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        student_number: newStudentNumber.trim() || `STD-${Date.now().toString().slice(-5)}`,
        parent_phone: newParentPhone.trim(),
        parent_email: newParentEmail.trim(),
        teacher_id: teacherId,
        status: newStatus
      });

      setStudents((prev) => [created, ...prev]);
      setFormSuccess(`تمت إضافة الطالب (${created.full_name}) وربطه بالفصل والمدرسة بنجاح.`);
      
      // Reset form
      setNewFullName('');
      setNewStudentNumber('');
      setNewEmail('');
      setNewParentPhone('');
      setNewParentEmail('');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess('');
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'تعذر إضافة الطالب. تحقق من الاتصال بقاعدة البيانات.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleOpenStudentProfile = async (st: DbStudent) => {
    setSelectedStudentProfile(st);
    setIsProfileModalOpen(true);
    setIsLoadingNotes(true);
    try {
      const notes = await fetchStudentNotes(schoolId, st.id);
      setStudentNotes(notes);
    } catch (err) {
      console.warn('Error fetching notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleOpenAddNote = (st: DbStudent) => {
    setSelectedStudentForNote(st);
    setNoteTitle('');
    setNoteContent('');
    setIsNoteModalOpen(true);
  };

  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForNote || !noteTitle.trim() || !noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const newNote = await addStudentNote({
        schoolId: schoolId,
        studentId: selectedStudentForNote.id,
        studentName: selectedStudentForNote.full_name,
        teacherId: teacherId,
        teacherName: teacherName,
        gradeName: selectedStudentForNote.grade_name,
        classroomName: selectedStudentForNote.classroom_name,
        noteType: noteType,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        subjectName: noteSubject,
        importanceLevel: noteImportance,
        isParentVisible: isAdminOnly ? false : isParentVisible,
        isStudentVisible: isAdminOnly ? false : isStudentVisible,
        isAdminOnly: isAdminOnly
      });

      setStudentNotes((prev) => [newNote, ...prev]);
      setIsNoteModalOpen(false);
      setNoteTitle('');
      setNoteContent('');
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student_number && s.student_number.includes(searchQuery)) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClassFilter === 'all' ||
      `${s.grade_name} - ${s.classroom_name}` === selectedClassFilter ||
      s.classroom_name === selectedClassFilter;

    const matchesStatus =
      selectedStatusFilter === 'all' || s.status === selectedStatusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Unique classes for filter
  const uniqueClasses = Array.from(
    new Set(students.map((s) => `${s.grade_name} (${s.classroom_name})`))
  );

  return (
    <div className="space-y-6" id="teacher-students-section">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-black text-slate-900">سجل طلابي والفصول المسندة</h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {students.length} طالب مسجل
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الطلاب في الفصول المسندة إليك، إضافة الملاحظات الأكاديمية والسلوكية، ومتابعة التواصل مع أولياء الأمور.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canAddStudent && (
            <button
              id="btn-add-student-teacher"
              onClick={() => {
                setFormError('');
                setFormSuccess('');
                setIsAddModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة طالب جديد للفصل</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، البريد، أو الرقم المدرسي..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">جميع الفصول والشعب</option>
            {uniqueClasses.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">جميع الحالات (نشط / غير نشط)</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Students List Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">جاري تحميل قائمة الطلاب من قاعدة البيانات...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا يوجد طلاب مطابقين للبحث</h4>
          <p className="text-xs text-slate-400">يمكنك إضافة طالب جديد أو تعديل معايير التصفية أعلاه.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">الرقم المدرسي</th>
                  <th className="p-4">الصف والشعبة</th>
                  <th className="p-4">بيانات ولي الأمر والتواصل</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                          🧑‍🎓
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{st.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{st.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold text-[11px]">
                        {st.student_number || 'STD-0000'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-800">{st.grade_name}</div>
                      <div className="text-[10px] text-emerald-700 font-black">شعبة: {st.classroom_name}</div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      {st.parent_phone ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{st.parent_phone}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">لا يوجد هاتف مسجل</span>
                      )}
                      {st.parent_email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {st.parent_email}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          st.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {st.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenStudentProfile(st)}
                          title="عرض ملف الطالب والملاحظات"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canAddNotes && (
                          <button
                            onClick={() => handleOpenAddNote(st)}
                            title="إضافة ملاحظة"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD STUDENT BY TEACHER */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">إضافة طالب جديد إلى الفصل</h3>
                  <p className="text-[11px] text-slate-500">
                    تسجيل تلقائي لـ ({currentSchool?.name || 'مدرستك'}) والمعلم الحالي.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم الطالب الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="مثال: يوسف محمد الغامدي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    الرقم المدرسي / رقم الهوية
                  </label>
                  <input
                    type="text"
                    value={newStudentNumber}
                    onChange={(e) => setNewStudentNumber(e.target.value)}
                    placeholder="مثال: 1098765432"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    البريد الإلكتروني للطالب <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="yousef@school.edu.sa"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    الصف الدراسي <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                    <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
                    <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    الفصل / الشعبة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newClassroomName}
                    onChange={(e) => setNewClassroomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="3/أ">3/أ</option>
                    <option value="3/ب">3/ب</option>
                    <option value="3/ج">3/ج</option>
                    <option value="1/أ">1/أ</option>
                    <option value="1/ب">1/ب</option>
                    <option value="عام">عام</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    رقم هاتف ولي الأمر (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    بريد ولي الأمر (اختياري)
                  </label>
                  <input
                    type="email"
                    value={newParentEmail}
                    onChange={(e) => setNewParentEmail(e.target.value)}
                    placeholder="parent@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">حالة الطالب</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={newStatus === 'active'}
                      onChange={() => setNewStatus('active')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>نشط (متاح في الحصص والواجبات)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-800">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={newStatus === 'inactive'}
                      onChange={() => setNewStatus('inactive')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span>غير نشط</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div>🏫 <strong>المدرسة المسندة:</strong> {currentSchool?.name || schoolId}</div>
                <div>👨‍🏫 <strong>المعلم المنشئ:</strong> {teacherName} ({teacherId})</div>
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
                  disabled={isSubmittingStudent}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmittingStudent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ في Supabase...</span>
                    </>
                  ) : (
                    <span>حفظ الطالب واعتماده</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD NOTE TO STUDENT */}
      {/* ========================================================= */}
      {isNoteModalOpen && selectedStudentForNote && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">إضافة ملاحظة للطالب</h3>
                  <p className="text-[11px] text-slate-500">الطالب: {selectedStudentForNote.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNoteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نوع الملاحظة</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as StudentNoteType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="ملاحظة دراسية">ملاحظة دراسية</option>
                    <option value="تميز">تميز</option>
                    <option value="تحسن">تحسن</option>
                    <option value="واجب غير مكتمل">واجب غير مكتمل</option>
                    <option value="ضعف في مادة">ضعف في مادة</option>
                    <option value="سلوك">سلوك</option>
                    <option value="حضور">حضور</option>
                    <option value="تأخر">تأخر</option>
                    <option value="ملاحظة عامة">ملاحظة عامة</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المادة المرتبطة</label>
                  <select
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="العلوم">العلوم</option>
                    <option value="الرياضيات">الرياضيات</option>
                    <option value="الفيزياء">الفيزياء</option>
                    <option value="الكيمياء">الكيمياء</option>
                    <option value="عام">عام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الملاحظة</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="مثال: تفاعل متميز في تجربة الدائرة الكهربائية"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نص الملاحظة والتفاصيل</label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="اكتب التقييم أو الملاحظة الإرشادية هنا..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
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
                        name="importance"
                        value={imp}
                        checked={noteImportance === imp}
                        onChange={() => setNoteImportance(imp)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{imp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-800">إعدادات الرؤية والخصوصية:</div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isParentVisible}
                      onChange={(e) => setIsParentVisible(e.target.checked)}
                      disabled={isAdminOnly}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>تظهر لولي الأمر في تقرير المتابعة</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStudentVisible}
                      onChange={(e) => setIsStudentVisible(e.target.checked)}
                      disabled={isAdminOnly}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>تظهر للطالب في لوحة إنجازاته</span>
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
                    <span>خاصة بإدارة المدرسة والإرشاد فقط (سرية)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmittingNote ? (
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

      {/* ========================================================= */}
      {/* MODAL 3: STUDENT PROFILE & NOTES HISTORY */}
      {/* ========================================================= */}
      {isProfileModalOpen && selectedStudentProfile && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-xl flex items-center justify-center shadow-inner">
                  🧑‍🎓
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedStudentProfile.full_name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudentProfile.grade_name} - شعبة {selectedStudentProfile.classroom_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">الرقم المدرسي</span>
                <span className="font-bold font-mono text-slate-800">
                  {selectedStudentProfile.student_number || 'STD-0000'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">البريد</span>
                <span className="font-bold text-slate-800 truncate block">{selectedStudentProfile.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">هاتف ولي الأمر</span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedStudentProfile.parent_phone || 'غير مسجل'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">الحالة</span>
                <span className="font-bold text-emerald-600">
                  {selectedStudentProfile.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>سجل الملاحظات والسلوك الأكاديمي ({studentNotes.length})</span>
                </h4>

                {canAddNotes && (
                  <button
                    onClick={() => handleOpenAddNote(selectedStudentProfile)}
                    className="text-xs font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة ملاحظة</span>
                  </button>
                )}
              </div>

              {isLoadingNotes ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                </div>
              ) : studentNotes.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  لا توجد ملاحظات مسجلة لهذا الطالب حتى الآن.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {note.noteType}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{note.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(note.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{note.content}</p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400">
                        <span>المعلم: {note.teacherName}</span>
                        {note.isParentVisible && <span className="text-emerald-600">✓ تظهر لولي الأمر</span>}
                        {note.isStudentVisible && <span className="text-teal-600">✓ تظهر للطالب</span>}
                        {note.isAdminOnly && <span className="text-rose-600">🔒 خاصة بالإدارة فقط</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
