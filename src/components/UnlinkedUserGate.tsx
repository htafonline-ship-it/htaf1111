import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant } from '../types';
import {
  joinSupabaseSchoolByCode,
  createTeacherJoinRequest,
  fetchSupabaseSchools,
  submitStudentRegistration,
  DbSchoolUser
} from '../lib/supabase';
import { KHARJ_TENANT_SCHOOLS } from '../data/kharjSchoolsData';
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

  // Real schools list fetched from Supabase (initialized with fallback to KHARJ_TENANT_SCHOOLS)
  const [availableSchools, setAvailableSchools] = useState<SchoolTenant[]>(() => {
    if (propSchools && propSchools.length > 0) return propSchools;
    return KHARJ_TENANT_SCHOOLS;
  });
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // Keep availableSchools in sync if propSchools updates
  useEffect(() => {
    if (propSchools && propSchools.length > 0) {
      setAvailableSchools(prev => {
        const map = new Map<string, SchoolTenant>();
        for (const s of KHARJ_TENANT_SCHOOLS) map.set(s.id, s);
        for (const s of propSchools) map.set(s.id, s);
        for (const s of prev) if (!map.has(s.id)) map.set(s.id, s);
        return Array.from(map.values());
      });
    }
  }, [propSchools]);

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

  // Fetch real schools from Supabase and merge
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
            nameEn: s.name_en || s.name,
            slug: s.slug || s.id,
            logoText: s.name ? s.name.slice(0, 2) : 'مد',
            badge: `${s.type || s.education_type || 'مدرسة'} - ${s.stage || 'تعليم عام'}`,
            primaryColor: 'from-blue-600 to-indigo-600',
            accentColor: 'blue',
            motto: 'التعليم الذكي والجيل الواعد',
            location: `${s.city || ''} ${s.district ? `- ${s.district}` : s.region ? `- ${s.region}` : ''}`.trim() || 'المملكة العربية السعودية',
            gender: (s.school_gender || (s.gender_type === 'بنات' ? 'girls' : s.gender_type === 'مشتركة' ? 'mixed' : 'boys')) as any,
            educationType: (s.education_type || s.type || 'حكومي') as any,
            stage: (s.stage || 'متوسط') as any,
            regionName: s.region,
            cityName: s.city,
            district: s.district,
            moeCode: s.moe_code || s.license_number,
            officialEmail: s.email,
            phone: s.phone,
            principalName: s.principal_name,
            principalEmail: s.email,
            totalStudentsCount: 0,
            totalTeachersCount: 0,
            isApproved: s.status === 'active',
            invitationCode: s.code,
            registrationCodeUsed: s.code,
            circulars: []
          }));

          setAvailableSchools(prev => {
            const map = new Map<string, SchoolTenant>();
            for (const s of KHARJ_TENANT_SCHOOLS) map.set(s.id, s);
            for (const s of prev) map.set(s.id, s);
            for (const r of formatted) {
              let matchedKey = r.id;
              for (const [k, v] of map.entries()) {
                if (
                  v.name === r.name ||
                  (v.registrationCodeUsed && v.registrationCodeUsed === r.registrationCodeUsed) ||
                  v.slug === r.slug
                ) {
                  matchedKey = k;
                  break;
                }
              }
              map.delete(matchedKey);
              map.set(r.id, r);
            }
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Notice loading schools for unlinked user:', err);
      } finally {
        if (isMounted) setSchoolsLoading(false);
      }
    };

    loadSchools();
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

  // Robust Arabic normalization helper for search queries
  const normalizeArabicText = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics / tashkeel
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[\-\_\/\.\,\:\;]/g, ' ')
      .replace(/\s+/g, ' ');
  };

  const queryNormalized = normalizeArabicText(schoolSearchQuery);
  const queryTokens = queryNormalized.split(' ').filter(Boolean);

  // Filtered schools for autocomplete
  const filteredSchools = availableSchools.filter((s) => {
    if (!queryNormalized) return true;

    const searchableText = normalizeArabicText([
      s.name,
      s.nameEn,
      s.location,
      s.district,
      s.regionName,
      s.cityName,
      s.badge,
      s.stage,
      s.moeCode,
      s.invitationCode,
      s.registrationCodeUsed,
      s.slug,
      s.id
    ].filter(Boolean).join(' '));

    if (searchableText.includes(queryNormalized)) return true;
    return queryTokens.every(token => searchableText.includes(token));
  });

  // Code match detector for registration code or invite code
  const codeNormalized = teacherOrClassCode.trim();
  const matchedSchoolByCode = codeNormalized
    ? availableSchools.find(
        (s) =>
          s.registrationCodeUsed?.toLowerCase() === codeNormalized.toLowerCase() ||
          s.invitationCode?.toLowerCase() === codeNormalized.toLowerCase() ||
          s.moeCode?.toLowerCase() === codeNormalized.toLowerCase() ||
          s.id.toLowerCase() === codeNormalized.toLowerCase()
      )
    : null;

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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-300">
                  البحث عن المدرسة واختيارها <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] font-bold text-blue-400">
                  {availableSchools.length} مدرسة معتمدة
                </span>
              </div>

              {/* Selected School Highlight Card */}
              {selectedSchoolId && selectedSchoolName ? (
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/50 to-slate-900 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 shadow-lg transition animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 font-black" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-emerald-300 font-black text-sm truncate">
                          {selectedSchoolName}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          تم التحديد ✓
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5 truncate">
                        {availableSchools.find((s) => s.id === selectedSchoolId)?.location && (
                          <span>{availableSchools.find((s) => s.id === selectedSchoolId)?.location}</span>
                        )}
                        {availableSchools.find((s) => s.id === selectedSchoolId)?.badge && (
                          <span>• {availableSchools.find((s) => s.id === selectedSchoolId)?.badge}</span>
                        )}
                        {availableSchools.find((s) => s.id === selectedSchoolId)?.registrationCodeUsed && (
                          <span className="font-mono text-[10px] text-slate-400">
                            (كود: {availableSchools.find((s) => s.id === selectedSchoolId)?.registrationCodeUsed})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSchoolId('');
                      setSelectedSchoolName('');
                      setSchoolSearchQuery('');
                    }}
                    className="shrink-0 text-slate-400 hover:text-rose-400 text-[11px] font-bold border border-slate-700 hover:border-rose-500/50 bg-slate-800/80 px-3 py-1.5 rounded-xl transition shadow-sm"
                  >
                    تغيير المدرسة
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="اكتب اسم المدرسة، الحي، أو رمز المدرسة (مثل: الهياثم، الخرج، SCH-2026...)"
                      value={schoolSearchQuery}
                      onChange={(e) => setSchoolSearchQuery(e.target.value)}
                      className="w-full text-xs py-3 pr-10 pl-4 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold outline-none focus:border-blue-500 transition shadow-inner"
                    />
                    {schoolSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSchoolSearchQuery('')}
                        className="absolute left-3 top-3 text-[11px] text-slate-400 hover:text-white bg-slate-700/60 px-2 py-0.5 rounded-md"
                      >
                        مسح
                      </button>
                    )}
                  </div>

                  {/* School Search Results List */}
                  <div className="max-h-56 overflow-y-auto bg-slate-800/95 rounded-xl border border-slate-700 divide-y divide-slate-700/60 shadow-xl">
                    {schoolsLoading ? (
                      <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>جاري مزامنة المدارس المعتمدة...</span>
                      </div>
                    ) : filteredSchools.length > 0 ? (
                      filteredSchools.map((sch) => {
                        const isSelected = selectedSchoolId === sch.id;
                        return (
                          <button
                            key={sch.id}
                            type="button"
                            onClick={() => {
                              setSelectedSchoolId(sch.id);
                              setSelectedSchoolName(sch.name);
                              setSchoolSearchQuery(sch.name);
                            }}
                            className={`w-full text-right p-3 text-xs flex items-center justify-between hover:bg-blue-600/10 transition group ${
                              isSelected ? 'bg-blue-600/20 text-blue-300 font-black' : 'text-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-700/70 border border-slate-600/50 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition">
                                <Building2 className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-xs text-white group-hover:text-blue-300 transition truncate">
                                  {sch.name}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 mt-1">
                                  {sch.location && (
                                    <span className="bg-slate-700/50 px-2 py-0.5 rounded-md text-slate-300">
                                      {sch.location}
                                    </span>
                                  )}
                                  {sch.badge && (
                                    <span className="bg-blue-950/60 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded-md">
                                      {sch.badge}
                                    </span>
                                  )}
                                  {sch.registrationCodeUsed && (
                                    <span className="font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded">
                                      {sch.registrationCodeUsed}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 mr-2">
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-black bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>مختارة</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-blue-400 group-hover:text-white font-bold bg-blue-600/20 group-hover:bg-blue-600 px-3 py-1 rounded-lg transition border border-blue-500/30">
                                  اختيار
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                        <div>لا توجد مدارس تطابق بحثك الحالي ("{schoolSearchQuery}").</div>
                        {schoolSearchQuery.trim().length > 1 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const customId = `sch-custom-${Date.now()}`;
                                const newCustomSchool: SchoolTenant = {
                                  id: customId,
                                  name: schoolSearchQuery.trim(),
                                  nameEn: schoolSearchQuery.trim(),
                                  slug: customId,
                                  logoText: schoolSearchQuery.trim().slice(0, 2),
                                  badge: 'مدرسة مسجلة',
                                  primaryColor: 'from-blue-600 to-indigo-600',
                                  accentColor: 'blue',
                                  motto: 'التعليم الذكي والجيل الواعد',
                                  location: 'المملكة العربية السعودية',
                                  totalStudentsCount: 0,
                                  totalTeachersCount: 0,
                                  isApproved: true,
                                  circulars: []
                                };
                                setAvailableSchools((prev) => [newCustomSchool, ...prev]);
                                setSelectedSchoolId(newCustomSchool.id);
                                setSelectedSchoolName(newCustomSchool.name);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition inline-flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>اعتماد واختيار "{schoolSearchQuery.trim()}" كمدرستي</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fallback Option if user entered query and wants to register it directly */}
                  {schoolSearchQuery.trim().length > 2 && filteredSchools.length > 0 && (
                    <div className="p-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300 text-[11px]">
                        لم تجد مدرستك بدقة؟ يمكنك اعتماد الاسم المكتوب فوراً:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const customId = `sch-custom-${Date.now()}`;
                          const newCustomSchool: SchoolTenant = {
                            id: customId,
                            name: schoolSearchQuery.trim(),
                            nameEn: schoolSearchQuery.trim(),
                            slug: customId,
                            logoText: schoolSearchQuery.trim().slice(0, 2),
                            badge: 'مدرسة مسجلة',
                            primaryColor: 'from-blue-600 to-indigo-600',
                            accentColor: 'blue',
                            motto: 'التعليم الذكي والجيل الواعد',
                            location: 'المملكة العربية السعودية',
                            totalStudentsCount: 0,
                            totalTeachersCount: 0,
                            isApproved: true,
                            circulars: []
                          };
                          setAvailableSchools((prev) => [newCustomSchool, ...prev]);
                          setSelectedSchoolId(newCustomSchool.id);
                          setSelectedSchoolName(newCustomSchool.name);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-[11px] font-bold underline shrink-0"
                      >
                        اعتماد "{schoolSearchQuery.trim()}"
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                رمز الفصل أو رمز المعلم أو رمز المدرسة (اختياري)
              </label>
              <input
                type="text"
                value={teacherOrClassCode}
                onChange={(e) => setTeacherOrClassCode(e.target.value)}
                placeholder="أدخل رمز الفصل، رمز المعلم، أو رمز المدرسة (مثل: SCH-2026...)"
                className="w-full text-xs py-3 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono outline-none focus:border-blue-500 uppercase tracking-wider"
              />

              {matchedSchoolByCode && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 truncate">
                      الرمز يطابق: <strong>{matchedSchoolByCode.name}</strong>
                    </span>
                  </div>
                  {selectedSchoolId !== matchedSchoolByCode.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSchoolId(matchedSchoolByCode.id);
                        setSelectedSchoolName(matchedSchoolByCode.name);
                        setSchoolSearchQuery(matchedSchoolByCode.name);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] shrink-0 transition"
                    >
                      تحديد هذه المدرسة
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[11px] shrink-0">
                      ✓ محددة حالياً
                    </span>
                  )}
                </div>
              )}
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
