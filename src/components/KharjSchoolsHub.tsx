import React, { useState, useEffect } from 'react';
import {
  KharjSchool,
  INITIAL_KHARJ_SCHOOLS,
  KHARJ_CENTERS_LIST
} from '../data/kharjSchoolsData';
import {
  SchoolTenant,
  SchoolRegistrationCode,
  SchoolInvitation,
  SchoolInvitationStatus,
  PlatformLetterSettings
} from '../types';
import {
  fetchSupabaseSchoolInvitations,
  saveSupabaseSchoolInvitation,
  updateSupabaseSchoolInvitationStatus,
  getSupabasePlatformLetterSettings,
  saveSupabasePlatformLetterSettings,
  DEFAULT_PLATFORM_LETTER_SETTINGS,
  isSupabaseConfigured
} from '../lib/supabase';
import {
  Building2,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Users,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Printer,
  ChevronDown,
  Layers,
  Award,
  ExternalLink,
  PlusCircle,
  Eye,
  Settings,
  Radar,
  Lock,
  Compass,
  AlertTriangle,
  FileCheck,
  CheckCheck,
  HelpCircle,
  Database
} from 'lucide-react';

interface KharjSchoolsHubProps {
  onRegisterSchool?: (school: SchoolTenant, codeUsed: string) => void;
  onAddRegistrationCode?: (code: SchoolRegistrationCode) => void;
  existingSchools?: SchoolTenant[];
  onOpenRadar?: () => void;
  onOpenSchoolBarcode?: (school: SchoolTenant) => void;
}

export const KharjSchoolsHub: React.FC<KharjSchoolsHubProps> = ({
  onRegisterSchool,
  onAddRegistrationCode,
  existingSchools = [],
  onOpenRadar,
  onOpenSchoolBarcode
}) => {
  const [schoolsList, setSchoolsList] = useState<KharjSchool[]>(INITIAL_KHARJ_SCHOOLS);
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Modals & Action States
  const [activeLetterSchool, setActiveLetterSchool] = useState<KharjSchool | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDispatchingAll, setIsDispatchingAll] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);

  // Platform Letter Settings (Founder signature & official disclaimer)
  const [letterSettings, setLetterSettings] = useState<PlatformLetterSettings>(DEFAULT_PLATFORM_LETTER_SETTINGS);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<PlatformLetterSettings>(DEFAULT_PLATFORM_LETTER_SETTINGS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to build canonical ref & code
  const getReferenceNumber = (school: KharjSchool) => {
    if (school.referenceNumber) return school.referenceNumber;
    const numPart = (school.id || '1001').replace(/\D/g, '').padEnd(4, '0').slice(0, 4) || '1001';
    return `INV-2026-${numPart}`;
  };

  const getInvitationCode = (school: KharjSchool) => {
    if (school.registrationCode?.startsWith('SCH-')) return school.registrationCode;
    const clean = (school.registrationCode || school.moeCode || school.id || 'SCH1001').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `SCH-${clean.slice(0, 6).padEnd(6, 'X')}`;
  };

  // 1. Initial Data Loading from Supabase & Settings
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingDb(true);
      try {
        // Load Letter Settings
        const settings = await getSupabasePlatformLetterSettings();
        setLetterSettings(settings);
        setSettingsForm(settings);

        // Load Remote Invitations
        if (isSupabaseConfigured) {
          const dbInvitations = await fetchSupabaseSchoolInvitations();
          if (dbInvitations && dbInvitations.length > 0) {
            setSchoolsList((prev) =>
              prev.map((s) => {
                const found = dbInvitations.find(
                  (inv) => inv.schoolId === s.id || inv.invitationCode === s.registrationCode || inv.schoolName === s.name
                );
                if (found) {
                  return {
                    ...s,
                    registrationCode: found.invitationCode || s.registrationCode,
                    referenceNumber: found.referenceNumber || s.referenceNumber,
                    invitationStatus: found.status,
                    invitationSentAt: found.sentAt || s.invitationSentAt,
                    viewedAt: found.viewedAt,
                    registeredAt: found.registeredAt,
                    verifiedAt: found.verifiedAt,
                    activatedAt: found.activatedAt,
                    notes: found.notes || s.notes
                  };
                }
                return s;
              })
            );
          }
        }
      } catch (err) {
        console.warn('Error loading initial hub data:', err);
      } finally {
        setIsLoadingDb(false);
      }
    };

    loadInitialData();
  }, []);

  // Save updated letter settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLetterSettings(settingsForm);
    setIsEditingSettings(false);
    await saveSupabasePlatformLetterSettings(settingsForm);
    showToast('✅ تم حفظ وتحديث بيانات توقيع الخطاب وإعدادات المنصة بنجاح!');
  };

  // Copy helper
  const handleCopy = (text: string, id: string, type: 'code' | 'msg') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } else {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Status mapping and colors
  const STATUS_CONFIG: Record<SchoolInvitationStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
    draft: { label: 'مسودة دعوة', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Clock },
    sent: { label: 'تم إرسال الدعوة', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', icon: Send },
    viewed: { label: 'تم فتح الدعوة', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: Eye },
    registered: { label: 'بدأ التسجيل', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: PlusCircle },
    verified: { label: 'تم التحقق الأكاديمي', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', icon: ShieldCheck },
    activated: { label: 'مفعلة ومرتبطة', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: CheckCircle2 }
  };

  const getNormalizedStatus = (rawStatus: any): SchoolInvitationStatus => {
    if (rawStatus === 'ready') return 'draft';
    if (rawStatus === 'linked') return 'activated';
    if (['draft', 'sent', 'viewed', 'registered', 'verified', 'activated'].includes(rawStatus)) {
      return rawStatus as SchoolInvitationStatus;
    }
    return 'draft';
  };

  // Send single invitation (Status: sent)
  const handleSendSingleInvitation = async (schoolId: string) => {
    const target = schoolsList.find((s) => s.id === schoolId);
    if (!target) return;

    const now = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const isoNow = new Date().toISOString();
    const invCode = getInvitationCode(target);
    const refNum = getReferenceNumber(target);

    // 1. Update local state
    setSchoolsList((prev) =>
      prev.map((s) =>
        s.id === schoolId
          ? {
              ...s,
              registrationCode: invCode,
              referenceNumber: refNum,
              invitationStatus: 'sent',
              invitationSentAt: now
            }
          : s
      )
    );

    // 2. Persist in Supabase `school_invitations` table
    await saveSupabaseSchoolInvitation({
      schoolId: target.id,
      schoolName: target.name,
      invitationCode: invCode,
      referenceNumber: refNum,
      status: 'sent',
      center: target.center,
      district: target.district,
      recipientEmail: target.contactEmail,
      recipientPhone: target.phone,
      sentAt: isoNow
    });

    // 3. Add to registration code registry if available
    if (onAddRegistrationCode) {
      const newCodeObj: SchoolRegistrationCode = {
        id: `code-kh-${Date.now()}`,
        code: invCode,
        schoolNameAssigned: target.name,
        createdDate: new Date().toISOString().split('T')[0],
        status: 'نشط',
        cityRegion: `الخرج - قطاع ${target.center}`
      };
      onAddRegistrationCode(newCodeObj);
    }

    showToast(`📨 تم إرسال وتوليد دعوة الانضمام الرسمية لمدرسة «${target.name}» برمز ${invCode} ورقم مرجعي ${refNum}`);
  };

  // Direct manual status transition for Super Admin tracking
  const handleUpdateStatusManually = async (schoolId: string, newStatus: SchoolInvitationStatus) => {
    const target = schoolsList.find((s) => s.id === schoolId);
    if (!target) return;

    const invCode = getInvitationCode(target);
    const refNum = getReferenceNumber(target);

    setSchoolsList((prev) =>
      prev.map((s) =>
        s.id === schoolId
          ? {
              ...s,
              invitationStatus: newStatus
            }
          : s
      )
    );

    await updateSupabaseSchoolInvitationStatus(invCode, newStatus);
    showToast(`🔄 تم تحديث حالة دعوة مدرسة «${target.name}» إلى «${STATUS_CONFIG[newStatus].label}»`);
  };

  // Batch dispatch for selected center or all
  const handleBatchDispatch = async (centerFilter?: string) => {
    const targetSchools = schoolsList.filter((s) => {
      const st = getNormalizedStatus(s.invitationStatus);
      if (centerFilter && centerFilter !== 'all') {
        return s.center === centerFilter && st === 'draft';
      }
      return st === 'draft';
    });

    if (targetSchools.length === 0) {
      showToast('⚠️ جميع المدارس المحددة تم إرسال دعوات لها بالفعل مسبقاً.');
      return;
    }

    setIsDispatchingAll(true);
    setDispatchProgress(15);

    const now = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const isoNow = new Date().toISOString();

    // Async batch execution
    for (let i = 0; i < targetSchools.length; i++) {
      const sch = targetSchools[i];
      const invCode = getInvitationCode(sch);
      const refNum = getReferenceNumber(sch);

      await saveSupabaseSchoolInvitation({
        schoolId: sch.id,
        schoolName: sch.name,
        invitationCode: invCode,
        referenceNumber: refNum,
        status: 'sent',
        center: sch.center,
        district: sch.district,
        recipientEmail: sch.contactEmail,
        recipientPhone: sch.phone,
        sentAt: isoNow
      });

      if (onAddRegistrationCode) {
        onAddRegistrationCode({
          id: `code-kh-${sch.id}-${Date.now()}`,
          code: invCode,
          schoolNameAssigned: sch.name,
          createdDate: new Date().toISOString().split('T')[0],
          status: 'نشط',
          cityRegion: `الخرج - قطاع ${sch.center}`
        });
      }

      setDispatchProgress(Math.round(((i + 1) / targetSchools.length) * 100));
    }

    setSchoolsList((prev) =>
      prev.map((s) => {
        const isMatch = centerFilter && centerFilter !== 'all' ? s.center === centerFilter : true;
        const st = getNormalizedStatus(s.invitationStatus);
        if (isMatch && st === 'draft') {
          return {
            ...s,
            registrationCode: getInvitationCode(s),
            referenceNumber: getReferenceNumber(s),
            invitationStatus: 'sent',
            invitationSentAt: now
          };
        }
        return s;
      })
    );

    setIsDispatchingAll(false);
    showToast(`🚀 تم بنجاح إرسال وتوليد ${targetSchools.length} دعوة انضمام مؤسسية وحفظها في قاعدة البيانات!`);
  };

  // Instant Link School (Status: activated)
  const handleInstantLinkSchool = async (school: KharjSchool) => {
    const invCode = getInvitationCode(school);
    const refNum = getReferenceNumber(school);

    if (onRegisterSchool) {
      const newSchoolTenant: SchoolTenant = {
        id: school.id,
        name: school.name,
        nameEn: school.nameEn,
        slug: `kharj-${school.id}`,
        logoText: 'HS',
        badge: 'مدرسة مرتبطة بنجاح',
        primaryColor: '#059669',
        accentColor: '#10b981',
        motto: 'التعليم الذكي لمستقبل رائد',
        location: `محافظة الخرج - ${school.district} (قطاع ${school.center})`,
        registrationCodeUsed: invCode,
        isApproved: true,
        principalName: school.principalName || 'إدارة المدرسة',
        principalEmail: school.contactEmail,
        totalStudentsCount: school.estimatedStudents,
        totalTeachersCount: school.estimatedTeachers,
        circulars: [
          {
            id: `circ-${Date.now()}`,
            title: 'تم الربط والتفعيل الرسمي في منصة حقائق العلوم',
            number: `CIR-2026-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString().split('T')[0],
            priority: 'عاجل',
            category: 'إداري',
            targetAudience: 'الجميع',
            content: `نرحب بإدارة ومنسوبي مدرسة ${school.name} ضمن المنظومة الأكاديمية الذكية بمحافظة الخرج.`
          }
        ]
      };
      onRegisterSchool(newSchoolTenant, invCode);
    }

    setSchoolsList((prev) =>
      prev.map((s) =>
        s.id === school.id
          ? {
              ...s,
              invitationStatus: 'activated',
              activatedAt: new Date().toISOString()
            }
          : s
      )
    );

    await saveSupabaseSchoolInvitation({
      schoolId: school.id,
      schoolName: school.name,
      invitationCode: invCode,
      referenceNumber: refNum,
      status: 'activated',
      center: school.center,
      district: school.district,
      activatedAt: new Date().toISOString()
    });

    showToast(`🎉 تم اعتماد وتفعيل مدرسة «${school.name}» وفتح مساحتها الرقمية المستقلة بنجاح!`);
  };

  // Filtered schools
  const filteredSchools = schoolsList.filter((school) => {
    const matchCenter = selectedCenter === 'all' || school.center === selectedCenter;
    const matchStage = selectedStage === 'all' || school.stage === selectedStage;
    const matchGender = selectedGender === 'all' || school.gender === selectedGender;
    const currentStatus = getNormalizedStatus(school.invitationStatus);
    const matchStatus = selectedStatus === 'all' || currentStatus === selectedStatus;
    const matchSearch =
      searchQuery.trim() === '' ||
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.moeCode.includes(searchQuery) ||
      getInvitationCode(school).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getReferenceNumber(school).toLowerCase().includes(searchQuery.toLowerCase());

    return matchCenter && matchStage && matchGender && matchStatus && matchSearch;
  });

  // Analytics Metrics
  const totalSchools = schoolsList.length;
  const activatedCount = schoolsList.filter((s) => getNormalizedStatus(s.invitationStatus) === 'activated').length;
  const sentCount = schoolsList.filter((s) => getNormalizedStatus(s.invitationStatus) === 'sent').length;
  const viewedCount = schoolsList.filter((s) => getNormalizedStatus(s.invitationStatus) === 'viewed').length;
  const draftCount = schoolsList.filter((s) => getNormalizedStatus(s.invitationStatus) === 'draft').length;
  const totalStudentsEst = schoolsList.reduce((acc, s) => acc + s.estimatedStudents, 0);

  // Generate invitation letter text template (copyable)
  const getInvitationTemplate = (school: KharjSchool) => {
    const invCode = getInvitationCode(school);
    const refNum = getReferenceNumber(school);
    const dateStr = new Date().toLocaleDateString('ar-SA');

    return `إلى إدارة مدرسة / ${school.name} المحترمين
السلام عليكم ورحمة الله وبركاته،

يسر منصة «حقائق العلوم» تقديم أطيب التحيات والتقدير لجهودكم في خدمة العملية التعليمية.

ما هي منصة حقائق العلوم؟
حقائق العلوم منصة تعليمية سعودية ذكية تهدف إلى توفير بيئة رقمية تجمع المدرسة والمعلم والطالب وولي الأمر، وتوفر أدوات تعليمية وإدارية مدعومة بالذكاء الاصطناعي للمساعدة في متابعة العملية التعليمية وتطوير تجربة الطالب.

أبرز أدوات وخدمات المنصة:
• إدارة الطلاب والفصول والجداول الدراسية.
• الواجبات والاختبارات والحضور والغياب.
• ملاحظات المعلمين والتواصل مع أولياء الأمور.
• المعلم الذكي وتنظيم المقررات والمواد التعليمية.
• الرادار الدراسي للإنذار المبكر (التعثر المبكر ← الحاجة للمتابعة ← التحسن ← التميز ← المواهب).
• الخطط التعليمية المساندة ومختبر الابتكار والبرمجة.

مساحة رقمية مستقلة لكل مدرسة:
تحصل مدرستكم الموقرة على مساحة رقمية مستقلة تشمل كافة منسوبيها وإدارتها مع عزل تام للبيانات على مستوى قاعدة البيانات وسياسات RLS عبر school_id.

بيانات دعوة الانضمام إلى المنصة:
- اسم المدرسة: ${school.name}
- رمز دعوة المدرسة: ${invCode}
- الرقم المرجعي: ${refNum}
- تاريخ الدعوة: ${dateStr}
- رابط الانضمام: https://htaf.online/join?code=${invCode}&school=${encodeURIComponent(school.name)}

(ملاحظة: رمز الدعوة فريد ومخصص لمدرستكم ولا يمكن استخدامه لمدرسة أخرى).

إخلاء مسؤولية:
«${letterSettings.officialDisclaimer}»

مع أطيب التحيات،
${letterSettings.founderName}
${letterSettings.founderTitle}
${letterSettings.founderSubtitle}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-black px-3.5 py-1 rounded-full border border-emerald-500/30">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>نظام دعوة المدارس المؤسسية المستقلة</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30">
                <Lock className="w-3.5 h-3.5" />
                <span>عزل بيانات RLS مستقل لكل مدرسة</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30">
                <Radar className="w-3.5 h-3.5" />
                <span>الرادار الدراسي للإنذار المبكر</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              منظومة دعوة المدارس وإدارة الارتباط المؤسسي
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-3xl leading-relaxed">
              توجيه الدعوات الرسمية إلى المدارس كجهات تعليمية مستقلة، وتتبع مراحل الدعوة والارتباط عبر قاعدة البيانات، مع دعم الرادار الدراسي الذكي والمساحات الرقمية المعزولة بأعلى معايير الأمان.
            </p>
          </div>

          {/* Quick Batch Actions & Settings */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenRadar && (
              <button
                onClick={onOpenRadar}
                className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-xl shadow-cyan-600/20 flex items-center gap-2 transition"
              >
                <Radar className="w-4 h-4 text-cyan-200 animate-pulse" />
                <span>رادار ربط مدارس المملكة</span>
              </button>
            )}

            <button
              onClick={() => setIsEditingSettings(true)}
              className="bg-slate-800/80 hover:bg-slate-700 text-emerald-300 font-bold text-xs px-4 py-3 rounded-2xl border border-emerald-500/30 flex items-center gap-2 transition"
              title="تعديل توقيع الخطاب وإعدادات المنصة"
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات الخطاب والتوقيع</span>
            </button>

            <button
              onClick={() => handleBatchDispatch('all')}
              disabled={isDispatchingAll || draftCount === 0}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition"
            >
              {isDispatchingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال الجماعي ({dispatchProgress}%)...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال دعوات الانضمام ({draftCount} مسودة جاهزة)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 border-t border-emerald-900/40 pt-5 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-900/40">
            <span className="text-slate-400 font-bold block">إجمالي المدارس</span>
            <span className="text-xl font-black text-white mt-1 block">{totalSchools} مدرسة</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-900/40">
            <span className="text-slate-400 font-bold block">مسودات جاهزة</span>
            <span className="text-xl font-black text-slate-300 mt-1 block">{draftCount} مسودة</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-900/40">
            <span className="text-slate-400 font-bold block">دعوات مرسلة</span>
            <span className="text-xl font-black text-cyan-400 mt-1 block">{sentCount} مرسلة</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-900/40">
            <span className="text-slate-400 font-bold block">مدارس مفعلة ومرتبطة</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">{activatedCount} مدرسة</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-900/40">
            <span className="text-slate-400 font-bold block">الطلاب المستهدفون</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">~{totalStudentsEst.toLocaleString()} طالب/ـة</span>
          </div>
        </div>
      </div>

      {/* Lifecycle Status Pipeline Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>مراحل دورة حياة الدعوة والارتباط المؤسسي:</span>
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            محمية بنظام عزل البيانات السحابي RLS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          {(['draft', 'sent', 'viewed', 'registered', 'verified', 'activated'] as SchoolInvitationStatus[]).map((st, idx) => {
            const cfg = STATUS_CONFIG[st];
            const Icon = cfg.icon;
            const count = schoolsList.filter((s) => getNormalizedStatus(s.invitationStatus) === st).length;
            const isSelected = selectedStatus === st;

            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(selectedStatus === st ? 'all' : st)}
                className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? `${cfg.bg} ${cfg.border} ring-2 ring-emerald-500 font-black`
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400">مرحلة {idx + 1}</span>
                  <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                </div>
                <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                <span className="text-sm font-black text-slate-800">{count} مدرسة</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Selection Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>اختر القطاع / المركز:</span>
          </span>

          {selectedCenter !== 'all' && (
            <button
              onClick={() => handleBatchDispatch(selectedCenter)}
              disabled={isDispatchingAll}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <Send className="w-3 h-3" />
              <span>إرسال لكافة مسودات قطاع {selectedCenter}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCenter('all')}
            className={`text-xs font-black px-4 py-2 rounded-xl whitespace-nowrap transition ${
              selectedCenter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            كافة المراكز ({totalSchools})
          </button>

          {KHARJ_CENTERS_LIST.map((centerName) => {
            const count = schoolsList.filter((s) => s.center === centerName).length;
            const isSelected = selectedCenter === centerName;

            return (
              <button
                key={centerName}
                onClick={() => setSelectedCenter(centerName)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-black shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{centerName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم المدرسة، الرمز الوزاري، كود الدعوة..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-700"
          >
            <option value="all">كافة المراحل</option>
            <option value="ابتدائي">ابتدائي</option>
            <option value="متوسط">متوسط</option>
            <option value="ثانوي">ثانوي</option>
            <option value="مجمع مشترك">مجمع مشترك</option>
            <option value="تحفيظ قرآن">تحفيظ قرآن</option>
            <option value="أهلي وعالمي">أهلي وعالمي</option>
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-700"
          >
            <option value="all">بنين وبنات</option>
            <option value="بنين">بنين</option>
            <option value="بنات">بنات</option>
            <option value="مشترك">مشترك (أهلي)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-700"
          >
            <option value="all">كافة حالات الدعوة</option>
            <option value="draft">مسودة دعوة</option>
            <option value="sent">تم إرسال الدعوة</option>
            <option value="viewed">تم فتح الدعوة</option>
            <option value="registered">بدأ التسجيل</option>
            <option value="verified">تم التحقق الأكاديمي</option>
            <option value="activated">مفعلة ومرتبطة</option>
          </select>
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((sch) => {
          const normStatus = getNormalizedStatus(sch.invitationStatus);
          const statusCfg = STATUS_CONFIG[normStatus];
          const StatusIcon = statusCfg.icon;
          const invCode = getInvitationCode(sch);
          const refNum = getReferenceNumber(sch);

          return (
            <div
              key={sch.id}
              className={`bg-white rounded-3xl p-5 border transition shadow-sm hover:shadow-md space-y-4 flex flex-col justify-between ${
                normStatus === 'activated'
                  ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20'
                  : normStatus === 'sent'
                  ? 'border-cyan-400/80 bg-cyan-50/20'
                  : normStatus === 'viewed'
                  ? 'border-blue-400/80 bg-blue-50/20'
                  : normStatus === 'verified'
                  ? 'border-indigo-400/80 bg-indigo-50/20'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      قطاع {sch.center}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {sch.stage} ({sch.gender})
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusCfg.label}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">{sch.name}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{sch.district} • محافظة الخرج</span>
                  </p>
                </div>
              </div>

              {/* School Details Box */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold">الجهة المخاطبة:</span>
                  <span className="font-extrabold text-slate-800">إدارة مدرسة / {sch.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold">الطلاب والكوادر:</span>
                  <span className="font-medium text-slate-700">~{sch.estimatedStudents} طالب | {sch.estimatedTeachers} معلم</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold">الرقم المرجعي للدعوة:</span>
                  <span className="font-mono font-bold text-slate-700">{refNum}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-emerald-800">رمز دعوة المدرسة:</span>
                  <div className="flex items-center gap-1">
                    <code className="bg-emerald-100 text-emerald-900 font-mono font-black text-[11px] px-2 py-0.5 rounded">
                      {invCode}
                    </code>
                    <button
                      onClick={() => handleCopy(invCode, sch.id, 'code')}
                      className="text-slate-400 hover:text-emerald-700 p-1"
                      title="نسخ رمز الدعوة"
                    >
                      {copiedCodeId === sch.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Stepper / Quick Stage Switcher */}
              <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-bold">
                  <span>تحديث حالة الدعوة في قاعدة البيانات:</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {(['draft', 'sent', 'viewed', 'registered', 'verified', 'activated'] as SchoolInvitationStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatusManually(sch.id, st)}
                      className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-bold transition ${
                        normStatus === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {STATUS_CONFIG[st].label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setActiveLetterSchool(sch)}
                    className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition flex items-center justify-center gap-1"
                    title="عرض خطاب الانضمام الرسمي"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>الخطاب</span>
                  </button>

                  {onOpenSchoolBarcode && (
                    <button
                      onClick={() => {
                        const tenantMatch: SchoolTenant = existingSchools.find(
                          (es) => es.id === sch.id || es.name === sch.name || es.moeCode === sch.moeCode
                        ) || {
                          id: sch.id,
                          name: sch.name,
                          nameEn: sch.name,
                          slug: sch.registrationCode?.toLowerCase() || sch.id,
                          logoText: sch.name.slice(0, 2),
                          badge: sch.stage || 'مدرسة معتمدة',
                          primaryColor: '#00d2ff',
                          accentColor: '#9333ea',
                          motto: 'المنصة التعليمية الذكية',
                          location: sch.centerName ? `محافظة الخرج - ${sch.centerName}` : 'محافظة الخرج',
                          stage: sch.stage as any,
                          moeCode: sch.moeCode,
                          circulars: []
                        };
                        onOpenSchoolBarcode(tenantMatch);
                      }}
                      className="text-[11px] font-black text-cyan-800 bg-cyan-50 hover:bg-cyan-100 py-2 rounded-xl transition flex items-center justify-center gap-1 border border-cyan-200 shadow-xs"
                      title="عرض وتنزيل باركود المدرسة الذكي"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span>الباركود</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(getInvitationTemplate(sch), sch.id, 'msg')}
                    className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-xl transition flex items-center justify-center gap-1 border border-emerald-200"
                    title="نسخ رسالة الدعوة"
                  >
                    {copiedMessageId === sch.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>منسوخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>رسالة</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendSingleInvitation(sch.id)}
                    className={`text-xs font-black py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm ${
                      normStatus === 'sent'
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        : normStatus === 'activated'
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{normStatus === 'sent' ? 'إعادة إرسال الدعوة' : normStatus === 'activated' ? 'تحديث الدعوة' : 'إرسال دعوة الانضمام'}</span>
                  </button>

                  <button
                    onClick={() => handleInstantLinkSchool(sch)}
                    className="text-xs font-black text-white bg-slate-900 hover:bg-slate-800 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اعتماد وتفعيل فوري</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OFFICIAL INVITATION LETTER & ONBOARDING MODAL */}
      {activeLetterSchool && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-emerald-500/40 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">خطاب دعوة الانضمام المؤسسي</h3>
                  <p className="text-xs text-slate-500 font-medium">موجه إلى إدارة مدرسة / {activeLetterSchool.name} المحترمين</p>
                </div>
              </div>
              <button
                onClick={() => setActiveLetterSchool(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Letter Paper Body */}
            <div className="p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 text-xs sm:text-sm text-slate-800 leading-relaxed font-['Cairo',sans-serif]">
              {/* Official Clean Header - No Ministry Logo / False Claims */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs text-slate-600 font-bold">
                <span>المملكة العربية السعودية</span>
                <span>{letterSettings.organizationName}</span>
              </div>

              <div className="text-center py-1">
                <span className="bg-emerald-100 text-emerald-900 font-black text-xs sm:text-sm px-5 py-1.5 rounded-full border border-emerald-300">
                  خطاب دعوة انضمام وشراكة رقمية ذكية
                </span>
              </div>

              {/* Addressee: Addressed strictly to School Entity, not an individual */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="font-black text-sm sm:text-base text-slate-900">
                  إلى إدارة مدرسة / {activeLetterSchool.name} المحترمين
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  القطاع: {activeLetterSchool.center} • {activeLetterSchool.district}
                </p>
              </div>

              <p className="font-bold">السلام عليكم ورحمة الله وبركاته،،،</p>

              {/* 1. What is Hataf Science Platform? */}
              <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-emerald-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ما هي منصة حقائق العلوم؟</span>
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  <strong>حقائق العلوم</strong> منصة تعليمية سعودية ذكية تهدف إلى توفير بيئة رقمية تجمع المدرسة والمعلم والطالب وولي الأمر، وتوفر أدوات تعليمية وإدارية مدعومة بالذكاء الاصطناعي للمساعدة في متابعة العملية التعليمية وتطوير تجربة الطالب.
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-black text-slate-800 text-[11px] block mb-1.5">أبرز خدمات وأدوات المنصة:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 font-medium">
                    <div>• إدارة الطلاب والفصول.</div>
                    <div>• الجداول الدراسية.</div>
                    <div>• الواجبات والاختبارات.</div>
                    <div>• الحضور والغياب.</div>
                    <div>• ملاحظات المعلمين.</div>
                    <div>• التواصل مع أولياء الأمور.</div>
                    <div>• المعلم الذكي.</div>
                    <div>• تنظيم المقررات والمواد التعليمية.</div>
                    <div>• متابعة مستوى الطالب وتطوره.</div>
                    <div>• الرادار الدراسي للإنذار المبكر.</div>
                    <div>• اكتشاف التميز والمواهب.</div>
                    <div>• الخطط التعليمية المساندة.</div>
                    <div className="col-span-2">• مختبر الابتكار والبرمجة.</div>
                  </div>
                </div>
              </div>

              {/* 2. Smart Academic Radar */}
              <div className="space-y-1.5 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                <h4 className="font-black text-amber-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Radar className="w-4 h-4 text-amber-700" />
                  <span>الرادار الدراسي الذكي</span>
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs">
                  تعمل المنصة على توفير نظام ذكي يساعد المدرسة على اكتشاف:
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200 font-black text-amber-900 text-xs text-center flex items-center justify-center gap-2 flex-wrap">
                  <span>التعثر المبكر</span>
                  <span>←</span>
                  <span>الحاجة للمتابعة</span>
                  <span>←</span>
                  <span>التحسن</span>
                  <span>←</span>
                  <span>التميز</span>
                  <span>←</span>
                  <span>المواهب</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pt-1">
                  (تعد هذه المؤشرات أدوات مساندة للمعلمين والمرشدين وإدارة المدرسة، ولا تعتبر حكمًا أو تقييمًا نهائيًا آليًا للطالب).
                </p>
              </div>

              {/* 3. Independent Space */}
              <div className="space-y-1.5 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <h4 className="font-black text-emerald-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>مساحة رقمية مستقلة لكل مدرسة</span>
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs">
                  تحصل كل مدرسة على مساحة رقمية مستقلة تشمل (إدارة المدرسة، المعلمون، الطلاب، أولياء الأمور، الفصول، الجداول، الواجبات، الاختبارات، الحضور، التقارير، والصلاحيات) مع عزل تام للبيانات على مستوى قاعدة البيانات وسياسات RLS عبر <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-bold text-[11px]">school_id</code>.
                </p>
              </div>

              {/* 4. Invitation Details Box (Changed title per user request) */}
              <div className="bg-white p-4 rounded-xl border border-emerald-300 space-y-2.5 shadow-sm">
                <span className="font-black text-emerald-950 block text-xs sm:text-sm">بيانات دعوة الانضمام إلى المنصة:</span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">اسم المدرسة:</span>
                    <span className="font-extrabold text-slate-900">{activeLetterSchool.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">القطاع / المركز:</span>
                    <span className="font-extrabold text-slate-900">{activeLetterSchool.center} ({activeLetterSchool.district})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">رمز دعوة المدرسة:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {getInvitationCode(activeLetterSchool)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">الرقم المرجعي:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {getReferenceNumber(activeLetterSchool)}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>رمز الدعوة فريد ومخصص لمدرستكم ولا يمكن استخدامه لمدرسة أخرى.</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Official Disclaimer */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-medium">
                <span className="font-bold text-slate-800 block mb-0.5">إشعار وإخلاء مسؤولية:</span>
                «{letterSettings.officialDisclaimer}»
              </div>

              {/* 6. Dynamic Signature Area */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
                <div>
                  <span className="block font-bold text-slate-500">تاريخ الدعوة: {new Date().toLocaleDateString('ar-SA')}</span>
                  <span className="block font-mono font-bold text-slate-500">{getReferenceNumber(activeLetterSchool)}</span>
                </div>
                <div className="text-left">
                  <span className="font-black text-emerald-900 block text-sm">{letterSettings.founderName}</span>
                  <span className="block text-[11px] font-bold text-slate-700">{letterSettings.founderTitle}</span>
                  <span className="block text-[10px] text-slate-500">{letterSettings.founderSubtitle}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  handleCopy(getInvitationTemplate(activeLetterSchool), activeLetterSchool.id, 'msg');
                  showToast('📋 تم نسخ نص الخطاب والدعوة بنجاح!');
                }}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ نص الخطاب</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleSendSingleInvitation(activeLetterSchool.id);
                    setActiveLetterSchool(null);
                  }}
                  className="text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال دعوة الانضمام وتحديث الحالة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM LETTER & SIGNATURE SETTINGS MODAL */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-emerald-500/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">إعدادات توقيع الخطابات الرسمية</h3>
              </div>
              <button
                onClick={() => setIsEditingSettings(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">اسم المؤسسة / الموقعة:</label>
                <input
                  type="text"
                  value={settingsForm.founderName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, founderName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">المسمى المهني / الوظيفي:</label>
                <input
                  type="text"
                  value={settingsForm.founderTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, founderTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الوصف الفرعي / الصفة:</label>
                <input
                  type="text"
                  value={settingsForm.founderSubtitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, founderSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">اسم المنصة:</label>
                <input
                  type="text"
                  value={settingsForm.organizationName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, organizationName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">صيغة إخلاء المسؤولية الرسمية:</label>
                <textarea
                  rows={3}
                  value={settingsForm.officialDisclaimer}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officialDisclaimer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition shadow-md shadow-emerald-600/20"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
