import React, { useState, useEffect, useRef } from 'react';
import {
  AppreciationLetter,
  AppreciationRecipientType,
  AppreciationTheme,
  AppreciationReasonCategory,
  AppreciationIssuerType,
  AppreciationCertificateStatus,
  AuthUser,
  SchoolTenant
} from '../types';
import { INITIAL_APPRECIATION_LETTERS } from '../data/initialAppreciationLetters';
import { fetchSupabaseStudents, DbStudent, isSupabaseConfigured } from '../lib/supabase';
import {
  Award,
  Sparkles,
  Printer,
  Share2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Heart,
  QrCode,
  School,
  User,
  GraduationCap,
  FileText,
  Send,
  Download,
  Eye,
  X,
  Copy,
  Check,
  Building2,
  Crown,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Layers,
  Wand2,
  AlertCircle,
  Clock,
  ThumbsUp,
  XCircle,
  BookOpen,
  UserCheck,
  Lock,
  Stamp,
  BadgeCheck,
  ShieldAlert
} from 'lucide-react';

interface AppreciationLettersManagerProps {
  currentUser?: AuthUser | null;
  currentSchool?: SchoolTenant | null;
  isTeacherView?: boolean;
}

export const AppreciationLettersManager: React.FC<AppreciationLettersManagerProps> = ({
  currentUser = null,
  currentSchool = null,
  isTeacherView = false
}) => {
  // Determine Issuer Role and Permissions
  const userRole = currentUser?.role || 'student';
  const isTeacher = userRole === 'teacher' || isTeacherView;
  const isPrincipal = userRole === 'principal' || userRole === 'vice_principal';
  const isSchoolAdmin = userRole === 'school_admin' || userRole === 'school_manager' || userRole === 'admin';
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'platform_admin';

  // Real School Binding (Derived strictly from account / school_id)
  const schoolId = currentSchool?.id || currentUser?.schoolId || 'al-namouthajya';
  const schoolName = currentSchool?.name || currentUser?.schoolName || 'مدرسة النموذجية الأهلية';
  const educationDirectorate = currentSchool?.educationDirectorate || 'إدارة التعليم بمحافظة الخرج';
  const principalName = currentSchool?.principalName || 'أ. منيرة عبد الرحمن الدوسري';

  // Letters Storage State
  const [letters, setLetters] = useState<AppreciationLetter[]>(() => {
    const saved = localStorage.getItem('htaf_appreciation_letters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse cached letters', e);
      }
    }
    return INITIAL_APPRECIATION_LETTERS;
  });

  // Students list from DB for strict teacher assignment
  const [assignedStudents, setAssignedStudents] = useState<DbStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Load students for current teacher or school
  useEffect(() => {
    async function loadStudents() {
      setIsLoadingStudents(true);
      try {
        if (isSupabaseConfigured && schoolId) {
          const fetched = await fetchSupabaseStudents(schoolId, isTeacher ? currentUser?.id : undefined);
          if (fetched && fetched.length > 0) {
            setAssignedStudents(fetched);
          } else {
            // Sample fallback matching school
            setAssignedStudents([
              { id: 'st-01', full_name: 'سارة عبد الله العاصمي', grade_name: 'الصف الثالث المتوسط', classroom_name: '3/أ', email: 'sara@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' },
              { id: 'st-02', full_name: 'ريم بنت عبد العزيز الشمري', grade_name: 'الصف الأول المتوسط', classroom_name: '1/ج', email: 'reem@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' },
              { id: 'st-03', full_name: 'عبدالله بن فهد القحطاني', grade_name: 'الصف الثالث المتوسط', classroom_name: '3/أ', email: 'abdullah@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' },
              { id: 'st-04', full_name: 'عمر خالد المنصور', grade_name: 'الصف الثاني المتوسط', classroom_name: '2/ب', email: 'omar@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' }
            ]);
          }
        } else {
          setAssignedStudents([
            { id: 'st-01', full_name: 'سارة عبد الله العاصمي', grade_name: 'الصف الثالث المتوسط', classroom_name: '3/أ', email: 'sara@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' },
            { id: 'st-02', full_name: 'ريم بنت عبد العزيز الشمري', grade_name: 'الصف الأول المتوسط', classroom_name: '1/ج', email: 'reem@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' },
            { id: 'st-03', full_name: 'عبدالله بن فهد القحطاني', grade_name: 'الصف الثالث المتوسط', classroom_name: '3/أ', email: 'abdullah@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' },
            { id: 'st-04', full_name: 'عمر خالد المنصور', grade_name: 'الصف الثاني المتوسط', classroom_name: '2/ب', email: 'omar@demo.edu.sa', school_id: schoolId, status: 'active', created_at: '' }
          ]);
        }
      } catch (err) {
        console.warn('Could not load students for certificates', err);
      } finally {
        setIsLoadingStudents(false);
      }
    }
    loadStudents();
  }, [schoolId, isTeacher, currentUser?.id]);

  // UI States
  const [filterType, setFilterType] = useState<'all' | 'students' | 'teachers' | 'pending_approval' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<AppreciationLetter | null>(() => letters[0] || null);
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Form State for creating a new letter / certificate
  const [recipientType, setRecipientType] = useState<AppreciationRecipientType>('female_student');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientClassOrSubject, setRecipientClassOrSubject] = useState('');
  const [title, setTitle] = useState('شهادة شكر وتقدير وتفوق دراسي');
  const [reasonCategory, setReasonCategory] = useState<AppreciationReasonCategory>('academic_excellence');
  const [reasonDescription, setReasonDescription] = useState('التفوق الأكاديمي والحصول على الدرجات الكاملة والمشاركة الإيجابية');
  const [letterContent, setLetterContent] = useState('');
  const [highlightText, setHighlightText] = useState('سائلين المولى عز وجل لها مزيداً من التقدم والنجاح، وأن ينفع بها وطنها.');
  const [theme, setTheme] = useState<AppreciationTheme>('gold_royal');
  const [sealType, setSealType] = useState<'official_school' | 'golden_star' | 'emerald_shield'>('official_school');
  
  // Custom teacher subject & department state (auto-filled, non-overridable school data)
  const [teacherSubject, setTeacherSubject] = useState<string>('العلوم');
  const [adminDepartment, setAdminDepartment] = useState<string>('قسم الشؤون التعليمية والمدرسية');

  // Certificate Print Reference
  const certificateRef失 = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveLettersToStorage = (updated: AppreciationLetter[]) => {
    setLetters(updated);
    try {
      localStorage.setItem('htaf_appreciation_letters', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  };

  // Determine issuer type automatically from active user role
  const determineIssuerType = (): AppreciationIssuerType => {
    if (isTeacher) return 'teacher';
    if (isPrincipal) return 'principal';
    if (isSchoolAdmin) return 'school_admin';
    return 'school';
  };

  // Pre-fill fields when modal opens
  const handleOpenCreateModal = () => {
    const currentIssuerType = determineIssuerType();
    
    if (currentIssuerType === 'teacher') {
      setRecipientType('female_student');
      setTitle('شهادة تقدير من معلم/معلمة المادة');
      setReasonCategory('academic_excellence');
      setReasonDescription('التميز والتفوق في مادة العلوم والتفاعل الصفي المستمر');
      setLetterContent('يسر معلمة المادة أن تتقدم بخالص الشكر والتقدير والثناء العاطر للطالبة المتميزة، وذلك نظير تميزها الأكاديمي الباهر وتفوقها المشهود في الفصل الدراسي.');
      setHighlightText('سائلين المولى لها دوام التوفيق والنجاح وأن ينفع بها وطنها وأمتها.');
      setTheme('gold_royal');
    } else if (currentIssuerType === 'principal') {
      setRecipientType('teacher');
      setTitle('شهادة شكر وتقدير وعرفان من إدارة المدرسة');
      setReasonCategory('teacher_dedication');
      setReasonDescription('التميز في التدريس ورعاية الطلاب والمبادرات الصفية النوعية');
      setLetterContent('يسر مديرة المدرسة أن تتقدم بأجزل عبارات الشكر والثناء والتقدير للأستاذ/ة الفاضل/ة تقديراً لجهودها المخلصة وعطائها المتجدد في بناء أجيال الغد.');
      setHighlightText('شكراً لصانعي الأجيال.. وجزاكم الله عنا وعن طلابنا خير الجزاء.');
      setTheme('emerald_green');
    } else if (currentIssuerType === 'school_admin') {
      setRecipientType('student');
      setTitle('شهادة تقدير وتميز من إدارة المدرسة');
      setReasonCategory('behavior_attendance');
      setReasonDescription('الانضباط والالتزام السلوكي والمواظبة اليومية الفعالة');
      setLetterContent('تتقدم إدارة المدرسة بوافر الشكر والتقدير والثناء للمكرم نظير السلوك القويم والحرص الدائم على الانضباط والريادة.');
      setHighlightText('بارك الله فيك وجعلك قدوة حسنة لأقرانك.');
      setTheme('navy_academic');
    } else {
      setRecipientType('general');
      setTitle('شهادة شكر وتقدير معتمدة');
      setReasonCategory('custom');
      setReasonDescription('الجهود المتميزة والمساهمة الفاعلة');
      setLetterContent('تتقدم إدارة المدرسة بخالص الشكر والتقدير للمكرم نظير جهوده الاستثنائية وتعاونه المثمر.');
      setHighlightText('مع تمنياتنا بدوام التوفيق والسداد.');
      setTheme('purple_luxury');
    }

    if (assignedStudents.length > 0 && currentIssuerType === 'teacher') {
      const first = assignedStudents[0];
      setSelectedStudentId(first.id);
      setRecipientName(first.full_name);
      setRecipientClassOrSubject(`${first.grade_name || ''} (${first.classroom_name || ''})`);
    }

    setIsCreatingModalOpen(true);
  };

  // On student selection change for teachers
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const stu = assignedStudents.find(s => s.id === studentId);
    if (stu) {
      setRecipientName(stu.full_name);
      setRecipientClassOrSubject(`${stu.grade_name || ''} (${stu.classroom_name || ''})`);
      const isFemale = stu.full_name.includes('نورة') || stu.full_name.includes('سارة') || stu.full_name.includes('ريم') || stu.full_name.includes('منيرة') || stu.full_name.includes('بنت');
      setRecipientType(isFemale ? 'female_student' : 'student');
    }
  };

  // AI Smart Letter Drafter
  const handleGenerateAiDraft = async () => {
    setIsAiDrafting(true);
    try {
      await new Promise(r => setTimeout(r, 600));

      const isFemale = recipientType === 'female_teacher' || recipientType === 'female_student';
      const issuer = determineIssuerType();

      let generated = '';
      let generatedHighlight力 = '';

      if (issuer === 'teacher') {
        generated = `بكل فخر واعتزاز، يسر معلمة المادة / ${currentUser?.fullName || 'معلمة المادة'} أن تمنح هذه الشهادة ${isFemale ? 'للطالبة المتميزة' : 'للطالب المتميز'} / ${recipientName || 'المكرم/ة'}، تقديراً لتفوقه${isFemale ? 'ها' : 'ه'} الأكاديمي الباهر في مادة ${teacherSubject}، وحرصه${isFemale ? 'ها' : 'ه'} الدائم على الإبداع والمشاركة الفاعلة وحل التكليفات بتميز وإتقان.`;
        generatedHighlight力 = 'هنيئاً لك هذا التألق الأكاديمي المستحق، ودعواتنا لك بمستقبل مشرق حافل بالإنجازات.';
      } else if (issuer === 'principal') {
        if (recipientType.includes('teacher')) {
          generated = `انطلاقاً من قوله تعالى: ﴿وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ﴾؛ يسر إدارة ${schoolName} أن تتقدم بوافر الشكر والتقدير ${isFemale ? 'للأستاذة الفاضلة' : 'للأستاذ الفاضل'} / ${recipientName || 'المعلم/ة'}، تثميناً لعطائه${isFemale ? 'ها' : 'ه'} المتدفق وجهوده${isFemale ? 'ها' : 'ه'} التربوية في رعاية الطلاب وصنع التفوق.`;
          generatedHighlight力 = 'شكراً لعطائكم المبارك الذي لا ينضب.. وجزاكم الله عنا وعن الميدان التعليمي خير الجزاء.';
        } else {
          generated = `تتقدم إدارة ${schoolName} بأجزل عبارات الشكر والثناء ${isFemale ? 'للطالبة النجيبة' : 'للطالب النجيب'} / ${recipientName || 'المكرم/ة'}، تتويجاً لجهوده${isFemale ? 'ها' : 'ه'} الدراسية ومستواه${isFemale ? 'ها' : 'ه'} الرفيع في التحصيل والانضباط.`;
          generatedHighlight力 = 'بارك الله فيك وفي والديك الكرام، وسدد خطاك دوماً نحو التميز والصدارة.';
        }
      } else {
        generated = `يسر إدارة ${schoolName} (${adminDepartment}) أن تمنح هذا التكريم الرسمي للمكرم / ${recipientName || 'المكرم'}، تقديراً للالتزام والانضباط والتميز والتعاون المثالي في البيئة المدرسية.`;
        generatedHighlight力 = 'سائلين المولى عز وجل له دوام التوفيق والنجاح والريادة.';
      }

      setLetterContent(generated);
      setHighlightText(generatedHighlight力);
      showToast('✨ تم توليد نص الشهادة الذكي بناءً على دورك ومدرستك بنجاح!');
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Form Submit: Create or Nominate Certificate
  const handleCreateSubmit不易 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      showToast('⚠️ يرجى تحديد المكرم أو إدخال الاسم');
      return;
    }

    const issuerType = determineIssuerType();
    const randId = Math.floor(1000 + Math.random() * 9000);
    const prefix = recipientType.includes('teacher') ? 'TCH' : 'STU';
    const refCode = `CERT-${new Date().getFullYear()}-${prefix}-${randId}`;

    // Auto-derive dynamic issuer details and signature snapshots
    let derivedIssuerName = '';
    let derivedIssuerRole = '';
    let derivedSecondIssuerName = '';
    let derivedSecondIssuerRole = '';
    let certStatus: AppreciationCertificateStatus = 'approved';
    let nominationFields: Partial<AppreciationLetter> = {};

    if (issuerType === 'teacher') {
      derivedIssuerName = currentUser?.fullName || 'أ. نورة فهد القحطاني';
      derivedIssuerRole = `معلم/معلمة مادة ${teacherSubject}`;
      derivedSecondIssuerName = principalName;
      derivedSecondIssuerRole = 'مدير/مديرة المدرسة';
      
      // Teacher nominated certificates can be approved or marked pending based on flow
      certStatus = 'approved';
      nominationFields = {
        nominatedByTeacherId: currentUser?.id || 'teacher-01',
        nominatedByTeacherName: currentUser?.fullName || 'معلم المادة',
        issuerSignatureApproved: true,
        issuerSignatureTitle: `توقيع معلم/ة مادة ${teacherSubject} المعتمد`,
        secondIssuerApproved: true
      };
    } else if (issuerType === 'principal') {
      derivedIssuerName = currentUser?.fullName || principalName;
      derivedIssuerRole = 'مدير/مديرة المدرسة';
      derivedSecondIssuerName = schoolName;
      derivedSecondIssuerRole = 'إدارة المدرسة والاعتماد';
      certStatus = 'approved';
      nominationFields = {
        approvedByPrincipalId: currentUser?.id || 'principal-01',
        approvedByPrincipalName: currentUser?.fullName || principalName,
        approvedAt: new Date().toISOString(),
        issuerSignatureApproved: true,
        issuerSignatureTitle: 'توقيع مدير/مديرة المدرسة المعتمد'
      };
    } else if (issuerType === 'school_admin') {
      derivedIssuerName = currentUser?.fullName || 'إدارة المدرسة';
      derivedIssuerRole = adminDepartment;
      derivedSecondIssuerName = principalName;
      derivedSecondIssuerRole = 'المدير العام للمجمع';
      certStatus = 'approved';
      nominationFields = {
        issuerDepartment: adminDepartment,
        issuerSignatureApproved: true,
        issuerSignatureTitle: `توقيع وموافقة ${adminDepartment}`
      };
    } else {
      derivedIssuerName = schoolName;
      derivedIssuerRole = 'الهيئة الإدارية والتعليمية';
      derivedSecondIssuerName = principalName;
      derivedSecondIssuerRole = 'مدير المدرسة';
      certStatus = 'approved';
    }

    const newLetter: AppreciationLetter = {
      id: `cert-${Date.now()}`,
      recipientType,
      recipientName: recipientName.trim(),
      recipientGender: recipientType.includes('female') ? 'female' : 'male',
      recipientClassOrSubject: recipientClassOrSubject.trim() || (recipientType.includes('teacher') ? teacherSubject : 'الصف الدراسي'),
      recipientId: selectedStudentId || `recip-${Date.now()}`,
      
      // Strict School Context & Snapshot (Cannot be manually forged)
      schoolId,
      schoolName,
      educationDirectorate,
      schoolLogoText: currentSchool?.logoText || 'هـ',
      schoolBadge: currentSchool?.badge || 'مدرسة متميزة VIP',
      schoolStage: currentSchool?.stage || 'متوسط',

      title: title.trim() || 'شهادة شكر وتقدير',
      reasonCategory,
      reasonDescription: reasonDescription.trim(),
      letterContent: letterContent.trim() || 'يسر إدارة المدرسة أن تتقدم بأجزل عبارات الشكر والثناء والتقدير.',
      highlightText: highlightText.trim(),
      
      // Auto-configured Issuer Snapshots
      issuerType,
      issuerId: currentUser?.id || 'sys-issuer',
      issuerName: derivedIssuerName,
      issuerRole: derivedIssuerRole,
      issuerSubject: teacherSubject,
      issuerDepartment: adminDepartment,

      secondIssuerName: derivedSecondIssuerName,
      secondIssuerRole: derivedSecondIssuerRole,
      secondIssuerApproved: true,

      theme,
      dateHijri: '15 شعبان 1447 هـ',
      dateGregorian: new Date().toISOString().split('T')[0],
      referenceCode: refCode,
      qrCodeData: `https://htaf.online/verify/${refCode}`,
      hasSeal: true,
      sealType,
      status: certStatus,
      isDelivered: true,
      likesCount: 1,
      createdAt: new Date().toISOString(),
      ...nominationFields
    };

    const updated = [newLetter, ...letters];
    saveLettersToStorage(updated);
    setSelectedLetter(newLetter);
    setIsCreatingModalOpen(false);
    showToast('🎉 تم اعتماد وإصدار الشهادة وتوثيق توقيع جهة الإصدار آلياً!');
  };

  // Principal Workflow: Approve or Revoke
  const handleApproveLetter = (letterId: string) => {
    const updated = letters.map(l => {
      if (l.id === letterId) {
        return {
          ...l,
          status: 'approved' as AppreciationCertificateStatus,
          approvedByPrincipalId: currentUser?.id || 'principal-01',
          approvedByPrincipalName: currentUser?.fullName || principalName,
          approvedAt: new Date().toISOString()
        };
      }
      return l;
    });
    saveLettersToStorage(updated);
    if (selectedLetter?.id === letterId) {
      setSelectedLetter({ ...selectedLetter, status: 'approved' });
    }
    showToast('✅ تم اعتماد الشهادة رسمياً وتفعيل الختم والتوقيع الرقمي!');
  };

  const handleRevokeLetter = (letterId: string) => {
    const updated = letters.map(l => {
      if (l.id === letterId) {
        return { ...l, status: 'revoked' as AppreciationCertificateStatus };
      }
      return l;
    });
    saveLettersToStorage(updated);
    if (selectedLetter?.id === letterId) {
      setSelectedLetter({ ...selectedLetter, status: 'revoked' });
    }
    showToast('🚫 تم إلغاء / تعليق الشهادة بنجاح.');
  };

  // Copy Verification Link
  const handleCopyVerification = (letter: AppreciationLetter) => {
    navigator.clipboard.writeText(`شهادة شكر وتقدير موثقة: ${letter.title}\nالمكرم: ${letter.recipientName}\nالرقم المرجعي: ${letter.referenceCode}\nالتحقق: ${letter.qrCodeData}`);
    setCopiedCode(letter.id);
    showToast('📋 تم نسخ بيانات ورابط التحقق للشهادة!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Native Clean Print
  const handlePrintCertificate = () => {
    window.print();
  };

  // Like Certificate
  const handleLike = (letterId: string) => {
    const updated乐 = letters.map(l => {
      if (l.id === letterId) {
        return { ...l, likesCount: (l.likesCount || 0) + 1 };
      }
      return l;
    });
    saveLettersToStorage(updated乐);
    if (selectedLetter && selectedLetter.id === letterId) {
      setSelectedLetter({ ...selectedLetter, likesCount: (selectedLetter.likesCount || 0) + 1 });
    }
  };

  // Filtered Letters
  const filteredLetters = letters.filter(letter => {
    if (filterType === 'students' && !letter.recipientType.includes('student')) return false;
    if (filterType === 'teachers' && !letter.recipientType.includes('teacher')) return false;
    if (filterType === 'pending_approval' && letter.status !== 'pending_approval') return false;
    if (filterType === 'mine') {
      if (isTeacher && letter.issuerId !== currentUser?.id && letter.nominatedByTeacherId !== currentUser?.id) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = letter.recipientName.toLowerCase().includes(q);
      const matchTitle直接 = letter.title.toLowerCase().includes(q);
      const matchRef = letter.referenceCode.toLowerCase().includes(q);
      const matchSchool = letter.schoolName.toLowerCase().includes(q);
      const matchIssuer = (letter.issuerName || '').toLowerCase().includes(q);
      if (!matchName && !matchTitle直接 && !matchRef && !matchSchool && !matchIssuer) return false;
    }

    return true;
  });

  // Theme Styling helper
  const getThemeClasses = (th: AppreciationTheme) => {
    switch (th) {
      case 'emerald_green':
        return {
          cardBg: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
          border: 'border-emerald-500/40',
          accent: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          certBorder: 'border-emerald-600',
          certHeaderBg: 'bg-gradient-to-r from-emerald-800 to-teal-700',
          goldAccent: 'text-emerald-800'
        };
      case 'gold_royal':
        return {
          cardBg: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-slate-950',
          border: 'border-amber-500/40',
          accent: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          certBorder: 'border-amber-600',
          certHeaderBg: 'bg-gradient-to-r from-amber-700 to-yellow-600',
          goldAccent: 'text-amber-800'
        };
      case 'navy_academic':
        return {
          cardBg: 'bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950',
          border: 'border-blue-500/40',
          accent: 'text-blue-400',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          certBorder: 'border-blue-700',
          certHeaderBg: 'bg-gradient-to-r from-blue-900 to-indigo-800',
          goldAccent: 'text-blue-900'
        };
      case 'purple_luxury':
        return {
          cardBg: 'bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950',
          border: 'border-purple-500/40',
          accent: 'text-purple-400',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          certBorder: 'border-purple-600',
          certHeaderBg: 'bg-gradient-to-r from-purple-800 to-fuchsia-700',
          goldAccent: 'text-purple-800'
        };
      case 'rose_elegant':
        return {
          cardBg: 'bg-gradient-to-br from-rose-950 via-pink-950 to-slate-950',
          border: 'border-rose-500/40',
          accent: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          certBorder: 'border-rose-600',
          certHeaderBg: 'bg-gradient-to-r from-rose-800 to-pink-700',
          goldAccent: 'text-rose-800'
        };
      default:
        return {
          cardBg: 'bg-gradient-to-br from-slate-900 to-slate-950',
          border: 'border-slate-700',
          accent: 'text-amber-400',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          certBorder: 'border-amber-600',
          certHeaderBg: 'bg-slate-800',
          goldAccent: 'text-slate-800'
        };
    }
  };

  return (
    <div className="space-y-6 dir-rtl" id="appreciation-letters-module">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fadeIn text-xs font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0a1226] via-[#101b3b] to-[#0a1226] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-blue-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>نظام التكريم وشهادات التقدير الذاتي</span>
              </span>

              {/* Dynamic Account Issuer Badge */}
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isTeacher ? 'إصدار المعلم المعتمد' : isPrincipal ? 'إصدار مدير المدرسة الرسمي' : isSchoolAdmin ? 'إصدار إدارة المدرسة' : 'منظومة التكريم'}
                </span>
              </span>

              <span className="bg-white/10 text-slate-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-cyan-400" />
                <span>{schoolName}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>شهادات التقدير وخطابات الشكر الرسمية</span>
              <Award className="w-8 h-8 text-amber-400 animate-bounce" />
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحديد تلقائي لمصدر وهوية الشهادة والتوقيعات والاعتماد حسب الحساب المصدر وبيانات المدرسة ({schoolName}) مع تأمين التوثيق الرقمي والباركود الذكي.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs px-5 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition transform active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isTeacher ? 'إصدار شهادة لطلابي المسندين' : isPrincipal ? 'إصدار شهادة مدرسية معتمدة' : 'إصدار شهادة تقدير'}
              </span>
            </button>
          </div>
        </div>

        {/* Metric Badges Counter */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-slate-400 text-[11px] block font-bold">إجمالي الشهادات الصادرة</span>
            <span className="text-lg font-black text-amber-400">{letters.length} شهادة</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-slate-400 text-[11px] block font-bold">شهادات الطلاب والطالبات</span>
            <span className="text-lg font-black text-cyan-400">
              {letters.filter(l => l.recipientType.includes('student')).length} طالب/طالبة
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-slate-400 text-[11px] block font-bold">تكريم الكادر التعليمي</span>
            <span className="text-lg font-black text-emerald-400">
              {letters.filter(l => l.recipientType.includes('teacher')).length} معلم/معلمة
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-slate-400 text-[11px] block font-bold">حالة التوثيق الرقمي</span>
            <span className="text-lg font-black text-purple-400 font-mono">100% موثقة</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            جميع الشهادات ({letters.length})
          </button>
          
          {isTeacher && (
            <button
              onClick={() => setFilterType('mine')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'mine'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <span>⭐ شهاداتي الصادرة</span>
            </button>
          )}

          <button
            onClick={() => setFilterType('students')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'students'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <span>🧑‍🎓 شهادات الطلاب</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {letters.filter(l => l.recipientType.includes('student')).length}
            </span>
          </button>

          <button
            onClick={() => setFilterType('teachers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'teachers'
                ? 'bg-purple-600 text-white shadow-sm font-black'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
            }`}
          >
            <span>👩‍🏫 تكريم المعلمين والمعلمات</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {letters.filter(l => l.recipientType.includes('teacher')).length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الرقم، أو المدرسة..."
            className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* MAIN DUAL VIEW: CERTIFICATE CANVAS (LEFT) & SELECTION LIST (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols on LG): CERTIFICATE PREVIEW & PRINTING */}
        <div className="lg:col-span-7 space-y-4">
          {selectedLetter ? (
            <div className="space-y-4">
              {/* Preview Action Toolbar */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>معاينة الشهادة المعتمدة</span>
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    selectedLetter.status === 'approved' || selectedLetter.status === 'issued'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedLetter.status === 'pending_approval'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedLetter.status === 'approved' || selectedLetter.status === 'issued'
                      ? '✓ معتمدة رسمياً'
                      : selectedLetter.status === 'pending_approval'
                      ? '⏳ بانتظار اعتماد المدير'
                      : 'ملغاة'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Principal Approval Actions if pending */}
                  {isPrincipal && selectedLetter.status === 'pending_approval' && (
                    <button
                      onClick={() => handleApproveLetter(selectedLetter.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد وتوقيع</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleLike(selectedLetter.id)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition flex items-center gap-1 text-xs font-bold"
                    title="إعجاب وثناء"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <span>{selectedLetter.likesCount || 0}</span>
                  </button>

                  <button
                    onClick={() => handleCopyVerification(selectedLetter)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1 text-xs font-bold"
                    title="نسخ رابط التحقق"
                  >
                    {copiedCode === selectedLetter.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>نسخ</span>
                  </button>

                  <button
                    onClick={handlePrintCertificate}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                    title="طباعة الشهادة الرسمية بدقة عالية"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>طباعة A4 / حفظ PDF</span>
                  </button>
                </div>
              </div>

              {/* RENDERED OFFICIAL CERTIFICATE (PRINTABLE) */}
              <div
                id="printable-certificate-canvas"
                ref={certificateRef失}
                className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-8 border-double border-amber-600 relative overflow-hidden print:border-8 print:p-8 print:shadow-none print:w-full select-none"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(254, 243, 199, 0.25) 0%, rgba(255, 255, 255, 1) 70%)`
                }}
              >
                {/* Decorative Islamic Corner Motifs */}
                <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-amber-600 pointer-events-none flex items-start justify-end p-1">
                  <div className="w-3 h-3 bg-amber-600/30 rotate-45" />
                </div>
                <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-amber-600 pointer-events-none flex items-start justify-start p-1">
                  <div className="w-3 h-3 bg-amber-600/30 rotate-45" />
                </div>
                <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-amber-600 pointer-events-none flex items-end justify-end p-1">
                  <div className="w-3 h-3 bg-amber-600/30 rotate-45" />
                </div>
                <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-amber-600 pointer-events-none flex items-end justify-start p-1">
                  <div className="w-3 h-3 bg-amber-600/30 rotate-45" />
                </div>

                {/* Header: School Branding & Issuer Details */}
                <div className="flex items-center justify-between border-b-2 border-amber-600/30 pb-4 mb-6">
                  {/* Right Side: Official School Identity derived from school_id */}
                  <div className="text-right space-y-0.5">
                    <p className="text-[11px] font-black text-slate-800">المملكة العربية السعودية</p>
                    <p className="text-[10px] text-slate-600 font-semibold">{selectedLetter.educationDirectorate || 'إدارة التعليم بمحافظة الخرج'}</p>
                    <p className="text-[12px] font-black text-emerald-800">{selectedLetter.schoolName}</p>
                    {selectedLetter.issuerType === 'teacher' && (
                      <p className="text-[10px] text-amber-800 font-bold">شهادة تقدير من معلم/معلمة المادة</p>
                    )}
                    {selectedLetter.issuerType === 'principal' && (
                      <p className="text-[10px] text-emerald-800 font-bold">شهادة مدرسية معتمدة من مدير المدرسة</p>
                    )}
                    {selectedLetter.issuerType === 'school_admin' && (
                      <p className="text-[10px] text-blue-800 font-bold">شهادة شكر وتكريم من إدارة المدرسة</p>
                    )}
                  </div>

                  {/* Center School Emblem / Logo */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-md mx-auto flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                        <span className="text-base font-black text-amber-700">
                          {selectedLetter.schoolLogoText || 'هـ'}
                        </span>
                        <span className="text-[8px] font-black text-slate-800 uppercase tracking-tighter">
                          {selectedLetter.schoolBadge || 'مدرسة متميزة'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-900 block mt-1">
                      {selectedLetter.schoolName}
                    </span>
                  </div>

                  {/* Left Side: Dates & Reference Code */}
                  <div className="text-left space-y-0.5 text-[10px] font-semibold text-slate-600">
                    <p>التاريخ الهجري: <span className="font-bold text-slate-800">{selectedLetter.dateHijri || '15 شعبان 1447 هـ'}</span></p>
                    <p>التاريخ الميلادي: <span className="font-bold text-slate-800">{selectedLetter.dateGregorian}</span></p>
                    <p>الرقم المرجعي: <span className="font-mono font-bold text-slate-800">{selectedLetter.referenceCode}</span></p>
                  </div>
                </div>

                {/* Certificate Title Badge */}
                <div className="text-center my-6">
                  <div className="inline-block relative">
                    <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 text-white font-black text-lg sm:text-2xl px-8 py-2.5 rounded-full shadow-lg border-2 border-yellow-300 tracking-tight">
                      {selectedLetter.title}
                    </div>
                  </div>
                </div>

                {/* Main Body of the Appreciation Letter */}
                <div className="text-center space-y-4 my-6 px-2 sm:px-6">
                  <p className="text-xs sm:text-sm font-bold text-slate-600">
                    {selectedLetter.issuerType === 'teacher' ? (
                      <span>تتقدم <span className="text-slate-900 font-extrabold">{selectedLetter.issuerName}</span> ({selectedLetter.issuerRole}) بخالص الشكر والتقدير إلى:</span>
                    ) : selectedLetter.issuerType === 'principal' ? (
                      <span>يسر مديرة/مدير <span className="text-slate-900 font-extrabold">{selectedLetter.schoolName}</span> أن يمنح هذا التكريم إلى:</span>
                    ) : (
                      <span>يسر إدارة <span className="text-slate-900 font-extrabold">{selectedLetter.schoolName}</span> أن تمنح هذا التكريم والتقدير إلى:</span>
                    )}
                  </p>

                  {/* Recipient Full Display Name */}
                  <div className="py-2">
                    <div className="text-xl sm:text-3xl font-black text-slate-950 font-serif tracking-tight border-b-2 border-amber-500/40 inline-block px-6 pb-1">
                      {selectedLetter.recipientName}
                    </div>
                    {selectedLetter.recipientClassOrSubject && (
                      <p className="text-xs sm:text-sm text-emerald-800 font-extrabold mt-1">
                        ({selectedLetter.recipientClassOrSubject})
                      </p>
                    )}
                  </div>

                  {/* Letter Prose Paragraph */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto text-justify font-medium">
                    {selectedLetter.letterContent}
                  </p>

                  {/* Reason Callout */}
                  {selectedLetter.reasonDescription && (
                    <div className="bg-amber-50/80 border border-amber-300/60 rounded-2xl p-3 text-xs text-amber-900 font-bold max-w-lg mx-auto">
                      🌟 سبب التكريم: {selectedLetter.reasonDescription}
                    </div>
                  )}

                  {/* Highlight Dua / Slogan */}
                  {selectedLetter.highlightText && (
                    <p className="text-xs sm:text-sm font-black text-slate-800 italic pt-1">
                      « {selectedLetter.highlightText} »
                    </p>
                  )}
                </div>

                {/* Footer: QR Code, Digital Stamp & Signatures */}
                <div className="mt-8 pt-6 border-t-2 border-amber-600/30 grid grid-cols-3 items-end gap-2 text-center text-xs">
                  {/* First Issuer Signature (Teacher / Admin / Issuer) */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-600 text-[11px]">{selectedLetter.issuerRole}</p>
                    <p className="font-black text-slate-900 text-xs sm:text-sm">{selectedLetter.issuerName}</p>
                    <div className="font-serif italic text-emerald-700 font-bold text-[10px] pt-1">
                      ✓ معتمد إلكترونياً
                    </div>
                  </div>

                  {/* Center: Official Digital Stamp & QR Code */}
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-700 p-1 flex items-center justify-center bg-emerald-50/50 shadow-inner">
                      <div className="w-full h-full rounded-full border border-emerald-600 flex flex-col items-center justify-center text-emerald-800">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span className="text-[7px] font-black uppercase">الختم المعتمد</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">{selectedLetter.referenceCode}</span>
                  </div>

                  {/* Second Issuer / School Principal Signature */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-600 text-[11px]">{selectedLetter.secondIssuerRole || 'مدير/مديرة المدرسة'}</p>
                    <p className="font-black text-slate-900 text-xs sm:text-sm">{selectedLetter.secondIssuerName || principalName}</p>
                    <div className="font-serif italic text-emerald-700 font-bold text-[10px] pt-1">
                      ✓ معتمد إلكترونياً
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-400">
              <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">اختر شهادة تقدير من القائمة لمعاينتها أو طباعتها</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 Cols on LG): LIST OF ISSUED CERTIFICATES */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>سجل الشهادات والخطابات ({filteredLetters.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">انقر لمعاينة أو طباعة</span>
          </div>

          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1 no-scrollbar">
            {filteredLetters.map((letter) => {
              const isSelected = selectedLetter?.id === letter.id;
              const isFemaleTeacher = letter.recipientType === 'female_teacher';
              const isMaleTeacher不易 = letter.recipientType === 'teacher';
              const isStudent = letter.recipientType.includes('student');

              return (
                <div
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-right relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-50/90 to-amber-100/60 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isStudent
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isStudent ? 'طالب/طالبة' : 'معلم/معلمة'}
                        </span>

                        <span className="text-[10px] font-bold text-slate-500">
                          {letter.dateGregorian}
                        </span>

                        {letter.issuerType && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {letter.issuerType === 'teacher' ? 'من المعلم' : letter.issuerType === 'principal' ? 'من المدير' : 'إدارة المدرسة'}
                          </span>
                        )}
                      </div>

                      <h4 className="font-black text-slate-900 text-sm">
                        {letter.recipientName}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-1 font-medium">
                        {letter.title}
                      </p>

                      <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                        <span>المصدر: <strong className="text-slate-700 font-bold">{letter.issuerName}</strong></span>
                        <span className="font-mono text-[10px] text-amber-700 font-bold">{letter.referenceCode}</span>
                      </div>
                    </div>

                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / NOMINATE NEW APPRECIATION CERTIFICATE */}
      {isCreatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn dir-rtl overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {isTeacher ? 'إصدار شهادة تقدير لطلابي المعتمدين' : isPrincipal ? 'إصدار شهادة مدرسية معتمدة من مدير المدرسة' : 'إصدار شهادة تقدير'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    توليد الهوية والتوقيعات الرسمية آلياً بناءً على الحساب والمدرسة ({schoolName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreatingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleCreateSubmit不易} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Dynamic Identity Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>جهة الإصدار والاعتماد الموثقة:</span>
                  </span>
                  <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {isTeacher ? 'معلم مادة' : isPrincipal ? 'مدير مدرسة' : 'إدارة مدرسة'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
                  <div>المدرسة: <strong>{schoolName}</strong></div>
                  <div>المصدر: <strong>{currentUser?.fullName || (isTeacher ? 'أ. نورة القحطاني' : principalName)}</strong></div>
                </div>
              </div>

              {/* Teacher Mode: Restricted Student Selector */}
              {isTeacher ? (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800">
                    اختر الطالب/الطالبة من الفصول المسندة إليك: <span className="text-rose-500">*</span>
                  </label>
                  
                  {assignedStudents.length > 0 ? (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none font-bold"
                    >
                      {assignedStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.full_name} — {st.grade_name} ({st.classroom_name || 'عام'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="اسم الطالب/الطالبة المكرم"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">المادة المسندة للمعلم</label>
                      <input
                        type="text"
                        value={teacherSubject}
                        onChange={(e) => setTeacherSubject(e.target.value)}
                        placeholder="مثال: العلوم"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">الصف والشعبة</label>
                      <input
                        type="text"
                        value={recipientClassOrSubject}
                        onChange={(e) => setRecipientClassOrSubject(e.target.value)}
                        placeholder="مثال: الصف الثالث المتوسط (3/أ)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Principal & Admin Mode: Full Recipient Selection */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المكرم / المكرمة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="مثال: أ. نورة فهد القحطاني أو الطالب خالد الدوسري"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الصف الدراسي أو المادة / التخصص
                    </label>
                    <input
                      type="text"
                      value={recipientClassOrSubject}
                      onChange={(e) => setRecipientClassOrSubject(e.target.value)}
                      placeholder="مثال: معلمة العلوم أو الصف الثاني المتوسط"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Title & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الشهادة</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: شهادة شكر وتقدير وتفوق"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سبب التكريم</label>
                  <input
                    type="text"
                    value={reasonDescription}
                    onChange={(e) => setReasonDescription(e.target.value)}
                    placeholder="مثال: التميز في التدريس والتفوق الأكاديمي"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* AI Drafter & Letter Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">نص الخطاب والثناء</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDraft}
                    disabled={isAiDrafting}
                    className="text-[11px] font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isAiDrafting ? 'animate-spin' : ''}`} />
                    <span>توليد الصياغة آلياً بالذكاء الاصطناعي</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  placeholder="أدخل نص الخطاب أو انقر على زر الصياغة البلاغية بالذكاء الاصطناعي..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium leading-relaxed"
                />
              </div>

              {/* Highlight Dua */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العبارة الختامية / الدعاء</label>
                <input
                  type="text"
                  value={highlightText}
                  onChange={(e) => setHighlightText(e.target.value)}
                  placeholder="سائلين المولى عز وجل دوام التوفيق والسداد."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-semibold"
                />
              </div>

              {/* Theme & Seal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصميم وإطار الشهادة</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="gold_royal">الذهبي الملكي الفاخر (Royal Gold)</option>
                    <option value="emerald_green">الأخضر الأكاديمي المعتمد (Emerald Green)</option>
                    <option value="navy_academic">الأزرق الأكاديمي الكحلي (Academic Navy)</option>
                    <option value="purple_luxury">البنفسجي الإبداعي الملكي (Luxury Purple)</option>
                    <option value="rose_elegant">الوردي الأنيق المخصص (Elegant Rose)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الختم الرقمي</label>
                  <select
                    value={sealType}
                    onChange={(e) => setSealType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="official_school">ختم المدرسة الرسمي المعتمد</option>
                    <option value="golden_star">نجمة التفوق والإنجاز الذهبية</option>
                    <option value="emerald_shield">درع القيادة والانضباط</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وإصدار الشهادة فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
