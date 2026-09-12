import React, { useState, useEffect } from 'react';
import { AuthUser, SchoolTenant, LinkedChild, ParentLinkRequest, ParentRelationship } from '../../types';
import {
  findStudentForParent,
  submitParentLinkRequest,
  fetchParentLinkRequests,
  fetchParentLinkedStudents,
  fetchSupabaseSchools
} from '../../lib/supabase';
import {
  UserCheck,
  Search,
  School,
  IdCard,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  XCircle
} from 'lucide-react';

interface ParentLinkChildrenGateProps {
  currentUser: AuthUser;
  currentSchool?: SchoolTenant | null;
  onChildLinkedSuccess: () => void;
  onCancel?: () => void;
}

export const ParentLinkChildrenGate: React.FC<ParentLinkChildrenGateProps> = ({
  currentUser,
  currentSchool = null,
  onChildLinkedSuccess,
  onCancel
}) => {
  const [schools, setSchools] = useState<SchoolTenant[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchool?.id || '');
  const [studentNumberInput, setStudentNumberInput] = useState<string>('');
  const [verificationInput, setVerificationInput] = useState<string>(currentUser.phone || '');
  const [parentNameInput, setParentNameInput] = useState<string>(currentUser.fullName || currentUser.username || 'ولي الأمر');
  const [relationship, setRelationship] = useState<ParentRelationship>('father');

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{
    id: string;
    schoolId: string;
    fullName: string;
    gradeName: string;
    classroomName: string;
    studentNumber: string;
    hasMatchingContact: boolean;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    success: boolean;
    autoApproved: boolean;
    message: string;
  } | null>(null);

  const [existingRequests, setExistingRequests] = useState<ParentLinkRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(true);

  // Load schools list
  useEffect(() => {
    let isMounted = true;
    const loadSchools = async () => {
      try {
        const list = await fetchSupabaseSchools();
        if (isMounted) {
          setSchools(list);
          if (!selectedSchoolId && list.length > 0) {
            setSelectedSchoolId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Error loading schools in ParentLinkChildrenGate:', err);
      }
    };
    loadSchools();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load parent's previous or pending link requests
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const requests = await fetchParentLinkRequests(currentUser.id, currentUser.email);
      setExistingRequests(requests);
    } catch (err) {
      console.warn('Error fetching parent link requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadRequests();
    }
  }, [currentUser?.id]);

  // Handle Search for Student
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    setSubmitFeedback(null);

    const schoolId = selectedSchoolId.trim();
    const studentNum = studentNumberInput.trim();

    if (!schoolId) {
      setSearchError('يرجى اختيار مدرسة الابن/الابنة أولاً');
      return;
    }

    if (!studentNum) {
      setSearchError('يرجى إدخال رقم الهوية الوطنية أو كود الطالب في المدرسة');
      return;
    }

    setIsSearching(true);
    try {
      const res = await findStudentForParent(schoolId, studentNum, verificationInput);
      if (res.found && res.student) {
        setSearchResult({
          ...res.student,
          hasMatchingContact: res.hasMatchingContact
        });
      } else {
        setSearchError(res.errorMessage || 'لم يتم العثور على طالب بهذه البيانات في المدرسة المختارة. يرجى التأكد من المدرسة ورقم الهوية بدقة.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Submit Link Request
  const handleConfirmLink = async () => {
    if (!searchResult) return;

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const result = await submitParentLinkRequest({
        parentUserId: currentUser.id,
        parentEmail: currentUser.email,
        parentName: parentNameInput.trim() || 'ولي الأمر',
        parentPhone: verificationInput.trim() || currentUser.phone || '',
        studentId: searchResult.id,
        schoolId: searchResult.schoolId,
        relationship: relationship,
        verificationValue: verificationInput.trim()
      });

      setSubmitFeedback(result);

      if (result.success) {
        await loadRequests();
        if (result.autoApproved) {
          // Immediately notify parent
          setTimeout(() => {
            onChildLinkedSuccess();
          }, 1800);
        }
      }
    } catch (err: any) {
      setSubmitFeedback({
        success: false,
        autoApproved: false,
        message: err?.message || 'فشل إرسال طلب الربط، يرجى المحاولة مرة أخرى'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSchoolObj = schools.find((s) => s.id === selectedSchoolId) || currentSchool;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 px-2 sm:px-4" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              <UserPlus className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">ربط حساب ولي الأمر بالأبناء</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                  نظام آمن ومحمي
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1 max-w-xl">
                حفاظاً على خصوصية أبنائنا وبناتنا، البحث مقيد برقم هوية الطالب واسم مدرسته فقط ولا يتم إظهار أي طالب دون تطابق البيانات.
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition"
            >
              العودة
            </button>
          )}
        </div>
      </div>

      {/* Main Search Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">البحث والتحقق من الابن / الابنة</h3>
              <p className="text-xs text-slate-500">أدخل اسم المدرسة ورقم هوية الطالب بدقة</p>
            </div>
          </div>

          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            خطوة 1 من 2
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* School Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <School className="w-4 h-4 text-emerald-600" />
              <span>المدرسة المسجل بها الطالب *</span>
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setSearchResult(null);
                setSearchError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            >
              <option value="">-- اختر مدرسة الابن --</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} {sch.city ? `(${sch.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Student ID / Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-emerald-600" />
              <span>رقم الهوية الوطنية / الإقامة للابن أو كود الطالب *</span>
            </label>
            <input
              type="text"
              value={studentNumberInput}
              onChange={(e) => {
                setStudentNumberInput(e.target.value);
                setSearchResult(null);
                setSearchError('');
              }}
              placeholder="مثال: 1089345210 أو STD-102"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            />
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>صفة القرابة *</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRelationship('father')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  relationship === 'father'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                أب
              </button>
              <button
                type="button"
                onClick={() => setRelationship('mother')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  relationship === 'mother'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                أم
              </button>
              <button
                type="button"
                onClick={() => setRelationship('guardian')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  relationship === 'guardian'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ولي أمر / وصيّ
              </button>
            </div>
          </div>

          {/* Verification Contact for Instant Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>رقم جوال ولي الأمر أو البريد للربط الفوري (اختياري)</span>
            </label>
            <input
              type="text"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              placeholder="مثال: 05xxxxxxxx للمطابقة المباشرة مع سجل المدرسة"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الاستعلام الآمن من قاعدة بيانات المدرسة...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>البحث والتحقق من الطالب</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Search Error Alert */}
        {searchError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-rose-900">تعذر العثور على الطالب</div>
              <p>{searchError}</p>
            </div>
          </div>
        )}

        {/* Found Student Result Card */}
        {searchResult && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-slate-50 border-2 border-emerald-500/40 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow">
                  👨‍🎓
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800">بيانات الطالب المطابق:</div>
                  <h4 className="text-lg font-black text-slate-900">{searchResult.fullName}</h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                  رقم الهوية: {searchResult.studentNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">المدرسة:</span>
                <span className="font-bold text-slate-800">{selectedSchoolObj?.name || 'المدرسة'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">المرحلة والصف:</span>
                <span className="font-bold text-slate-800">{searchResult.gradeName}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[11px]">الفصل الدراسي:</span>
                <span className="font-bold text-slate-800">{searchResult.classroomName}</span>
              </div>
            </div>

            {/* Verification Status info */}
            {searchResult.hasMatchingContact ? (
              <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>
                  تطابق رقم الجوال / البريد مع سجلات المدرسة! سيتم ربط حسابك وتفعيله فورياً بنقرة واحدة.
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  سيتم إرسال طلب ربط الحساب إلى إدارة المدرسة للاعتماد السريع والتأكد من صلة القرابة.
                </span>
              </div>
            )}

            {/* Confirm Link Button */}
            <button
              type="button"
              onClick={handleConfirmLink}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تأكيد الربط وتسجيل الصلاحيات...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>تأكيد الربط واعتماد حساب ولي الأمر</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Submit Feedback Toast/Alert */}
        {submitFeedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 ${
              submitFeedback.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {submitFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div>{submitFeedback.message}</div>
              {submitFeedback.autoApproved && (
                <div className="text-[11px] text-emerald-700">
                  جاري نقلك مباشرة إلى لوحة متابعة الابن...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Existing Requests History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <h3 className="font-extrabold text-slate-900 text-base">سجل طلبات الربط السابقة</h3>
          </div>

          <button
            onClick={loadRequests}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-emerald-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
        </div>

        {isLoadingRequests ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>جاري تحميل طلباتك السابقة...</span>
          </div>
        ) : existingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
            لا توجد طلبات ربط سابقة قيد الانتظار. ابحث عن ابنك أعلاه لربط حسابه.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {existingRequests.map((req) => (
              <div key={req.id} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{req.studentName || 'الطالب'}</span>
                    <span className="text-[11px] text-slate-500">
                      ({req.relationship === 'mother' ? 'أم' : req.relationship === 'guardian' ? 'ولي أمر' : 'أب'})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span>{req.schoolName || 'المدرسة'}</span> •{' '}
                    <span>{new Date(req.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {req.rejectionReason && (
                    <div className="text-xs text-rose-600 font-semibold">سبب الرفض: {req.rejectionReason}</div>
                  )}
                </div>

                <div>
                  {req.status === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>معتمد ومربوط</span>
                      </span>
                      <button
                        onClick={onChildLinkedSuccess}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        فتح اللوحة
                      </button>
                    </div>
                  ) : req.status === 'rejected' ? (
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>مرفوض</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>قيد مراجعة المدرسة</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
