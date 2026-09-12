import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, UserRole, SchoolTenant } from '../types';
import {
  supabase,
  supabaseUrl,
  supabaseAnonKey,
  signInWithUsernameOrEmail,
  isSupabaseConfigured,
  normalizeAuthInput
} from '../lib/supabase';
import {
  is2FAEnabledForUser,
  verifyUserMFAChallenge,
  isAdminRole,
  maskEmail
} from '../lib/twoFactorService';
import { BrandLogo } from './BrandLogo';
import {
  X,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Smartphone,
  Key,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Settings
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  onOpenSupabaseConfig?: () => void;
  initialMode?: 'login' | 'register';
  schools?: SchoolTenant[];
  onOpenSchoolRegistration?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  schools = [],
}) => {
  const [mainMode, setMainMode] = useState<'login' | 'register'>(initialMode || 'login');
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);

  // Credentials State (Supabase Password Auth)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleNotConfigured, setGoogleNotConfigured] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // 2FA Verification State
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'totp' | 'recovery'>('totp');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync mode when initialMode or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setMainMode(initialMode || 'login');
      setErrorMessage('');
      setShowCredentialsForm(false);
    }
  }, [isOpen, initialMode]);

  // Focus first OTP input when 2FA step opens
  useEffect(() => {
    if (is2FAStep && authMode === 'totp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [is2FAStep, authMode]);

  if (!isOpen) return null;

  const initiate2FAForUser = (user: AuthUser) => {
    setPendingAuthUser(user);
    setOtpDigits(['', '', '', '', '', '']);
    setRecoveryCodeInput('');
    setAuthMode('totp');
    setIs2FAStep(true);
    setErrorMessage('');
  };

  // Google OAuth Login via Supabase Auth with diagnostic pre-verification
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setGoogleNotConfigured(false);

    try {
      const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://htaf.online';
      
      // Step 1: Obtain the OAuth URL with skipBrowserRedirect so we can check if the provider is enabled
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: origin,
          skipBrowserRedirect: true,
        }
      });

      if (error) {
        if (error.message?.includes('Unsupported provider') || error.message?.includes('provider is not enabled')) {
          setGoogleNotConfigured(true);
          setShowCredentialsForm(true);
          setErrorMessage('موفر تسجيل الدخول بقوقل غير مفعّل في لوحة تحكم Supabase.');
        } else {
          setErrorMessage(error.message || 'تعذر بدء تسجيل الدخول عبر Google. يرجى المحاولة لاحقاً.');
        }
        setIsLoading(false);
        return;
      }

      if (!data?.url) {
        setErrorMessage('تعذر استلام رابط التوجيه الخاص بـ Google من الخادم.');
        setIsLoading(false);
        return;
      }

      // Step 2: Pre-check the authorize endpoint to avoid showing a raw JSON error page to the user
      try {
        const verifyRes = await fetch(data.url, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
          }
        });

        if (verifyRes.status === 400) {
          const bodyJson = await verifyRes.json().catch(() => null);
          if (bodyJson?.msg?.includes('Unsupported provider') || bodyJson?.error_code === 'validation_failed') {
            setIsLoading(false);
            setGoogleNotConfigured(true);
            setShowCredentialsForm(true);
            setErrorMessage('موفر تسجيل الدخول بقوقل (Google Provider) غير مفعّل بعد في لوحة تحكم Supabase.');
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Google pre-check network info:', checkErr);
      }

      // Step 3: Provider is active, navigate to Google sign-in
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      if (err?.message?.includes('Unsupported provider') || err?.message?.includes('provider is not enabled')) {
        setGoogleNotConfigured(true);
        setShowCredentialsForm(true);
        setErrorMessage('موفر تسجيل الدخول بقوقل غير مفعّل بعد في Supabase.');
      } else {
        setErrorMessage(err?.message || 'تعذر بدء تسجيل الدخول عبر Google. يرجى التحقق من الاتصال.');
      }
      setIsLoading(false);
    }
  };

  // Handle Credentials Submit via Supabase
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = normalizeAuthInput(username);
    const cleanPass = normalizeAuthInput(password);

    if (!cleanUsername || !cleanPass) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithUsernameOrEmail(cleanUsername, cleanPass);
      const authUser = result.authUser;

      if (is2FAEnabledForUser(authUser)) {
        initiate2FAForUser(authUser);
        return;
      }

      onLoginSuccess(authUser);
      onClose();
    } catch (err: any) {
      console.error('Credentials login error:', err);
      setErrorMessage(err?.message || 'بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA OTP Digits Handler
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (digits.length === 6) {
        otpInputRefs.current[5]?.focus();
      }
      return;
    }

    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify 2FA
  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuthUser) return;

    setErrorMessage('');
    setIsLoading(true);

    try {
      const code = otpDigits.join('');
      if (code.length !== 6) {
        setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
        setIsLoading(false);
        return;
      }

      const verified = await verifyUserMFAChallenge(pendingAuthUser, code, 'totp');
      if (verified.success) {
        setTwoFactorSuccess(true);
        setTimeout(() => {
          onLoginSuccess(pendingAuthUser);
          onClose();
        }, 800);
      } else {
        setErrorMessage(verified.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر التحقق من الرمز.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Recovery Code
  const handleVerifyRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuthUser) return;

    setErrorMessage('');
    setIsLoading(true);

    try {
      const verified = await verifyUserMFAChallenge(pendingAuthUser, recoveryCodeInput.trim(), 'recovery');
      if (verified.success) {
        setTwoFactorSuccess(true);
        setTimeout(() => {
          onLoginSuccess(pendingAuthUser);
          onClose();
        }, 800);
      } else {
        setErrorMessage(verified.error || 'رمز الاسترداد غير صحيح أو تم استخدامه مسبقاً.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر التحقق من رمز الاسترداد.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn dir-rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative transition-all">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={() => {
              if (is2FAStep) {
                setIs2FAStep(false);
                setPendingAuthUser(null);
                setErrorMessage('');
              } else {
                onClose();
              }
            }}
            className="absolute left-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <BrandLogo size="md" glow={true} />
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {is2FAStep
                  ? 'التحقق بخطوتين (2FA)'
                  : mainMode === 'register'
                  ? 'تسجيل حساب جديد بالمنصة'
                  : 'تسجيل الدخول للمنصة'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {is2FAStep
                  ? 'أدخل رمز التحقق للمتابعة الآمنة'
                  : 'منصة هتاف العاصمي التعليمية الذكية'}
              </p>
            </div>
          </div>
        </div>

        {/* 2FA Challenge View */}
        {is2FAStep && pendingAuthUser ? (
          <div className="p-6 space-y-5 animate-fadeIn">
            <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                {authMode === 'totp' ? <Smartphone className="w-6 h-6" /> : <Key className="w-6 h-6 text-amber-600" />}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">
                  {authMode === 'totp' ? 'رمز تطبيق المصادقة (TOTP)' : 'رمز استرداد الطوارئ'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  حساب:{' '}
                  <span className="font-bold text-slate-800 font-mono">
                    {maskEmail(pendingAuthUser.email || `${pendingAuthUser.username}@htaf.online`)}
                  </span>
                </p>
                {isAdminRole(pendingAuthUser.role) && (
                  <span className="inline-block mt-1 bg-amber-500/20 text-amber-900 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    🛡️ مصادقة ثنائية مفعلة للحسابات الإدارية
                  </span>
                )}
              </div>
            </div>

            {authMode === 'totp' ? (
              <form onSubmit={handleVerify2FASubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                    أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة:
                  </label>
                  <div className="flex items-center justify-center gap-2 dir-ltr">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-13 text-center text-xl font-black rounded-xl border transition outline-none font-mono ${
                          digit
                            ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-emerald-500 focus:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {twoFactorSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center justify-center gap-2 font-bold animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تم التحقق بنجاح! جاري الدخول...</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otpDigits.join('').length < 6 || twoFactorSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>تأكيد الرمز والمتابعة</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('recovery');
                      setErrorMessage('');
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-800 transition"
                  >
                    استخدام رمز الاسترداد للطوارئ بدلاً من ذلك ←
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyRecoveryCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رمز الاسترداد المكون من 10 خانات:
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                    placeholder="ABCD-1234-EF"
                    className="w-full text-center text-sm py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none font-mono font-bold tracking-widest uppercase"
                  />
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !recoveryCodeInput.trim() || twoFactorSuccess}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>تسجيل الدخول برمز الاسترداد</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('totp');
                      setErrorMessage('');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                  >
                    العودة لتطبيق المصادقة ←
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIs2FAStep(false);
                  setPendingAuthUser(null);
                  setErrorMessage('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                ← إلغاء والعودة لشاشة الدخول
              </button>
            </div>
          </div>
        ) : (
          /* Primary Google-Centric Screen */
          <div className="p-6 space-y-6">
            
            {/* Header Text */}
            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-slate-900">
                {mainMode === 'register' ? 'إنشاء حساب جديد عبر Google' : 'تسجيل الدخول للمنصة'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {mainMode === 'register'
                  ? 'ابدأ مصادقة حسابك التعليمي عبر Google ثم أكمل بيانات مدرستك وصفك بسهولة.'
                  : 'سجّل دخولك المباشر والآمن بحسابك في Google للوصول إلى كافة المقررات والأنشطة.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && !googleNotConfigured && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-bold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Diagnostic Alert when Google Provider is not enabled in Supabase */}
            {googleNotConfigured && (
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-950 text-xs space-y-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-black text-amber-900 text-xs sm:text-sm">
                      خدمة الدخول بحساب Google غير مفعّلة حالياً في Supabase
                    </h4>
                    <p className="text-amber-800 leading-relaxed text-[11px]">
                      تظهر رسالة <code className="bg-amber-100 text-rose-700 px-1 py-0.5 rounded font-mono text-[10px]">Unsupported provider: provider is not enabled</code> لأن مفتاح موفر Google غير مفعّل بعد في لوحة تحكم قاعدة البيانات.
                    </p>
                  </div>
                </div>

                {/* Steps & Callback URL */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between flex-wrap gap-1 font-black text-slate-800">
                    <span>خطوات تفعيل تسجيل الدخول بقوقل:</span>
                    <a
                      href="https://supabase.com/dashboard/project/gmnzyurlstuqlehbnupx/auth/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline text-[11px]"
                    >
                      <span>فتح إعدادات Providers في Supabase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed pr-1 text-[11px]">
                    <li>افتح صفحة <strong>Auth Providers</strong> في مشروعك في Supabase وانقر على <strong>Google</strong>.</li>
                    <li>فعّل المفتاح <strong>Enable Sign in with Google</strong> (ON).</li>
                    <li>أدخل <strong>Client ID</strong> و <strong>Client Secret</strong> (من Google Cloud Console).</li>
                    <li>تأكد من وضع رابط الـ <strong>Callback URL</strong> التالي في Google Console:</li>
                  </ol>

                  <div className="flex items-center gap-2 bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[10.5px] dir-ltr justify-between">
                    <span className="truncate">{supabaseUrl}/auth/v1/callback</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${supabaseUrl}/auth/v1/callback`);
                        setCopiedCallback(true);
                        setTimeout(() => setCopiedCallback(false), 3000);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-[10.5px] font-sans font-bold flex items-center gap-1 shrink-0 transition"
                    >
                      {copiedCallback ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCallback ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-amber-100/60 p-2.5 rounded-xl text-center text-[11px] text-amber-900 font-bold">
                  💡 يمكنك الآن تسجيل الدخول فوراً باستخدام <strong>اسم المستخدم وكلمة المرور</strong> بالأسفل دون انتظار!
                </div>
              </div>
            )}

            {/* Primary Action Button: Large "المتابعة باستخدام Google" */}
            <div className="space-y-3">
              <button
                type="button"
                id="loginmodal-btn-google"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-extrabold text-sm py-4 px-6 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-3.5 transition group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span>جاري التوجيه إلى Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="group-hover:text-slate-900 transition">
                      المتابعة باستخدام Google
                    </span>
                  </>
                )}
              </button>

              <div className="bg-slate-50 rounded-xl p-2.5 text-center text-[11px] text-slate-500 font-medium">
                🔒 Google يتولى التحقق من الحساب والبريد والاسم والصورة تلقائياً وأمان تام
              </div>
            </div>

            {/* Mode Switcher: "ليس لديك حساب؟ تسجيل جديد" vs "لديك حساب بالفعل؟ تسجيل الدخول" */}
            <div className="pt-3 border-t border-slate-100 text-center">
              {mainMode === 'login' ? (
                <p className="text-xs text-slate-600 font-medium">
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    id="loginmodal-switch-register"
                    onClick={() => {
                      setMainMode('register');
                      setErrorMessage('');
                    }}
                    className="font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition"
                  >
                    تسجيل جديد
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-600 font-medium">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    id="loginmodal-switch-login"
                    onClick={() => {
                      setMainMode('login');
                      setErrorMessage('');
                    }}
                    className="font-black text-blue-600 hover:text-blue-700 underline underline-offset-4 transition"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              )}
            </div>

            {/* Optional Alternative: Direct Password Login (discreet for staff/admin) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                id="loginmodal-toggle-credentials"
                onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>تسجيل الدخول ببيانات الحساب</span>
                </div>
                {showCredentialsForm ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showCredentialsForm && (
                <form onSubmit={handleCredentialsSubmit} className="mt-3 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      اسم المستخدم أو رقم الهوية أو البريد
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        id="login-input-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="اسم المستخدم أو رقم الهوية"
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        id="login-input-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="login-btn-submit-credentials"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>تسجيل الدخول</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
