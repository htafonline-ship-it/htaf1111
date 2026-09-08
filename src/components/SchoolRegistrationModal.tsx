import React, { useState, useEffect } from 'react';
import {
  SchoolTenant,
  SchoolGender,
  SchoolEducationType,
  SchoolStage,
  AuthUser
} from '../types';
import {
  formatSchoolDisplayName,
  generateUniqueInvitationCode,
  generateUniqueReferenceNumber,
  checkSchoolDuplicates,
  buildJoinSchoolUrl
} from '../utils/schoolCodeGenerator';
import { SchoolLocationPicker, SchoolLocationData } from './SchoolLocationPicker';
import {
  createSupabaseSchool,
  saveSupabaseSchoolInvitation,
  fetchSupabaseSchools,
  isSupabaseConfigured,
  DbSchool
} from '../lib/supabase';
import {
  Building2,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  MapPin,
  Mail,
  Phone,
  Layers,
  ArrowRight,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  UserCheck,
  HelpCircle,
  FileCheck2,
  Users
} from 'lucide-react';

interface SchoolRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSchools: SchoolTenant[];
  currentUser?: AuthUser | null;
  initialCode?: string;
  onSuccessRegistered?: (school: SchoolTenant, codeUsed?: string) => void;
  onSuccessRequested?: (newSchool: Partial<SchoolTenant>) => void;
}

export const SchoolRegistrationModal: React.FC<SchoolRegistrationModalProps> = ({
  isOpen,
  onClose,
  existingSchools,
  currentUser,
  initialCode = '',
  onSuccessRegistered,
  onSuccessRequested
}) => {
  const [activeMode, setActiveMode] = useState<'with_code' | 'request_new'>(
    initialCode ? 'with_code' : 'with_code'
  );

  // Tab 1: With Code State
  const [inviteCodeInput, setInviteCodeInput] = useState(initialCode);
  const [matchedSchool, setMatchedSchool] = useState<SchoolTenant | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'school_admin' | 'teacher' | 'student' | 'parent'>('school_admin');
  const [userName, setUserName] = useState(currentUser?.fullName || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [isCodeRegistering, setIsCodeRegistering] = useState(false);
  const [codeSuccessMessage, setCodeSuccessMessage] = useState<string | null>(null);

  // Tab 2: Request New School State
  const [schoolName, setSchoolName] = useState('');
  const [schoolGender, setSchoolGender] = useState<SchoolGender>('boys');
  const [educationType, setEducationType] = useState<SchoolEducationType>('حكومي');
  const [stage, setStage] = useState<SchoolStage>('ثانوي');
  const [moeCode, setMoeCode] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [phone, setPhone] = useState('05');
  const [principalName, setPrincipalName] = useState(''); // Strictly optional
  const [locationData, setLocationData] = useState<SchoolLocationData>({
    regionId: 'reg-riyadh',
    regionName: 'منطقة الرياض',
    governorateId: 'gov-kharj',
    governorateName: 'محافظة الخرج',
    cityId: 'city-saihat-kharj',
    cityName: 'مدينة السيح',
    district: 'حي الخزامى',
    shortNationalAddress: 'KHRA4291',
    postalCode: '11942',
    latitude: 24.1556,
    longitude: 47.3119,
    educationDirectorate: 'إدارة التعليم بمحافظة الخرج'
  });

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSubmittedSuccess, setRequestSubmittedSuccess] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronize initial code
  useEffect(() => {
    if (initialCode) {
      setInviteCodeInput(initialCode);
      verifyCode(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  // Real-time verification of code
  const verifyCode = (code: string) => {
    const clean = (code || '').trim().toUpperCase();
    setCodeError(null);
    setMatchedSchool(null);

    if (!clean) return;

    // Search in existing schools by invitationCode or registrationCodeUsed
    const found = existingSchools.find(
      (s) =>
        s.invitationCode?.trim().toUpperCase() === clean ||
        s.registrationCodeUsed?.trim().toUpperCase() === clean ||
        (s.slug && s.slug.toUpperCase() === clean)
    );

    if (found) {
      setMatchedSchool(found);
    } else {
      setCodeError('رمز الدعوة أو كود التسجيل المدخل غير مسجل أو غير مفعّل.');
    }
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInviteCodeInput(val);
    if (val.length >= 6) {
      verifyCode(val);
    } else {
      setMatchedSchool(null);
      setCodeError(null);
    }
  };

  // Submit Join by Code
  const handleJoinByCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedSchool) {
      setCodeError('يُرجى إدخال رمز دعوة صحيح أولاً.');
      return;
    }

    setIsCodeRegistering(true);
    setCodeError(null);

    try {
      if (onSuccessRegistered) {
        onSuccessRegistered(matchedSchool, inviteCodeInput);
      }
      setCodeSuccessMessage(`تم ربط حسابك بنجاح بمدرسة: ${formatSchoolDisplayName(matchedSchool.name, matchedSchool.gender)}`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setCodeError(err.message || 'حدث خطأ أثناء إتمام الربط.');
    } finally {
      setIsCodeRegistering(false);
    }
  };

  // Check Duplicate in real-time when typing school name
  const handleSchoolNameChange = (val: string) => {
    setSchoolName(val);
    if (val.trim().length >= 4) {
      const dupCheck = checkSchoolDuplicates(
        {
          name: val,
          moeCode,
          region: locationData.regionName,
          governorate: locationData.governorateName,
          city: locationData.cityName,
          lat: locationData.latitude,
          lng: locationData.longitude
        },
        existingSchools
      );
      if (dupCheck.isDuplicate) {
        setDuplicateWarning(`⚠️ تنبيه تكرار: ${dupCheck.matchReason}`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Submit Request for New School
  const handleRequestNewSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setRequestError('يُرجى إدخال اسم المدرسة الرسمي.');
      return;
    }

    // Duplicate Check
    const dupCheck = checkSchoolDuplicates(
      {
        name: schoolName,
        moeCode,
        region: locationData.regionName,
        governorate: locationData.governorateName,
        city: locationData.cityName,
        lat: locationData.latitude,
        lng: locationData.longitude
      },
      existingSchools
    );

    if (dupCheck.isDuplicate) {
      setDuplicateWarning(`⚠️ يبدو أن هذه المدرسة مسجلة مسبقاً: ${dupCheck.matchReason}`);
      // If MOE code matches, block
      if (moeCode && dupCheck.matchReason?.includes('الرقم الوزاري')) {
        setRequestError('لا يمكن إنشاء مدرسة برقم وزاري مكرر مسجل مسبقاً في النظام.');
        return;
      }
    }

    setIsSubmittingRequest(true);
    setRequestError(null);

    try {
      const existingCodes = existingSchools.map((s) => s.invitationCode || '');
      const existingRefs = existingSchools.map((s) => s.referenceNumber || '');

      const autoInviteCode = generateUniqueInvitationCode(existingCodes);
      const autoRefNumber = generateUniqueReferenceNumber(existingRefs);
      const formattedSlug = `sch-${Date.now().toString(36)}`;

      const newSchoolPayload: SchoolTenant = {
        id: `school-${Date.now()}`,
        name: schoolName.trim(),
        nameEn: 'Saudi Smart School',
        slug: formattedSlug,
        logoText: schoolName ? schoolName.slice(0, 1) : 'م',
        badge: `${educationType} - ${schoolGender === 'girls' ? 'بنات' : schoolGender === 'boys' ? 'بنين' : 'مشتركة'}`,
        primaryColor: schoolGender === 'girls' ? '#d946ef' : '#059669',
        accentColor: schoolGender === 'girls' ? '#ec4899' : '#10b981',
        motto: 'الريادة التعليمية والتحول الرقمي',
        location: `${locationData.governorateName} - ${locationData.cityName} - ${locationData.district}`,
        gender: schoolGender,
        educationType,
        stage,
        regionId: locationData.regionId,
        regionName: locationData.regionName,
        governorateId: locationData.governorateId,
        governorateName: locationData.governorateName,
        cityId: locationData.cityId,
        cityName: locationData.cityName,
        district: locationData.district,
        shortNationalAddress: locationData.shortNationalAddress,
        postalCode: locationData.postalCode,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        educationDirectorate: locationData.educationDirectorate,
        moeCode: moeCode.trim() || undefined,
        officialEmail: officialEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        principalName: principalName.trim() || undefined,
        status: 'pending_review',
        isApproved: false,
        invitationCode: autoInviteCode,
        referenceNumber: autoRefNumber,
        totalStudentsCount: 0,
        totalTeachersCount: 0,
        circulars: []
      };

      // Save to Supabase if configured
      if (isSupabaseConfigured) {
        try {
          await createSupabaseSchool(
            {
              name: newSchoolPayload.name,
              type: educationType,
              gender_type: schoolGender === 'girls' ? 'بنات' : schoolGender === 'boys' ? 'بنين' : 'مشتركة',
              school_gender: schoolGender,
              stage,
              country: 'المملكة العربية السعودية',
              region: locationData.regionName,
              region_id: locationData.regionId,
              governorate: locationData.governorateName,
              governorate_id: locationData.governorateId,
              city: locationData.cityName,
              city_id: locationData.cityId,
              district: locationData.district,
              short_national_address: locationData.shortNationalAddress,
              postal_code: locationData.postalCode,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              education_directorate: locationData.educationDirectorate,
              moe_code: moeCode,
              principal_name: principalName || 'إدارة المدرسة',
              phone,
              email: officialEmail,
              license_number: moeCode,
              academic_year: '1448 هـ (2026/2027م)',
              slug: formattedSlug,
              invitation_code: autoInviteCode,
              reference_number: autoRefNumber,
            },
            currentUser?.id || 'pending-user',
            currentUser?.email || officialEmail || 'admin@school.edu.sa',
            currentUser?.fullName || principalName || 'مسؤول المدرسة'
          );
        } catch (dbErr) {
          console.warn('Supabase school insertion warning:', dbErr);
        }
      }

      if (onSuccessRequested) {
        onSuccessRequested(newSchoolPayload);
      }

      setRequestSubmittedSuccess({
        school: newSchoolPayload,
        invitationCode: autoInviteCode,
        referenceNumber: autoRefNumber,
        joinUrl: buildJoinSchoolUrl(autoInviteCode)
      });
    } catch (err: any) {
      setRequestError(err.message || 'حدث خطأ أثناء إرسال طلب تسجيل المدرسة.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleCopyJoinLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 border-b border-emerald-900/50 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-block mb-1">
                  بوابة المدارس المعتمدة
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  تسجيل وربط المدارس في منصة حقائق العلوم
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 mt-6 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('with_code')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'with_code'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>لدي رمز دعوة (انضمام لمدرسة)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('request_new')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'request_new'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>أرغب بتسجيل مدرستي (طلب جديد)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          
          {/* ============================================================== */}
          {/* OPTION 1: JOIN WITH INVITATION CODE */}
          {/* ============================================================== */}
          {activeMode === 'with_code' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h4 className="text-lg font-black text-slate-900">
                  الانضمام إلى مدرسة مسجلة عبر رمز الدعوة
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  أدخل رمز الدعوة الفريد (مثل: <code className="bg-slate-100 text-emerald-700 font-mono px-2 py-0.5 rounded font-bold">SCH-K7P4X9</code>) للربط التلقائي بمدرستك.
                </p>
              </div>

              <form onSubmit={handleJoinByCodeSubmit} className="max-w-xl mx-auto space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800">
                    رمز الدعوة / كود التسجيل المعتمد <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={handleCodeInputChange}
                      placeholder="SCH-XXXXXX أو SCH-2026-..."
                      className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-mono font-black text-slate-900 tracking-wider outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>
                </div>

                {codeError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{codeError}</span>
                  </div>
                )}

                {codeSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{codeSuccessMessage}</span>
                  </div>
                )}

                {/* Real-time Matched School Preview Card */}
                {matchedSchool && (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                          تم التحقق من صحة الرمز
                        </span>
                        <h5 className="text-base sm:text-lg font-black text-slate-900">
                          أنت بصدد التسجيل ضمن مدرسة:
                        </h5>
                        <p className="text-base font-black text-emerald-800">
                          {formatSchoolDisplayName(matchedSchool.name, matchedSchool.gender)}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                        {matchedSchool.name ? matchedSchool.name.slice(0, 1) : 'م'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-emerald-200/60 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-slate-400 block text-[10px] font-bold">نوع المدرسة</span>
                        <span className="font-black text-slate-800">
                          {matchedSchool.gender === 'girls' ? 'مدارس بنات 👧' : matchedSchool.gender === 'boys' ? 'مدارس بنين 👦' : 'مشتركة 👥'}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-slate-400 block text-[10px] font-bold">الموقع</span>
                        <span className="font-black text-slate-800 truncate block">
                          {matchedSchool.location || 'الخرج'}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[10px] font-bold">حالة الاعتماد</span>
                        <span className="font-black text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>معتمدة بالمنصة</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>لا يمكن تغيير المدرسة بعد إتمام عملية الربط لضمان أمان البيانات.</span>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-slate-800">
                        صفتك في المدرسة <span className="text-rose-600">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'school_admin', label: 'مدير / إدارة' },
                          { id: 'teacher', label: 'معلم / معلمة' },
                          { id: 'student', label: 'طالب / طالبة' },
                          { id: 'parent', label: 'ولي أمر' }
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedRole(r.id as any)}
                            className={`p-2.5 rounded-xl text-xs font-black border transition ${
                              selectedRole === r.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCodeRegistering}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {isCodeRegistering ? (
                        <span>جارٍ إتمام الربط وتفعيل الحساب...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>إكمال التسجيل والربط بالمدرسة</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* OPTION 2: REQUEST NEW SCHOOL REGISTRATION */}
          {/* ============================================================== */}
          {activeMode === 'request_new' && (
            <div>
              {requestSubmittedSuccess ? (
                /* Success Screen for School Request */
                <div className="max-w-xl mx-auto p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <FileCheck2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full border border-amber-300">
                      قيد مراجعة وتفعيل Super Admin
                    </span>
                    <h4 className="text-xl font-black text-slate-900">
                      تم استلام طلب تسجيل المدرسة بنجاح!
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      تم حفظ بيانات المدرسة، وتوليد رمز الدعوة التلقائي والرقم المرجعي في قاعدة البيانات. ستصبح المدرسة مفعلة فور اعتمادها.
                    </p>
                  </div>

                  {/* Generated Unique Code & Ref Box */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-right space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">اسم المنشأة التعليمية:</span>
                      <span className="text-xs font-black text-slate-900">
                        {formatSchoolDisplayName(requestSubmittedSuccess.school.name, requestSubmittedSuccess.school.gender)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500 font-bold">الرقم المرجعي التلقائي:</span>
                      <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                        {requestSubmittedSuccess.referenceNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500 font-bold">رمز الدعوة الفريد:</span>
                      <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {requestSubmittedSuccess.invitationCode}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1.5">
                      <span className="text-xs text-slate-500 font-bold block">رابط الانضمام التلقائي:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={requestSubmittedSuccess.joinUrl}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyJoinLink(requestSubmittedSuccess.joinUrl)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl shrink-0 transition"
                          title="نسخ الرابط"
                        >
                          {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3 rounded-xl transition"
                  >
                    إغلاق والعودة للمنصة
                  </button>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRequestNewSchoolSubmit} className="space-y-6">
                  {duplicateWarning && (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold space-y-1">
                      <div className="flex items-center gap-2 text-amber-950 font-black">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>تنبيه منع تكرار المدارس:</span>
                      </div>
                      <p>{duplicateWarning}</p>
                    </div>
                  )}

                  {requestError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  {/* Section 1: School Name & Gender Support */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                    <h5 className="font-black text-xs text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>هوية المدرسة ونوع الجنس والمرحلة</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* School Name */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-black text-slate-800">
                          اسم المدرسة الرسمي <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => handleSchoolNameChange(e.target.value)}
                          placeholder="مثال: ثانوية الملك عبدالله أو الثانوية الأولى للبنات"
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400">
                          المعاينة باللوحة: <strong className="text-slate-700">{formatSchoolDisplayName(schoolName || 'اسم المدرسة', schoolGender)}</strong>
                        </span>
                      </div>

                      {/* School Gender: Boys / Girls / Mixed */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-800">
                          نوع المدرسة (School Gender) <span className="text-rose-600">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'boys', label: 'بنين 👦', badge: 'بنين' },
                            { id: 'girls', label: 'بنات 👧', badge: 'بنات' },
                            { id: 'mixed', label: 'مشتركة 👥', badge: 'مشتركة' }
                          ].map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setSchoolGender(g.id as SchoolGender)}
                              className={`p-2.5 rounded-xl text-xs font-black border transition ${
                                schoolGender === g.id
                                  ? g.id === 'girls'
                                    ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                    : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Education Type */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-800">
                          نوع التعليم <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={educationType}
                          onChange={(e) => setEducationType(e.target.value as SchoolEducationType)}
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="حكومي">حكومي</option>
                          <option value="أهلي">أهلي</option>
                          <option value="عالمي">عالمي</option>
                          <option value="تحفيظ قرآن">تحفيظ قرآن</option>
                          <option value="تربية خاصة">تربية خاصة</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>

                      {/* Stage */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-800">
                          المرحلة الدراسية <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value as SchoolStage)}
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="ابتدائي">ابتدائي</option>
                          <option value="متوسط">متوسط</option>
                          <option value="ثانوي">ثانوي</option>
                          <option value="مجمع تعليمي">مجمع تعليمي</option>
                          <option value="روضة">روضة</option>
                        </select>
                      </div>

                      {/* MOE Code / License */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-800">
                          الرقم الوزاري / رقم المدرسة (إن توفر)
                        </label>
                        <input
                          type="text"
                          value={moeCode}
                          onChange={(e) => setMoeCode(e.target.value)}
                          placeholder="مثال: 441029"
                          className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Interactive Location Picker */}
                  <SchoolLocationPicker
                    initialData={locationData}
                    onChange={(loc) => setLocationData(loc)}
                    existingSchools={existingSchools}
                    currentSchoolName={schoolName}
                    currentMoeCode={moeCode}
                  />

                  {/* Section 3: Official Contact Information */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                    <h5 className="font-black text-xs text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <span>بيانات التواصل الرسمية للمنشأة</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-slate-700">
                          البريد الإلكتروني الرسمي للمدرسة
                        </label>
                        <input
                          type="email"
                          value={officialEmail}
                          onChange={(e) => setOfficialEmail(e.target.value)}
                          placeholder="admin@school.edu.sa"
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-slate-700">
                          رقم التواصل الرسمي
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05XXXXXXXX"
                          className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-slate-700 flex items-center justify-between">
                          <span>اسم المدير أو المديرة</span>
                          <span className="text-slate-400 text-[10px] font-normal">(اختياري)</span>
                        </label>
                        <input
                          type="text"
                          value={principalName}
                          onChange={(e) => setPrincipalName(e.target.value)}
                          placeholder="الحساب مرتبط بالمدرسة وليس بالشخص"
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-4 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {isSubmittingRequest ? (
                        <span>جارٍ تسجيل وحفظ بيانات المدرسة...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>إرسال طلب تسجيل المدرسة والمراجعة</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      سيتم مراجعة الطلب من قِبل Super Admin وتوليد رابط الانضمام التلقائي واعتماد المدرسة رسمياً.
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
