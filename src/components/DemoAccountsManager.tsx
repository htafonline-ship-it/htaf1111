import React, { useState, useEffect } from 'react';
import { SchoolTenant, UserRole, UserProfile, AuthUser } from '../types';
import {
  fetchSchoolProfiles,
  createRealDemoAccountInSupabase,
  toggleUserAccountStatus,
  extendDemoAccountDuration,
  isSupabaseConfigured
} from '../lib/supabase';
import {
  getUserMFAStatus,
  adminUpdateUserMFA,
  MFAStatus,
  isAdminRole
} from '../lib/twoFactorService';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Calendar,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Copy,
  Check,
  AlertCircle,
  Lock,
  User,
  GraduationCap,
  Crown,
  HeartHandshake,
  Activity,
  RefreshCw,
  Smartphone,
  Key,
  ShieldAlert
} from 'lucide-react';

interface DemoAccountsManagerProps {
  schools: SchoolTenant[];
}

export const DemoAccountsManager: React.FC<DemoAccountsManagerProps> = ({ schools }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for creating a new Demo Account
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [username, setUsername] = useState('student.demo1');
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || 'school-kharj-scicenter');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [customPassword, setCustomPassword] = useState('DemoPass2026!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset demo accounts to generate easily
  const presetDemos = [
    { role: 'student' as UserRole, username: 'student.demo1', fullName: 'طالب تجريبي (معمل العلوم)', title: 'طالب' },
    { role: 'teacher' as UserRole, username: 'teacher.demo1', fullName: 'معلم تجريبي (مشرف الكيمياء)', title: 'معلم' },
    { role: 'parent' as UserRole, username: 'parent.demo1', fullName: 'ولي أمر تجريبي', title: 'ولي أمر' },
    { role: 'counselor' as UserRole, username: 'counselor.demo1', fullName: 'موجه طلابي تجريبي', title: 'مرشد طلابي' },
    { role: 'school_admin' as UserRole, username: 'principal.demo1', fullName: 'مدير مدرسة تجريبي', title: 'مدير مدرسة' },
  ];

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await fetchSchoolProfiles(selectedSchoolId);
      setProfiles(data);
    } catch (err) {
      console.warn('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [selectedSchoolId]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Auto update suggested username
    const prefix = newRole === 'school_admin' ? 'principal' : newRole;
    setUsername(`${prefix}.demo1`);
  };

  const handleApplyPreset = (p: typeof presetDemos[0]) => {
    setRole(p.role);
    setUsername(p.username);
    setFullName(p.fullName);
  };

  const handleCopyCredentials = (u: string, p = 'DemoPass2026!') => {
    navigator.clipboard.writeText(`اسم المستخدم: ${u}\nكلمة المرور: ${p}\nالبريد: ${u}@htaf.online`);
    setCopiedId(u);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'يرجى ملء جميع الحقول الإلزامية' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const expiresAtDate = new Date(Date.now() + expiresInDays * 24 * 3600 * 1000).toISOString();
      const res = await createRealDemoAccountInSupabase({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: `${username.trim().toLowerCase()}@htaf.online`,
        role,
        schoolId: selectedSchoolId,
        expiresAt: expiresAtDate,
        temporaryPassword: customPassword.trim() || 'DemoPass2026!'
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: res.message || `تم إنشاء حساب التجربة بنجاح: ${username.trim().toLowerCase()} (@htaf.online)`
        });
        setFullName('');
        loadProfiles();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.message || 'تعذر إنشاء حساب التجربة. يرجى المحاولة مرة أخرى.'
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'حدث خطأ غير متوقع' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus: 'active' | 'suspended' = currentStatus === 'active' ? 'suspended' : 'active';
    const ok = await toggleUserAccountStatus(userId, newStatus);
    if (ok) {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, accountStatus: newStatus } : p));
      setFeedbackMsg({ type: 'success', text: `تم تحديث حالة الحساب إلى: ${newStatus === 'active' ? 'نشط' : 'معطل'}` });
    }
  };

  const handleExtendDuration = async (userId: string) => {
    const ok = await extendDemoAccountDuration(userId, 30);
    if (ok) {
      loadProfiles();
      setFeedbackMsg({ type: 'success', text: 'تم تمديد فترة الحساب التجريبي بمقدار 30 يوماً إضافية' });
    }
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'student': return { label: 'طالب', color: 'bg-blue-100 text-blue-800' };
      case 'teacher': return { label: 'معلم', color: 'bg-emerald-100 text-emerald-800' };
      case 'parent': return { label: 'ولي أمر', color: 'bg-amber-100 text-amber-800' };
      case 'counselor': return { label: 'مرشد طلابي', color: 'bg-purple-100 text-purple-800' };
      case 'school_admin': return { label: 'مدير مدرسة', color: 'bg-rose-100 text-rose-800' };
      case 'platform_admin': return { label: 'سوبر أدمن', color: 'bg-slate-900 text-amber-300' };
      default: return { label: r, color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-900/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-black px-3.5 py-1 rounded-full border border-emerald-500/30">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>نظام إدارة حسابات التجربة للمنصة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              إدارة مستخدمي التجربة (Experience & Demo Accounts)
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              إنشاء حسابات فعلية معتمدة بأسماء مستخدمين فريدة ونطاق <span className="font-mono text-amber-300 font-bold">@htaf.online</span> مع تاريخ انتهاء وصلاحيات محددة.
            </p>
          </div>

          <button
            onClick={loadProfiles}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2 transition shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث السجلات</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Preset Quick Generator Pills */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <span className="text-xs font-black text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>توليد حسابات تجربة معيارية بضغطة واحدة:</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {presetDemos.map((p) => (
            <button
              key={p.username}
              onClick={() => handleApplyPreset(p)}
              className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-right transition flex flex-col gap-1"
            >
              <span className="text-xs font-black text-slate-800">{p.title}</span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold">{p.username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Create Form (Left) & Accounts List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CREATE FORM */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">إنشاء حساب تجربة جديد</h3>
              <p className="text-[11px] text-slate-500">حساب معتمد ومفعل على المنصة</p>
            </div>
          </div>

          <form onSubmit={handleCreateDemoSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: طالب تجريبي (سعود العتيبي)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية *</label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-emerald-500 outline-none"
              >
                <option value="student">🎓 طالب (Student)</option>
                <option value="teacher">👨‍🏫 معلم (Teacher)</option>
                <option value="parent">👨‍👩‍👧 ولي أمر (Parent)</option>
                <option value="counselor">🩺 موجه / مرشد طلابي (Counselor)</option>
                <option value="school_admin">🏫 مدير مدرسة (School Principal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم الفريد *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                  placeholder="student.demo1"
                  className="w-full pl-24 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:border-emerald-500 font-black text-slate-800 outline-none dir-ltr text-left"
                />
                <span className="absolute left-2 top-2 text-[10px] text-slate-400 font-mono font-bold">@htaf.online</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المدرسة المرتبطة *</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-emerald-500 outline-none"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مدة الصلاحية</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                >
                  <option value={7}>7 أيام</option>
                  <option value={14}>14 يوماً</option>
                  <option value={30}>30 يوماً</option>
                  <option value={90}>90 يوماً</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="DemoPass2026!"
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>تأكيد إنشاء حساب التجربة</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ACCOUNTS LIST (Right 2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">سجل المستخدمين وحسابات التجربة الحالية</h3>
                <p className="text-[11px] text-slate-500">
                  إجمالي السجلات: {profiles.length} مستخدم مسجل بقاعدة البيانات
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              <span>المدرسة: </span>
              <span className="text-slate-800 font-black">
                {schools.find(s => s.id === selectedSchoolId)?.name || 'الكل'}
              </span>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold">لا توجد حسابات مسجلة لهذه المدرسة بعد</p>
              <p className="text-[11px]">يمكنك إنشاء حسابات تجربة من النموذج الجانبي أو تشغيل كود التهيئة SQL</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {profiles.map((p) => {
                const roleBadge = getRoleLabel(p.role);
                const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
                const isActive = p.accountStatus === 'active' && !isExpired;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-300'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-700 font-black flex items-center justify-center text-sm shrink-0">
                        {p.fullName ? p.fullName.slice(0, 1) : 'م'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{p.fullName}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                          {p.isDemoAccount && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                              Demo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-700">@{p.username}</span>
                          <span>•</span>
                          <span>{p.email}</span>
                          {p.expiresAt && (
                            <>
                              <span>•</span>
                              <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                {isExpired ? 'منتهي الصلاحية' : `ينتهي: ${p.expiresAt.split('T')[0]}`}
                              </span>
                            </>
                          )}
                        </div>

                        {/* 2FA / MFA Status Badge */}
                        <div className="flex items-center gap-2 pt-1">
                          {(() => {
                            const mfaStatus = getUserMFAStatus({ id: p.id, email: p.email, username: p.username, role: p.role });
                            const isEnforced = isAdminRole(p.role);
                            return (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                mfaStatus === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : mfaStatus === 'required' || isEnforced
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : mfaStatus === 'reset_required'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>2FA: {mfaStatus === 'active' ? 'مفعلة ونشطة' : isEnforced || mfaStatus === 'required' ? 'إلزامية (مطلوبة)' : mfaStatus === 'reset_required' ? 'إعادة إعداد مطلوبة' : 'غير مفعلة'}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCredentials(p.username)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 transition shadow-sm"
                        title="نسخ بيانات الدخول"
                      >
                        {copiedId === p.username ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === p.username ? 'تم النسخ' : 'نسخ'}</span>
                      </button>

                      {/* Admin MFA Action Quick Toggle */}
                      <button
                        onClick={() => {
                          const adminSimUser: AuthUser = {
                            id: 'admin-action-user',
                            role: 'super_admin',
                            email: 'htaf.online@gmail.com',
                            username: 'superadmin',
                            fullName: 'المشرف العام',
                            loginMethod: 'credentials'
                          };
                          const currentStatus = getUserMFAStatus({ id: p.id, email: p.email, username: p.username, role: p.role });
                          const nextAction = currentStatus === 'active' || currentStatus === 'required' ? 'disable' : 'enforce';
                          adminUpdateUserMFA(adminSimUser, p.id, p.email || `${p.username}@htaf.online`, p.role, nextAction);
                          setFeedbackMsg({
                            type: 'success',
                            text: nextAction === 'enforce' ? `تم فرض المصادقة الثنائية (2FA) على الحساب @${p.username}` : `تم إلغاء 2FA للحساب @${p.username}`
                          });
                          setTimeout(() => setFeedbackMsg(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 transition"
                        title="إدارة وتحديث حالة المصادقة الثنائية 2FA"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>تحكم 2FA</span>
                      </button>

                      {p.isDemoAccount && (
                        <button
                          onClick={() => handleExtendDuration(p.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition"
                          title="تمديد 30 يوماً"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>تمديد</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleStatus(p.id, p.accountStatus)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          p.accountStatus === 'active'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {p.accountStatus === 'active' ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>تعطيل</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تفعيل</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
