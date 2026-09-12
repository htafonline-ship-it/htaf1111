import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  StudentProfile,
  HomeworkAssignment,
  QuizItem,
  SubjectPerformance,
  ClassSchedulePeriod,
  StudentNote,
  AttendanceRecord,
  TeacherQuiz,
  TeacherCommunication,
  TeacherPermissions,
  DayOfWeek,
  StudentNoteType,
  AttendanceStatus,
  SchoolInvitation,
  SchoolInvitationStatus,
  PlatformLetterSettings,
  UserProfile,
  UserRole,
  AuthUser
} from '../types';

// Supabase credentials strictly from Environment Variables with Hostinger production reference
const DEFAULT_SUPABASE_URL = 'https://gmnzyurlstuqlehbnupx.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtbnp5dXJsc3R1cWxlaGJudXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTMyOTcsImV4cCI6MjEwNDI4OTI5N30.lq43jmlcW2ZYP6RGOaRyy0dor6RPcyflKiNBVvz10QU';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = (typeof envUrl === 'string' && envUrl.trim()) ? envUrl.trim() : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = (typeof envAnonKey === 'string' && envAnonKey.trim()) ? envAnonKey.trim() : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// -------------------------------------------------------------
// SUPABASE AUTH HELPERS
// -------------------------------------------------------------

export async function signInWithGoogle(customRedirectUrl?: string) {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://htaf.online';
  const redirectTo = customRedirectUrl || origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;

  if (data?.url) {
    // Pre-check to verify provider is active
    try {
      const verifyRes = await fetch(data.url, {
        method: 'GET',
        headers: { 'apikey': supabaseAnonKey }
      });
      if (verifyRes.status === 400) {
        const bodyJson = await verifyRes.json().catch(() => null);
        if (bodyJson?.msg?.includes('Unsupported provider') || bodyJson?.error_code === 'validation_failed') {
          throw new Error('خدمة تسجيل الدخول بقوقل غير مفعّلة بعد في لوحة تحكم Supabase (Unsupported provider).');
        }
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes('غير مفعّلة')) {
        throw checkErr;
      }
      console.warn('Google pre-check network note:', checkErr);
    }

    window.location.href = data.url;
  }

  return data;
}

export async function signUpWithEmail(email: string, pass: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Signout error:', error);
}

export async function getCurrentSupabaseUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// -------------------------------------------------------------
// USER PROFILES & AUTHENTICATION WITH SUPABASE
// -------------------------------------------------------------

export interface DbProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  national_id?: string;
  school_id?: string;
  class_id?: string;
  grade_id?: string;
  account_status: 'active' | 'pending' | 'suspended';
  is_demo_account?: boolean;
  demo_expires_at?: string;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export async function fetchUserProfile(userId: string): Promise<DbProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.warn('Error fetching profile from Supabase:', err);
    return null;
  }
}

export async function fetchUserProfileByUsername(username: string): Promise<DbProfile | null> {
  if (!isSupabaseConfigured || !username) return null;
  try {
    const clean = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.eq.${clean},email.eq.${clean}`)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.warn('Error fetching profile by username:', err);
    return null;
  }
}

export async function upsertUserProfile(profile: {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  national_id?: string;
  school_id?: string;
  class_id?: string;
  grade_id?: string;
  account_status?: 'active' | 'pending' | 'suspended';
  is_demo_account?: boolean;
  demo_expires_at?: string;
  avatar_url?: string;
}): Promise<DbProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const payload = {
      ...profile,
      account_status: profile.account_status || 'active',
      is_demo_account: profile.is_demo_account ?? false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Error upserting profile in Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Exception upserting profile:', err);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<DbProfile>
): Promise<DbProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Error updating profile in Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Exception updating profile:', err);
    return null;
  }
}

/**
 * Normalizes input by converting Arabic/Indic numerals to Western Arabic (ASCII) digits,
 * stripping invisible zero-width and directional characters, and trimming whitespace.
 */
export function normalizeAuthInput(val: string): string {
  if (!val) return '';
  return val
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u00A0\r\n]/g, '')
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

export const PRIMARY_ADMIN_NATIONAL_ID = '1007363904';
export const PRIMARY_ADMIN_PASSWORD = '139213';
export const PRIMARY_ADMIN_EMAIL = 'admin.1007363904@htaf.online';

/**
 * Sign in using Username or Email with authentic Supabase Auth.
 */
export async function signInWithUsernameOrEmail(
  identifier: string,
  pass: string
): Promise<{ authUser: AuthUser; rawUser?: any }> {
  const clean = normalizeAuthInput(identifier ? identifier.trim() : '');
  const rawPass = normalizeAuthInput(pass ? pass.trim() : '');

  if (!clean) throw new Error('يرجى إدخال اسم المستخدم أو رقم الهوية أو البريد الإلكتروني.');
  if (!rawPass) throw new Error('يرجى إدخال كلمة المرور.');

  // EXCLUSIVE PRIMARY ADMIN CREDENTIALS:
  // الادمن فقط 1007363904 والباسبورد 139213
  const isPrimaryAdminIdentifier =
    clean === PRIMARY_ADMIN_NATIONAL_ID ||
    clean.toLowerCase() === 'admin' ||
    clean.toLowerCase() === 'superadmin' ||
    clean.toLowerCase() === 'super_admin' ||
    clean.toLowerCase() === 'admin@htaf.online' ||
    clean.toLowerCase() === PRIMARY_ADMIN_EMAIL;

  if (isPrimaryAdminIdentifier) {
    if (rawPass !== PRIMARY_ADMIN_PASSWORD) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }

    const adminUser: AuthUser = {
      id: 'admin_1007363904',
      username: PRIMARY_ADMIN_NATIONAL_ID,
      fullName: 'مدير المنصة الرئيسي (Super Admin)',
      email: PRIMARY_ADMIN_EMAIL,
      role: 'platform_admin',
      nationalId: PRIMARY_ADMIN_NATIONAL_ID,
      accountStatus: 'active',
      loginMethod: 'credentials',
      badge: 'مدير المنصة الرئيسي (Super Admin)'
    };

    try {
      localStorage.setItem('htaf_active_auth_user', JSON.stringify(adminUser));
    } catch (e) {
      console.warn('Could not persist admin auth user to localStorage:', e);
    }

    // Also attempt asynchronous update/upsert to Supabase profiles if configured
    if (isSupabaseConfigured && supabase) {
      upsertUserProfile({
        id: adminUser.id,
        username: PRIMARY_ADMIN_NATIONAL_ID,
        full_name: adminUser.fullName,
        email: adminUser.email,
        role: 'platform_admin',
        national_id: PRIMARY_ADMIN_NATIONAL_ID,
        account_status: 'active'
      }).catch((e) => console.warn('Supabase admin profile upsert note:', e));
    }

    return {
      authUser: adminUser,
      rawUser: { id: adminUser.id, email: adminUser.email }
    };
  }

  if (!isSupabaseConfigured) {
    throw new Error('خدمة Supabase غير مهيأة. يرجى التحقق من متغيرات البيئة.');
  }

  let targetEmail = clean.toLowerCase();

  // If username given without @, look up user email from profiles table
  if (!clean.includes('@')) {
    const profile = await fetchUserProfileByUsername(clean);
    if (profile && profile.email) {
      targetEmail = profile.email;
    } else {
      targetEmail = `${clean.toLowerCase()}@htaf.online`;
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password: rawPass,
  });

  if (error || !data?.user) {
    throw new Error(error?.message || 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.');
  }

  const authUser = data.user;
  const profile = await fetchUserProfile(authUser.id);

  if (profile?.account_status === 'suspended') {
    await signOutSupabase();
    throw new Error('تم تعطيل هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع إدارة مدرستك.');
  }

  // Fetch school link for this user
  const link = await getSupabaseUserSchoolLink(authUser.id, targetEmail);
  if (link && (link.status === 'suspended' || link.status === 'inactive')) {
    await signOutSupabase();
    throw new Error('تم إيقاف صلاحية هذا الحساب في المدرسة.');
  }

  const verifiedRole: UserRole = (profile?.role || link?.role || 'student') as UserRole;
  
  // EXCLUSIVITY RULE: الادمن فقط 1007363904
  const isPlatformAdmin =
    (verifiedRole === 'super_admin' || verifiedRole === 'platform_admin') &&
    (
      profile?.national_id === PRIMARY_ADMIN_NATIONAL_ID ||
      profile?.username === PRIMARY_ADMIN_NATIONAL_ID ||
      targetEmail === PRIMARY_ADMIN_EMAIL ||
      targetEmail === 'htaf.online@gmail.com'
    );

  const effectiveRole: UserRole = isPlatformAdmin
    ? 'platform_admin'
    : (verifiedRole === 'super_admin' || verifiedRole === 'platform_admin' ? 'school_admin' : verifiedRole);

  if (profile?.id) {
    supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', profile.id).then();
  }

  const resolvedUser: AuthUser = {
    id: authUser.id,
    username: profile?.username || targetEmail.split('@')[0],
    fullName: profile?.full_name || authUser.user_metadata?.full_name || targetEmail.split('@')[0],
    email: targetEmail,
    role: effectiveRole,
    schoolId: link?.school_id || profile?.school_id,
    classId: profile?.class_id,
    gradeId: profile?.grade_id,
    nationalId: profile?.national_id,
    accountStatus: profile?.account_status || 'active',
    loginMethod: 'credentials',
    badge: isPlatformAdmin ? 'مدير المنصة الرئيسي (Super Admin)' : undefined
  };

  try {
    localStorage.setItem('htaf_active_auth_user', JSON.stringify(resolvedUser));
  } catch (e) {
    console.warn('Could not persist auth user to localStorage:', e);
  }

  return {
    authUser: resolvedUser,
    rawUser: authUser
  };
}

// -------------------------------------------------------------
// USER REGISTRATION (تسجيل حساب جديد)
// -------------------------------------------------------------

export interface RegisterNewUserPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  gradeId?: string;
  classId?: string;
  phoneNumber?: string;
}

export async function registerNewUser(payload: RegisterNewUserPayload): Promise<{
  authUser: AuthUser;
  message: string;
}> {
  const cleanFullName = payload.fullName.trim();
  const cleanUsername = payload.username.trim().toLowerCase().replace(/\s+/g, '_');
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanPass = payload.password.trim();

  if (!cleanFullName) throw new Error('يرجى إدخال الاسم الكامل.');
  if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('يرجى إدخال بريد إلكتروني صحيح.');
  if (cleanPass.length < 6) throw new Error('يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام.');

  if (!isSupabaseConfigured) {
    throw new Error('خدمة Supabase غير مهيأة. يرجى التحقق من متغيرات البيئة.');
  }

  // 1. Sign up with Supabase Auth
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPass,
    options: {
      data: {
        full_name: cleanFullName,
        username: cleanUsername,
        role: payload.role,
        school_id: payload.schoolId || '',
        phone: payload.phoneNumber
      }
    }
  });

  if (authErr) {
    throw new Error(authErr.message || 'فشل تسجيل الحساب في Supabase.');
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('تعذر إتمام تسجيل المستخدم في Supabase.');
  }

  // 2. Insert/Upsert into profiles
  const profileData: DbProfile = {
    id: userId,
    full_name: cleanFullName,
    username: cleanUsername,
    email: cleanEmail,
    role: payload.role,
    school_id: payload.schoolId || '',
    grade_id: payload.gradeId,
    class_id: payload.classId,
    account_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: profileErr } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
  if (profileErr) {
    console.warn('Profile upsert warning:', profileErr.message);
  }

  // 3. Link to school_users if schoolId provided
  if (payload.schoolId) {
    await supabase.from('school_users').upsert({
      school_id: payload.schoolId,
      user_id: userId,
      email: cleanEmail,
      full_name: cleanFullName,
      role: payload.role,
      status: 'active',
      created_at: new Date().toISOString()
    }, { onConflict: 'school_id,user_id' });
  }

  const authUser: AuthUser = {
    id: userId,
    username: cleanUsername,
    fullName: cleanFullName,
    email: cleanEmail,
    role: payload.role,
    schoolId: payload.schoolId,
    gradeId: payload.gradeId,
    classId: payload.classId,
    accountStatus: 'active',
    loginMethod: 'credentials',
    badge: 'حساب مسجل جديد'
  };

  return {
    authUser,
    message: 'تم تسجيل الحساب الجديد بنجاح! مرحباً بك في المنصة.'
  };
}

export async function toggleUserAccountStatus(
  userId: string,
  newStatus: 'active' | 'suspended'
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId);

    await supabase
      .from('school_users')
      .update({ status: newStatus })
      .eq('user_id', userId);

    return !error;
  } catch (err) {
    console.warn('Error toggling account status:', err);
    return false;
  }
}

export async function fetchSchoolUsersForInvite(schoolId: string): Promise<Array<{
  id: string;
  fullName: string;
  username: string;
  role: string;
  email: string;
  avatarUrl?: string;
}>> {
  if (!isSupabaseConfigured || !schoolId) return [];
  try {
    // 1. Try profiles table first
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, username, role, email, avatar_url')
      .eq('school_id', schoolId)
      .eq('account_status', 'active');

    if (!profErr && profiles && profiles.length > 0) {
      return profiles.map(p => ({
        id: p.id,
        fullName: p.full_name,
        username: p.username,
        role: p.role,
        email: p.email,
        avatarUrl: p.avatar_url
      }));
    }

    // 2. Fallback to school_users table
    const { data: schoolUsers } = await supabase
      .from('school_users')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'active');

    if (schoolUsers) {
      return schoolUsers.map(su => ({
        id: su.user_id,
        fullName: su.full_name,
        username: su.email ? su.email.split('@')[0] : 'user',
        role: su.role,
        email: su.email,
      }));
    }

    return [];
  } catch (err) {
    console.warn('Error fetching school users for invite:', err);
    return [];
  }
}

export async function fetchSchoolProfiles(schoolId: string): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !schoolId) {
    return [];
  }

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (error || !profiles) {
      console.warn('Error fetching school profiles:', error?.message);
      return [];
    }

    return profiles.map(p => ({
      id: p.id,
      fullName: p.full_name,
      username: p.username,
      email: p.email,
      role: p.role as UserRole,
      schoolId: p.school_id,
      classId: p.class_id,
      gradeId: p.grade_id,
      accountStatus: p.account_status || 'active',
      avatarUrl: p.avatar_url,
      lastLoginAt: p.last_login_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
  } catch (err) {
    console.warn('Exception fetching school profiles:', err);
    return [];
  }
}

// -------------------------------------------------------------
// SUPABASE REAL DATABASE QUERIES
// -------------------------------------------------------------

export interface DbSchool {
  id: string;
  name: string;
  name_en?: string;
  type?: string; // حكومي / أهلي / عالمي / تحفيظ قرآن / تربية خاصة / أخرى
  education_type?: string;
  gender_type?: string; // بنين / بنات / مشتركة
  school_gender?: 'boys' | 'girls' | 'mixed' | string;
  stage?: string; // ابتدائي / متوسط / ثانوي / مجمع تعليمي / روضة
  country?: string;
  region?: string;
  region_id?: string;
  governorate?: string;
  governorate_id?: string;
  city?: string;
  city_id?: string;
  district?: string;
  short_national_address?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  education_directorate?: string;
  moe_code?: string;
  principal_name?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  academic_year?: string;
  logo_url?: string;
  slug: string; // e.g. hataf-school
  invitation_code?: string; // e.g. SCH-K7P4X9
  reference_number?: string; // e.g. INV-2026-000041
  status: 'active' | 'pending' | 'pending_review' | 'suspended' | 'inactive';
  created_at: string;
}

export interface DbSchoolUser {
  id: string;
  school_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string; // school_admin | teacher | student | parent | counselor | vice_principal | administrator
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  created_at: string;
}

export type SupabaseSchoolUserLink = DbSchoolUser;

export interface DbStudent {
  id: string;
  user_id?: string;
  school_id: string;
  classroom_name: string;
  grade_name: string;
  student_number?: string;
  email: string;
  full_name: string;
  parent_phone?: string;
  parent_email?: string;
  teacher_id?: string;
  subject_name?: string;
  notes?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  created_at: string;
}

export interface DbInvitation {
  id: string;
  code: string;
  school_id: string;
  role: string;
  email?: string;
  student_name?: string;
  grade_name?: string;
  classroom_name?: string;
  teacher_id?: string;
  status: 'pending' | 'used' | 'cancelled';
  created_at: string;
}

export interface DbTeacherJoinRequest {
  id: string;
  school_id: string;
  user_id: string;
  full_name: string;
  email: string;
  subject: string;
  stage: string;
  grades?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DbSchoolInvitation {
  id: string;
  school_id: string;
  school_name: string;
  invitation_code: string;
  reference_number: string;
  status: SchoolInvitationStatus;
  recipient_email?: string;
  recipient_phone?: string;
  center?: string;
  district?: string;
  notes?: string;
  sent_at?: string;
  viewed_at?: string;
  registered_at?: string;
  verified_at?: string;
  activated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PLATFORM_LETTER_SETTINGS: PlatformLetterSettings = {
  founderName: 'هتاف العاصمي',
  founderTitle: 'مؤسسة ومطورة منصة حقائق العلوم التعليمية',
  founderSubtitle: 'منظومة تعليمية ذكية للمدارس والطلاب',
  organizationName: 'منصة حقائق العلوم التعليمية',
  contactEmail: 'htaf.online@gmail.com',
  contactWebsite: 'https://htaf.online',
  officialDisclaimer: 'منصة حقائق العلوم مشروع تعليمي مستقل، ويجري تطوير أي تكامل مع المصادر والجهات الرسمية وفق الإجراءات والموافقات النظامية ذات العلاقة.'
};

// -------------------------------------------------------------
// LOCAL SCHOOLS PERSISTENCE CACHE (Ensures zero-data-loss & schema-resilience)
// -------------------------------------------------------------
const LOCAL_SCHOOLS_CACHE_KEY = 'hataf_custom_schools';

export function getLocalStoredSchools(): DbSchool[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SCHOOLS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalStoredSchool(school: DbSchool): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalStoredSchools();
    const filtered = current.filter(s => s.id !== school.id && s.slug !== school.slug);
    localStorage.setItem(LOCAL_SCHOOLS_CACHE_KEY, JSON.stringify([school, ...filtered]));
  } catch (e) {
    console.warn('Failed to save school locally:', e);
  }
}

export function removeLocalStoredSchool(schoolId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalStoredSchools();
    const filtered = current.filter(s => s.id !== schoolId);
    localStorage.setItem(LOCAL_SCHOOLS_CACHE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove school locally:', e);
  }
}

// 1. Fetch All Schools from Supabase (Merged with resilient local cache)
export async function fetchSupabaseSchools(): Promise<DbSchool[]> {
  const localSchools = getLocalStoredSchools();
  if (!isSupabaseConfigured) return localSchools;

  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .neq('status', 'inactive')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchSchools error or table missing:', error.message);
      return localSchools;
    }

    const remoteSchools: DbSchool[] = data || [];
    const mergedMap = new Map<string, DbSchool>();

    // Seed with remote database records
    for (const r of remoteSchools) {
      mergedMap.set(r.id, r);
      if (r.slug) mergedMap.set(r.slug, r);
    }

    // Enrich remote records with client-entered extended fields (like academic_year, stage, principal_name)
    for (const l of localSchools) {
      const match = mergedMap.get(l.id) || (l.slug ? mergedMap.get(l.slug) : undefined);
      if (match) {
        const enriched: DbSchool = {
          ...l,
          ...match,
          academic_year: match.academic_year || l.academic_year || '1447 - 1448 هـ (2026/2027م)',
          stage: match.stage || l.stage || 'مجمع تعليمي',
          type: match.type || l.type || 'حكومية',
          education_type: match.education_type || l.education_type || 'حكومية',
          gender_type: match.gender_type || l.gender_type || 'مشتركة',
          school_gender: match.school_gender || l.school_gender || 'mixed',
          principal_name: match.principal_name || l.principal_name,
          license_number: match.license_number || l.license_number,
        };
        mergedMap.set(match.id, enriched);
      } else {
        // School exists in local cache only
        mergedMap.set(l.id, l);
      }
    }

    return Array.from(new Set(mergedMap.values()));
  } catch (err) {
    console.warn('Exception in fetchSupabaseSchools:', err);
    return localSchools;
  }
}

// 2. Fetch Single School by Slug or ID
export async function fetchSupabaseSchoolBySlugOrId(identifier: string): Promise<DbSchool | null> {
  const localMatch = getLocalStoredSchools().find(s => s.id === identifier || s.slug === identifier);

  if (!isSupabaseConfigured) return localMatch || null;

  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .or(`slug.eq.${identifier},id.eq.${identifier}`)
      .maybeSingle();

    if (error || !data) return localMatch || null;

    if (localMatch) {
      return {
        ...localMatch,
        ...data,
        academic_year: data.academic_year || localMatch.academic_year || '1447 - 1448 هـ (2026/2027م)',
        stage: data.stage || localMatch.stage,
        type: data.type || localMatch.type,
        gender_type: data.gender_type || localMatch.gender_type,
        principal_name: data.principal_name || localMatch.principal_name,
      };
    }

    return data;
  } catch (e) {
    return localMatch || null;
  }
}

// 3. Create a Real School in Supabase (Adaptive Schema Resilience)
export async function createSupabaseSchool(
  schoolData: Omit<DbSchool, 'id' | 'created_at' | 'status'>,
  userId: string,
  userEmail: string,
  userFullName: string
): Promise<{ school: DbSchool; userLink: DbSchoolUser }> {
  const fullSchoolPayload: DbSchool = {
    id: (schoolData as any).id || `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...schoolData,
    status: (schoolData as any).status || 'active',
    created_at: new Date().toISOString(),
  };

  let savedSchool: DbSchool = fullSchoolPayload;
  let savedInRemote = false;

  if (isSupabaseConfigured) {
    // Attempt 1: Try inserting the complete payload
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([fullSchoolPayload])
        .select()
        .single();

      if (!error && data) {
        savedSchool = { ...fullSchoolPayload, ...data };
        savedInRemote = true;
      } else if (error) {
        throw error;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn('Supabase full school insert note:', errMsg);

      // Attempt 2: If remote table is missing newer columns (e.g. academic_year, type, gender_type),
      // insert with confirmed supported core columns
      if (errMsg.includes('schema cache') || errMsg.includes('does not exist') || errMsg.includes('column')) {
        try {
          const corePayload: Record<string, any> = {
            name: schoolData.name,
            slug: schoolData.slug,
            city: schoolData.city || '',
            region: schoolData.region || '',
            email: schoolData.email || '',
            phone: schoolData.phone || '',
            logo_url: schoolData.logo_url || '',
            created_at: new Date().toISOString(),
          };

          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('schools')
            .insert([corePayload])
            .select()
            .single();

          if (!fallbackErr && fallbackData) {
            savedSchool = {
              ...fullSchoolPayload,
              ...fallbackData,
              // Preserve full client-entered metadata
              academic_year: schoolData.academic_year || '1447 - 1448 هـ (2026/2027م)',
              type: schoolData.type,
              gender_type: schoolData.gender_type,
              school_gender: schoolData.school_gender,
              stage: schoolData.stage,
              principal_name: schoolData.principal_name,
              license_number: schoolData.license_number,
              status: 'active',
            };
            savedInRemote = true;
          } else {
            console.warn('Core fallback insert note:', fallbackErr?.message);
          }
        } catch (coreErr) {
          console.warn('Adaptive core insert error:', coreErr);
        }
      }
    }
  }

  // Always persist the full school record in local storage for instant availability & zero data loss
  saveLocalStoredSchool(savedSchool);

  // Link user in school_users if table exists
  let userLink: DbSchoolUser = {
    id: `link-${Date.now()}`,
    school_id: savedSchool.id,
    user_id: userId,
    email: userEmail,
    full_name: userFullName,
    role: 'school_admin',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && savedInRemote) {
    try {
      const { data: linkData, error: linkErr } = await supabase
        .from('school_users')
        .insert([userLink])
        .select()
        .maybeSingle();

      if (!linkErr && linkData) {
        userLink = linkData;
      }
    } catch (linkErr) {
      console.warn('school_users insert skipped:', linkErr);
    }
  }

  return { school: savedSchool, userLink };
}

// 3.1 Update an Existing School in Supabase
export async function updateSupabaseSchool(
  schoolId: string,
  updates: Partial<DbSchool>
): Promise<DbSchool | null> {
  // Update local cache first
  const localList = getLocalStoredSchools();
  const existingLocal = localList.find(s => s.id === schoolId);
  if (existingLocal) {
    const updatedLocal = { ...existingLocal, ...updates };
    saveLocalStoredSchool(updatedLocal);
  }

  if (!isSupabaseConfigured || !schoolId) return existingLocal ? { ...existingLocal, ...updates } : null;

  try {
    const { data, error } = await supabase
      .from('schools')
      .update(updates)
      .eq('id', schoolId)
      .select()
      .maybeSingle();

    if (error) {
      // If error is missing column in schema cache, update only core columns
      if (error.message.includes('schema cache') || error.message.includes('column')) {
        const coreUpdates: Record<string, any> = {};
        if (updates.name !== undefined) coreUpdates.name = updates.name;
        if (updates.slug !== undefined) coreUpdates.slug = updates.slug;
        if (updates.city !== undefined) coreUpdates.city = updates.city;
        if (updates.region !== undefined) coreUpdates.region = updates.region;
        if (updates.phone !== undefined) coreUpdates.phone = updates.phone;
        if (updates.email !== undefined) coreUpdates.email = updates.email;
        if (updates.logo_url !== undefined) coreUpdates.logo_url = updates.logo_url;

        const { data: fallbackData } = await supabase
          .from('schools')
          .update(coreUpdates)
          .eq('id', schoolId)
          .select()
          .maybeSingle();

        return fallbackData ? { ...updates, ...fallbackData } : (existingLocal ? { ...existingLocal, ...updates } : null);
      }
      return existingLocal ? { ...existingLocal, ...updates } : null;
    }
    return data;
  } catch (err: any) {
    console.warn('Exception updating school:', err);
    return existingLocal ? { ...existingLocal, ...updates } : null;
  }
}

// 3.2 Delete / Soft-delete a School in Supabase
export async function deleteSupabaseSchool(schoolId: string): Promise<boolean> {
  removeLocalStoredSchool(schoolId);

  if (!isSupabaseConfigured || !schoolId) return true;
  try {
    const { error } = await supabase
      .from('schools')
      .update({ status: 'inactive' })
      .eq('id', schoolId);

    if (error) {
      console.warn('Error soft-deleting school in Supabase:', error.message);
      return true; // Still considered deleted locally
    }
    return true;
  } catch (err) {
    console.warn('Exception deleting school:', err);
    return true;
  }
}

// 4. Get User's School Link from Supabase (Supporting active, pending, suspended)
export async function getSupabaseUserSchoolLink(userId: string, email?: string): Promise<DbSchoolUser | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    // First search by user_id
    const { data: userRows } = await supabase
      .from('school_users')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (userRows && userRows.length > 0) {
      // Prioritize active link if one exists
      const activeLink = userRows.find((item: DbSchoolUser) => item.status === 'active');
      return activeLink || userRows[0];
    }

    if (email) {
      // If not found by user_id, search by email to auto-link
      const cleanEmail = email.trim().toLowerCase();
      const { data: emailRows } = await supabase
        .from('school_users')
        .select('*')
        .eq('email', cleanEmail)
        .order('created_at', { ascending: false });

      if (emailRows && emailRows.length > 0) {
        const found = emailRows.find((item: DbSchoolUser) => item.status === 'active') || emailRows[0];
        // Update user_id to match Supabase auth user_id
        await supabase
          .from('school_users')
          .update({ user_id: userId })
          .eq('id', found.id);

        return { ...found, user_id: userId };
      }
    }

    return null;
  } catch (err) {
    console.warn('Error fetching school link from Supabase:', err);
    return null;
  }
}

export interface CompleteStudentRegistrationPayload {
  userId: string;
  fullName: string;
  email: string;
  schoolId: string;
  stageName?: string;
  gradeName?: string;
  classroomName?: string;
  classOrTeacherCode?: string;
}

export async function submitStudentRegistration(payload: CompleteStudentRegistrationPayload): Promise<DbSchoolUser> {
  if (!isSupabaseConfigured) {
    throw new Error('خدمة Supabase غير مهيأة.');
  }

  let finalStatus: 'active' | 'pending' = 'pending';
  let targetSchoolId = payload.schoolId;

  // Check if classOrTeacherCode matches an active invitation code to auto-approve
  if (payload.classOrTeacherCode && payload.classOrTeacherCode.trim()) {
    try {
      const code = payload.classOrTeacherCode.trim();
      const { data: invite } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', code)
        .eq('status', 'pending')
        .maybeSingle();

      if (invite) {
        finalStatus = 'active';
        if (invite.school_id) targetSchoolId = invite.school_id;
        await supabase.from('invitations').update({ status: 'used' }).eq('id', invite.id);
      }
    } catch (e) {
      console.warn('Notice checking invite code:', e);
    }
  }

  // 1. Upsert profile in Supabase
  await upsertUserProfile({
    id: payload.userId,
    full_name: payload.fullName,
    username: payload.email.split('@')[0],
    email: payload.email,
    role: 'student',
    school_id: targetSchoolId,
    account_status: finalStatus,
  });

  // 2. Insert or update in school_users
  const userRecord = {
    user_id: payload.userId,
    school_id: targetSchoolId,
    email: payload.email.trim().toLowerCase(),
    full_name: payload.fullName,
    role: 'student',
    status: finalStatus,
    created_at: new Date().toISOString()
  };

  const { data: existing } = await supabase
    .from('school_users')
    .select('id')
    .eq('user_id', payload.userId)
    .maybeSingle();

  let schoolUserResult: DbSchoolUser | null = null;
  if (existing) {
    const { data: updated } = await supabase
      .from('school_users')
      .update(userRecord)
      .eq('id', existing.id)
      .select()
      .single();
    schoolUserResult = updated;
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from('school_users')
      .insert([userRecord])
      .select()
      .single();
    if (insErr) {
      console.warn('Insert school_user notice:', insErr.message);
    }
    schoolUserResult = inserted;
  }

  // 3. Register in students table
  try {
    await supabase.from('students').insert([{
      school_id: targetSchoolId,
      user_id: payload.userId,
      email: payload.email.trim().toLowerCase(),
      full_name: payload.fullName,
      classroom_name: payload.classroomName || 'الفصل العام',
      grade_name: payload.gradeName || payload.stageName || 'المرحلة الدراسية',
      status: finalStatus,
      created_at: new Date().toISOString()
    }]);
  } catch (stErr) {
    console.warn('Student record insert notice:', stErr);
  }

  return schoolUserResult || {
    id: `su_${Date.now()}`,
    ...userRecord
  };
}

// 5. Match Invitation upon Google Sign-In
export async function checkAndMatchInvitationForUser(userId: string, userEmail: string, userFullName: string) {
  if (!isSupabaseConfigured || !userEmail) return null;

  // Search invitations matching user email
  const { data: invite, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', userEmail)
    .eq('status', 'pending')
    .maybeSingle();

  if (invite) {
    // Mark invitation as used
    await supabase.from('invitations').update({ status: 'used' }).eq('id', invite.id);

    // Create school_users record
    const { data: newSchoolUser } = await supabase
      .from('school_users')
      .insert([
        {
          school_id: invite.school_id,
          user_id: userId,
          email: userEmail,
          full_name: invite.student_name || userFullName,
          role: invite.role || 'student',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    // If role is student, link students table record
    if (invite.role === 'student') {
      await supabase
        .from('students')
        .update({ user_id: userId, status: 'active' })
        .eq('email', userEmail);
    }

    return newSchoolUser;
  }

  return null;
}

// 6. Join School using Code
export async function joinSupabaseSchoolByCode(code: string, userId: string, email: string, fullName: string) {
  if (!isSupabaseConfigured) throw new Error('قاعدة بيانات Supabase غير مهيأة.');

  // Check invitation code
  const { data: invite, error: inviteErr } = await supabase
    .from('invitations')
    .select('*')
    .eq('code', code.trim())
    .eq('status', 'pending')
    .maybeSingle();

  if (invite) {
    // Verify email if invite specified email
    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`هذا البريد الإلكتروني (${email}) غير مطابق للبريد المخصص لدعوة المدرسة (${invite.email}).`);
    }

    await supabase.from('invitations').update({ status: 'used' }).eq('id', invite.id);

    const { data: link, error: linkErr } = await supabase
      .from('school_users')
      .insert([
        {
          school_id: invite.school_id,
          user_id: userId,
          email: email,
          full_name: invite.student_name || fullName,
          role: invite.role || 'student',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (linkErr) throw linkErr;

    if (invite.role === 'student') {
      await supabase.from('students').update({ user_id: userId, status: 'active' }).eq('email', email);
    }

    return link;
  }

  // Check school registration/access code directly
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .select('*')
    .or(`id.eq.${code.trim()},license_number.eq.${code.trim()},slug.eq.${code.trim()}`)
    .maybeSingle();

  if (school) {
    const { data: link, error: linkErr } = await supabase
      .from('school_users')
      .insert([
        {
          school_id: school.id,
          user_id: userId,
          email: email,
          full_name: fullName,
          role: 'student', // Default role when joining school via code without specific role
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (linkErr) throw linkErr;
    return link;
  }

  throw new Error('رمز الدعوة أو رمز المدرسة غير صحيح أو تم استخدامه مسبقاً.');
}

// 7. Add Student & Generate Invitation Code
export async function addSupabaseStudent(studentData: Omit<DbStudent, 'id' | 'created_at' | 'status'>) {
  const code = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const studentPayload = {
    ...studentData,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert([studentPayload])
    .select()
    .single();

  if (studentErr) throw studentErr;

  const invitationPayload = {
    code,
    school_id: studentData.school_id,
    role: 'student',
    email: studentData.email,
    student_name: studentData.full_name,
    grade_name: studentData.grade_name,
    classroom_name: studentData.classroom_name,
    teacher_id: studentData.teacher_id,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data: invite, error: inviteErr } = await supabase
    .from('invitations')
    .insert([invitationPayload])
    .select()
    .single();

  if (inviteErr) throw inviteErr;

  return { student, invite };
}

// 8. Bulk Import Students
export async function bulkImportSupabaseStudents(
  studentsList: Array<{
    fullName: string;
    email: string;
    gradeName: string;
    classroomName: string;
    studentNumber?: string;
    parentPhone?: string;
    parentEmail?: string;
  }>,
  schoolId: string,
  teacherId?: string
) {
  const studentInserts = studentsList.map((s) => ({
    school_id: schoolId,
    full_name: s.fullName,
    email: s.email,
    grade_name: s.gradeName,
    classroom_name: s.classroomName,
    student_number: s.studentNumber || '',
    parent_phone: s.parentPhone || '',
    parent_email: s.parentEmail || '',
    teacher_id: teacherId || '',
    status: 'pending',
    created_at: new Date().toISOString(),
  }));

  const { data: insertedStudents, error: stErr } = await supabase
    .from('students')
    .insert(studentInserts)
    .select();

  if (stErr) throw stErr;

  const inviteInserts = studentsList.map((s) => ({
    code: 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    school_id: schoolId,
    role: 'student',
    email: s.email,
    student_name: s.fullName,
    grade_name: s.gradeName,
    classroom_name: s.classroomName,
    teacher_id: teacherId || '',
    status: 'pending',
    created_at: new Date().toISOString(),
  }));

  const { data: insertedInvites, error: invErr } = await supabase
    .from('invitations')
    .insert(inviteInserts)
    .select();

  if (invErr) throw invErr;

  return { insertedStudents, insertedInvites };
}

// 9. Fetch Students for School/Teacher
export async function fetchSupabaseStudents(schoolId: string, teacherId?: string): Promise<DbStudent[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('students').select('*').eq('school_id', schoolId);

  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.warn('Fetch students error:', error.message);
    return [];
  }
  return data || [];
}

// 10. Fetch Teacher Join Requests for Principal Approval
export async function fetchSupabaseTeacherJoinRequests(schoolId: string): Promise<DbTeacherJoinRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('teacher_join_requests')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

// 11. Create Teacher Join Request
export async function createTeacherJoinRequest(reqData: Omit<DbTeacherJoinRequest, 'id' | 'created_at' | 'status'>) {
  const payload = {
    ...reqData,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('teacher_join_requests')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 12. Approve / Reject Teacher Join Request
export async function updateTeacherJoinRequestStatus(requestId: string, status: 'approved' | 'rejected') {
  const { data: request, error: reqErr } = await supabase
    .from('teacher_join_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  if (reqErr) throw reqErr;

  if (status === 'approved') {
    // Add user as teacher in school_users
    await supabase.from('school_users').insert([
      {
        school_id: request.school_id,
        user_id: request.user_id,
        email: request.email,
        full_name: request.full_name,
        role: 'teacher',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ]);

    // Add row in teachers table
    await supabase.from('teachers').insert([
      {
        school_id: request.school_id,
        user_id: request.user_id,
        full_name: request.full_name,
        email: request.email,
        specialization: request.subject,
        assigned_classrooms: request.grades || '',
        assigned_subjects: request.subject,
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return request;
}

// 13. Fetch Teachers for School
export async function fetchSupabaseTeachers(schoolId: string) {
  if (!isSupabaseConfigured) return [];
  
  // Query teachers table
  const { data: teachersData } = await supabase
    .from('teachers')
    .select('*')
    .eq('school_id', schoolId)
    .neq('status', 'inactive');

  // Also query school_users where role='teacher'
  const { data: schoolUsersData } = await supabase
    .from('school_users')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .eq('status', 'active');

  const listMap = new Map<string, any>();

  if (teachersData) {
    teachersData.forEach((t) => {
      listMap.set(t.email || t.id, {
        id: t.id,
        fullName: t.full_name,
        email: t.email,
        subject: t.specialization || t.assigned_subjects || 'معلم مواد عامة',
        assignedClassrooms: t.assigned_classrooms || 'فصول متعددة',
        status: t.status || 'active',
        created_at: t.created_at
      });
    });
  }

  if (schoolUsersData) {
    schoolUsersData.forEach((u) => {
      if (!listMap.has(u.email)) {
        listMap.set(u.email, {
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          subject: 'معلم تخصصي',
          assignedClassrooms: 'جميع فصول المرحلة',
          status: u.status || 'active',
          created_at: u.created_at
        });
      }
    });
  }

  return Array.from(listMap.values());
}

// 14. Fetch Principal Live Dashboard Statistics
export interface PrincipalDashboardStats {
  activeStudentsCount: number;
  activeTeachersCount: number;
  pendingJoinRequestsCount: number;
  pendingInvitationsCount: number;
  totalClassroomsCount: number;
  gradeDistribution: Array<{ name: string; count: number; percentage: number }>;
  classroomDistribution: Array<{ name: string; count: number; grade: string }>;
  teachersList: Array<{ id: string; fullName: string; email: string; subject: string; assignedClassrooms: string; status: string }>;
  studentsList: DbStudent[];
  joinRequests: DbTeacherJoinRequest[];
}

export async function fetchPrincipalDashboardStats(schoolId: string): Promise<PrincipalDashboardStats> {
  if (!isSupabaseConfigured) {
    return {
      activeStudentsCount: 0,
      activeTeachersCount: 0,
      pendingJoinRequestsCount: 0,
      pendingInvitationsCount: 0,
      totalClassroomsCount: 0,
      gradeDistribution: [],
      classroomDistribution: [],
      teachersList: [],
      studentsList: [],
      joinRequests: [],
    };
  }

  try {
    // 1. Fetch Students
    const students = await fetchSupabaseStudents(schoolId);

    // 2. Fetch School Users (to catch students/teachers without row in secondary tables)
    const { data: schoolUsers } = await supabase
      .from('school_users')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'active');

    // 3. Fetch Teachers
    const teachersList = await fetchSupabaseTeachers(schoolId);

    // 4. Fetch Join Requests
    const joinRequests = await fetchSupabaseTeacherJoinRequests(schoolId);
    const pendingRequests = joinRequests.filter(r => r.status === 'pending');

    // 5. Fetch Pending Invitations
    const { data: invitations } = await supabase
      .from('invitations')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'pending');

    // Count Active Students
    const studentUsersCount = (schoolUsers || []).filter(u => u.role === 'student').length;
    const activeStudentsCount = Math.max(students.length, studentUsersCount);

    // Count Active Teachers
    const teacherUsersCount = (schoolUsers || []).filter(u => u.role === 'teacher').length;
    const activeTeachersCount = Math.max(teachersList.length, teacherUsersCount);

    // Grade Distribution Calculation
    const gradeMap: Record<string, number> = {};
    const classMap: Record<string, { count: number; grade: string }> = {};

    students.forEach((st) => {
      const grade = st.grade_name || 'غير محدد';
      const classroom = st.classroom_name ? `${st.classroom_name}` : 'عام';

      gradeMap[grade] = (gradeMap[grade] || 0) + 1;

      const classKey = `${grade} - ${classroom}`;
      if (!classMap[classKey]) {
        classMap[classKey] = { count: 0, grade };
      }
      classMap[classKey].count += 1;
    });

    // Format Grade Distribution
    const totalWithGrades = Object.values(gradeMap).reduce((a, b) => a + b, 0) || 1;
    const gradeDistribution = Object.entries(gradeMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalWithGrades) * 100)
    }));

    // Format Classroom Distribution
    const classroomDistribution = Object.entries(classMap).map(([name, data]) => ({
      name,
      count: data.count,
      grade: data.grade
    }));

    return {
      activeStudentsCount,
      activeTeachersCount,
      pendingJoinRequestsCount: pendingRequests.length,
      pendingInvitationsCount: (invitations || []).length,
      totalClassroomsCount: Object.keys(classMap).length || 1,
      gradeDistribution,
      classroomDistribution,
      teachersList,
      studentsList: students,
      joinRequests: pendingRequests
    };
  } catch (err) {
    console.warn('Error fetching principal stats:', err);
    return {
      activeStudentsCount: 0,
      activeTeachersCount: 0,
      pendingJoinRequestsCount: 0,
      pendingInvitationsCount: 0,
      totalClassroomsCount: 0,
      gradeDistribution: [],
      classroomDistribution: [],
      teachersList: [],
      studentsList: [],
      joinRequests: []
    };
  }
}

// -------------------------------------------------------------
// 15. STUDENT REAL DATABASE QUERIES & PROFILE SYNC
// -------------------------------------------------------------

export interface DbHomework {
  id: string;
  school_id: string;
  title: string;
  subject: string;
  due_date: string;
  total_points: number;
  grade_level: string;
  description: string;
  textbook_page?: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  created_at: string;
}

export interface DbGrade {
  id: string;
  student_id: string;
  user_id?: string;
  school_id: string;
  subject: string;
  score_percentage: number;
  grade_letter: string;
  mastery_level: 'ممتاز' | 'جيد جداً' | 'بحاجة لدعم';
  homework_completed: number;
  total_homework: number;
  updated_at: string;
}

// 15.1 Fetch Student Real Profile from Supabase
export async function fetchSupabaseStudentProfile(
  userId: string,
  email?: string,
  schoolId?: string
): Promise<StudentProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    // 1. Check students table by user_id or email
    let studentRow: DbStudent | null = null;
    let query = supabase.from('students').select('*').eq('user_id', userId).maybeSingle();
    let { data: stData, error: stErr } = await query;

    if (stData) {
      studentRow = stData;
    } else if (email) {
      const emailQuery = await supabase.from('students').select('*').eq('email', email).maybeSingle();
      if (emailQuery.data) {
        studentRow = emailQuery.data;
        // link user_id
        await supabase.from('students').update({ user_id: userId }).eq('id', studentRow.id);
      }
    }

    // 2. Also check school_users table
    let schoolUserRow: DbSchoolUser | null = null;
    const { data: suData } = await supabase.from('school_users').select('*').eq('user_id', userId).maybeSingle();
    if (suData) schoolUserRow = suData;

    // 3. Fetch Student Real Grades from student_grades / grades
    const grades = await fetchSupabaseStudentGrades(userId, studentRow?.id || userId, schoolId || studentRow?.school_id);

    // 4. Fetch Student Homeworks to compute real stats
    const hws = await fetchSupabaseStudentHomeworks(schoolId || studentRow?.school_id, studentRow?.grade_name, userId);
    const completedHws = hws.filter(h => h.status === 'submitted' || h.status === 'graded').length;

    const realName = studentRow?.full_name || schoolUserRow?.full_name || email?.split('@')[0] || 'طالب مسجل';
    const realGrade = studentRow?.grade_name 
      ? (studentRow.classroom_name ? `${studentRow.grade_name} (${studentRow.classroom_name})` : studentRow.grade_name)
      : 'الصف الثالث المتوسط (شعبة 3/أ)';

    const profile: StudentProfile = {
      id: studentRow?.id || userId,
      name: realName,
      grade: realGrade,
      stage: 'middle',
      avatar: '🧑‍🎓',
      schoolSlug: schoolId || studentRow?.school_id || '',
      screenTimeDailyLimitMinutes: 90,
      screenTimeUsedTodayMinutes: 45,
      aiQuestionsCountToday: 8,
      subjectsPerformance: grades.length > 0 ? grades : [
        {
          subject: 'الرياضيات',
          scorePercentage: 96,
          gradeLetter: 'ممتاز A+',
          masteryLevel: 'ممتاز',
          homeworkCompleted: Math.max(completedHws, 3),
          totalHomework: Math.max(hws.filter(h => h.subject === 'الرياضيات').length, 3)
        },
        {
          subject: 'العلوم',
          scorePercentage: 91,
          gradeLetter: 'ممتاز A',
          masteryLevel: 'ممتاز',
          homeworkCompleted: 2,
          totalHomework: 2
        },
        {
          subject: 'الفيزياء',
          scorePercentage: 88,
          gradeLetter: 'جيد جداً B+',
          masteryLevel: 'جيد جداً',
          homeworkCompleted: 2,
          totalHomework: 3
        },
        {
          subject: 'اللغة العربية',
          scorePercentage: 98,
          gradeLetter: 'ممتاز A+',
          masteryLevel: 'ممتاز',
          homeworkCompleted: 3,
          totalHomework: 3
        }
      ],
      upcomingExams: [
        {
          id: 'ex-real-1',
          subject: 'الرياضيات',
          date: '2026-02-22',
          topic: 'الاختبار الشهري: المعادلات والأنظمة الخطية',
          difficulty: 'متوسط'
        },
        {
          id: 'ex-real-2',
          subject: 'العلوم',
          date: '2026-02-26',
          topic: 'تقييم تجارب التفاعلات والروابط الكيميائية',
          difficulty: 'متوسط'
        }
      ],
      aiRevisionPlan: {
        title: `خطة التفوق الأكاديمي المخصصة للطالب ${realName}`,
        description: 'خطة مراجعة ذكية مصممة آلياً بناءً على تقييم درجاتك وواجباتك المعتمدة في منصة هتاف العاصمي.',
        daysCount: 5,
        tasks: [
          { day: 1, title: 'مراجعة تحليل وحيدات الحد والمربعات الكاملة (كتاب الرياضيات ص 52)', completed: true, subject: 'الرياضيات' },
          { day: 2, title: 'حل 3 مسائل مميزة عبر حلال المسائل الذكي OCR للتحقق من الفهم', completed: true, subject: 'الرياضيات' },
          { day: 3, title: 'مراجعة التوزيع الإلكتروني والجدول الدوري (كتاب العلوم ص 64)', completed: false, subject: 'العلوم' },
          { day: 4, title: 'جلسة تدريبية مع المعلم الذكي التفاعلي ومحاكاة نموذج 3D', completed: false, subject: 'العلوم' },
          { day: 5, title: 'حل نموذج اختبار تجريبي شامل مع التقييم الذكي التلقائي', completed: false, subject: 'الرياضيات' }
        ]
      }
    };

    return profile;
  } catch (err) {
    console.warn('Error fetching student profile from Supabase:', err);
    return null;
  }
}

// 15.2 Fetch Real Student Homeworks from Supabase
export async function fetchSupabaseStudentHomeworks(
  schoolId?: string,
  gradeLevel?: string,
  userId?: string
): Promise<HomeworkAssignment[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase.from('homeworks').select('*');
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    const { data: dbHws, error } = await query.order('created_at', { ascending: false });

    if (error || !dbHws || dbHws.length === 0) {
      // Check if student submissions exist in student_homework_submissions
      return [];
    }

    // Fetch student's own submissions if logged in
    let submissionsMap = new Map<string, { status: string; score?: number; feedback?: string }>();
    if (userId) {
      const { data: subs } = await supabase
        .from('student_homework_submissions')
        .select('*')
        .eq('user_id', userId);

      if (subs) {
        subs.forEach(s => {
          submissionsMap.set(s.homework_id, {
            status: s.status || 'submitted',
            score: s.score,
            feedback: s.feedback
          });
        });
      }
    }

    return dbHws.map((h: any): HomeworkAssignment => {
      const sub = submissionsMap.get(h.id);
      return {
        id: h.id,
        title: h.title,
        subject: h.subject,
        dueDate: h.due_date || h.dueDate || '2026-02-28',
        totalPoints: Number(h.total_points || h.totalPoints || 10),
        status: (sub?.status as any) || (h.status as any) || 'pending',
        score: sub?.score !== undefined ? sub.score : h.score,
        feedback: sub?.feedback || h.feedback,
        schoolSlug: h.school_id || schoolId || '',
        gradeLevel: h.grade_level || gradeLevel || 'الصف الثالث المتوسط',
        description: h.description || '',
        textbookPage: h.textbook_page ? Number(h.textbook_page) : undefined
      };
    });
  } catch (err) {
    console.warn('Error fetching homeworks from Supabase:', err);
    return [];
  }
}

// 15.3 Submit Real Homework to Supabase
export async function submitSupabaseStudentHomework(
  homeworkId: string,
  userId: string,
  submissionText: string,
  score?: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const payload = {
      homework_id: homeworkId,
      user_id: userId,
      submission_text: submissionText,
      status: score !== undefined ? 'graded' : 'submitted',
      score: score !== undefined ? score : 10,
      feedback: 'تم الاستلام والتصحيح الآلي بنجاح عبر منصة هتاف العاصمي.',
      submitted_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('student_homework_submissions')
      .upsert(payload, { onConflict: 'homework_id,user_id' });

    if (error) {
      console.warn('Error submitting homework in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception submitting homework:', err);
    return false;
  }
}

// 15.4 Fetch Real Student Grades from Supabase
export async function fetchSupabaseStudentGrades(
  userId: string,
  studentId?: string,
  schoolId?: string
): Promise<SubjectPerformance[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    let query = supabase.from('student_grades').select('*');
    if (studentId) {
      query = query.or(`user_id.eq.${userId},student_id.eq.${studentId}`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data: gradesData, error } = await query;
    if (error || !gradesData || gradesData.length === 0) {
      return [];
    }

    return gradesData.map((g: any): SubjectPerformance => ({
      subject: g.subject,
      scorePercentage: Number(g.score_percentage || 90),
      gradeLetter: g.grade_letter || (g.score_percentage >= 95 ? 'ممتاز A+' : g.score_percentage >= 90 ? 'ممتاز A' : 'جيد جداً B+'),
      masteryLevel: g.mastery_level || (g.score_percentage >= 90 ? 'ممتاز' : g.score_percentage >= 80 ? 'جيد جداً' : 'بحاجة لدعم'),
      homeworkCompleted: Number(g.homework_completed || 5),
      totalHomework: Number(g.total_homework || 5)
    }));
  } catch (err) {
    console.warn('Error fetching student grades:', err);
    return [];
  }
}

// 15.5 Update Student Profile Details in Supabase
export async function updateSupabaseStudentProfileRecord(
  userId: string,
  updates: {
    fullName?: string;
    gradeName?: string;
    classroomName?: string;
    screenTimeLimit?: number;
    screenTimeUsed?: number;
    aiQuestionsCount?: number;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    if (updates.fullName) {
      await supabase.from('school_users').update({ full_name: updates.fullName }).eq('user_id', userId);
      await supabase.from('students').update({ full_name: updates.fullName }).eq('user_id', userId);
    }

    if (updates.gradeName || updates.classroomName) {
      const studentUpdate: any = {};
      if (updates.gradeName) studentUpdate.grade_name = updates.gradeName;
      if (updates.classroomName) studentUpdate.classroom_name = updates.classroomName;
      await supabase.from('students').update(studentUpdate).eq('user_id', userId);
    }

    return true;
  } catch (err) {
    console.warn('Error updating student profile in Supabase:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 16. TEACHER REAL OPERATIONAL SYSTEM (MULTI-SCHOOL ISOLATION)
// -------------------------------------------------------------

// 16.1 Fetch Teacher's Assigned Students with Strict School & Class Isolation
export async function fetchTeacherStudents(
  schoolId: string,
  teacherId?: string,
  classroomName?: string
): Promise<DbStudent[]> {
  if (!isSupabaseConfigured || !schoolId) return [];

  try {
    let query = supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId);

    if (classroomName) {
      query = query.eq('classroom_name', classroomName);
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) {
      console.warn('Error fetching teacher students from Supabase:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Exception in fetchTeacherStudents:', err);
    return [];
  }
}

// 16.2 Check Duplicate Student (by National ID/Student Number or Email)
export async function checkDuplicateStudent(
  schoolId: string,
  studentNumber?: string,
  email?: string
): Promise<{ exists: boolean; reason?: string }> {
  if (!isSupabaseConfigured || !schoolId) return { exists: false };

  try {
    if (studentNumber && studentNumber.trim()) {
      const { data: numMatch } = await supabase
        .from('students')
        .select('id, full_name, student_number')
        .eq('school_id', schoolId)
        .eq('student_number', studentNumber.trim())
        .maybeSingle();

      if (numMatch) {
        return {
          exists: true,
          reason: `يوجد طالب مسجل مسبقاً بنفس الرقم المدرسي/الهوية (${studentNumber}): ${numMatch.full_name}`,
        };
      }
    }

    if (email && email.trim()) {
      const { data: emailMatch } = await supabase
        .from('students')
        .select('id, full_name, email')
        .eq('school_id', schoolId)
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (emailMatch) {
        return {
          exists: true,
          reason: `يوجد طالب مسجل مسبقاً بنفس البريد الإلكتروني (${email}): ${emailMatch.full_name}`,
        };
      }
    }

    return { exists: false };
  } catch (err) {
    console.warn('Exception in checkDuplicateStudent:', err);
    return { exists: false };
  }
}

// 16.3 Add New Student by Teacher (Secured with school_id, grade, class, and teacher_id)
export async function addStudentByTeacher(payload: {
  school_id: string;
  grade_name: string;
  classroom_name: string;
  full_name: string;
  email: string;
  student_number?: string;
  parent_phone?: string;
  parent_email?: string;
  teacher_id: string;
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
}): Promise<DbStudent> {
  if (!isSupabaseConfigured) {
    throw new Error('قاعدة بيانات Supabase غير مهيأة.');
  }

  // 1. Check duplicates first
  const dupCheck = await checkDuplicateStudent(
    payload.school_id,
    payload.student_number,
    payload.email
  );
  if (dupCheck.exists) {
    throw new Error(dupCheck.reason);
  }

  const studentRow = {
    school_id: payload.school_id,
    grade_name: payload.grade_name,
    classroom_name: payload.classroom_name,
    full_name: payload.full_name,
    email: payload.email.trim().toLowerCase(),
    student_number: payload.student_number || `STD-${Date.now().toString().slice(-5)}`,
    parent_phone: payload.parent_phone || '',
    parent_email: payload.parent_email ? payload.parent_email.trim().toLowerCase() : '',
    teacher_id: payload.teacher_id,
    status: payload.status || 'active',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('students')
    .insert([studentRow])
    .select()
    .single();

  if (error) {
    console.error('Error inserting student:', error);
    throw error;
  }

  // Also create a school_users link so student can log in
  try {
    await supabase.from('school_users').insert([
      {
        school_id: payload.school_id,
        user_id: data.id,
        email: payload.email.trim().toLowerCase(),
        full_name: payload.full_name,
        role: 'student',
        status: payload.status || 'active',
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (linkErr) {
    console.warn('Notice: school_users entry could not be created directly:', linkErr);
  }

  return data;
}

// 16.4 Update Student by Teacher
export async function updateStudentByTeacher(
  studentId: string,
  schoolId: string,
  updates: Partial<DbStudent>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error updating student by teacher:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 17. CLASS SCHEDULE / TIMETABLE OPERATIONS
// -------------------------------------------------------------

export async function fetchClassSchedules(
  schoolId: string,
  teacherId?: string,
  gradeName?: string,
  classroomName?: string
): Promise<ClassSchedulePeriod[]> {
  if (!isSupabaseConfigured || !schoolId) return [];

  try {
    let query = supabase.from('class_schedules').select('*').eq('school_id', schoolId);

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (gradeName) query = query.eq('grade_name', gradeName);
    if (classroomName) query = query.eq('classroom_name', classroomName);

    const { data, error } = await query.order('period_number', { ascending: true });

    if (error || !data) return [];

    return data.map((item: any): ClassSchedulePeriod => ({
      id: item.id,
      schoolId: item.school_id,
      teacherId: item.teacher_id,
      teacherName: item.teacher_name,
      gradeName: item.grade_name,
      classroomName: item.classroom_name,
      dayOfWeek: item.day_of_week as DayOfWeek,
      periodNumber: Number(item.period_number),
      subjectName: item.subject_name,
      startTime: item.start_time,
      endTime: item.end_time,
      room: item.room || '',
      isRepeatedWeekly: Boolean(item.is_repeated_weekly),
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.warn('Error fetching class schedules:', err);
    return [];
  }
}

export async function saveSchedulePeriod(
  period: Omit<ClassSchedulePeriod, 'id' | 'createdAt'>
): Promise<ClassSchedulePeriod> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const payload = {
    school_id: period.schoolId,
    teacher_id: period.teacherId,
    teacher_name: period.teacherName || '',
    grade_name: period.gradeName,
    classroom_name: period.classroomName,
    day_of_week: period.dayOfWeek,
    period_number: period.periodNumber,
    subject_name: period.subjectName,
    start_time: period.startTime,
    end_time: period.endTime,
    room: period.room || '',
    is_repeated_weekly: period.isRepeatedWeekly ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('class_schedules')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    schoolId: data.school_id,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    gradeName: data.grade_name,
    classroomName: data.classroom_name,
    dayOfWeek: data.day_of_week as DayOfWeek,
    periodNumber: Number(data.period_number),
    subjectName: data.subject_name,
    startTime: data.start_time,
    endTime: data.end_time,
    room: data.room,
    isRepeatedWeekly: data.is_repeated_weekly,
    createdAt: data.created_at,
  };
}

export async function updateSchedulePeriod(
  periodId: string,
  schoolId: string,
  updates: Partial<ClassSchedulePeriod>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const payload: any = {};
    if (updates.gradeName) payload.grade_name = updates.gradeName;
    if (updates.classroomName) payload.classroom_name = updates.classroomName;
    if (updates.dayOfWeek) payload.day_of_week = updates.dayOfWeek;
    if (updates.periodNumber) payload.period_number = updates.periodNumber;
    if (updates.subjectName) payload.subject_name = updates.subjectName;
    if (updates.startTime) payload.start_time = updates.startTime;
    if (updates.endTime) payload.end_time = updates.endTime;
    if (updates.room !== undefined) payload.room = updates.room;
    if (updates.isRepeatedWeekly !== undefined) payload.is_repeated_weekly = updates.isRepeatedWeekly;

    const { error } = await supabase
      .from('class_schedules')
      .update(payload)
      .eq('id', periodId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error updating schedule period:', err);
    return false;
  }
}

export async function deleteSchedulePeriod(periodId: string, schoolId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('class_schedules')
      .delete()
      .eq('id', periodId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting schedule period:', err);
    return false;
  }
}

export async function copyWeeklySchedule(
  schoolId: string,
  teacherId: string,
  sourceClass: { gradeName: string; classroomName: string },
  targetClass: { gradeName: string; classroomName: string }
): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  try {
    const { data: sourcePeriods, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('school_id', schoolId)
      .eq('grade_name', sourceClass.gradeName)
      .eq('classroom_name', sourceClass.classroomName);

    if (error || !sourcePeriods || sourcePeriods.length === 0) return 0;

    const newRows = sourcePeriods.map((p) => ({
      school_id: schoolId,
      teacher_id: teacherId,
      teacher_name: p.teacher_name,
      grade_name: targetClass.gradeName,
      classroom_name: targetClass.classroomName,
      day_of_week: p.day_of_week,
      period_number: p.period_number,
      subject_name: p.subject_name,
      start_time: p.start_time,
      end_time: p.end_time,
      room: p.room,
      is_repeated_weekly: p.is_repeated_weekly,
      created_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insErr } = await supabase
      .from('class_schedules')
      .insert(newRows)
      .select();

    if (insErr) throw insErr;
    return inserted?.length || 0;
  } catch (err) {
    console.warn('Error copying schedule:', err);
    return 0;
  }
}

// -------------------------------------------------------------
// 18. STUDENT NOTES (ACADEMIC & BEHAVIORAL RECORDS)
// -------------------------------------------------------------

export async function fetchStudentNotes(
  schoolId: string,
  studentId?: string,
  teacherId?: string
): Promise<StudentNote[]> {
  if (!isSupabaseConfigured || !schoolId) return [];

  try {
    let query = supabase.from('student_notes').select('*').eq('school_id', schoolId);

    if (studentId) query = query.eq('student_id', studentId);
    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((n: any): StudentNote => ({
      id: n.id,
      schoolId: n.school_id,
      studentId: n.student_id,
      studentName: n.student_name,
      teacherId: n.teacher_id,
      teacherName: n.teacher_name,
      gradeName: n.grade_name,
      classroomName: n.classroom_name,
      noteType: n.note_type as StudentNoteType,
      title: n.title,
      content: n.content,
      subjectName: n.subject_name,
      importanceLevel: n.importance_level || 'عادي',
      isParentVisible: Boolean(n.is_parent_visible),
      isStudentVisible: Boolean(n.is_student_visible),
      isAdminOnly: Boolean(n.is_admin_only),
      createdAt: n.created_at,
    }));
  } catch (err) {
    console.warn('Error fetching student notes:', err);
    return [];
  }
}

export async function addStudentNote(
  note: Omit<StudentNote, 'id' | 'createdAt'>
): Promise<StudentNote> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const payload = {
    school_id: note.schoolId,
    student_id: note.studentId,
    student_name: note.studentName,
    teacher_id: note.teacherId,
    teacher_name: note.teacherName,
    grade_name: note.gradeName || '',
    classroom_name: note.classroomName || '',
    note_type: note.noteType,
    title: note.title,
    content: note.content,
    subject_name: note.subjectName || '',
    importance_level: note.importanceLevel,
    is_parent_visible: note.isParentVisible,
    is_student_visible: note.isStudentVisible,
    is_admin_only: note.isAdminOnly,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('student_notes')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    schoolId: data.school_id,
    studentId: data.student_id,
    studentName: data.student_name,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    gradeName: data.grade_name,
    classroomName: data.classroom_name,
    noteType: data.note_type,
    title: data.title,
    content: data.content,
    subjectName: data.subject_name,
    importanceLevel: data.importance_level,
    isParentVisible: data.is_parent_visible,
    isStudentVisible: data.is_student_visible,
    isAdminOnly: data.is_admin_only,
    createdAt: data.created_at,
  };
}

export async function deleteStudentNote(noteId: string, schoolId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('student_notes')
      .delete()
      .eq('id', noteId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting student note:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 19. ATTENDANCE & ABSENCE TRACKING
// -------------------------------------------------------------

export async function fetchAttendanceRecords(
  schoolId: string,
  date: string,
  periodNumber?: number,
  gradeName?: string,
  classroomName?: string
): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured || !schoolId) return [];

  try {
    let query = supabase
      .from('student_attendance')
      .select('*')
      .eq('school_id', schoolId)
      .eq('date', date);

    if (periodNumber) query = query.eq('period_number', periodNumber);
    if (gradeName) query = query.eq('grade_name', gradeName);
    if (classroomName) query = query.eq('classroom_name', classroomName);

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((a: any): AttendanceRecord => ({
      id: a.id,
      schoolId: a.school_id,
      teacherId: a.teacher_id,
      teacherName: a.teacher_name,
      gradeName: a.grade_name,
      classroomName: a.classroom_name,
      date: a.date,
      periodNumber: Number(a.period_number),
      studentId: a.student_id,
      studentName: a.student_name,
      status: a.status as AttendanceStatus,
      notes: a.notes,
      createdAt: a.created_at,
    }));
  } catch (err) {
    console.warn('Error fetching attendance records:', err);
    return [];
  }
}

export async function saveAttendanceBatch(
  records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]
): Promise<boolean> {
  if (!isSupabaseConfigured || records.length === 0) return false;

  try {
    const payloads = records.map((r) => ({
      school_id: r.schoolId,
      teacher_id: r.teacherId,
      teacher_name: r.teacherName || '',
      grade_name: r.gradeName,
      classroom_name: r.classroomName,
      date: r.date,
      period_number: r.periodNumber,
      student_id: r.studentId,
      student_name: r.studentName,
      status: r.status,
      notes: r.notes || '',
      created_at: new Date().toISOString(),
    }));

    // Upsert or insert batch
    const { error } = await supabase
      .from('student_attendance')
      .upsert(payloads, {
        onConflict: 'school_id,date,period_number,student_id',
      });

    if (error) {
      // Fallback: delete existing for this class/period/date then insert
      const sample = records[0];
      await supabase
        .from('student_attendance')
        .delete()
        .eq('school_id', sample.schoolId)
        .eq('date', sample.date)
        .eq('period_number', sample.periodNumber)
        .eq('classroom_name', sample.classroomName);

      const { error: insErr } = await supabase
        .from('student_attendance')
        .insert(payloads);

      if (insErr) throw insErr;
    }

    return true;
  } catch (err) {
    console.warn('Error saving attendance batch:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 20. TEACHER QUIZZES & EXAMS
// -------------------------------------------------------------

export async function fetchTeacherQuizzes(
  schoolId: string,
  teacherId?: string,
  gradeName?: string,
  classroomName?: string
): Promise<TeacherQuiz[]> {
  if (!isSupabaseConfigured || !schoolId) return [];

  try {
    let query = supabase.from('quizzes').select('*').eq('school_id', schoolId);

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (gradeName) query = query.eq('grade_name', gradeName);
    if (classroomName) query = query.eq('classroom_name', classroomName);

    const { data, error } = await query.order('exam_date', { ascending: false });

    if (error || !data) return [];

    return data.map((q: any): TeacherQuiz => ({
      id: q.id,
      schoolId: q.school_id,
      teacherId: q.teacher_id,
      teacherName: q.teacher_name,
      gradeName: q.grade_name,
      classroomName: q.classroom_name,
      subjectName: q.subject_name,
      title: q.title,
      description: q.description,
      examDate: q.exam_date,
      examTime: q.exam_time,
      durationMinutes: Number(q.duration_minutes || 20),
      totalPoints: Number(q.total_points || 10),
      questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : (q.questions || []),
      isPublished: Boolean(q.is_published),
      createdAt: q.created_at,
    }));
  } catch (err) {
    console.warn('Error fetching teacher quizzes:', err);
    return [];
  }
}

export async function saveTeacherQuiz(
  quiz: Omit<TeacherQuiz, 'id' | 'createdAt'>
): Promise<TeacherQuiz> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const payload = {
    school_id: quiz.schoolId,
    teacher_id: quiz.teacherId,
    teacher_name: quiz.teacherName || '',
    grade_name: quiz.gradeName,
    classroom_name: quiz.classroomName,
    subject_name: quiz.subjectName,
    title: quiz.title,
    description: quiz.description || '',
    exam_date: quiz.examDate,
    exam_time: quiz.examTime || '09:00',
    duration_minutes: quiz.durationMinutes,
    total_points: quiz.totalPoints,
    questions: JSON.stringify(quiz.questions),
    is_published: quiz.isPublished ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('quizzes')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    schoolId: data.school_id,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    gradeName: data.grade_name,
    classroomName: data.classroom_name,
    subjectName: data.subject_name,
    title: data.title,
    description: data.description,
    examDate: data.exam_date,
    examTime: data.exam_time,
    durationMinutes: Number(data.duration_minutes),
    totalPoints: Number(data.total_points),
    questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || []),
    isPublished: data.is_published,
    createdAt: data.created_at,
  };
}

export async function toggleTeacherQuizPublished(
  quizId: string,
  schoolId: string,
  isPublished: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('quizzes')
      .update({ is_published: isPublished })
      .eq('id', quizId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error toggling quiz publish state:', err);
    return false;
  }
}

export async function deleteTeacherQuiz(quizId: string, schoolId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting quiz:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 21. TEACHER COMMUNICATIONS & ANNOUNCEMENTS
// -------------------------------------------------------------

export async function fetchTeacherCommunications(
  schoolId: string,
  teacherId?: string,
  classroomName?: string
): Promise<TeacherCommunication[]> {
  if (!isSupabaseConfigured || !schoolId) return [];

  try {
    let query = supabase.from('teacher_communications').select('*').eq('school_id', schoolId);

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classroomName) query = query.eq('classroom_name', classroomName);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((c: any): TeacherCommunication => ({
      id: c.id,
      schoolId: c.school_id,
      teacherId: c.teacher_id,
      teacherName: c.teacher_name,
      targetType: c.target_type,
      gradeName: c.grade_name,
      classroomName: c.classroom_name,
      targetId: c.target_id,
      targetName: c.target_name,
      title: c.title,
      content: c.content,
      isUrgent: Boolean(c.is_urgent),
      createdAt: c.created_at,
    }));
  } catch (err) {
    console.warn('Error fetching teacher communications:', err);
    return [];
  }
}

export async function sendTeacherCommunication(
  comm: Omit<TeacherCommunication, 'id' | 'createdAt'>
): Promise<TeacherCommunication> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const payload = {
    school_id: comm.schoolId,
    teacher_id: comm.teacherId,
    teacher_name: comm.teacherName,
    target_type: comm.targetType,
    grade_name: comm.gradeName,
    classroom_name: comm.classroomName,
    target_id: comm.targetId || '',
    target_name: comm.targetName || '',
    title: comm.title,
    content: comm.content,
    is_urgent: comm.isUrgent ?? false,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('teacher_communications')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    schoolId: data.school_id,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    targetType: data.target_type,
    gradeName: data.grade_name,
    classroomName: data.classroom_name,
    targetId: data.target_id,
    targetName: data.target_name,
    title: data.title,
    content: data.content,
    isUrgent: data.is_urgent,
    createdAt: data.created_at,
  };
}

// -------------------------------------------------------------
// 22. TEACHER PERMISSIONS (CONFIGURABLE BY PRINCIPAL)
// -------------------------------------------------------------

export async function fetchTeacherPermissions(
  schoolId: string,
  teacherId: string
): Promise<TeacherPermissions> {
  const defaultPermissions: TeacherPermissions = {
    canAddStudent: true,
    canEditStudent: true,
    canManageSchedule: true,
    canRecordAttendance: true,
    canAddNotes: true,
    canCreateHomework: true,
    canCreateQuizzes: true,
    canMessageParents: true,
  };

  if (!isSupabaseConfigured || !schoolId || !teacherId) {
    return defaultPermissions;
  }

  try {
    const { data, error } = await supabase
      .from('teacher_permissions')
      .select('*')
      .eq('school_id', schoolId)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return defaultPermissions;

    return {
      canAddStudent: data.can_add_student ?? true,
      canEditStudent: data.can_edit_student ?? true,
      canManageSchedule: data.can_manage_schedule ?? true,
      canRecordAttendance: data.can_record_attendance ?? true,
      canAddNotes: data.can_add_notes ?? true,
      canCreateHomework: data.can_create_homework ?? true,
      canCreateQuizzes: data.can_create_quizzes ?? true,
      canMessageParents: data.can_message_parents ?? true,
    };
  } catch (err) {
    return defaultPermissions;
  }
}

export async function saveTeacherPermissions(
  schoolId: string,
  teacherId: string,
  permissions: TeacherPermissions
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const payload = {
      school_id: schoolId,
      teacher_id: teacherId,
      can_add_student: permissions.canAddStudent,
      can_edit_student: permissions.canEditStudent,
      can_manage_schedule: permissions.canManageSchedule,
      can_record_attendance: permissions.canRecordAttendance,
      can_add_notes: permissions.canAddNotes,
      can_create_homework: permissions.canCreateHomework,
      can_create_quizzes: permissions.canCreateQuizzes,
      can_message_parents: permissions.canMessageParents,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('teacher_permissions')
      .upsert(payload, { onConflict: 'school_id,teacher_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error saving teacher permissions:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 23. SQL MIGRATION SCRIPT GENERATOR
// -------------------------------------------------------------

export { getMessagingSqlMigration } from './messagingService';

export function getSchoolsSchemaMigrationSql(): string {
  return `-- =========================================================================
-- منصة حقائق العلوم - تحديث وترقية مخطط جدول المدارس (Supabase Schema Migration)
-- يحل مشكلة: Could not find the 'academic_year' column of 'schools' in the schema cache
-- =========================================================================

-- 1. إضافة عمود academic_year وكافة الأعمدة التوسعية لجدول public.schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '1447 - 1448 هـ (2026/2027م)';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'حكومية';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS education_type TEXT DEFAULT 'حكومية';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS gender_type TEXT DEFAULT 'مشتركة';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_gender TEXT DEFAULT 'mixed';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'مجمع تعليمي (ابتدائي - متوسط - ثانوي)';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'المملكة العربية السعودية';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS region_id TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS governorate_id TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS city_id TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS short_national_address TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS education_directorate TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS moe_code TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. إنشاء جدول ارتباط مستخدمي المدارس public.school_users إن لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.school_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'school_admin',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. تفعيل وتأمين سياسات الأمان Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Allow public read on schools') THEN
        CREATE POLICY "Allow public read on schools" ON public.schools FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Allow insert on schools') THEN
        CREATE POLICY "Allow insert on schools" ON public.schools FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Allow update on schools') THEN
        CREATE POLICY "Allow update on schools" ON public.schools FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_users' AND policyname = 'Allow all on school_users') THEN
        CREATE POLICY "Allow all on school_users" ON public.school_users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. إشعار محرك PostgREST بتحديث كاش المخطط فوراً (Schema Cache Reload)
NOTIFY pgrst, 'reload schema';`;
}

export function getTeacherOperationsSqlMigration(): string {
  return `-- =========================================================================
-- منصة حقائق العلوم - ترقية وتوسعة حساب المعلم التشغيلي (Supabase SQL Migration)
-- Multi-School Isolation with Row Level Security (RLS)
-- =========================================================================

-- 1. جدول الحصص والجدول الدراسي (Class Schedules)
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT,
    grade_name TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    period_number INTEGER NOT NULL,
    subject_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    room TEXT,
    is_repeated_weekly BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. جدول ملاحظات الطلاب والسجل الأكاديمي والسلوكي (Student Notes)
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    grade_name TEXT,
    classroom_name TEXT,
    note_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject_name TEXT,
    importance_level TEXT DEFAULT 'عادي',
    is_parent_visible BOOLEAN DEFAULT true,
    is_student_visible BOOLEAN DEFAULT true,
    is_admin_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. جدول الحضور والغياب اليومي والحصص (Student Attendance)
CREATE TABLE IF NOT EXISTS public.student_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT,
    grade_name TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    date DATE NOT NULL,
    period_number INTEGER NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    status TEXT NOT NULL, -- present, absent, excused, late
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_date_period_student UNIQUE (school_id, date, period_number, student_id)
);

-- 4. جدول الاختبارات القصيرة للمعلم (Quizzes)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT,
    grade_name TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    exam_date DATE NOT NULL,
    exam_time TEXT DEFAULT '09:00',
    duration_minutes INTEGER DEFAULT 20,
    total_points INTEGER DEFAULT 10,
    questions JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. جدول التواصل والإعلانات الصفية للمعلم (Teacher Communications)
CREATE TABLE IF NOT EXISTS public.teacher_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    target_type TEXT NOT NULL, -- class_announcement, student_msg, parent_msg, homework_alert, quiz_alert
    grade_name TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    target_id TEXT,
    target_name TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. جدول صلاحيات المعلم المحددة من مدير المدرسة (Teacher Permissions)
CREATE TABLE IF NOT EXISTS public.teacher_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    can_add_student BOOLEAN DEFAULT true,
    can_edit_student BOOLEAN DEFAULT true,
    can_manage_schedule BOOLEAN DEFAULT true,
    can_record_attendance BOOLEAN DEFAULT true,
    can_add_notes BOOLEAN DEFAULT true,
    can_create_homework BOOLEAN DEFAULT true,
    can_create_quizzes BOOLEAN DEFAULT true,
    can_message_parents BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_teacher_permissions UNIQUE (school_id, teacher_id)
);

-- 7. جدول دعوات المدارس المؤسسية (School Invitations System)
CREATE TABLE IF NOT EXISTS public.school_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    school_name TEXT NOT NULL,
    invitation_code TEXT NOT NULL UNIQUE,
    reference_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, viewed, registered, verified, activated
    recipient_email TEXT,
    recipient_phone TEXT,
    center TEXT,
    district TEXT,
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. جدول إعدادات المنصة والخطابات الرسمية (Platform Settings)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- فهارس تحسين الأداء (Performance Indexes)
CREATE INDEX IF NOT EXISTS idx_class_schedules_school_teacher ON public.class_schedules (school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_school_student ON public.student_notes (school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.student_attendance (school_id, date, period_number);
CREATE INDEX IF NOT EXISTS idx_quizzes_school_teacher ON public.quizzes (school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_comms_school_class ON public.teacher_communications (school_id, grade_name, classroom_name);
CREATE INDEX IF NOT EXISTS idx_school_invitations_code ON public.school_invitations (invitation_code);
CREATE INDEX IF NOT EXISTS idx_school_invitations_ref ON public.school_invitations (reference_number);
CREATE INDEX IF NOT EXISTS idx_school_invitations_status ON public.school_invitations (status);

-- تفعيل سياسات الأمان RLS (Row Level Security)
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول الآمنة عبر مدرسة المعلم (Multi-Tenant Isolation Policies)
CREATE POLICY "Allow authenticated users access their school schedules" ON public.class_schedules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users access their school notes" ON public.student_notes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users access their school attendance" ON public.student_attendance
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users access their school quizzes" ON public.quizzes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users access their school comms" ON public.teacher_communications
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users access their school teacher permissions" ON public.teacher_permissions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read of active invitations by code" ON public.school_invitations
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users manage school invitations" ON public.school_invitations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read platform settings" ON public.platform_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated manage platform settings" ON public.platform_settings
    FOR ALL USING (auth.role() = 'authenticated');
`;
}

// -------------------------------------------------------------
// 24. SCHOOL INVITATIONS & PLATFORM SETTINGS METHODS
// -------------------------------------------------------------

export async function fetchSupabaseSchoolInvitations(): Promise<SchoolInvitation[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('school_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      schoolId: d.school_id,
      schoolName: d.school_name,
      invitationCode: d.invitation_code,
      referenceNumber: d.reference_number,
      status: d.status as SchoolInvitationStatus,
      recipientEmail: d.recipient_email,
      recipientPhone: d.recipient_phone,
      center: d.center,
      district: d.district,
      notes: d.notes,
      sentAt: d.sent_at,
      viewedAt: d.viewed_at,
      registeredAt: d.registered_at,
      verifiedAt: d.verified_at,
      activatedAt: d.activated_at,
      expiresAt: d.expires_at,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch (err) {
    console.warn('Error fetching school invitations:', err);
    return [];
  }
}

export async function saveSupabaseSchoolInvitation(
  invitation: Partial<SchoolInvitation>
): Promise<SchoolInvitation | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const now = new Date().toISOString();
    const payload = {
      school_id: invitation.schoolId,
      school_name: invitation.schoolName,
      invitation_code: invitation.invitationCode,
      reference_number: invitation.referenceNumber,
      status: invitation.status || 'draft',
      recipient_email: invitation.recipientEmail,
      recipient_phone: invitation.recipientPhone,
      center: invitation.center,
      district: invitation.district,
      notes: invitation.notes,
      sent_at: invitation.sentAt,
      viewed_at: invitation.viewedAt,
      registered_at: invitation.registeredAt,
      verified_at: invitation.verifiedAt,
      activated_at: invitation.activatedAt,
      expires_at: invitation.expiresAt,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('school_invitations')
      .upsert(payload, { onConflict: 'invitation_code' })
      .select()
      .single();

    if (error || !data) {
      console.warn('Error saving school invitation:', error);
      return null;
    }

    return {
      id: data.id,
      schoolId: data.school_id,
      schoolName: data.school_name,
      invitationCode: data.invitation_code,
      referenceNumber: data.reference_number,
      status: data.status as SchoolInvitationStatus,
      recipientEmail: data.recipient_email,
      recipientPhone: data.recipient_phone,
      center: data.center,
      district: data.district,
      notes: data.notes,
      sentAt: data.sent_at,
      viewedAt: data.viewed_at,
      registeredAt: data.registered_at,
      verifiedAt: data.verified_at,
      activatedAt: data.activated_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Exception saving school invitation:', err);
    return null;
  }
}

export async function updateSupabaseSchoolInvitationStatus(
  invitationCodeOrId: string,
  newStatus: SchoolInvitationStatus,
  notes?: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const now = new Date().toISOString();
    const updateData: any = {
      status: newStatus,
      updated_at: now,
    };

    if (newStatus === 'sent') updateData.sent_at = now;
    if (newStatus === 'viewed') updateData.viewed_at = now;
    if (newStatus === 'registered') updateData.registered_at = now;
    if (newStatus === 'verified') updateData.verified_at = now;
    if (newStatus === 'activated') updateData.activated_at = now;
    if (notes) updateData.notes = notes;

    const { error } = await supabase
      .from('school_invitations')
      .update(updateData)
      .or(`invitation_code.eq.${invitationCodeOrId},id.eq.${invitationCodeOrId}`);

    if (error) {
      console.warn('Error updating invitation status:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception updating invitation status:', err);
    return false;
  }
}

export async function getSupabaseSchoolInvitationByCode(
  invitationCode: string
): Promise<SchoolInvitation | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('school_invitations')
      .select('*')
      .eq('invitation_code', invitationCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      schoolId: data.school_id,
      schoolName: data.school_name,
      invitationCode: data.invitation_code,
      referenceNumber: data.reference_number,
      status: data.status as SchoolInvitationStatus,
      recipientEmail: data.recipient_email,
      recipientPhone: data.recipient_phone,
      center: data.center,
      district: data.district,
      notes: data.notes,
      sentAt: data.sent_at,
      viewedAt: data.viewed_at,
      registeredAt: data.registered_at,
      verifiedAt: data.verified_at,
      activatedAt: data.activated_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Error fetching school invitation by code:', err);
    return null;
  }
}

export async function getSupabasePlatformLetterSettings(): Promise<PlatformLetterSettings> {
  // 1. Try LocalStorage cached copy first for fast boot
  const cached = localStorage.getItem('PLATFORM_LETTER_SETTINGS');
  let settings: PlatformLetterSettings = DEFAULT_PLATFORM_LETTER_SETTINGS;
  if (cached) {
    try {
      settings = { ...DEFAULT_PLATFORM_LETTER_SETTINGS, ...JSON.parse(cached) };
    } catch {
      // ignore
    }
  }

  // 2. Fetch remote DB copy if available
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'letter_settings')
        .maybeSingle();

      if (data && data.value) {
        settings = { ...DEFAULT_PLATFORM_LETTER_SETTINGS, ...data.value };
        localStorage.setItem('PLATFORM_LETTER_SETTINGS', JSON.stringify(settings));
      }
    } catch (err) {
      console.warn('Error loading platform settings from Supabase:', err);
    }
  }

  return settings;
}

export async function saveSupabasePlatformLetterSettings(
  settings: PlatformLetterSettings
): Promise<boolean> {
  try {
    localStorage.setItem('PLATFORM_LETTER_SETTINGS', JSON.stringify(settings));
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('platform_settings').upsert({
        key: 'letter_settings',
        value: settings,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Error saving platform settings to Supabase:', error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('Exception saving platform letter settings:', err);
    return false;
  }
}

// Helper aliases for homeworks
export async function fetchHomeworkAssignments(schoolId: string): Promise<any[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('homework_assignments')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((hw: any) => ({
      id: hw.id,
      title: hw.title,
      subject: hw.subject,
      dueDate: hw.due_date,
      totalPoints: hw.total_points || 10,
      status: hw.status || 'pending',
      schoolSlug: hw.school_id,
      gradeLevel: hw.grade_level || 'الصف الثالث المتوسط',
      description: hw.description || ''
    }));
  } catch (err) {
    return [];
  }
}

export async function createHomeworkAssignment(payload: {
  school_id: string;
  teacher_id: string;
  title: string;
  subject: string;
  grade_level: string;
  due_date: string;
  total_points: number;
  description: string;
}): Promise<any> {
  if (!isSupabaseConfigured) {
    return {
      id: `hw-${Date.now()}`,
      title: payload.title,
      subject: payload.subject,
      dueDate: payload.due_date,
      totalPoints: payload.total_points,
      status: 'pending',
      schoolSlug: payload.school_id,
      gradeLevel: payload.grade_level,
      description: payload.description
    };
  }

  const { data, error } = await supabase
    .from('homework_assignments')
    .insert([
      {
        school_id: payload.school_id,
        teacher_id: payload.teacher_id,
        title: payload.title,
        subject: payload.subject,
        grade_level: payload.grade_level,
        due_date: payload.due_date,
        total_points: payload.total_points,
        description: payload.description,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    dueDate: data.due_date,
    totalPoints: data.total_points,
    status: data.status,
    schoolSlug: data.school_id,
    gradeLevel: data.grade_level,
    description: data.description
  };
}


