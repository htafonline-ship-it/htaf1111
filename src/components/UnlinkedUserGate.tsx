import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant } from '../types';
import {
  joinSupabaseSchoolByCode,
  createTeacherJoinRequest,
  fetchSupabaseSchools,
  submitStudentRegistration,
  DbSchoolUser
} from '../lib/supabase';
import {
  School,
  Building2,
  KeyRound,
  Send,
  HelpCircle,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  GraduationCap,
  Search,
  Check,
  Clock,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface UnlinkedUserGateProps {
  currentUser?: AuthUser | null;
  user?: AuthUser | null;
  userSchoolLink?: DbSchoolUser | null;
  schools?: SchoolTenant[];
  onCreateSchoolClick?: () => void;
  onOpenCreateSchool?: () => void;
  onSchoolJoinedSuccess?: () => void;
  onLinkedSuccess?: () => void;
  onLogout?: () => void;
}

export const UnlinkedUserGate: React.FC<UnlinkedUserGateProps> = ({
  currentUser: propCurrentUser,
  user: propUser,
  userSchoolLink,
  schools: propSchools = [],
  onCreateSchoolClick,
  onOpenCreateSchool,
  onSchoolJoinedSuccess,
  onLinkedSuccess,
  onLogout,
}) => {
  const activeUser = propCurrentUser || propUser;
  const isPendingStatus = userSchoolLink?.status === 'pending' || activeUser?.accountStatus === 'pending';

  const [activeTab, setActiveTab] = useState<'student_profile' | 'teacher_request' | 'join_code'>('student_profile');

  // Real schools list fetched from Supabase
  const [availableSchools, setAvailableSchools] = useState<SchoolTenant[]>(propSchools);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // Student Profile Completion Form State
  const [studentFullName, setStudentFullName] = useState(activeUser?.fullName || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>('');
  const [stage, setStage] = useState('المرحلة المتوسطة');
  const [grade, setGrade] = useState('الصف الأول المتوسط');
  const [classroom, setClassroom] = useState('1/1');
  const [teacherOrClassCode, setTeacherOrClassCode] = useState('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentSubmitSuccess, setStudentSubmitSuccess] = useState(false);
  const [studentSubmitError, setStudentSubmitError] = useState<string | null>(null);

  // Teacher Request State
  const [teacherSubject, setTeacherSubject] = useState('العلوم والرياضيات');
  const [teacherStage, setTeacherStage] = useState('المرحلة المتوسطة');
  const [teacherGrades, setTeacherGrades] = useState('الصف الأول والثاني والثالث');
  const [teacherSchoolId, setTeacherSchoolId] = useState('');
  const [teacherSchoolName, setTeacherSchoolName] = useState('');
  const [teacherReqLoading, setTeacherReqLoading] = useState(false);
  const [teacherReqSuccess, setTeacherReqSuccess] = useState(false);
  const [teacherReqError, setTeacherReqError] = useState<string | null>(null);

  // Invite Code State
  const [inviteCode, setInviteCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Recheck Status State
  const [rechecking, setRechecking] = useState(false);

  // Fetch real schools from Supabase if not populated
  useEffect(() => {
    let isMounted = true;
    const loadSchools = async () => {
      setSchoolsLoading(true);
      try {
        const data = await fetchSupabaseSchools();
        if (isMounted && data && data.length > 0) {
          const formatted: SchoolTenant[] = data.map((s) => ({
            id: s.id,
            name: s.name,
            nameEn: s.name,
            slug: s.slug || s.id,
            logoText: s.name ? s.name.slice(0, 2) : 'مد',
            badge: s.type || 'مدرسة موثقة',
            primaryColor: 'from-blue-600 to-indigo-600',
            accentColor: 'blue',
            motto: 'التعليم الذكي والجيل الواعد',
            location: `${s.city || ''} ${s.region || ''}`.trim() || 'المملكة العربية السعودية',
            totalStudentsCount: 0,
            totalTeachersCount: 0,
            isApproved: s.status === 'active',
            circulars: []
          }));
          setAvailableSchools(formatted);
        }
      } catch (err) {
        console.warn('Notice loading schools for unlinked user:', err);
      } finally {
        if (isMounted) setSchoolsLoading(false);
      }
    };

    if (availableSchools.length === 0) {
      loadSchools();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Update name if user updates
  useEffect(() => {
    if (activeUser?.fullName && !studentFullName) {
      setStudentFullName(activeUser.fullName);
    }
  }, [activeUser]);

  // Filtered schools for autocomplete
  const filteredSchools = availableSchools.filter((s) =>
    s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
    (s.location && s.location.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
  );

  const handleRefreshStatus = async () => {
    setRechecking(true);
    try {
      if (onSchoolJoinedSuccess) await onSchoolJoinedSuccess();
      if (onLinkedSuccess) await onLinkedSuccess();
    } finally {
      setTimeout(() => setRechecking(false), 600);
    }
  };

  // Submit Student Profile & Join Request
  const handleStudentProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser?.id) return;
    if (!selectedSchoolId) {
      setStudentSubmitError('يرجى اختيار المدرسة من قائمة البحث أولاً.');
      return;
    }

    setIsSubmittingStudent(true);
    setStudentSubmitError(null);

    try {
      await submitStudentRegistration({
        userId: activeUser.id,
        fullName: studentFullName.trim() || activeUser.fullName || 'طالب مسجل',
        email: activeUser.email || '',
        schoolId: selectedSchoolId,
        stageName: stage,
        gradeName: grade,
        classroomName: classroom,
        classOrTeacherCode: teacherOrClassCode.trim()
      });

      setStudentSubmitSuccess(true);
      setTimeout(() => {
        if (onSchoolJoinedSuccess) onSchoolJoinedSuccess();
        if (onLinkedSuccess) onLinkedSuccess();
      }, 1000);
    } catch (err: any) {
      console.error('Error submitting student profile:', err);
      setStudentSubmitError(err?.message || 'تعذر إرسال طلب الانضمام. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Submit Teacher Join Request
  const handleTeacherRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherSchoolId) {
      setTeacherReqError('يرجى اختيار المدرسة أولاً.');
      return;
    }

    setTeacherReqLoading(true);
    setTeacherReqError(null);

    try {
      await createTeacherJoinRequest({
        school_id: teacherSchoolId,
        user_id: activeUser?.id || '',
        full_name: activeUser?.fullName || '',
        email: activeUser?.email || '',
        subject: teacherSubject,
        stage: teacherStage,
        grades: teacherGrades,
      });
      setTeacherReqSuccess(true);
    } catch (err: any) {
      setTeacherReqError(err.message || 'تعذر إرسال طلب انضمام المعلم.');
    } finally {
      setTeacherReqLoading(false);
    }
  };

  // Direct Code Join
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setCodeLoading(true);
    setCodeError(null);

    try {
      await joinSupabaseSchoolByCode(
        inviteCode.trim(),
        activeUser?.id || '',
        activeUser?.email || '',
        activeUser?.fullName || ''
      );
      if (onSchoolJoinedSuccess) onSchoolJoinedSuccess();
      if (onLinkedSuccess) onLinkedSuccess();
    } catch (err: any) {
      setCodeError(err.message || 'رمز الانضمام غير صحيح أو انتهت صلاحيته.');
    } finally {
      setCodeLoading(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: Status = 'pending' ("طلبك قيد مراجعة المدرسة")
  // -------------------------------------------------------------
  if (isPendingStatus || studentSubmitSuccess || teacherReqSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 dir-rtl animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 text-center text-slate-100 relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-4xl shadow-inner animate-pulse">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-black px-3.5 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              حالة الطلب: قيد الانتظار والمراجعة
            </span>
            <h2 className="text-2xl font-black text-white">
              طلبك قيد مراجعة المدرسة
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              تم استلام بياناتك وطلب انضمامك بنجاح. سيتم تفعيل حسابك فور اعتماد الإدارة المدرسية أو معلم الفصل للطلب.
            </p>
          </div>

          {/* User & Request Summary Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-right space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">الاسم:</span>
              <span className="font-bold text-white">{activeUser?.fullName || 'طالب مسجل'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">البريد الإلكتروني (Google):</span>
              <span className="font-bold text-slate-300 font-mono">{activeUser?.email || '-'}</span>
            </div>
            {selectedSchoolName && (
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">المدرسة المختارة:</span>
                <span className="font-bold text-emerald-400">{selectedSchoolName}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-400">المرحلة والصف:</span>
              <span className="font-bold text-slate-200">{stage} - {grade} ({classroom})</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRefreshStatus}
              disabled={rechecking}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {rechecking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>تحديث حالة الطلب الآن</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: Complete Student Profile & Join Form (Requirement 7)
  // -------------------------------------------------------------
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 dir-rtl animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-10 space-y-7 text-slate-100 relative overflow-hidden">
        
        {/* Top Header */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            إكمال بيانات الطالب والانضمام للمدرسة
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            تم التحقق من حسابك عبر Google بنجاح. أكمل بياناتك التعليمية وحدد مدرستك لربط حسابك وإرسال طلب الانضمام.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-800/80 p-1.5 border border-slate-700/80 gap-1 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('student_profile')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'student_profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>بيانات الطالب والانضمام</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teacher_request')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'teacher_request' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>طلب انضمام معلم</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join_code')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'join_code' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>رمز دعوة مباشر</span>
          </button>
        </div>

        {/* TAB 1: Student Profile Form */}
        {activeTab === 'student_profile' && (
          <form onSubmit={handleStudentProfileSubmit} className="space-y-4">
            
            {/* Grid 1: Name & Google Email (Readonly) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">
                  الاسم الكامل (يأتي من Google)
                </label>
                <input
                  type="text"
                  required
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  placeholder="اسم الطالب الكامل"
                  className="w-full text-xs py-3 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">
                  البريد الإلكتروني (Google - لا يمكن تغييره)
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={activeUser?.email || ''}
                  className="w-full text-xs py-3 px-3.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 font-mono outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* School Search & Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300">
                البحث عن المدرسة واختيارها <span className="text-rose-400">*</span>
              </label>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  placeholder="ابحث باسم المدرسة أو مدينتها (مثل: مدرسة الخرج، الرياض...)"
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="w-full text-xs py-3 pr-9 pl-4 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              {/* Autocomplete School Results */}
              <div className="max-h-36 overflow-y-auto bg-slate-800/90 rounded-xl border border-slate-700 divide-y divide-slate-700/60 mt-1">
                {schoolsLoading ? (
                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تحميل المدارس المعتمدة...</span>
                  </div>
                ) : filteredSchools.length > 0 ? (
                  filteredSchools.map((sch) => (
                    <button
                      key={sch.id}
                      type="button"
                      onClick={() => {
                        setSelectedSchoolId(sch.id);
                        setSelectedSchoolName(sch.name);
                        setSchoolSearchQuery(sch.name);
                      }}
                      className={`w-full text-right p-2.5 text-xs flex items-center justify-between hover:bg-slate-700/80 transition ${
                        selectedSchoolId === sch.id ? 'bg-blue-600/20 text-blue-300 font-black' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sch.name}</span>
                        {sch.location && (
                          <span className="text-[10px] text-slate-400">({sch.location})</span>
                        )}
                      </div>
                      {selectedSchoolId === sch.id && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    لا توجد مدارس تطابق بحثك. يرجى التأكد من كتابة الاسم بصورة صحيحة.
                  </div>
                )}
              </div>
            </div>

            {/* Stage & Grade Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">
                  المرحلة التعليمية
                </label>
                <select
                  value={stage}
                  onChange={(e) => {
                    const newStage = e.target.value;
                    setStage(newStage);
                    if (newStage === 'المرحلة الابتدائية') {
                      setGrade('الصف الأول الابتدائي');
                    } else if (newStage === 'المرحلة الثانوية') {
                      setGrade('الصف الأول الثانوي');
                    } else {
                      setGrade('الصف الأول المتوسط');
                    }
                  }}
                  className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-blue-500"
                >
                  <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">
                  الصف الدراسي
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-blue-500"
                >
                  {stage === 'المرحلة الابتدائية' && (
                    <>
                      <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                      <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                      <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                      <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                      <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                      <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                    </>
                  )}
                  {stage === 'المرحلة المتوسطة' && (
                    <>
                      <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                      <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
                      <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    </>
                  )}
                  {stage === 'المرحلة الثانوية' && (
                    <>
                      <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                      <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">
                  الفصل / الشعبة
                </label>
                <input
                  type="text"
                  required
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  placeholder="مثال: 1/1 أو أ أو ب"
                  className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-blue-500 text-center"
                />
              </div>
            </div>

            {/* Class / Teacher Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300">
                رمز الفصل أو رمز المعلم (اختياري)
              </label>
              <input
                type="text"
                value={teacherOrClassCode}
                onChange={(e) => setTeacherOrClassCode(e.target.value)}
                placeholder="أدخل رمز الفصل أو رمز المعلم إن وجد للاعتماد المباشر"
                className="w-full text-xs py-3 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono outline-none focus:border-blue-500 uppercase tracking-wider"
              />
            </div>

            {/* Error Message */}
            {studentSubmitError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{studentSubmitError}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmittingStudent || !selectedSchoolId}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isSubmittingStudent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال طلب الانضمام للمدرسة...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال طلب الانضمام</span>
                </>
              )}
            </button>

          </form>
        )}

        {/* TAB 2: Teacher Join Request */}
        {activeTab === 'teacher_request' && (
          <form onSubmit={handleTeacherRequestSubmit} className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-200 leading-relaxed">
              وفقاً لنظام المدارس في منصة هتاف، يتم ربط المعلمين عبر طلب اعتماد رسمي يُراجع من قبل مدير المدرسة.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300">
                المدرسة المستهدفة
              </label>
              <select
                value={teacherSchoolId}
                onChange={(e) => {
                  setTeacherSchoolId(e.target.value);
                  const found = availableSchools.find((s) => s.id === e.target.value);
                  if (found) setTeacherSchoolName(found.name);
                }}
                className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-purple-500"
              >
                <option value="">اختر المدرسة من القائمة المعتمدة</option>
                {availableSchools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} {sch.location ? `(${sch.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">المادة التدريسية</label>
                <input
                  type="text"
                  required
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-300">المرحلة</label>
                <select
                  value={teacherStage}
                  onChange={(e) => setTeacherStage(e.target.value)}
                  className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-purple-500"
                >
                  <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300">الصفوف الموكلة لك</label>
              <input
                type="text"
                required
                value={teacherGrades}
                onChange={(e) => setTeacherGrades(e.target.value)}
                placeholder="مثال: الصف الأول والثاني المتوسط"
                className="w-full text-xs py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-purple-500"
              />
            </div>

            {teacherReqError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{teacherReqError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={teacherReqLoading || !teacherSchoolId}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {teacherReqLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال طلب انضمام المعلم...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال طلب اعتماد المعلم</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: Invite Code Form */}
        {activeTab === 'join_code' && (
          <form onSubmit={handleJoinByCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300">
                أدخل رمز الدعوة المباشر
              </label>
              <input
                type="text"
                required
                placeholder="مثال: INV-ABC123 أو SCH-2026-RIYADH"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full text-xs py-3.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-center uppercase tracking-widest outline-none focus:border-emerald-500"
              />
            </div>

            {codeError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{codeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={codeLoading || !inviteCode.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {codeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من رمز الدعوة...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>تأكيد الرمز والانضمام فوراً</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Logout Footer */}
        {onLogout && (
          <div className="pt-4 border-t border-slate-800 flex justify-center">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج والعودة لاحقاً</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
