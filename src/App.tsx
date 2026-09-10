import React, { useState, useEffect } from 'react';
import {
  UserRole,
  SchoolTenant,
  HomeworkAssignment,
  QuizItem,
  StudentProfile,
  CounselingReferral,
  SchoolCircular,
  SupportTicket,
  StudyGroup,
  StudyGroupMessage,
  ModerationAuditLogItem,
  SchoolRegistrationCode,
  CurriculumBook,
  HomeworkCitation,
  AuthUser
} from './types';
import {
  INITIAL_SCHOOLS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_HOMEWORKS,
  INITIAL_QUIZZES,
  INITIAL_REFERRALS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_STUDY_GROUPS,
  INITIAL_STUDY_MESSAGES,
  INITIAL_AUDIT_LOGS,
  INITIAL_REGISTRATION_CODES,
  CURRICULUM_BOOKS
} from './data/mockData';

import {
  supabase,
  fetchSupabaseSchools,
  getSupabaseUserSchoolLink,
  checkAndMatchInvitationForUser,
  fetchSupabaseSchoolBySlugOrId,
  fetchUserProfile,
  SupabaseSchoolUserLink
} from './lib/supabase';

import {
  checkTabPermission,
  checkSchoolTenantAccess,
  isPlatformAdminRole
} from './lib/routeGuardMiddleware';
import {
  signOutFirebase,
  onFirebaseAuthChange,
  checkFirebaseRedirectResult
} from './lib/firebase';

import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginModal } from './components/LoginModal';
import { SchoolRegistrationModal } from './components/SchoolRegistrationModal';
import { CreateSchoolView } from './components/CreateSchoolView';
import { ManualAddSchoolModal } from './components/ManualAddSchoolModal';
import { EditSchoolModal } from './components/EditSchoolModal';
import { UnlinkedUserGate } from './components/UnlinkedUserGate';
import { InviteStudentModal } from './components/InviteStudentModal';
import { AccessDeniedGate } from './components/AccessDeniedGate';
import { SecurityToast } from './components/SecurityToast';
import { UserProfileView } from './components/UserProfileView';

import { AISolverView } from './components/AISolverView';
import { SmartTeacherView } from './components/SmartTeacherView';
import { CurriculumLibraryView } from './components/CurriculumLibraryView';
import { SchoolManagementView } from './components/SchoolManagementView';
import { MessagingView } from './components/MessagingView';
import { SuperAdminView } from './components/SuperAdminView';
import { KharjSchoolsHub } from './components/KharjSchoolsHub';
import { KingdomSchoolsRadarView } from './components/KingdomSchoolsRadarView';
import { AppreciationLettersManager } from './components/AppreciationLettersManager';
import { SchoolBarcodeModal } from './components/SchoolBarcodeModal';

import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { ParentDashboard } from './components/dashboards/ParentDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { CounselorDashboard } from './components/dashboards/CounselorDashboard';
import { AchievementsPortfolioView } from './components/achievements/AchievementsPortfolioView';

import { DynamicPageSectionRenderer } from './components/dynamic/DynamicPageSectionRenderer';
import { AdminPageCustomizerModal } from './components/dynamic/AdminPageCustomizerModal';
import { AdminDynamicBar } from './components/dynamic/AdminDynamicBar';
import { getDynamicBlocksForPage } from './lib/dynamicPagesService';

import { AboutAppModal } from './pwa/AboutAppModal';
import { PWAOfflineNotice } from './pwa/PWAOfflineNotice';
import { PWAUpdateModal } from './pwa/PWAUpdateModal';
import { InteractiveScrollNavigator } from './components/InteractiveScrollNavigator';

export default function App() {
  // Authentication State - Defaults to null (Production Auth via Google / Supabase)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [isAboutAppOpen, setIsAboutAppOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [isSchoolRegistrationOpen, setIsSchoolRegistrationOpen] = useState<boolean>(false);

  const handleOpenLoginModal = (mode: 'login' | 'register' = 'login') => {
    setLoginModalMode(mode);
    setIsLoginModalOpen(true);
  };
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState<boolean>(false);
  const [isManualAddSchoolOpen, setIsManualAddSchoolOpen] = useState<boolean>(false);
  const [isEditSchoolOpen, setIsEditSchoolOpen] = useState<boolean>(false);
  const [editingSchool, setEditingSchool] = useState<SchoolTenant | null>(null);
  const [isRefreshingSchools, setIsRefreshingSchools] = useState<boolean>(false);
  const [schoolSyncToast, setSchoolSyncToast] = useState<string | null>(null);
  const [isInviteStudentModalOpen, setIsInviteStudentModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSchoolBarcodeModalOpen, setIsSchoolBarcodeModalOpen] = useState<boolean>(false);
  const [barcodeSchool, setBarcodeSchool] = useState<SchoolTenant | null>(null);

  const handleOpenSchoolBarcode = (target?: SchoolTenant) => {
    if (target) {
      setBarcodeSchool(target);
    } else if (currentSchool) {
      setBarcodeSchool(currentSchool);
    } else if (schools.length > 0) {
      setBarcodeSchool(schools[0]);
    }
    setIsSchoolBarcodeModalOpen(true);
  };

  const [userSchoolLink, setUserSchoolLink] = useState<SupabaseSchoolUserLink | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [schools, setSchools] = useState<SchoolTenant[]>([]);
  const [currentSchool, setCurrentSchool] = useState<SchoolTenant | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Dynamic Pages State
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [customizerTargetBlockId, setCustomizerTargetBlockId] = useState<string | undefined>(undefined);
  const [dynamicBlocksVersion, setDynamicBlocksVersion] = useState<number>(0);

  const isAdmin =
    isPlatformAdminRole(currentRole) ||
    isPlatformAdminRole(currentUser?.role || '') ||
    currentRole === 'school_admin' ||
    currentRole === 'principal' ||
    currentRole === 'vice_principal' ||
    currentRole === 'school_manager' ||
    currentRole === 'admin';

  const currentDynamicBlocks = getDynamicBlocksForPage(activeTab);

  // Load real schools from Supabase
  const loadRealSchools = async () => {
    try {
      const realSchools = await fetchSupabaseSchools();
      if (realSchools && realSchools.length > 0) {
        const formatted: SchoolTenant[] = realSchools.map((s) => ({
          id: s.id,
          name: s.name,
          nameEn: s.name_en || s.name,
          slug: s.slug || s.id,
          logoText: s.name ? s.name.slice(0, 2) : 'مد',
          badge: `${s.type || s.education_type || 'مدرسة'} - ${s.stage || 'تعليم عام'}`,
          primaryColor: 'from-blue-600 to-indigo-600',
          accentColor: 'blue',
          motto: 'التعليم الذكي والجيل الواعد',
          location: `${s.city || ''} ${s.region ? `- ${s.region}` : ''}`.trim() || 'المملكة العربية السعودية',
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
          circulars: []
        }));
        setSchools(formatted);
        if (!currentSchool || !formatted.find(f => f.id === currentSchool.id)) {
          setCurrentSchool(formatted[0]);
        }
      }
    } catch (err) {
      console.warn('Supabase schools fetch error:', err);
    }
  };

  // Refresh & Sync Schools Action
  const handleRefreshSchools = async () => {
    setIsRefreshingSchools(true);
    try {
      await loadRealSchools();
      setSchoolSyncToast('تم تحديث ومزامنة بيانات المدارس بنجاح!');
      setTimeout(() => setSchoolSyncToast(null), 3500);
    } catch (err) {
      console.error('Error refreshing schools:', err);
      setSchoolSyncToast('تم إنعاش قائمة المدارس.');
      setTimeout(() => setSchoolSyncToast(null), 3000);
    } finally {
      setIsRefreshingSchools(false);
    }
  };

  // Handle Manual School Creation
  const handleManualSchoolCreated = (newSchool: SchoolTenant) => {
    setSchools(prev => [newSchool, ...prev.filter(s => s.id !== newSchool.id)]);
    setCurrentSchool(newSchool);
    setSchoolSyncToast(`تمت إضافة وتفعيل مدرسة (${newSchool.name}) بنجاح!`);
    setTimeout(() => setSchoolSyncToast(null), 3500);
  };

  // Handle School Updated
  const handleSchoolUpdated = (updatedSchool: SchoolTenant) => {
    setSchools(prev => prev.map(s => s.id === updatedSchool.id ? updatedSchool : s));
    if (currentSchool?.id === updatedSchool.id) {
      setCurrentSchool(updatedSchool);
    }
    setSchoolSyncToast(`تم تحديث بيانات مدرسة (${updatedSchool.name}) بنجاح!`);
    setTimeout(() => setSchoolSyncToast(null), 3500);
  };

  const handleOpenEditSchool = (schoolToEdit: SchoolTenant) => {
    setEditingSchool(schoolToEdit);
    setIsEditSchoolOpen(true);
  };

  // Sync user session and school_users role from Supabase DB
  const syncUserAuthWithSupabase = async (sessionUser: any) => {
    setIsLoadingAuth(true);
    try {
      const email = sessionUser.email || '';
      const name = sessionUser.user_metadata?.full_name || email.split('@')[0] || 'مستخدم مسجل';

      // 1. Auto match any invitations for this user email
      await checkAndMatchInvitationForUser(sessionUser.id, email, name);

      // 2. Query both profiles and school_users tables
      const [profile, link] = await Promise.all([
        fetchUserProfile(sessionUser.id),
        getSupabaseUserSchoolLink(sessionUser.id, email)
      ]);

      // Check for suspended or inactive account
      if (profile?.account_status === 'suspended' || link?.status === 'suspended' || link?.status === 'inactive') {
        if (supabase) await supabase.auth.signOut();
        setCurrentUser(null);
        setUserSchoolLink(null);
        triggerSecurityAlert('تم إيقاف هذا الحساب من قبل الإدارة. يرجى مراجعة إدارة مدرستك.');
        return;
      }

      const verifiedRole = (profile?.role || link?.role) as UserRole | undefined;
      const isPlatformAdmin = verifiedRole === 'super_admin' || verifiedRole === 'platform_admin';

      if (link && link.status === 'active') {
        setUserSchoolLink(link);
        const dbRole = (link.role as UserRole) || (profile?.role as UserRole) || 'student';
        setCurrentRole(isPlatformAdmin ? 'platform_admin' : dbRole);

        // Fetch assigned school
        if (link.school_id) {
          const matchedSchool = await fetchSupabaseSchoolBySlugOrId(link.school_id);
          if (matchedSchool) {
            const formatted: SchoolTenant = {
              id: matchedSchool.id,
              name: matchedSchool.name,
              nameEn: matchedSchool.name,
              slug: matchedSchool.slug || matchedSchool.id,
              logoText: matchedSchool.name ? matchedSchool.name.slice(0, 2) : 'مد',
              badge: matchedSchool.type || 'مدرسة موثقة',
              primaryColor: 'from-blue-600 to-indigo-600',
              accentColor: 'blue',
              motto: 'التعليم الذكي والجيل الواعد',
              location: `${matchedSchool.city || ''} ${matchedSchool.region || ''}`.trim() || 'المملكة العربية السعودية',
              totalStudentsCount: 0,
              totalTeachersCount: 0,
              isApproved: matchedSchool.status === 'active',
              circulars: []
            };
            setCurrentSchool(formatted);
          }
        }

        const authUsr: AuthUser = {
          id: sessionUser.id,
          username: profile?.username || email.split('@')[0],
          fullName: profile?.full_name || link.full_name || name,
          email,
          role: isPlatformAdmin ? 'platform_admin' : dbRole,
          schoolId: link.school_id || profile?.school_id,
          classId: profile?.class_id,
          gradeId: profile?.grade_id,
          accountStatus: profile?.account_status || 'active',
          avatarUrl: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
          loginMethod: 'google',
          badge: isPlatformAdmin ? 'مدير المنصة الرئيسي (Super Admin)' : undefined
        };
        setCurrentUser(authUsr);

        // Synchronize student profile with real authenticated user
        setStudentProfile(prev => ({
          ...prev,
          name: authUsr.fullName,
          avatarUrl: authUsr.avatarUrl,
          avatar: authUsr.avatarUrl ? undefined : (isPlatformAdmin ? '👑' : '🧑‍🎓'),
        }));

        // Initial default tab by verified database role
        if (isPlatformAdmin) {
          setCurrentRole('platform_admin');
          setActiveTab('platform-admin');
        } else if (dbRole === 'principal' || dbRole === 'school_admin' || dbRole === 'vice_principal') {
          setActiveTab('school-mgmt');
        } else if (dbRole === 'teacher') {
          setActiveTab('teacher-portal');
        } else if (dbRole === 'counselor') {
          setActiveTab('counselor-portal');
        } else if (dbRole === 'parent') {
          setActiveTab('parent-portal');
        } else {
          setActiveTab('dashboard');
        }
      } else if (isPlatformAdmin) {
        // Platform Admin without school restriction
        setUserSchoolLink(null);
        const authUsr: AuthUser = {
          id: sessionUser.id,
          username: profile?.username || email.split('@')[0],
          fullName: profile?.full_name || name,
          email,
          role: 'platform_admin',
          accountStatus: 'active',
          avatarUrl: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
          loginMethod: 'google',
          badge: 'مدير المنصة الرئيسي (Super Admin)'
        };
        setCurrentUser(authUsr);
        setCurrentRole('platform_admin');
        setActiveTab('platform-admin');
      } else {
        // User is authenticated but NOT linked to any school yet, and is NOT a platform admin
        // Do not assign default schools or create fake links
        setUserSchoolLink(null);
        setCurrentSchool(null);
        const userRole = (profile?.role as UserRole) || 'student';

        const authUsr: AuthUser = {
          id: sessionUser.id,
          username: profile?.username || email.split('@')[0],
          fullName: profile?.full_name || name,
          email,
          role: userRole,
          schoolId: undefined,
          accountStatus: 'active',
          avatarUrl: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
          loginMethod: 'google',
          badge: 'حساب غير مرتبط بمدرسة'
        };
        setCurrentUser(authUsr);
        setCurrentRole(userRole);

        setStudentProfile(prev => ({
          ...prev,
          name: authUsr.fullName,
          avatarUrl: authUsr.avatarUrl,
          avatar: userRole === 'teacher' ? '👩‍🏫' : '🧑‍🎓',
        }));

        setActiveTab('unlinked-user');
      }
    } catch (err) {
      console.error('Error syncing auth session:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadRealSchools();

    // Check if there is saved customized student profile locally
    try {
      const saved = localStorage.getItem('htaf_student_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          setStudentProfile(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.warn('Could not read saved profile:', e);
    }

    // Check Firebase redirect result on page load
    checkFirebaseRedirectResult().then(user => {
      if (user) {
        handleLoginSuccess(user);
      }
    }).catch(e => console.warn('Firebase redirect check error:', e));

    // Listen to Firebase Auth state
    const unsubscribeFirebase = onFirebaseAuthChange((fbUser) => {
      if (fbUser) {
        // If logged in via Firebase Google
        setCurrentUser(fbUser);
        setCurrentRole(fbUser.role);
        setIsLoadingAuth(false);
      }
    });

    if (supabase) {
      // Check active Supabase session on load
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncUserAuthWithSupabase(session.user);
        } else {
          setIsLoadingAuth(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          syncUserAuthWithSupabase(session.user);
        } else if (!currentUser) {
          setCurrentUser(null);
          setUserSchoolLink(null);
          setIsLoadingAuth(false);
        }
      });

      return () => {
        subscription?.unsubscribe();
        unsubscribeFirebase();
      };
    } else {
      setIsLoadingAuth(false);
      return () => {
        unsubscribeFirebase();
      };
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);

    // Direct immediate routing according to user role without any extra clicks
    if (user.role === 'platform_admin' || user.role === 'super_admin') {
      setActiveTab('platform-admin');
    } else if (user.role === 'school_admin' || user.role === 'principal' || user.role === 'vice_principal') {
      setActiveTab('school-mgmt');
    } else if (user.role === 'teacher') {
      setActiveTab('teacher-portal');
    } else if (user.role === 'counselor') {
      setActiveTab('counselor-portal');
    } else if (user.role === 'parent') {
      setActiveTab('parent-portal');
    } else {
      setActiveTab('dashboard');
    }

    const realName = user.fullName || user.username || user.email?.split('@')[0] || 'طالب مسجل';
    setStudentProfile(prev => ({
      ...prev,
      name: realName,
      avatarUrl: user.avatarUrl,
      avatar: user.avatarUrl ? undefined : (user.role === 'platform_admin' ? '👑' : '🧑‍🎓')
    }));

    if (user.id && supabase) {
      syncUserAuthWithSupabase({ id: user.id, email: user.email, user_metadata: { full_name: user.fullName, avatar_url: user.avatarUrl } });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setUserSchoolLink(null);
    setCurrentRole('student');
    setActiveTab('dashboard');
    setStudentProfile(prev => ({
      ...prev,
      name: 'طالب منصة هتاف العاصمي',
      avatar: '🧑‍🎓',
      avatarUrl: undefined
    }));
  };

  // Security Toast Alert State
  const [securityToastMessage, setSecurityToastMessage] = useState<string | null>(null);

  const triggerSecurityAlert = (msg: string) => {
    setSecurityToastMessage(msg);
  };

  // Route Guard Middleware - Intercept Hash / URL updates
  useEffect(() => {
    const processRouteGuardMiddleware = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      const [targetTab, targetSchoolId] = hash.split('/');

      if (targetTab) {
        const tabCheck = checkTabPermission(targetTab, currentRole, userSchoolLink);
        if (!tabCheck.allowed) {
          const fallbackTab = tabCheck.suggestedTab || 'dashboard';
          setActiveTab(fallbackTab);
          window.location.hash = `#${fallbackTab}`;
        } else if (targetTab !== activeTab) {
          setActiveTab(targetTab);
        }
      }

      if (targetSchoolId) {
        const schoolCheck = checkSchoolTenantAccess(targetSchoolId, userSchoolLink, currentRole);
        if (!schoolCheck.allowed) {
          if (userSchoolLink?.school_id) {
            const matched = schools.find((s) => s.id === userSchoolLink.school_id);
            if (matched) setCurrentSchool(matched);
          }
        }
      }
    };

    processRouteGuardMiddleware();
    window.addEventListener('hashchange', processRouteGuardMiddleware);
    return () => window.removeEventListener('hashchange', processRouteGuardMiddleware);
  }, [currentRole, userSchoolLink, schools, activeTab]);

  // Auto-enforce School Tenant Isolation for Non-Platform Admins
  useEffect(() => {
    if (currentUser && !isPlatformAdminRole(currentRole) && userSchoolLink?.school_id) {
      if (!currentSchool || currentSchool.id !== userSchoolLink.school_id) {
        const userAssignedSchool = schools.find((s) => s.id === userSchoolLink.school_id);
        if (userAssignedSchool) {
          setCurrentSchool(userAssignedSchool);
        }
      }
    }
  }, [currentUser, currentRole, userSchoolLink, schools, currentSchool]);

  const handleSetActiveTabGuard = (tab: string) => {
    const check = checkTabPermission(tab, currentRole, userSchoolLink);
    if (check.allowed) {
      setActiveTab(tab);
      window.location.hash = `#${tab}`;
    } else {
      const fallbackTab = check.suggestedTab || 'dashboard';
      setActiveTab(fallbackTab);
      window.location.hash = `#${fallbackTab}`;
    }
  };

  const handleSchoolChangeGuard = (targetSchool: SchoolTenant) => {
    const check = checkSchoolTenantAccess(targetSchool.id, userSchoolLink, currentRole);
    if (check.allowed) {
      setCurrentSchool(targetSchool);
    } else {
      if (userSchoolLink?.school_id) {
        const assigned = schools.find((s) => s.id === userSchoolLink.school_id);
        if (assigned) setCurrentSchool(assigned);
      }
    }
  };

  // App Data States
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('htaf_student_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_STUDENT_PROFILE, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load initial student profile from localStorage', e);
    }
    return INITIAL_STUDENT_PROFILE;
  });

  // Listen to profile updates dispatched anywhere in the app
  useEffect(() => {
    const handleProfileUpdateEvent = (evt: any) => {
      if (evt.detail) {
        setStudentProfile((prev) => ({ ...prev, ...evt.detail }));
      }
    };
    window.addEventListener('htaf_student_profile_updated', handleProfileUpdateEvent);
    return () => {
      window.removeEventListener('htaf_student_profile_updated', handleProfileUpdateEvent);
    };
  }, []);

  const [homeworks, setHomeworks] = useState<HomeworkAssignment[]>(INITIAL_HOMEWORKS);
  const [quizzes, setQuizzes] = useState<QuizItem[]>(INITIAL_QUIZZES);
  const [referrals, setReferrals] = useState<CounselingReferral[]>(INITIAL_REFERRALS);

  // Messaging & Moderation States
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(INITIAL_STUDY_GROUPS);
  const [groupMessages, setGroupMessages] = useState<StudyGroupMessage[]>(INITIAL_STUDY_MESSAGES);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // Super Admin Registration Codes & Central Books State
  const [registrationCodes, setRegistrationCodes] = useState<SchoolRegistrationCode[]>(INITIAL_REGISTRATION_CODES);
  const [centralBooks, setCentralBooks] = useState<CurriculumBook[]>(CURRICULUM_BOOKS);

  const handleAddBook = (newBook: CurriculumBook) => {
    setCentralBooks((prev) => [newBook, ...prev]);
  };

  const handleBulkAddBooks = (newBooks: CurriculumBook[]) => {
    setCentralBooks((prev) => [...newBooks, ...prev]);
  };

  const handleUpdateBook = (updatedBook: CurriculumBook) => {
    setCentralBooks((prev) =>
      prev.map((b) => (b.id === updatedBook.id ? updatedBook : b))
    );
  };

  const handleReplaceBookVersion = (oldBookId: string, newBook: CurriculumBook) => {
    setCentralBooks((prev) =>
      prev.map((b) => (b.id === oldBookId ? { ...b, is_active: false } : b)).concat(newBook)
    );
  };

  const handleDeleteBook = (bookId: string) => {
    setCentralBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleAddRegistrationCode = (newCode: SchoolRegistrationCode) => {
    setRegistrationCodes((prev) => [newCode, ...prev]);
  };

  const handleToggleCodeStatus = (codeId: string) => {
    setRegistrationCodes((prev) =>
      prev.map((c) =>
        c.id === codeId ? { ...c, status: c.status === 'معطل' ? 'نشط' : 'معطل' } : c
      )
    );
  };

  const handleToggleSchoolApproval = (schoolId: string) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, isApproved: !s.isApproved } : s))
    );
  };

  const handleRegisterSchoolByCode = (newSchool: SchoolTenant, codeUsed: string) => {
    setSchools((prev) => [newSchool, ...prev]);
    setCurrentSchool(newSchool);

    // Mark code as used
    setRegistrationCodes((prev) =>
      prev.map((c) =>
        c.code.trim().toUpperCase() === codeUsed.trim().toUpperCase()
          ? {
              ...c,
              status: 'مستخدم',
              usedBySchoolId: newSchool.id,
              usedAtDate: new Date().toISOString().split('T')[0]
            }
          : c
      )
    );
  };

  // Prefill states for AISolverView & SmartTeacherView
  const [solverQuestion, setSolverQuestion] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('العلوم');
  const [teacherGrade, setTeacherGrade] = useState('الصف الثالث المتوسط');
  const [teacherTopic, setTeacherTopic] = useState('');
  const [teacherMode, setTeacherMode] = useState<'explain' | 'quiz' | 'summary'>('explain');

  const handleOpenSolverForHomework = (hw: HomeworkAssignment) => {
    setSolverQuestion(`حل واجب ${hw.subject}: ${hw.title}. ${hw.description}`);
    setActiveTab('solver');
  };

  const handleSelectTopicForSolver = (text: string, subject?: string, grade?: string) => {
    setSolverQuestion(text);
    setActiveTab('solver');
  };

  const handleSelectTopicForTeacher = (
    subject: string,
    grade: string,
    topic?: string,
    mode: 'explain' | 'quiz' | 'summary' = 'explain'
  ) => {
    setTeacherSubject(subject);
    setTeacherGrade(grade);
    setTeacherTopic(topic || '');
    setTeacherMode(mode);
    setActiveTab('smart-teacher');
  };

  const handleAddHomework = (newHw: HomeworkAssignment) => {
    setHomeworks((prev) => [newHw, ...prev]);
  };

  const handleAddQuiz = (newQuiz: QuizItem) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
  };

  const handleAddReferral = (newRef: CounselingReferral) => {
    setReferrals((prev) => [newRef, ...prev]);
  };

  const handleAddTicket = (newTicket: SupportTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleAddTicketReply = (ticketId: string, text: string, senderRole: 'student' | 'admin' | 'counselor') => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            updatedAt: new Date().toISOString().split('T')[0],
            messages: [
              ...t.messages,
              {
                id: `tm-${Date.now()}`,
                senderName: senderRole === 'student' ? 'أحمد العتيبي' : 'إدارة المنصة والإرشاد',
                senderRole,
                timestamp: 'الآن',
                text
              }
            ]
          };
        }
        return t;
      })
    );
  };

  const handleSendGroupMessage = (
    groupId: string,
    messageOrText: string | StudyGroupMessage,
    problemCitation?: any,
    homeworkCitation?: HomeworkCitation
  ) => {
    if (typeof messageOrText === 'object') {
      setGroupMessages((prev) => [...prev, messageOrText]);
    } else {
      const newMsg: StudyGroupMessage = {
        id: `msg-${Date.now()}`,
        groupId,
        senderName: currentRole === 'student' ? studentProfile.name : 'المعلم المشرف',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        senderRole: currentRole,
        text: messageOrText,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        problemCitation,
        homeworkCitation
      };
      setGroupMessages((prev) => [...prev, newMsg]);
    }
  };

  const handleDeleteGroupMessage = (messageId: string, reason: string) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, text: '[تم حذف المحتوى بواسطة المشرف]' } : m))
    );

    // Record in Audit Log
    const newAuditLog: ModerationAuditLogItem = {
      id: `audit-${Date.now()}`,
      timestamp: 'الآن',
      action: 'حذف رسالة مخالفة',
      actorName: 'المشرف الإداري الذكي',
      targetUser: 'طالب في مجموعة المذاكرة',
      details: `تم حذف الرسالة ID (${messageId}) بسبب: ${reason}`,
      severity: 'متوسط'
    };
    setAuditLogs((prev) => [newAuditLog, ...prev]);
  };

  const handleAddCircular = (newCirc: SchoolCircular) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === currentSchool.id) {
          const updated = { ...s, circulars: [newCirc, ...s.circulars] };
          setCurrentSchool(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleAddCounselingNote = (refId: string, noteText: string) => {
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.id === refId) {
          return {
            ...r,
            status: 'قيد المتابعة',
            confidentialNotes: [
              ...r.confidentialNotes,
              {
                id: `cn-${Date.now()}`,
                author: 'د. إبراهيم السعيد (الموجه الطلابي)',
                date: new Date().toISOString().split('T')[0],
                note: noteText
              }
            ]
          };
        }
        return r;
      })
    );
  };

  const handleUpdateRevisionTask = (day: number, completed: boolean) => {
    setStudentProfile((prev) => ({
      ...prev,
      aiRevisionPlan: {
        ...prev.aiRevisionPlan,
        tasks: prev.aiRevisionPlan.tasks.map((t) => (t.day === day ? { ...t, completed } : t))
      }
    }));
  };

  const handleUpdateScreenTime = (newLimitMinutes: number) => {
    setStudentProfile((prev) => ({ ...prev, screenTimeDailyLimitMinutes: newLimitMinutes }));
  };

  return (
    <div className="min-h-screen bg-[#070c1b] text-slate-100 font-['Cairo',sans-serif] flex w-full relative">
      {/* Interactive Scroll & Progress Navigator (تحكم تفاعلي بالنزول والطلوع) */}
      <InteractiveScrollNavigator />

      {/* Security Toast Alert Popup */}
      {securityToastMessage && (
        <SecurityToast
          message={securityToastMessage}
          onClose={() => setSecurityToastMessage(null)}
        />
      )}

      {/* Right Sidebar (Desktop Persistent & Mobile Drawer) */}
      <Sidebar
        currentRole={currentRole}
        currentSchool={currentSchool}
        schools={schools}
        onSchoolChange={handleSchoolChangeGuard}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTabGuard}
        onOpenSolver={() => {
          setSolverQuestion('');
          handleSetActiveTabGuard('solver');
        }}
        currentUser={currentUser}
        onOpenLoginModal={handleOpenLoginModal}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenManualAddSchool={() => setIsManualAddSchoolOpen(true)}
        onRefreshSchools={handleRefreshSchools}
        isRefreshingSchools={isRefreshingSchools}
        onOpenSchoolBarcode={() => handleOpenSchoolBarcode(currentSchool || undefined)}
        onOpenAboutApp={() => setIsAboutAppOpen(true)}
      />

      {/* Main Content Area with Sticky Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          currentRole={currentRole}
          currentSchool={currentSchool}
          schools={schools}
          onSchoolChange={handleSchoolChangeGuard}
          activeTab={activeTab}
          setActiveTab={handleSetActiveTabGuard}
          onOpenSolver={() => {
            setSolverQuestion('');
            handleSetActiveTabGuard('solver');
          }}
          currentUser={currentUser}
          onOpenLoginModal={handleOpenLoginModal}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSchoolBarcode={() => handleOpenSchoolBarcode(currentSchool || undefined)}
          onOpenAboutApp={() => setIsAboutAppOpen(true)}
        />

        {/* Admin Dynamic Builder Bar (Visible to Platform and School Admins) */}
        <AdminDynamicBar
          currentRole={currentRole}
          currentUser={currentUser}
          activeTab={activeTab}
          dynamicBlocksCount={currentDynamicBlocks.length}
          onOpenCustomizer={() => {
            setCustomizerTargetBlockId(undefined);
            setIsCustomizerOpen(true);
          }}
        />

        {/* Login & Register Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          initialMode={loginModalMode}
          schools={schools}
          onOpenSchoolRegistration={() => {
            setIsLoginModalOpen(false);
            setIsSchoolRegistrationOpen(true);
          }}
        />

        {/* School Registration / Join Modal */}
        <SchoolRegistrationModal
          isOpen={isSchoolRegistrationOpen}
          onClose={() => setIsSchoolRegistrationOpen(false)}
          existingSchools={schools}
          currentUser={currentUser}
          onSuccessRegistered={(newSchool) => {
            setSchools((prev) => {
              if (prev.some((s) => s.id === newSchool.id)) {
                return prev.map((s) => (s.id === newSchool.id ? newSchool : s));
              }
              return [newSchool, ...prev];
            });
            setCurrentSchool(newSchool);
            setSchoolSyncToast(`تم الانضمام وتفعيل مدرسة (${newSchool.name}) بنجاح!`);
            setTimeout(() => setSchoolSyncToast(null), 3500);
          }}
          onSuccessRequested={() => {
            setSchoolSyncToast('تم استلام طلب تسجيل المدرسة بنجاح وسيتم اعتماده قريباً!');
            setTimeout(() => setSchoolSyncToast(null), 3500);
          }}
        />

        {/* Create School View Modal */}
        {isCreateSchoolOpen && (
          <CreateSchoolView
            currentUser={currentUser}
            user={currentUser}
            onClose={() => setIsCreateSchoolOpen(false)}
            onCancel={() => setIsCreateSchoolOpen(false)}
            onSchoolCreated={(newSch) => {
              loadRealSchools();
              setIsCreateSchoolOpen(false);
            }}
            onSuccess={(newSch) => {
              loadRealSchools();
              setIsCreateSchoolOpen(false);
            }}
          />
        )}

        {/* Invite Student Modal */}
        {currentUser && currentSchool && (
          <InviteStudentModal
            isOpen={isInviteStudentModalOpen}
            onClose={() => setIsInviteStudentModalOpen(false)}
            schoolId={currentSchool.id}
            schoolName={currentSchool.name}
            teacherId={currentUser.id}
          />
        )}

        {/* Main Content Body */}
        <main className="flex-1 pb-16">
          <>
            {/* Top Dynamic Sections (Admin Configurable) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <DynamicPageSectionRenderer
                pageId={activeTab}
                position="banner"
                blocks={currentDynamicBlocks}
                currentUser={currentUser}
                currentRole={currentRole}
                isAdmin={isAdmin}
                onOpenCustomizer={(blockId) => {
                  setCustomizerTargetBlockId(blockId);
                  setIsCustomizerOpen(true);
                }}
                onNavigateTab={handleSetActiveTabGuard}
              />
              <DynamicPageSectionRenderer
                pageId={activeTab}
                position="top"
                blocks={currentDynamicBlocks}
                currentUser={currentUser}
                currentRole={currentRole}
                isAdmin={isAdmin}
                onOpenCustomizer={(blockId) => {
                  setCustomizerTargetBlockId(blockId);
                  setIsCustomizerOpen(true);
                }}
                onNavigateTab={handleSetActiveTabGuard}
              />
            </div>

            {currentUser && currentRole !== 'platform_admin' && currentRole !== 'super_admin' && (!currentSchool || !userSchoolLink?.school_id || activeTab === 'unlinked-user') ? (
              <div className="max-w-4xl mx-auto px-4 py-8">
                <UnlinkedUserGate
                  currentUser={currentUser}
                  schools={schools}
                  onCreateSchoolClick={() => setIsCreateSchoolOpen(true)}
                  onOpenCreateSchool={() => setIsCreateSchoolOpen(true)}
                  onSchoolJoinedSuccess={async () => {
                    if (supabase) {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) await syncUserAuthWithSupabase(user);
                    }
                  }}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <>
            {(activeTab === 'super_admin' || activeTab === 'platform-admin') && (
              <SuperAdminView
                schools={schools}
                registrationCodes={registrationCodes}
                centralBooks={centralBooks}
                onAddRegistrationCode={handleAddRegistrationCode}
                onToggleCodeStatus={handleToggleCodeStatus}
                onToggleSchoolApproval={handleToggleSchoolApproval}
                onRegisterSchoolByCode={handleRegisterSchoolByCode}
                onAddBook={handleAddBook}
                onBulkAddBooks={handleBulkAddBooks}
                onUpdateBook={handleUpdateBook}
                onReplaceBookVersion={handleReplaceBookVersion}
                onDeleteBook={handleDeleteBook}
                onOpenManualAddSchool={() => setIsManualAddSchoolOpen(true)}
                onOpenEditSchool={handleOpenEditSchool}
                onRefreshSchools={handleRefreshSchools}
                isRefreshingSchools={isRefreshingSchools}
                onOpenRadar={() => handleSetActiveTabGuard('schools-radar')}
              />
            )}

            {activeTab === 'kharj-schools' && (
              <div className="max-w-7xl mx-auto px-4 py-8">
                <KharjSchoolsHub
                  onRegisterSchool={handleRegisterSchoolByCode}
                  onAddRegistrationCode={handleAddRegistrationCode}
                  existingSchools={schools}
                  onOpenRadar={() => handleSetActiveTabGuard('schools-radar')}
                  onOpenSchoolBarcode={handleOpenSchoolBarcode}
                />
              </div>
            )}

            {(activeTab === 'schools-radar' || activeTab === 'radar') && (
              <div className="max-w-7xl mx-auto px-4 py-6">
                <KingdomSchoolsRadarView
                  currentSchool={currentSchool}
                  currentUser={currentUser}
                  allTenantSchools={schools}
                  onOpenManualAddSchool={() => setIsManualAddSchoolOpen(true)}
                  onOpenEditSchool={handleOpenEditSchool}
                  onRefreshSchools={handleRefreshSchools}
                  isRefreshingSchools={isRefreshingSchools}
                  onOpenSchoolBarcode={handleOpenSchoolBarcode}
                />
              </div>
            )}

            {(activeTab === 'appreciation-letters' || activeTab === 'appreciation') && (
              <div className="max-w-7xl mx-auto px-4 py-6">
                <AppreciationLettersManager
                  currentUser={currentUser}
                  currentSchool={currentSchool}
                />
              </div>
            )}

            {activeTab === 'solver' && (
              <AISolverView initialQuestion={solverQuestion} />
            )}

            {activeTab === 'smart-teacher' && (
              <SmartTeacherView
                centralBooks={centralBooks}
                initialSubject={teacherSubject}
                initialGrade={teacherGrade}
                initialTopic={teacherTopic}
                initialMode={teacherMode}
              />
            )}

            {activeTab === 'curriculum' && (
              <CurriculumLibraryView
                centralBooks={centralBooks}
                onAddBook={handleAddBook}
                currentUser={currentUser}
                currentRole={currentRole}
                currentSchool={currentSchool}
                studentProfile={studentProfile}
                onUpdateStudentProfile={(updated) => {
                  setStudentProfile(updated);
                  try {
                    localStorage.setItem('htaf_student_profile', JSON.stringify(updated));
                  } catch (e) {
                    console.warn('Failed to persist student profile', e);
                  }
                }}
                onNavigateToDashboard={() => {
                  handleSetActiveTabGuard('dashboard');
                }}
                onSelectTopicForSolver={handleSelectTopicForSolver}
                onSelectTopicForTeacher={handleSelectTopicForTeacher}
                onOpenHomeworkCreator={(lessonTitle, subject, grade, pageStart) => {
                  setActiveTab('homework');
                }}
                onCreateQuizForLesson={(lessonTitle, subject, grade) => {
                  setActiveTab('quiz');
                }}
                onCreateStudyRoomForLesson={(lessonTitle, subject, grade) => {
                  setActiveTab('messaging');
                }}
              />
            )}

            {activeTab === 'school-mgmt' && (
              <SchoolManagementView
                currentSchool={currentSchool}
                referrals={referrals}
                auditLogs={auditLogs}
                onAddReferral={handleAddReferral}
                onAddCircular={handleAddCircular}
                onOpenInviteStudentModal={() => setIsInviteStudentModalOpen(true)}
                onOpenManualAddSchool={() => setIsManualAddSchoolOpen(true)}
                onOpenEditSchool={handleOpenEditSchool}
                onRefreshSchools={handleRefreshSchools}
                isRefreshingSchools={isRefreshingSchools}
                onOpenRadar={() => handleSetActiveTabGuard('schools-radar')}
                onOpenSchoolBarcode={() => handleOpenSchoolBarcode(currentSchool || undefined)}
              />
            )}

            {activeTab === 'messaging' && (
              <MessagingView
                currentRole={currentRole}
                currentUser={currentUser}
                currentSchool={currentSchool}
                studentProfile={studentProfile}
                tickets={tickets}
                studyGroups={studyGroups}
                groupMessages={groupMessages}
                centralBooks={centralBooks}
                onAddTicket={handleAddTicket}
                onAddTicketReply={handleAddTicketReply}
                onSendGroupMessage={handleSendGroupMessage}
                onDeleteGroupMessage={handleDeleteGroupMessage}
                onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
              />
            )}

            {activeTab === 'counseling' && (
              <CounselorDashboard
                referrals={referrals}
                onAddNote={handleAddCounselingNote}
              />
            )}

            {activeTab === 'profile' && (
              <div className="max-w-7xl mx-auto px-4 py-8">
                <UserProfileView
                  currentUser={currentUser}
                  currentSchool={currentSchool}
                  onOpenLoginModal={() => setIsLoginModalOpen(true)}
                  onProfileUpdated={(updatedUser) => {
                    setCurrentUser(updatedUser);
                    setStudentProfile(prev => ({
                      ...prev,
                      name: updatedUser.fullName,
                      avatarUrl: updatedUser.avatarUrl
                    }));
                  }}
                  onLogout={handleLogout}
                />
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="max-w-7xl mx-auto px-4 py-8">
                <AchievementsPortfolioView
                  currentUser={
                    currentUser || {
                      id: studentProfile.id || 'guest_user',
                      name: studentProfile.name || 'زائر المنصة',
                      role: currentRole,
                      email: ''
                    }
                  }
                  currentSchool={currentSchool}
                  availableStudents={[]}
                  availableTeachers={[]}
                />
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="max-w-7xl mx-auto px-4 py-8">
                {currentRole === 'student' && (
                  <StudentDashboard
                    profile={studentProfile}
                    homeworks={homeworks}
                    quizzes={quizzes}
                    onOpenSolverForHomework={handleOpenSolverForHomework}
                    onUpdateRevisionTask={handleUpdateRevisionTask}
                    onNavigateTab={handleSetActiveTabGuard}
                    onOpenSolver={() => {
                      setSolverQuestion('');
                      handleSetActiveTabGuard('solver');
                    }}
                    onUpdateProfile={(updated) => {
                      setStudentProfile(updated);
                      try {
                        localStorage.setItem('htaf_student_profile', JSON.stringify(updated));
                      } catch (e) {
                        console.warn('Failed to persist student profile', e);
                      }
                    }}
                    currentUser={currentUser}
                    currentSchool={currentSchool}
                    onOpenLoginModal={() => setIsLoginModalOpen(true)}
                  />
                )}

                {currentRole === 'parent' && (
                  <ParentDashboard
                    profile={studentProfile}
                    onUpdateScreenTime={handleUpdateScreenTime}
                    currentUser={currentUser}
                    currentSchool={currentSchool}
                  />
                )}

                {currentRole === 'teacher' && (
                  <TeacherDashboard
                    currentUser={currentUser}
                    currentSchool={currentSchool}
                    userSchoolLink={userSchoolLink}
                    homeworks={homeworks}
                    onAddHomework={handleAddHomework}
                    onAddQuiz={handleAddQuiz}
                    onOpenInviteStudentModal={() => setIsInviteStudentModalOpen(true)}
                  />
                )}

                {currentRole === 'counselor' && (
                  <CounselorDashboard
                    referrals={referrals}
                    onAddNote={handleAddCounselingNote}
                  />
                )}

                {(currentRole === 'principal' || currentRole === 'vice_principal' || currentRole === 'school_admin' || currentRole === 'school_manager') && (
                  <SchoolManagementView
                    currentSchool={currentSchool}
                    referrals={referrals}
                    auditLogs={auditLogs}
                    onAddReferral={handleAddReferral}
                    onAddCircular={handleAddCircular}
                    onOpenInviteStudentModal={() => setIsInviteStudentModalOpen(true)}
                    onOpenManualAddSchool={() => setIsManualAddSchoolOpen(true)}
                    onOpenEditSchool={handleOpenEditSchool}
                    onRefreshSchools={handleRefreshSchools}
                    isRefreshingSchools={isRefreshingSchools}
                  />
                )}

                {(currentRole === 'super_admin' || currentRole === 'platform_admin') && (
                  <SuperAdminView
                    schools={schools}
                    registrationCodes={registrationCodes}
                    centralBooks={centralBooks}
                    onAddRegistrationCode={handleAddRegistrationCode}
                    onToggleCodeStatus={handleToggleCodeStatus}
                    onToggleSchoolApproval={handleToggleSchoolApproval}
                    onRegisterSchoolByCode={handleRegisterSchoolByCode}
                    onAddBook={handleAddBook}
                    onBulkAddBooks={handleBulkAddBooks}
                    onUpdateBook={handleUpdateBook}
                    onReplaceBookVersion={handleReplaceBookVersion}
                    onDeleteBook={handleDeleteBook}
                    onOpenManualAddSchool={() => setIsManualAddSchoolOpen(true)}
                    onOpenEditSchool={handleOpenEditSchool}
                    onRefreshSchools={handleRefreshSchools}
                    isRefreshingSchools={isRefreshingSchools}
                  />
                )}
              </div>
            )}
            </>
            )}

            {/* Bottom Dynamic Sections (Admin Configurable) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <DynamicPageSectionRenderer
                pageId={activeTab}
                position="bottom"
                blocks={currentDynamicBlocks}
                currentUser={currentUser}
                currentRole={currentRole}
                isAdmin={isAdmin}
                onOpenCustomizer={(blockId) => {
                  setCustomizerTargetBlockId(blockId);
                  setIsCustomizerOpen(true);
                }}
                onNavigateTab={handleSetActiveTabGuard}
              />
            </div>
          </>
      </main>


      {/* Global Footer */}
      <footer className="bg-[#050a16] text-blue-300/70 text-xs py-8 border-t border-blue-900/40 mt-auto safe-area-pb">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-white">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">منصة حقائق العلوم التعليمية الذكية</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">تطبيق الويب التقدمي PWA © 2026</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            متوافق بالكامل مع كتب وإصدارات وزارة التعليم المعتمدة • مدعوم بأحدث نماذج الذكاء الاصطناعي (Google Gemini)
          </p>
        </div>
      </footer>

      {/* PWA Components */}
      <AboutAppModal
        isOpen={isAboutAppOpen}
        onClose={() => setIsAboutAppOpen(false)}
        currentSchool={currentSchool}
      />
      <PWAOfflineNotice />
      <PWAUpdateModal />

      {/* Manual Add School Modal */}
      <ManualAddSchoolModal
        isOpen={isManualAddSchoolOpen}
        onClose={() => setIsManualAddSchoolOpen(false)}
        onSchoolCreated={handleManualSchoolCreated}
        currentUser={currentUser}
      />

      {/* Edit School Modal */}
      <EditSchoolModal
        isOpen={isEditSchoolOpen}
        onClose={() => {
          setIsEditSchoolOpen(false);
          setEditingSchool(null);
        }}
        school={editingSchool}
        onSchoolUpdated={handleSchoolUpdated}
      />

      {/* School Sync Success Toast */}
      {schoolSyncToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            ✓
          </div>
          <p className="text-xs font-bold">{schoolSyncToast}</p>
        </div>
      )}

      {/* Admin Dynamic Page Customizer Modal */}
      <AdminPageCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentPageId={activeTab}
        onBlocksUpdated={() => setDynamicBlocksVersion(v => v + 1)}
      />

      {/* Official School Smart Barcode & QR Modal */}
      <SchoolBarcodeModal
        isOpen={isSchoolBarcodeModalOpen}
        onClose={() => setIsSchoolBarcodeModalOpen(false)}
        schools={schools}
        currentSchool={barcodeSchool || currentSchool}
        onSelectSchool={(sch) => setBarcodeSchool(sch)}
      />
    </div>
    </div>
  );
}
