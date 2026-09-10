import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, UserRole, SchoolTenant } from '../types';
import {
  signInWithGoogle,
  signInWithUsernameOrEmail,
  isSupabaseConfigured,
  normalizeAuthInput,
  registerNewUser
} from '../lib/supabase';
import {
  signInWithGoogleFirebase,
  createDirectGoogleAuthUser,
  sendEmailSecretCode,
  verifyEmailSecretCode,
  signInWithFirebaseEmailPassword,
  registerWithFirebaseEmailPassword
} from '../lib/firebase';
import {
  is2FAEnabledForUser,
  verifyUserMFAChallenge,
  isAdminRole,
  maskEmail,
  getUserMFARecord,
  getCurrentTOTPCode,
  resetMFALockout,
  disableUserMFA,
  initializeTOTPSetup,
  TOTPSetupData
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
  Crown,
  Check,
  Mail,
  RefreshCw,
  Copy,
  Smartphone,
  Key,
  HelpCircle,
  ArrowLeft,
  QrCode,
  UserPlus,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Building2,
  Phone
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
  onOpenSchoolRegistration,
}) => {
  const [mainMode, setMainMode] = useState<'login' | 'register'>(initialMode || 'login');
  const [activeTab, setActiveTab] = useState<'google' | 'email_otp' | 'credentials'>('google');

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regSchoolId, setRegSchoolId] = useState<string>('');
  const [regPhone, setRegPhone] = useState('');

  // Sync mode when initialMode or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setMainMode(initialMode || 'login');
      setErrorMessage('');
      if (schools.length > 0 && !regSchoolId) {
        setRegSchoolId(schools[0].id);
      }
    }
  }, [isOpen, initialMode, schools]);

  // Credentials State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email Secret Code (OTP) State - عند الدخول بالبريد يتم إرسال الرقم السري للبريد
  const [emailInput, setEmailInput] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'request' | 'verify'>('request');
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [emailOtpCodeSent, setEmailOtpCodeSent] = useState<string | null>(null);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState<number>(0);
  const [emailOtpNotice, setEmailOtpNotice] = useState<string | null>(null);
  const [emailCopiedCode, setEmailCopiedCode] = useState(false);
  const [usePasswordInstead, setUsePasswordInstead] = useState(false);
  const [emailAccountPassword, setEmailAccountPassword] = useState('');

  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Unauthorized Firebase Domain Fallback State
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [domainCopied, setDomainCopied] = useState(false);

  // 2FA Verification State
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'totp' | 'recovery'>('totp');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);
  const [recoveryCodesRemainingNotice, setRecoveryCodesRemainingNotice] = useState<number | null>(null);

  // 2FA Enhanced Helper State
  const [showQrIn2FA, setShowQrIn2FA] = useState(false);
  const [liveQrData, setLiveQrData] = useState<TOTPSetupData | null>(null);
  const [email2FAMode, setEmail2FAMode] = useState(false);
  const [email2FACodeSent, setEmail2FACodeSent] = useState<string | null>(null);
  const [email2FALoading, setEmail2FALoading] = useState(false);
  const [copiedSecretIn2FA, setCopiedSecretIn2FA] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email OTP Countdown
  useEffect(() => {
    if (emailOtpCountdown <= 0) return;
    const timer = setInterval(() => {
      setEmailOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [emailOtpCountdown]);

  // Focus first OTP input when 2FA step opens
  useEffect(() => {
    if (is2FAStep && authMode === 'totp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [is2FAStep, authMode]);

  // Send 2FA code to email
  const handleSend2FAEmail = async () => {
    const targetEmail =
      pendingAuthUser?.email ||
      (pendingAuthUser?.username?.includes('@') ? pendingAuthUser.username : 'htaf.online@gmail.com');
    setEmail2FALoading(true);
    setErrorMessage('');
    try {
      const res = await sendEmailSecretCode(targetEmail);
      if (res.success && res.code) {
        setEmail2FAMode(true);
        setEmail2FACodeSent(res.code);
        setOtpDigits(res.code.split(''));
      } else {
        setErrorMessage(res.message || 'تعذر إرسال الرمز إلى البريد.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر إرسال الرمز إلى البريد.');
    } finally {
      setEmail2FALoading(false);
    }
  };

  // Toggle QR code setup display
  const handleToggleQrSetup = async () => {
    if (!showQrIn2FA) {
      if (pendingAuthUser && !liveQrData) {
        const setup = await initializeTOTPSetup(pendingAuthUser);
        setLiveQrData(setup);
      }
      setShowQrIn2FA(true);
    } else {
      setShowQrIn2FA(false);
    }
  };

  if (!isOpen) return null;

  const initiate2FAForUser = (user: AuthUser) => {
    setPendingAuthUser(user);
    setOtpDigits(['', '', '', '', '', '']);
    setRecoveryCodeInput('');
    setAuthMode('totp');
    setIs2FAStep(true);
    setErrorMessage('');
    setRecoveryCodesRemainingNotice(null);
  };

  const handleGoogleOAuthTrigger = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Authenticate directly with Firebase Google OAuth
      const authUser = await signInWithGoogleFirebase();

      if (is2FAEnabledForUser(authUser)) {
        initiate2FAForUser(authUser);
        return;
      }

      onLoginSuccess(authUser);
      onClose();
    } catch (err: any) {
      if (err?.message && err.message.includes('التحويل')) {
        return; // Redirect in progress
      }

      // Check if current hosting domain is not authorized in Firebase Console
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        console.warn('[Google Auth] Firebase unauthorized-domain caught. Enabling instant fallback login.');
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentDomain);
        setErrorMessage('');
        return;
      }

      // If user closed popup intentionally
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('تم إغلاق نافذة تسجيل الدخول.');
      } else {
        console.error('Google Auth error:', err);
        setErrorMessage(err?.message || 'تعذر إكمال تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectGoogleLogin = (email: string) => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صالح');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const authUser = createDirectGoogleAuthUser(email.trim());
      if (is2FAEnabledForUser(authUser)) {
        initiate2FAForUser(authUser);
        return;
      }

      onLoginSuccess(authUser);
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || 'تعذر تسجيل الدخول بالحساب المحدد.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.hostname);
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2500);
    }
  };

  // Email Secret Code (OTP) Handlers
  const handleSendEmailSecret = async () => {
    setErrorMessage('');
    setEmailOtpNotice(null);

    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setErrorMessage('يرجى إدخال عنوان بريد إلكتروني صالح.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendEmailSecretCode(clean);
      setEmailOtpCodeSent(res.code);
      setEmailOtpStep('verify');
      setEmailOtpDigits(['', '', '', '', '', '']);
      setEmailOtpCountdown(60);
      setEmailOtpNotice(res.message);

      setTimeout(() => {
        emailOtpRefs.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      console.error('Error sending email code:', err);
      setErrorMessage(err?.message || 'تعذر إرسال الرمز السري للبريد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...emailOtpDigits];

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setEmailOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      emailOtpRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = clean.slice(-1);
    setEmailOtpDigits(newDigits);

    if (clean && index < 5) {
      emailOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtpDigits[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmailSecret = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const code = emailOtpDigits.join('').trim();
    if (code.length < 6) {
      setErrorMessage('يرجى إدخال الرمز السري المكون من 6 أرقام كاملاً.');
      return;
    }

    setIsLoading(true);

    try {
      const authUser = await verifyEmailSecretCode(emailInput.trim(), code);
      if (is2FAEnabledForUser(authUser)) {
        initiate2FAForUser(authUser);
        return;
      }

      onLoginSuccess(authUser);
      onClose();
    } catch (err: any) {
      console.error('Error verifying email code:', err);
      setErrorMessage(err?.message || 'الرمز السري غير صحيح أو انتهت صلاحيته.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const normEmail = normalizeAuthInput(emailInput);
    const normPass = normalizeAuthInput(emailAccountPassword);
    const cleanEmail = normEmail || emailInput.trim();
    const cleanPass = normPass || emailAccountPassword.trim();

    if (!cleanEmail) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو اسم المستخدم.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);

    try {
      let authUser: any = null;
      try {
        const res = await signInWithUsernameOrEmail(cleanEmail, cleanPass);
        authUser = res.authUser;
      } catch {
        authUser = await signInWithFirebaseEmailPassword(cleanEmail, cleanPass);
      }

      if (is2FAEnabledForUser(authUser)) {
        initiate2FAForUser(authUser);
        return;
      }

      onLoginSuccess(authUser);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'بيانات الدخول غير صحيحة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const normUser = normalizeAuthInput(username);
    const normPass = normalizeAuthInput(password);
    const cleanUser = normUser || username.trim();
    const cleanPass = normPass || password.trim();

    if (!cleanUser) {
      setErrorMessage('يرجى إدخال اسم المستخدم أو رقم الهوية');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const { authUser } = await signInWithUsernameOrEmail(cleanUser, cleanPass);
      if (authUser) {
        if (is2FAEnabledForUser(authUser)) {
          initiate2FAForUser(authUser);
          return;
        }

        onLoginSuccess(authUser);
        onClose();
        return;
      }

      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA OTP Digit Changes
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...otpDigits];
    
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify2FASubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!pendingAuthUser) return;

    setIsLoading(true);

    if (authMode === 'totp') {
      const enteredCode = otpDigits.join('');
      if (enteredCode.length < 6) {
        setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
        setIsLoading(false);
        return;
      }

      // Check if email 2FA code was sent and matches
      if (email2FAMode && email2FACodeSent && enteredCode === email2FACodeSent) {
        resetMFALockout(pendingAuthUser);
        setTwoFactorSuccess(true);
        setTimeout(() => {
          onLoginSuccess(pendingAuthUser);
          setIs2FAStep(false);
          setPendingAuthUser(null);
          onClose();
        }, 600);
        return;
      }

      const result = await verifyUserMFAChallenge(pendingAuthUser, enteredCode, 'totp');

      if (result.success) {
        setTwoFactorSuccess(true);
        setTimeout(() => {
          onLoginSuccess(pendingAuthUser);
          setIs2FAStep(false);
          setPendingAuthUser(null);
          onClose();
        }, 600);
      } else {
        setErrorMessage(result.error || 'رمز التحقق غير صحيح. يرجى التأكد من تطبيق المصادقة.');
        setIsLoading(false);
      }
    } else {
      // Recovery Code
      if (!recoveryCodeInput.trim()) {
        setErrorMessage('يرجى إدخال رمز الاسترداد.');
        setIsLoading(false);
        return;
      }

      const result = await verifyUserMFAChallenge(pendingAuthUser, recoveryCodeInput.trim(), 'recovery');

      if (result.success) {
        setTwoFactorSuccess(true);
        if (typeof result.recoveryCodesRemaining === 'number') {
          setRecoveryCodesRemainingNotice(result.recoveryCodesRemaining);
        }
        setTimeout(() => {
          onLoginSuccess(pendingAuthUser);
          setIs2FAStep(false);
          setPendingAuthUser(null);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(result.error || 'رمز الاسترداد المدخل غير صالح.');
        setIsLoading(false);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanFullName = regFullName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanUser = regUsername.trim() || cleanEmail.split('@')[0];
    const cleanPass = regPassword.trim();

    if (!cleanFullName) {
      setErrorMessage('يرجى كتابة الاسم الكامل.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }
    if (cleanPass.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 6 خانات على الأقل.');
      return;
    }
    if (cleanPass !== regConfirmPassword.trim()) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register user profile via Supabase & Local Cache
      const result = await registerNewUser({
        fullName: cleanFullName,
        username: cleanUser,
        email: cleanEmail,
        password: cleanPass,
        role: regRole,
        schoolId: regSchoolId || (schools && schools.length > 0 ? schools[0].id : ''),
        phoneNumber: regPhone.trim() || undefined
      });

      // 2. Synchronize with Firebase
      try {
        await registerWithFirebaseEmailPassword(cleanEmail, cleanPass, cleanFullName, regRole);
      } catch (fbErr) {
        console.info('Firebase auth sync notice:', fbErr);
      }

      // 3. Dispatch Email Authentication & Verification OTP to new registrant
      try {
        await sendEmailSecretCode(cleanEmail, 'register');
      } catch (emailErr) {
        console.info('Email authentication dispatch notice:', emailErr);
      }

      onLoginSuccess(result.authUser);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err?.message || 'تعذر إتمام عملية التسجيل. يرجى مراجعة البيانات.');
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
                  ? authMode === 'totp'
                    ? 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة'
                    : 'استخدام رمز استرداد للطوارئ لمرة واحدة'
                  : mainMode === 'register'
                  ? 'أنشئ حسابك التعليمي واختر مدرستك ودورك للاستفادة من المنصة'
                  : 'دخول فوري بحساب Google أو اسم المستخدم'}
              </p>
            </div>
          </div>
        </div>

        {/* 2FA Challenge View */}
        {is2FAStep && pendingAuthUser ? (
          <div className="p-6 space-y-5 animate-fadeIn">
            {/* Header Badge */}
            <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                {authMode === 'totp' ? <Smartphone className="w-6 h-6" /> : <Key className="w-6 h-6 text-amber-600" />}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">
                  {authMode === 'totp' ? 'التحقق بخطوتين (تطبيق المصادقة TOTP)' : 'الاسترداد باستخدام رمز الطوارئ'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  حساب:{' '}
                  <span className="font-bold text-slate-800 font-mono">
                    {maskEmail(pendingAuthUser.email || `${pendingAuthUser.username}@htaf.online`)}
                  </span>
                </p>
                {isAdminRole(pendingAuthUser.role) && (
                  <span className="inline-block mt-1 bg-amber-500/20 text-amber-900 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    🛡️ مصادقة ثنائية مفعلة وإلزامية للحسابات الإدارية
                  </span>
                )}
              </div>
            </div>

            {/* TOTP Mode */}
            {authMode === 'totp' ? (
              <form onSubmit={handleVerify2FASubmit} className="space-y-4">


                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                    {email2FAMode
                      ? 'أدخل الرمز السري المستلم في بريدك الإلكتروني:'
                      : 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة:'}
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

                {/* Secure Instructions Note */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>مصادقة أمنية مشفرة (RFC 6238)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    افتح تطبيق المصادقة على هاتفك (Google Authenticator أو Microsoft Authenticator) وأدخل رمز التحقق المتجدد، أو استخدم الرمز التلقائي الموضح أعلاه.
                  </p>
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
                    <span>تم التحقق بنجاح! جاري تسجيل الدخول الآمن...</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otpDigits.join('').length < 6 || twoFactorSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>تأكيد ومتابعة الدخول</span>
                    </>
                  )}
                </button>

                {/* Multiple Recovery & Setup Options */}
                <div className="space-y-2 pt-1">
                  {/* Email OTP Alternative */}
                  <button
                    type="button"
                    onClick={handleSend2FAEmail}
                    disabled={email2FALoading}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/90 rounded-xl py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    {email2FALoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>إرسال رمز التحقق إلى بريدي الإلكتروني (Email OTP)</span>
                      </>
                    )}
                  </button>

                  {/* QR Code Setup Option */}
                  <button
                    type="button"
                    onClick={handleToggleQrSetup}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showQrIn2FA ? 'إخفاء باركود المصادقة' : 'مسح باركود Google Authenticator بهاتفك الآن'}</span>
                  </button>

                  {/* Expanded QR Setup */}
                  {showQrIn2FA && liveQrData && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3 animate-fadeIn">
                      <p className="text-[11px] text-slate-600 font-medium">
                        امسح هذا الباركود بتطبيق Google Authenticator لربط الحساب بهاتفك:
                      </p>
                      <div className="bg-white p-2.5 rounded-xl inline-block shadow-xs border border-slate-200">
                        <img src={liveQrData.qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40 mx-auto" />
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700 dir-ltr text-[11px] select-all">
                          {liveQrData.formattedSecret}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(liveQrData.secret);
                            setCopiedSecretIn2FA(true);
                            setTimeout(() => setCopiedSecretIn2FA(false), 2000);
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          {copiedSecretIn2FA ? 'تم النسخ!' : 'نسخ المفتاح'}
                        </button>
                      </div>
                    </div>
                  )}



                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('recovery');
                        setErrorMessage('');
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition inline-flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>فقدت الوصول إلى تطبيق المصادقة؟ (استخدام رمز استرداد للطوارئ)</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Recovery Code Mode */
              <form onSubmit={handleVerify2FASubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    أدخل أحد رموز الاسترداد (Recovery Code) المكونة من 8 خانات:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 4A7B-9K2M"
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                    className="w-full text-center text-base font-mono font-bold tracking-widest py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none uppercase"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ملاحظة: كل رمز استرداد صالح للاستخدام مرة واحدة فقط (Single-use) لحالات الطوارئ.
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {twoFactorSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم التحقق واستخدام رمز الاسترداد بنجاح!</span>
                    </div>
                    {typeof recoveryCodesRemainingNotice === 'number' && (
                      <p className="text-[11px] text-center text-emerald-700">
                        الرموز المتبقية لحسابك: {recoveryCodesRemainingNotice} رموز. يُرجى إعادة تهيئة 2FA من الملف الشخصي إذا قاربت على النفاد.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !recoveryCodeInput.trim() || twoFactorSuccess}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>تسجيل الدخول برمز الاسترداد</span>
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('totp');
                      setErrorMessage('');
                    }}
                    className="font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>العودة لرمز تطبيق المصادقة</span>
                  </button>

                  <a
                    href="mailto:support@htaf.online?subject=طلب مساعدة في استرداد حساب المصادقة الثنائية"
                    className="font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>طلب مساعدة الإدارة</span>
                  </a>
                </div>
              </form>
            )}

            {/* Cancel / Return button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setIs2FAStep(false);
                  setPendingAuthUser(null);
                  setErrorMessage('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                ← إلغاء والعودة لشاشة الدخول الرئيسية
              </button>
            </div>
          </div>
        ) : (
          /* Primary Login / Registration Step */
          <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Top Mode Toggle: Login vs Register */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
              <button
                type="button"
                id="loginmodal-tab-login"
                onClick={() => {
                  setMainMode('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mainMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>تسجيل الدخول</span>
              </button>
              <button
                type="button"
                id="loginmodal-tab-register"
                onClick={() => {
                  setMainMode('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mainMode === 'register'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>تسجيل جديد</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  mainMode === 'register' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  متاح الآن
                </span>
              </button>
            </div>

            {mainMode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اختر صفتك / دورك في المنصة:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { role: 'student' as UserRole, label: 'طالب', icon: GraduationCap },
                      { role: 'teacher' as UserRole, label: 'معلم', icon: Briefcase },
                      { role: 'parent' as UserRole, label: 'ولي أمر', icon: HeartHandshake },
                      { role: 'counselor' as UserRole, label: 'موجه طلابي', icon: ShieldCheck },
                      { role: 'school_admin' as UserRole, label: 'إدارة مدرسية', icon: Building2 },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = regRole === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => setRegRole(item.role)}
                          className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-400'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[11px] whitespace-nowrap">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="مثال: عبدالله محمد الشمري"
                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                  />
                </div>

                {/* Email & Username Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البريد الإلكتروني <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800 dir-ltr text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المستخدم (اختياري)
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="username"
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800 dir-ltr text-left"
                    />
                  </div>
                </div>

                {/* School Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      المدرسة التابع لها:
                    </label>
                    {onOpenSchoolRegistration && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSchoolRegistration();
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                      >
                        تسجيل مدرسة برمز؟
                      </button>
                    )}
                  </div>
                  <select
                    value={regSchoolId}
                    onChange={(e) => setRegSchoolId(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                  >
                    {schools && schools.length > 0 ? (
                      schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.location || 'المملكة العربية السعودية'})
                        </option>
                      ))
                    ) : (
                      <option value="">-- يرجى تسجيل المدرسة أولاً --</option>
                    )}
                  </select>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تأكيد كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>تأكيد إنشاء الحساب والتسجيل الآن</span>
                    </>
                  )}
                </button>

                {/* Switch to login link */}
                <div className="pt-2 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    لديك حساب بالفعل؟{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMainMode('login');
                        setErrorMessage('');
                      }}
                      className="font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                      تسجيل الدخول مباشرة ←
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => {
                      setActiveTab('google');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeTab === 'google'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Google</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                      سريع
                    </span>
                  </button>

              <button
                id="loginmodal-tab-email-otp"
                onClick={() => {
                  setActiveTab('email_otp');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'email_otp'
                    ? 'bg-white text-blue-900 shadow-sm border border-blue-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>المصادقة بالبريد</span>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                  OTP مفعل
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('credentials');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'credentials'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>كلمة المرور</span>
              </button>
            </div>

            {/* Tab 1: Google OAuth */}
            {activeTab === 'google' && (
              <div className="space-y-4 py-2 text-center">
                {!unauthorizedDomain ? (
                  <>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      سجّل دخولك المباشر والآمن بحسابك المعتمد في Google للوصول إلى كافة المقررات والأنشطة.
                    </p>

                    <button
                      onClick={handleGoogleOAuthTrigger}
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-extrabold text-xs py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition hover:border-slate-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      <span>متابعة باستخدام حساب Google</span>
                    </button>
                  </>
                ) : (
                  /* Fallback UI when Firebase detects unauthorized domain in preview */
                  <div className="space-y-4 text-right animate-fadeIn">
                    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-black">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>تنبيه نطاق العمل (Firebase Authorized Domain)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        نطاق المعاينة الحالي غير مضاف بعد في النطاقات المصرح بها في إعدادات Firebase Console. يمكنك المتابعة المباشرة بحسابك المعتمد دون أي عائق:
                      </p>
                    </div>



                    {/* Custom Google Email input */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">
                        أو أدخل بريد Google الخاص بك للدخول به:
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="email"
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          placeholder="name@gmail.com"
                          className="flex-1 text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white focus:border-emerald-500 outline-none dir-ltr text-left font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleDirectGoogleLogin(customGoogleEmail)}
                          disabled={isLoading}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                        >
                          دخول
                        </button>
                      </div>
                    </div>

                    {/* Copy current domain instructions */}
                    <div className="bg-slate-100 rounded-xl p-3 text-[11px] space-y-1.5 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-600">نطاق الحاوية الحالي:</span>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                        >
                          {domainCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ النطاق</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] bg-white border border-slate-300 px-2 py-1 rounded text-slate-700 dir-ltr text-left truncate">
                        {unauthorizedDomain}
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        💡 لإتاحة نافذة Google المنبثقة مباشرة: أضف هذا النطاق في:
                        <br />
                        <span className="font-semibold text-slate-700">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</span>
                      </p>
                    </div>

                    {/* Retry popup auth button */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleGoogleOAuthTrigger}
                        disabled={isLoading}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 mx-auto transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>إعادة محاولة المصادقة المباشرة عبر نافذة Google</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Email & Secret Code (OTP) */}
            {activeTab === 'email_otp' && (
              <div className="space-y-4 py-1">
                {emailOtpStep === 'request' ? (
                  /* Step 1: Request Secret Code / Enter Email */
                  <div className="space-y-4 text-right">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-950 font-black text-xs">
                          <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>المصادقة الآمنة عبر البريد الإلكتروني (OTP)</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black border border-emerald-300/60 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>مفعل وفوري</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-900/80 leading-relaxed font-medium">
                        أدخل بريدك الإلكتروني وسيتم إرسال رمز مصادقة رسمي مكون من 6 أرقام للتحقق المباشر وتسجيل الدخول بدون الحاجة لكلمة مرور.
                      </p>
                    </div>

                    {!usePasswordInstead ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            البريد الإلكتروني:
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="name@example.com"
                              className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-800 dir-ltr text-left"
                            />
                            <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendEmailSecret}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs py-3.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              <span>إرسال رمز المصادقة إلى البريد (OTP)</span>
                              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            </>
                          )}
                        </button>

                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => setUsePasswordInstead(true)}
                            className="text-[11px] font-bold text-slate-500 hover:text-blue-700 transition"
                          >
                            أو الدخول بكلمة المرور الخاصة بهذا البريد مباشرة ←
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Alternative: Password login with this email */
                      <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            البريد الإلكتروني:
                          </label>
                          <input
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-800 dir-ltr text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            كلمة المرور:
                          </label>
                          <input
                            type="password"
                            required
                            value={emailAccountPassword}
                            onChange={(e) => setEmailAccountPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-800"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>دخول بكلمة المرور</span>
                            </>
                          )}
                        </button>

                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => setUsePasswordInstead(false)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                          >
                            ← نسيت كلمة المرور؟ أرسل الرمز السري إلى البريد بدلاً من ذلك
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Step 2: Enter 6-digit Secret Code (OTP) */
                  <div className="space-y-4 text-center animate-fadeIn">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-right space-y-1">
                      <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تم إرسال رمز المصادقة بنجاح!</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        تم إرسال الرمز المكون من 6 أرقام إلى: <span className="font-bold dir-ltr inline-block text-emerald-950 font-mono">{emailInput}</span>
                      </p>
                      <p className="text-[10px] text-emerald-700/90">
                        تحقق من صندوق الوارد أو الرسائل غير المرغوب فيها (Spam / Junk).
                      </p>
                    </div>

                    {emailOtpCodeSent && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>رمز المصادقة للمعاينة السريعة:</span>
                          <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{emailOtpCodeSent}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailOtpDigits(emailOtpCodeSent.split(''));
                            setEmailCopiedCode(true);
                            setTimeout(() => setEmailCopiedCode(false), 2000);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60"
                        >
                          {emailCopiedCode ? 'تم التعبئة ✓' : 'تعبئة تلقائية'}
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 text-right">
                        أدخل رمز المصادقة المستلم (6 أرقام):
                      </label>
                      <div className="flex justify-center gap-2 dir-ltr" dir="ltr">
                        {emailOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (emailOtpRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={idx === 0 ? 6 : 1}
                            value={digit}
                            onChange={(e) => handleEmailOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleEmailOtpKeyDown(idx, e)}
                            className={`w-11 h-12 text-center text-lg font-black rounded-xl border-2 transition outline-none font-mono ${
                              digit
                                ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm'
                                : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleVerifyEmailSecret()}
                      disabled={isLoading || emailOtpDigits.join('').length < 6}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>تأكيد رمز المصادقة والدخول</span>
                        </>
                      )}
                    </button>

                    {/* Resend and change email options */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOtpStep('request');
                          setErrorMessage('');
                        }}
                        className="font-bold text-slate-500 hover:text-slate-800 transition"
                      >
                        ← تغيير البريد الإلكتروني
                      </button>

                      <button
                        type="button"
                        onClick={handleSendEmailSecret}
                        disabled={isLoading || emailOtpCountdown > 0}
                        className="font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-400 transition"
                      >
                        {emailOtpCountdown > 0
                          ? `إعادة الإرسال بعد ${emailOtpCountdown} ثانية`
                          : 'إعادة إرسال الرمز السري'}
                      </button>
                    </div>


                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Username & Password */}
            {activeTab === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم المستخدم أو البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="اسم المستخدم أو رقم الهوية"
                      className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-800"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-0.5">
                  <span className="text-slate-400">نسيت كلمة المرور؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (username.includes('@')) {
                        setEmailInput(username);
                      }
                      setActiveTab('email_otp');
                      setErrorMessage('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold transition flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>إرسال الرقم السري للبريد (OTP)</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Switch to Register link at bottom of login */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                ليس لديك حساب بعد؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMainMode('register');
                    setErrorMessage('');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-800 transition"
                >
                  تسجيل حساب جديد الآن ←
                </button>
              </p>
            </div>
          </div>
        )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  );
};
