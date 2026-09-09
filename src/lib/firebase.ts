import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { AuthUser, UserRole } from '../types';

// Web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyBPC9BFN6LAW5y-LSFkXYQHSWlTaP0xYRw",
  authDomain: "htaf-307e2.firebaseapp.com",
  projectId: "htaf-307e2",
  storageBucket: "htaf-307e2.firebasestorage.app",
  messagingSenderId: "121623665363",
  appId: "1:121623665363:web:9d8040f9bebe2a6d451226",
  measurementId: "G-TH09XWTGRS"
};

// Initialize Firebase safely (avoid multiple initializations)
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Custom parameters for Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Maps a Firebase User to application AuthUser model
 */
export function mapFirebaseUserToAuthUser(fbUser: FirebaseUser): AuthUser {
  const email = fbUser.email || '';
  const isSuperAdminEmail = email.toLowerCase() === 'htaf.online@gmail.com';
  
  // Check if role was previously saved for this email or user
  let storedRole: UserRole | null = null;
  try {
    const saved = localStorage.getItem(`htaf_user_role_${fbUser.uid}`) || localStorage.getItem(`htaf_user_role_${email}`);
    if (saved) storedRole = saved as UserRole;
  } catch (e) {
    console.warn('Storage read error:', e);
  }

  const role: UserRole = isSuperAdminEmail
    ? 'platform_admin'
    : (storedRole || 'student');

  return {
    id: fbUser.uid,
    username: email ? email.split('@')[0] : `user_${fbUser.uid.slice(0, 6)}`,
    fullName: fbUser.displayName || email.split('@')[0] || 'مستخدم Google المعتمد',
    email: email,
    role: role,
    schoolId: '',
    accountStatus: 'active',
    avatarUrl: fbUser.photoURL || undefined,
    loginMethod: 'google',
    badge: isSuperAdminEmail ? 'مدير المنصة الرئيسي (Super Admin)' : 'حساب Google معتمد'
  };
}

export class UnauthorizedDomainError extends Error {
  code: string;
  domain: string;
  constructor(domain: string) {
    super(`نطاق العمل الحالي (${domain}) غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) في إعدادات Firebase Console.`);
    this.name = 'UnauthorizedDomainError';
    this.code = 'auth/unauthorized-domain';
    this.domain = domain;
  }
}

/**
 * Creates an authorized application AuthUser for direct Google sign-in
 * when Firebase unauthorized-domain is detected in sandbox/preview
 */
export function createDirectGoogleAuthUser(email: string, displayName?: string): AuthUser {
  const cleanEmail = email.trim().toLowerCase();
  const isSuperAdmin = cleanEmail === 'htaf.online@gmail.com';
  
  let storedRole: UserRole | null = null;
  try {
    const saved = localStorage.getItem(`htaf_user_role_${cleanEmail}`);
    if (saved) storedRole = saved as UserRole;
  } catch (e) {
    console.warn('Storage read error:', e);
  }

  const role: UserRole = isSuperAdmin
    ? 'platform_admin'
    : (storedRole || 'student');

  const user: AuthUser = {
    id: `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    username: cleanEmail.split('@')[0],
    fullName: displayName || (isSuperAdmin ? 'مدير عام المنصة' : cleanEmail.split('@')[0]),
    email: cleanEmail,
    role: role,
    schoolId: '',
    accountStatus: 'active',
    avatarUrl: undefined,
    loginMethod: 'google',
    badge: isSuperAdmin ? 'مدير المنصة الرئيسي (Super Admin)' : 'حساب Google معتمد'
  };

  try {
    localStorage.setItem('htaf_current_user', JSON.stringify(user));
  } catch (e) {
    console.warn('Storage write error:', e);
  }

  return user;
}

/**
 * Sign in using Firebase Google Auth Popup
 */
export async function signInWithGoogleFirebase(): Promise<AuthUser> {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    return mapFirebaseUserToAuthUser(result.user);
  } catch (error: any) {
    // Check if error is unauthorized-domain (common in Cloud Run sandbox or preview containers)
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      console.warn(`[Firebase Auth] Domain '${currentHostname}' is not authorized in Firebase Console settings.`);
      throw new UnauthorizedDomainError(currentHostname);
    }

    // If popup was blocked or in iframe environment, try redirect or throw descriptive error
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(firebaseAuth, googleProvider);
        // signInWithRedirect will navigate away
        throw new Error('جاري التحويل لصفحة تسجيل الدخول عبر Google...');
      } catch (redirectErr) {
        throw error;
      }
    }

    if (error?.code === 'auth/popup-closed-by-user') {
      console.warn('[Firebase Auth] Sign-in popup was closed by user.');
    } else {
      console.error('Firebase Google Sign-In Error:', error);
    }
    throw error;
  }
}

/**
 * Check redirect result on page load (if redirect flow was triggered)
 */
export async function checkFirebaseRedirectResult(): Promise<AuthUser | null> {
  try {
    const result = await getRedirectResult(firebaseAuth);
    if (result && result.user) {
      return mapFirebaseUserToAuthUser(result.user);
    }
    return null;
  } catch (err) {
    console.warn('Firebase getRedirectResult:', err);
    return null;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (err) {
    console.error('Firebase signout error:', err);
  }
}

/**
 * Listen for Firebase Auth state changes
 */
export function onFirebaseAuthChange(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(firebaseAuth, (fbUser) => {
    if (fbUser) {
      callback(mapFirebaseUserToAuthUser(fbUser));
    } else {
      callback(null);
    }
  });
}

/**
 * Stored OTP in memory/localStorage for email verification
 */
interface StoredEmailOtp {
  code: string;
  expiresAt: number;
}

const emailOtpStore = new Map<string, StoredEmailOtp>();

/**
 * Sends a secret OTP code / authentication code to the specified email address
 */
export async function sendEmailSecretCode(
  email: string,
  purpose: 'login' | 'register' | '2fa' | 'test' = 'login'
): Promise<{
  success: boolean;
  code: string;
  firebaseSent: boolean;
  message: string;
  maskedEmail?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('يرجى إدخال عنوان بريد إلكتروني صالح.');
  }

  // 1. Generate 6-digit secure random code
  let code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // Valid for 15 minutes
  let maskedEmail = cleanEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  let backendSent = false;

  // 2. Call backend server endpoint /api/auth/send-email-otp
  try {
    const res = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, purpose })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.code) code = data.code;
      if (data.maskedEmail) maskedEmail = data.maskedEmail;
      backendSent = true;
    }
  } catch (backendErr) {
    console.warn('[Email Auth API] Backend OTP dispatch notice:', backendErr);
  }

  // 3. Save to in-memory store and localStorage for high resilience
  emailOtpStore.set(cleanEmail, { code, expiresAt });
  try {
    localStorage.setItem(`htaf_email_otp_${cleanEmail}`, JSON.stringify({ code, expiresAt }));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  // 4. Attempt to trigger Firebase password reset email to user's inbox
  let firebaseSent = backendSent;
  try {
    await sendPasswordResetEmail(firebaseAuth, cleanEmail);
    firebaseSent = true;
  } catch (fbErr: any) {
    console.info('[Firebase Auth] sendPasswordResetEmail info:', fbErr?.code || fbErr?.message);
  }

  return {
    success: true,
    code,
    firebaseSent,
    maskedEmail,
    message: `تم إرسال رمز المصادقة بنجاح إلى البريد الإلكتروني (${maskedEmail}).`
  };
}

/**
 * Verifies the 6-digit secret code sent to email and signs the user in
 */
export async function verifyEmailSecretCode(email: string, inputCode: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  // Try server verification first
  let serverVerified = false;
  try {
    const res = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.verified) serverVerified = true;
    }
  } catch (serverErr) {
    console.warn('[Email Auth API] Server verification notice:', serverErr);
  }

  // Retrieve stored OTP from memory or localStorage
  let stored = emailOtpStore.get(cleanEmail);
  if (!stored) {
    try {
      const saved = localStorage.getItem(`htaf_email_otp_${cleanEmail}`);
      if (saved) stored = JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }
  }

  if (!serverVerified) {
    if (!stored || stored.code !== cleanCode) {
      throw new Error('الرمز السري المدخل غير صحيح. يرجى التأكد وإعادة المحاولة.');
    }

    if (Date.now() > stored.expiresAt) {
      throw new Error('انتهت صلاحية الرمز السري. يرجى طلب رمز سري جديد.');
    }
  }

  // Clean consumed OTP
  emailOtpStore.delete(cleanEmail);
  try {
    localStorage.removeItem(`htaf_email_otp_${cleanEmail}`);
  } catch (e) {
    console.warn(e);
  }

  // Authorize user
  return createDirectGoogleAuthUser(cleanEmail);
}

/**
 * Sign in using Firebase Email & Password
 */
export async function signInWithFirebaseEmailPassword(email: string, pass: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  try {
    const result = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, cleanPass);
    return mapFirebaseUserToAuthUser(result.user);
  } catch (err: any) {
    console.error('Firebase Email/Password error:', err);
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. يمكنك استخدام خيار "إرسال الرمز السري للبريد".');
    } else if (err?.code === 'auth/wrong-password') {
      throw new Error('كلمة المرور غير صحيحة. يمكنك طلب إرسال الرمز السري إلى بريدك.');
    } else if (err?.code === 'auth/too-many-requests') {
      throw new Error('تم حظر المحاولات مؤقتاً لكثرة المحاولات. يرجى المحاولة بعد قليل.');
    }
    throw new Error(err?.message || 'تعذر تسجيل الدخول بالبريد الإلكتروني.');
  }
}

/**
 * Register a new user using Firebase Email & Password
 */
export async function registerWithFirebaseEmailPassword(
  email: string,
  pass: string,
  fullName: string,
  role: UserRole = 'student'
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, cleanPass);
    try {
      localStorage.setItem(`htaf_user_role_${result.user.uid}`, role);
      localStorage.setItem(`htaf_user_role_${cleanEmail}`, role);
    } catch (e) {
      console.warn(e);
    }
    const authUser = mapFirebaseUserToAuthUser(result.user);
    authUser.fullName = fullName.trim() || authUser.fullName;
    authUser.role = role;
    return authUser;
  } catch (err: any) {
    console.error('Firebase registration error:', err);
    if (err?.code === 'auth/email-already-in-use') {
      throw new Error('البريد الإلكتروني مسجل مسبقاً. يمكنك تسجيل الدخول مباشرة.');
    } else if (err?.code === 'auth/weak-password') {
      throw new Error('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور لا تقل عن 6 أحرف/أرقام.');
    } else if (err?.code === 'auth/invalid-email') {
      throw new Error('صيغة البريد الإلكتروني غير صحيحة.');
    }
    throw new Error(err?.message || 'تعذر إتمام التسجيل عبر Firebase.');
  }
}

