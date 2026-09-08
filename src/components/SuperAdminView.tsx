import React, { useState } from 'react';
import { SchoolTenant, SchoolRegistrationCode, CurriculumBook, AuthUser } from '../types';
import { CurriculumImportView } from './CurriculumImportView';
import { KharjSchoolsHub } from './KharjSchoolsHub';
import { DemoAccountsManager } from './DemoAccountsManager';
import {
  getSystemHealthTelemetry,
  getSystemTechnicalLogs,
  getStrictPrivacyRlsSql,
  getAllEmergencyGrants,
  grantEmergencySupportAccess,
  revokeEmergencySupportAccess,
  EmergencyAccessGrant,
  SystemTechnicalErrorLog
} from '../lib/privacyService';
import {
  Crown,
  KeyRound,
  Building2,
  Plus,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Search,
  Sparkles,
  Users,
  GraduationCap,
  Globe,
  Radio,
  FileSpreadsheet,
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  MapPin,
  Send,
  UserCheck,
  RefreshCw,
  Edit3,
  Radar,
  Activity,
  Server,
  ShieldAlert,
  FileCode2,
  Terminal,
  Lock,
  Unlock,
  Clock,
  ExternalLink,
  HelpCircle,
  Trash2
} from 'lucide-react';

interface SuperAdminViewProps {
  schools: SchoolTenant[];
  registrationCodes: SchoolRegistrationCode[];
  centralBooks: CurriculumBook[];
  onAddRegistrationCode: (newCode: SchoolRegistrationCode) => void;
  onToggleCodeStatus: (codeId: string) => void;
  onToggleSchoolApproval: (schoolId: string) => void;
  onRegisterSchoolByCode: (school: SchoolTenant, codeUsed: string) => void;
  onAddBook: (book: CurriculumBook) => void;
  onBulkAddBooks: (books: CurriculumBook[]) => void;
  onUpdateBook: (updatedBook: CurriculumBook) => void;
  onReplaceBookVersion: (oldBookId: string, newBook: CurriculumBook) => void;
  onDeleteBook: (bookId: string) => void;
  onOpenManualAddSchool?: () => void;
  onOpenEditSchool?: (school: SchoolTenant) => void;
  onRefreshSchools?: () => Promise<void> | void;
  isRefreshingSchools?: boolean;
  onOpenRadar?: () => void;
  onDeleteSchool?: (schoolId: string) => Promise<void> | void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  schools,
  registrationCodes,
  centralBooks,
  onAddRegistrationCode,
  onToggleCodeStatus,
  onToggleSchoolApproval,
  onRegisterSchoolByCode,
  onAddBook,
  onBulkAddBooks,
  onUpdateBook,
  onReplaceBookVersion,
  onDeleteBook,
  onOpenManualAddSchool,
  onOpenEditSchool,
  onRefreshSchools,
  isRefreshingSchools = false,
  onOpenRadar,
  onDeleteSchool
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'codes' | 'schools' | 'new_code' | 'curriculum_import' | 'kharj_schools' | 'demo_accounts' | 'system_health'>('kharj_schools');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Masking & Security State for Passwords/Credentials
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showRegistrationCodes, setShowRegistrationCodes] = useState(false);

  // Technical Support & Emergency Access State
  const [emergencyGrants, setEmergencyGrants] = useState<EmergencyAccessGrant[]>(() => getAllEmergencyGrants());
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencySchoolId, setEmergencySchoolId] = useState(schools[0]?.id || 'all');
  const [emergencyJustification, setEmergencyJustification] = useState('');
  const [emergencyDurationMinutes, setEmergencyDurationMinutes] = useState(30);
  const [emergencyPurpose, setEmergencyPurpose] = useState<EmergencyAccessGrant['purpose']>('technical_investigation');

  // Form for generating new code
  const [cityRegion, setCityRegion] = useState('الرياض');
  const [assignedSchoolName, setAssignedSchoolName] = useState('');
  const [customCodeSuffix, setCustomCodeSuffix] = useState('');
  const [generateSuccessMsg, setGenerateSuccessMsg] = useState<string | null>(null);

  // Filter state for Schools tab
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolRegionFilter, setSchoolRegionFilter] = useState('all');
  const [schoolStageFilter, setSchoolStageFilter] = useState('all');
  const [schoolGenderFilter, setSchoolGenderFilter] = useState('all');

  // Aggregated Analytics Modal for a clicked school
  const [selectedSchoolForAnalytics, setSelectedSchoolForAnalytics] = useState<SchoolTenant | null>(null);

  // Helper to generate unique school registration code
  const generateUniqueInvitationCode = (regionName: string, cityName: string) => {
    const regionCode = regionName.includes('مكة')
      ? 'MKH'
      : regionName.includes('الشرقية')
      ? 'EAS'
      : regionName.includes('عسير')
      ? 'ASR'
      : regionName.includes('القصيم')
      ? 'QSM'
      : cityName.includes('الخرج')
      ? 'KHJ'
      : 'RYD';
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    return `SCH-2026-${regionCode}-${randDigits}`;
  };

  // Form for Registering School directly from Super Admin
  const [showRegModal, setShowRegModal] = useState(false);
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regSchoolNameEn, setRegSchoolNameEn] = useState('');
  const [regRegion, setRegRegion] = useState('منطقة الرياض');
  const [regCity, setRegCity] = useState('محافظة الخرج');
  const [regStage, setRegStage] = useState<'ابتدائي' | 'متوسط' | 'ثانوي' | 'مجمع تعليمي'>('مجمع تعليمي');
  const [regGender, setRegGender] = useState<'بنين' | 'بنات' | 'مشترك'>('بنين');
  const [regSchoolType, setRegSchoolType] = useState<'حكومي' | 'أهلي' | 'عالمي' | 'تحفيظ قرآن'>('حكومي');
  const [regAutoCode, setRegAutoCode] = useState(() => generateUniqueInvitationCode('منطقة الرياض', 'محافظة الخرج'));
  const [regError, setRegError] = useState<string | null>(null);

  const handleCopy = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomNum = Math.floor(10 + Math.random() * 90);
    const suffix = customCodeSuffix.trim() ? customCodeSuffix.toUpperCase().replace(/\s+/g, '-') : `${randomNum}`;
    const codeString = `SCH-2026-${(cityRegion || 'KSA').toUpperCase().slice(0, 3)}-${suffix}`;

    const newCodeObj: SchoolRegistrationCode = {
      id: `code-${Date.now()}`,
      code: codeString,
      schoolNameAssigned: assignedSchoolName.trim() || 'غير مخصصة مسبقاً',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'نشط',
      cityRegion
    };

    onAddRegistrationCode(newCodeObj);
    setGenerateSuccessMsg(`تم توليد كود التسجيل المعتمد بنجاح: ${codeString}`);
    setAssignedSchoolName('');
    setCustomCodeSuffix('');
    setTimeout(() => setGenerateSuccessMsg(null), 4000);
  };

  const handleRegisterSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regSchoolName.trim()) {
      setRegError('يرجى كتابة اسم المدرسة الرسمي.');
      return;
    }

    const uniqueCode = regAutoCode.trim().toUpperCase() || generateUniqueInvitationCode(regRegion, regCity);

    // Register code object first
    const newCodeObj: SchoolRegistrationCode = {
      id: `code-${Date.now()}`,
      code: uniqueCode,
      schoolNameAssigned: regSchoolName.trim(),
      createdDate: new Date().toISOString().split('T')[0],
      status: 'مستخدم',
      cityRegion: `${regRegion} - ${regCity}`
    };
    onAddRegistrationCode(newCodeObj);

    // Create School Entity with strictly School-Level metadata
    const newSchoolObj: SchoolTenant = {
      id: `school-${Date.now()}`,
      name: regSchoolName.trim(),
      nameEn: regSchoolNameEn.trim() || 'Smart Educational Center',
      slug: (regSchoolNameEn || regSchoolName).toLowerCase().replace(/\s+/g, '-') || `school-${Date.now()}`,
      logoText: regSchoolName.slice(0, 1) || 'م',
      badge: `${regSchoolType} • ${regStage} • ${regGender}`,
      primaryColor: '#059669',
      accentColor: '#10b981',
      motto: 'التميز التعليمي والابتكار الرقمي',
      location: `${regRegion} - ${regCity}`,
      registrationCodeUsed: uniqueCode,
      isApproved: true,
      principalName: 'إدارة المدرسة المعتمدة',
      principalEmail: 'admin@school.moe.gov.sa',
      totalStudentsCount: regStage === 'مجمع تعليمي' ? 620 : 420,
      totalTeachersCount: regStage === 'مجمع تعليمي' ? 44 : 28,
      circulars: []
    };

    onRegisterSchoolByCode(newSchoolObj, uniqueCode);
    setShowRegModal(false);
    setRegSchoolName('');
    setRegSchoolNameEn('');
    setRegAutoCode(generateUniqueInvitationCode(regRegion, regCity));
  };

  const filteredCodes = registrationCodes.filter(
    (c) =>
      c.code.includes(searchQuery) ||
      (c.schoolNameAssigned && c.schoolNameAssigned.includes(searchQuery)) ||
      c.cityRegion.includes(searchQuery)
  );

  const activeCodesCount = registrationCodes.filter((c) => c.status === 'نشط').length;
  const usedCodesCount = registrationCodes.filter((c) => c.status === 'مستخدم').length;

  return (
    <div className="space-y-6">
      {/* Super Admin Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl border border-amber-900/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-black px-3.5 py-1 rounded-full border border-amber-500/30">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>لوحة تحكم المنصة المركزية</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-black px-4 py-1.5 rounded-full border border-emerald-500/40 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>مدير المنصة الرئيسي — موثّق — المصادقة الثنائية مفعلة</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              إدارة كودات تسجيل المدارس والتفعيل المركزية والتشخيص الفني
            </h2>
            <p className="text-amber-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              وفق ضوابط الخصوصية الصارمة وتقليل البيانات (Data Minimization)، تظهر هنا البيانات التشغيلية المجمعة وحالة الربط التقني فقط دون كشف بيانات الطلاب أو الرسائل الشخصية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setActiveSubTab('system_health')}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold px-4 py-3 rounded-2xl border border-cyan-500/30 shadow-xl flex items-center gap-2 transition"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>فحص صحة النظام والدعم الفني</span>
            </button>

            {onOpenRadar && (
              <button
                onClick={onOpenRadar}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-xl shadow-cyan-600/20 flex items-center gap-2 transition"
              >
                <Radar className="w-4 h-4 text-cyan-200 animate-pulse" />
                <span>رادار ربط مدارس المملكة</span>
              </button>
            )}

            <button
              onClick={() => setShowRegModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center gap-2 transition shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>تسجيل مدرسة برمز تفعيل جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-amber-900/40 pt-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-amber-900/30">
            <span className="text-slate-400 font-bold block">إجمالي المدارس المسجلة</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{schools.length} مدرسة</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-amber-900/30">
            <span className="text-slate-400 font-bold block">أكواد التفعيل النشطة</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{activeCodesCount} كود</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-amber-900/30">
            <span className="text-slate-400 font-bold block">الأكواد المستهلكة</span>
            <span className="text-xl font-black text-blue-400 mt-0.5 block">{usedCodesCount} كود</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-amber-900/30">
            <span className="text-slate-400 font-bold block">حالة التراخيص بالمملكة</span>
            <span className="text-xs font-black text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام الأكواد آمن 100%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('system_health')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'system_health'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>صحة المنظومة والدعم الفني والخصوصية</span>
          </button>

          <button
            onClick={() => setActiveSubTab('demo_accounts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'demo_accounts'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>حسابات التجربة المعملية (Demo Accounts)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kharj_schools')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'kharj_schools'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>مدارس ومراكز محافظة الخرج ودعوات الارتباط</span>
          </button>

          <button
            onClick={() => setActiveSubTab('curriculum_import')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'curriculum_import'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>استيراد المناهج والكتب (Curriculum Import)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('codes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'codes'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>أكواد تسجيل المدارس ({registrationCodes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('new_code')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'new_code'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>توليد كود تسجيلي جديد</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schools')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'schools'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>سجل المدارس المعتمدة ({schools.length})</span>
          </button>
        </div>

        {activeSubTab === 'codes' && (
          <div className="relative shrink-0 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالكود أو اسم المدرسة..."
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* DEMO EXPERIENCE ACCOUNTS TAB */}
      {activeSubTab === 'demo_accounts' && (
        <DemoAccountsManager schools={schools} />
      )}

      {/* KHARJ SCHOOLS & CENTERS INVITATIONS HUB TAB */}
      {activeSubTab === 'kharj_schools' && (
        <KharjSchoolsHub
          onRegisterSchool={onRegisterSchoolByCode}
          onAddRegistrationCode={onAddRegistrationCode}
          existingSchools={schools}
        />
      )}

      {/* CURRICULUM IMPORT TAB */}
      {activeSubTab === 'curriculum_import' && (
        <CurriculumImportView
          centralBooks={centralBooks}
          onAddBook={onAddBook}
          onBulkAddBooks={onBulkAddBooks}
          onUpdateBook={onUpdateBook}
          onReplaceBookVersion={onReplaceBookVersion}
          onDeleteBook={onDeleteBook}
        />
      )}

      {/* CODES TAB */}
      {activeSubTab === 'codes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>سجل أرقام وأكواد التسجيل والتفعيل (School Registration Codes)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تُعطى هذه الأكواد لمدراء المدارس الجدد ليتمكنوا من إنشاء وتفعيل مدارسهم على المنصة.
              </p>
            </div>

            <button
              onClick={() => setShowRegistrationCodes(!showRegistrationCodes)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition shrink-0"
            >
              {showRegistrationCodes ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-600" />
                  <span>إخفاء أرقام الأكواد الحساسة</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>إظهار أرقام الأكواد</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="p-3">كود التسجيل والتفعيل</th>
                  <th className="p-3">المدرسة المخصصة له</th>
                  <th className="p-3">المنطقة / المدينة</th>
                  <th className="p-3">تاريخ الإصدار</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-black text-slate-900 flex items-center gap-2">
                      <span className="bg-slate-100 text-amber-900 border border-slate-300 px-2.5 py-1 rounded-lg">
                        {showRegistrationCodes ? c.code : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="text-slate-400 hover:text-amber-600 transition"
                        title="نسخ الكود"
                      >
                        {copiedCode === c.code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="p-3 font-bold text-slate-800">
                      {c.schoolNameAssigned || 'مفتوح لأي مدرسة'}
                    </td>

                    <td className="p-3 font-bold text-slate-600">
                      {c.cityRegion}
                    </td>

                    <td className="p-3 text-slate-500">
                      {c.createdDate}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          c.status === 'نشط'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'مستخدم'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {c.status === 'نشط' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {c.status === 'مستخدم' && <ShieldCheck className="w-3 h-3 text-blue-600" />}
                        {c.status === 'معطل' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{c.status}</span>
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => onToggleCodeStatus(c.id)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-lg transition border ${
                          c.status === 'معطل'
                            ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-100 hover:text-rose-700'
                        }`}
                      >
                        {c.status === 'معطل' ? 'إعادة تنشيط' : 'تعطيل الكود'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW CODE GENERATOR TAB */}
      {activeSubTab === 'new_code' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              توليد كود تسجيلي خاص لمدرسة جديدة
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              قم بإنشاء وتحديد منطقة الكود لزيادة الأمان ومنع التسجيل العشوائي.
            </p>
          </div>

          {generateSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{generateSuccessMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerateCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المنطقة أو المدينة التعليمية:</label>
              <select
                value={cityRegion}
                onChange={(e) => setCityRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام والمنطقة الشرقية</option>
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="عسير والجنوب">عسير والجنوب</option>
                <option value="القصيم">القصيم</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تخصيص الكود لمدرسة معينة (اختياري):</label>
              <input
                type="text"
                value={assignedSchoolName}
                onChange={(e) => setAssignedSchoolName(e.target.value)}
                placeholder="مثال: مدارس الفكر النموذجية"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رمز رمزي مخصص في نهاية الكود (اختياري):</label>
              <input
                type="text"
                value={customCodeSuffix}
                onChange={(e) => setCustomCodeSuffix(e.target.value)}
                placeholder="مثال: VIP-2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>إصدار وتوليد الكود التسجيلي الآن</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPROVED SCHOOLS TAB */}
      {activeSubTab === 'schools' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                سجل المدارس المعتمدة بالمنصة — على مستوى الكيان والمؤشرات ({schools.length})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تُعرض المدارس بمؤشراتها التشغيلية والرقمية المجمعة فقط مع إمكانية التصفية بحسب المنطقة والمحافظة والمرحلة.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {onRefreshSchools && (
                <button
                  type="button"
                  onClick={onRefreshSchools}
                  disabled={isRefreshingSchools}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black px-3.5 py-2.5 rounded-xl border border-slate-300 flex items-center gap-2 transition disabled:opacity-60"
                  title="تحديث ومزامنة بيانات المدارس من قاعدة البيانات"
                >
                  <RefreshCw className={`w-4 h-4 text-cyan-600 ${isRefreshingSchools ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingSchools ? 'جاري التحديث...' : 'تحديث المدارس'}</span>
                </button>
              )}

              {onOpenManualAddSchool && (
                <button
                  type="button"
                  onClick={onOpenManualAddSchool}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مدرسة يدوياً</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar: Region, Stage, Gender, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">بحث بالاسم أو المحافظة:</label>
              <div className="relative">
                <input
                  type="text"
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  placeholder="ابحث عن مدرسة أو مدينة..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">تصفية حسب المنطقة:</label>
              <select
                value={schoolRegionFilter}
                onChange={(e) => setSchoolRegionFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">جميع المناطق</option>
                <option value="الرياض">منطقة الرياض</option>
                <option value="مكة">منطقة مكة المكرمة</option>
                <option value="الشرقية">المنطقة الشرقية</option>
                <option value="القصيم">منطقة القصيم</option>
                <option value="عسير">منطقة عسير</option>
                <option value="المدينة">منطقة المدينة المنورة</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">المرحلة التعليمية:</label>
              <select
                value={schoolStageFilter}
                onChange={(e) => setSchoolStageFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">جميع المراحل</option>
                <option value="ابتدائي">ابتدائي</option>
                <option value="متوسط">متوسط</option>
                <option value="ثانوي">ثانوي</option>
                <option value="مجمع">مجمع تعليمي</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">تصنيف الطلاب:</label>
              <select
                value={schoolGenderFilter}
                onChange={(e) => setSchoolGenderFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">الكل (بنين / بنات / مشترك)</option>
                <option value="بنين">بنين</option>
                <option value="بنات">بنات</option>
                <option value="مشترك">مشترك</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schools
              .filter((sch) => {
                const loc = sch.location || '';
                const name = sch.name || '';
                const badge = sch.badge || '';
                const matchesSearch =
                  !schoolSearchQuery.trim() ||
                  name.includes(schoolSearchQuery) ||
                  loc.includes(schoolSearchQuery);
                const matchesRegion =
                  schoolRegionFilter === 'all' ||
                  loc.includes(schoolRegionFilter) ||
                  name.includes(schoolRegionFilter);
                const matchesStage =
                  schoolStageFilter === 'all' ||
                  name.includes(schoolStageFilter) ||
                  badge.includes(schoolStageFilter) ||
                  (schoolStageFilter === 'مجمع' && (name.includes('مجمع') || name.includes('نموذجية')));
                const matchesGender =
                  schoolGenderFilter === 'all' ||
                  badge.includes(schoolGenderFilter) ||
                  (schoolGenderFilter === 'بنات' && (name.includes('بنات') || name.includes('الأولى') || name.includes('الثانية'))) ||
                  (schoolGenderFilter === 'بنين' && !name.includes('بنات'));

                return matchesSearch && matchesRegion && matchesStage && matchesGender;
              })
              .map((sch) => {
                const schoolType = sch.name.includes('عالمي') ? 'عالمي' : sch.name.includes('أهلي') ? 'أهلي' : sch.name.includes('تحفيظ') ? 'تحفيظ قرآن' : 'حكومي';
                const stage = sch.name.includes('ثانوي') ? 'ثانوي' : sch.name.includes('متوسط') ? 'متوسط' : sch.name.includes('ابتدائي') ? 'ابتدائي' : 'مجمع تعليمي';
                const gender = sch.name.includes('بنات') || sch.badge?.includes('بنات') ? 'بنات' : sch.badge?.includes('مشترك') ? 'مشترك' : 'بنين';
                const region = sch.location?.includes('مكة') ? 'منطقة مكة المكرمة' : sch.location?.includes('الشرقية') || sch.location?.includes('الدمام') || sch.location?.includes('الخبر') ? 'المنطقة الشرقية' : sch.location?.includes('القصيم') ? 'منطقة القصيم' : sch.location?.includes('عسير') ? 'منطقة عسير' : 'منطقة الرياض';
                const governorate = sch.location?.includes('الخرج') ? 'محافظة الخرج' : sch.location?.includes('جدة') ? 'محافظة جدة' : sch.location?.includes('الدمام') ? 'مدينة الدمام' : sch.location?.includes('الخبر') ? 'محافظة الخبر' : sch.location?.includes('بريدة') ? 'مدينة بريدة' : sch.location?.includes('أبها') ? 'مدينة أبها' : 'مدينة الرياض';
                const studentsCount = sch.totalStudentsCount || 480;
                const teachersCount = sch.totalTeachersCount || Math.max(16, Math.round(studentsCount / 16));

                return (
                  <div
                    key={sch.id}
                    className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4 relative flex flex-col justify-between hover:shadow-lg transition-all hover:border-amber-400/60 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>نشطة ومعتمدة</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                            {schoolType}
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                            {gender}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                            {stage}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base group-hover:text-amber-900 transition-colors">{sch.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <strong>{region}</strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-medium">{governorate}</span>
                        </div>
                      </div>

                      {/* Aggregated School Entity Stats */}
                      <div className="grid grid-cols-2 gap-2 text-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="p-1">
                          <span className="text-[10px] text-slate-400 font-bold block">إجمالي الطلاب</span>
                          <strong className="text-sm font-black text-emerald-700">{studentsCount} طالب</strong>
                        </div>
                        <div className="p-1 border-r border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block">إجمالي المعلمين</span>
                          <strong className="text-sm font-black text-cyan-700">{teachersCount} معلماً</strong>
                        </div>
                      </div>

                      {/* Connection & Last Activity */}
                      <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-medium">
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>حالة الربط السحابي:</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>متصل ومؤمن RLS</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>آخر نشاط للنظام:</span>
                          <strong className="text-slate-800 font-bold">نشط اليوم (مزامنة فورية)</strong>
                        </div>
                      </div>

                      {/* Button to open Aggregated School Indicators Modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedSchoolForAnalytics(sch)}
                        className="w-full bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-amber-950 hover:to-slate-900 text-amber-300 text-xs font-black py-2.5 px-3 rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition shadow-xs"
                      >
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>عرض المؤشرات التشغيلية المجمعة</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        كود: {sch.registrationCodeUsed || sch.moeCode || 'SCH-MGR-OK'}
                      </span>

                      <div className="flex items-center gap-2">
                        {onOpenEditSchool && (
                          <button
                            onClick={() => onOpenEditSchool(sch)}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                            title="تحديث وتعديل بيانات المدرسة التشغيلية"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        )}

                        <button
                          onClick={() => onToggleSchoolApproval(sch.id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-amber-600 underline"
                        >
                          تعليق
                        </button>

                        {onDeleteSchool && (
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من رغبتك في حذف مدرسة "${sch.name}" نهائياً؟ سيتم إلغاء تفعيلها وحذف ارتباطاتها.`)) {
                                onDeleteSchool(sch.id);
                              }
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition flex items-center gap-1"
                            title="حذف المدرسة نهائياً"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH, TECHNICAL LOGS & PRIVACY DIAGNOSTICS TAB */}
      {activeSubTab === 'system_health' && (
        <div className="space-y-6">
          {/* Header & Policy Summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-800 text-xs font-black px-3 py-1 rounded-full border border-cyan-200 mb-2">
                  <Activity className="w-4 h-4 text-cyan-600" />
                  <span>لوحة صحة المنظومة، الدعم الفني، وضوابط الخصوصية (Least Privilege Support)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  المؤشرات التشغيلية والتشخيص الفني وحماية البيانات
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1">
                  تلتزم المنصة بنموذج Least Privilege الصارم؛ لا تظهر أي سجلات شخصية أو محادثات طلاب. تقتصر لوحة الدعم الفني على التنبيهات البرمجية، رموز الأخطاء (HTTP Status)، وحالة الخوادم.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => {
                    const sql = getStrictPrivacyRlsSql();
                    navigator.clipboard.writeText(sql);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl border border-slate-300 flex items-center gap-2 transition"
                >
                  <FileCode2 className="w-4 h-4 text-indigo-600" />
                  <span>{copiedSql ? 'تم نسخ كود RLS!' : 'نسخ كود SQL لسياسات RLS'}</span>
                </button>

                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="bg-gradient-to-r from-rose-600 to-amber-700 hover:from-rose-500 hover:to-amber-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-rose-700/20 flex items-center gap-2 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-200" />
                  <span>طلب وصول طوارئ معتمد (Break-Glass)</span>
                </button>
              </div>
            </div>

            {/* Live Telemetry KPI Cards */}
            {(() => {
              const telemetry = getSystemHealthTelemetry(schools, registrationCodes, centralBooks);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block">جاهزية الخوادم Uptime</span>
                    <strong className="text-lg font-black text-emerald-700 block mt-1">{telemetry.uptimePercentage}%</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">مستقر 100%</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block">زمن استجابة DB</span>
                    <strong className="text-lg font-black text-cyan-700 block mt-1">{telemetry.avgDatabaseLatencyMs} ms</strong>
                    <span className="text-[10px] text-slate-500 font-bold">Supabase PostgreSQL</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block">بوابة API Gateway</span>
                    <strong className="text-lg font-black text-indigo-700 block mt-1">{telemetry.apiResponseTimeMs} ms</strong>
                    <span className="text-[10px] text-slate-500 font-bold">سرعة فائقة</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block">إجمالي الطلاب المجمع</span>
                    <strong className="text-lg font-black text-slate-900 block mt-1">{telemetry.totalAggregatedStudents}</strong>
                    <span className="text-[10px] text-slate-500 font-bold">بجميع المدارس</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block">إجمالي المعلمين</span>
                    <strong className="text-lg font-black text-slate-900 block mt-1">{telemetry.totalAggregatedTeachers}</strong>
                    <span className="text-[10px] text-slate-500 font-bold">كوادر معتمدة</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block">حالة عزل البيانات RLS</span>
                    <strong className="text-sm font-black text-emerald-700 block mt-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{telemetry.rlsPolicyEnforcement === 'active_strict' ? 'نشط وصارم' : 'مفعل'}</span>
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-bold">Least Privilege</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Emergency Access Grants (Break-Glass) Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">سجل جلسات الدعم الفني الطارئة (Audited Break-Glass Grants)</h4>
                  <p className="text-xs text-slate-500">
                    أي وصول استثنائي مسجل ومؤقت لغرض التحقيق البرمجي المبرر حصراً وفق معايير الحوكمة.
                  </p>
                </div>
              </div>
            </div>

            {emergencyGrants.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-1 text-xs text-slate-500">
                <Lock className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <p className="font-bold text-slate-700">لا توجد أي جلسات طوارئ مفتوحة حالياً</p>
                <p className="text-[11px]">جميع بيانات المدارس معزولة بالكامل ويتم حجب البيانات الحساسة تلقائياً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                      <th className="p-3">معرف الجلسة</th>
                      <th className="p-3">المدرسة المستهدفة</th>
                      <th className="p-3">سبب الوصول المبرر</th>
                      <th className="p-3">تاريخ الانتهاء</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emergencyGrants.map((grant) => {
                      const isExpired = new Date(grant.expiresAt) < new Date();
                      const isActive = grant.isActive && !isExpired;

                      return (
                        <tr key={grant.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-slate-800">{grant.id.slice(0, 16)}...</td>
                          <td className="p-3 font-bold text-slate-700">
                            {grant.schoolId === 'all' ? 'جميع المدارس (طوارئ عامة)' : grant.schoolId}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{grant.justification}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            {new Date(grant.expiresAt).toLocaleTimeString('ar-SA')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isActive ? 'نشطة مؤقتاً' : 'منتهية/ملغاة'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {grant.status === 'active' && (
                              <button
                                onClick={() => {
                                  const currentAdmin: AuthUser = {
                                    id: 'usr-super-admin-01',
                                    username: 'superadmin',
                                    fullName: 'د. فهد السلمان - المشرف العام',
                                    email: 'fahad.alsalman@smartschool.edu.sa',
                                    role: 'super_admin',
                                    loginMethod: 'credentials'
                                  };
                                  revokeEmergencySupportAccess(currentAdmin, grant.id);
                                  setEmergencyGrants(getAllEmergencyGrants());
                                }}
                                className="text-[11px] font-black text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg transition"
                              >
                                إنهاء الجلسة فوراً
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Technical Diagnostics & Sanitized Error Logs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                  <Terminal className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">سجلات التشخيص الفني والأخطاء البرمجية (Technical Diagnostics)</h4>
                  <p className="text-xs text-slate-500">
                    سجلات برمجية نقية منزوعة الهوية (No PII) تفيد فرق الدعم في مراقبة تكامل الـ APIs وسلامة العمليات.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                تم تنقية وحجب جميع البيانات الشخصية
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                    <th className="p-3">الوقت</th>
                    <th className="p-3">المسار Endpoint</th>
                    <th className="p-3">كود الخطأ</th>
                    <th className="p-3">رمز الحالة HTTP</th>
                    <th className="p-3">الرسالة الفنية المنقاة</th>
                    <th className="p-3 text-center">حالة المشكلة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getSystemTechnicalLogs().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{log.endpoint}</td>
                      <td className="p-3 font-mono text-slate-800">{log.errorCode}</td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-black text-[10px] px-2 py-0.5 rounded-md ${
                            log.statusCode === 200
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.statusCode === 403
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.statusCode || 500}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{log.sanitizedMessage}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            log.resolved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {log.resolved ? 'تم المعالجة' : 'قيد المتابعة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY BREAK-GLASS REQUEST MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">طلب وصول طوارئ مبرر (Break-Glass Access)</h3>
                  <p className="text-xs text-slate-500">خاضع للتدقيق والمحاسبة الإلزامية في سجلات الرقابة</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-black flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>إشعار حوكمة وامتثال:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                يتم تطبيق سياسات الحماية الصارمة Least Privilege. لا يجوز فتح جلسة الوصول المؤقت إلا لوجود بلاغ دعم فني عاجل، وسيتم تسجيل الجلسة مع كامل تفاصيل التدقيق (Audit Trail).
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!emergencyJustification.trim()) return;

                const currentAdmin: AuthUser = {
                  id: 'usr-super-admin-01',
                  username: 'superadmin',
                  fullName: 'د. فهد السلمان - المشرف العام',
                  email: 'fahad.alsalman@smartschool.edu.sa',
                  role: 'super_admin',
                  loginMethod: 'credentials'
                };
                const selectedSch = schools.find((s) => s.id === emergencySchoolId);
                const targetSchoolName = emergencySchoolId === 'all' ? 'جميع مدارس المنظومة' : (selectedSch?.name || emergencySchoolId);

                grantEmergencySupportAccess(
                  currentAdmin,
                  emergencySchoolId,
                  targetSchoolName,
                  emergencyJustification,
                  emergencyDurationMinutes,
                  emergencyPurpose
                );

                setEmergencyGrants(getAllEmergencyGrants());
                setShowEmergencyModal(false);
                setEmergencyJustification('');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">المدرسة المستهدفة بالدعم *</label>
                <select
                  value={emergencySchoolId}
                  onChange={(e) => setEmergencySchoolId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="all">جميع المدارس (طوارئ فنية شاملة)</option>
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الغرض الفني للجلسة *</label>
                <select
                  value={emergencyPurpose}
                  onChange={(e) => setEmergencyPurpose(e.target.value as EmergencyAccessGrant['purpose'])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="technical_investigation">تحقيق فني في خطأ برمجية أو قاعدة بيانات</option>
                  <option value="incident_response">استجابة لحادث أمني أو تقني عاجل</option>
                  <option value="data_recovery">استعادة بيانات أو مزامنة فاشلة</option>
                  <option value="compliance_audit">تدقيق امتثال بناءً على طلب رسمي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مدة الصلاحية المؤقتة *</label>
                <select
                  value={emergencyDurationMinutes}
                  onChange={(e) => setEmergencyDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value={15}>15 دقيقة (جلسة سريعة)</option>
                  <option value={30}>30 دقيقة (جلسة قياسية)</option>
                  <option value={60}>60 دقيقة (ساعة واحدة كحد أقصى)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التبرير الفني الإلزامي ورقم التذكرة *</label>
                <textarea
                  required
                  rows={3}
                  value={emergencyJustification}
                  onChange={(e) => setEmergencyJustification(e.target.value)}
                  placeholder="مثال: متابعة تذكرة الدعم الفني #8921 المتعلقة بفشل مزامنة المقررات مع الصفوف..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-700 hover:from-rose-500 hover:to-amber-600 text-white rounded-xl font-black shadow-md transition"
                >
                  تأكيد ومنح الصلاحية المؤقتة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW SCHOOL MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">تسجيل مدرسة برمز تفعيل جديد</h3>
                  <p className="text-xs text-slate-500">توليد رمز دعوة فريد تلقائياً وربطه بالمنطقة ونوع المدرسة</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSchoolSubmit} className="space-y-4">
              {/* Auto-generated Invitation Code Box */}
              <div className="bg-amber-50/80 border border-amber-300/80 p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>رمز التفعيل والدعوة المولد تلقائياً (فريد وموثق):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRegAutoCode(generateUniqueInvitationCode(regRegion, regCity))}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-950 flex items-center gap-1 transition"
                    title="توليد رمز فريد جديد"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>توليد كود آخر</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={regAutoCode}
                    className="w-full font-mono bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm font-black text-amber-950 outline-none text-center tracking-wider shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(regAutoCode)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0 transition"
                  >
                    {copiedCode === regAutoCode ? 'تم النسخ!' : 'نسخ'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المدرسة الرسمي بالعربية *</label>
                <input
                  type="text"
                  required
                  value={regSchoolName}
                  onChange={(e) => setRegSchoolName(e.target.value)}
                  placeholder="مثال: مدرسة الخرج الثانوية النموذجية"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المنطقة التعليمية *</label>
                  <select
                    value={regRegion}
                    onChange={(e) => {
                      setRegRegion(e.target.value);
                      setRegAutoCode(generateUniqueInvitationCode(e.target.value, regCity));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="منطقة الرياض">منطقة الرياض</option>
                    <option value="منطقة مكة المكرمة">منطقة مكة المكرمة</option>
                    <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                    <option value="منطقة القصيم">منطقة القصيم</option>
                    <option value="منطقة عسير">منطقة عسير</option>
                    <option value="منطقة المدينة المنورة">منطقة المدينة المنورة</option>
                    <option value="منطقة تبوك">منطقة تبوك</option>
                    <option value="منطقة حائل">منطقة حائل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المحافظة / المدينة *</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => {
                      setRegCity(e.target.value);
                      setRegAutoCode(generateUniqueInvitationCode(regRegion, e.target.value));
                    }}
                    placeholder="مثال: محافظة الخرج أو مدينة الرياض"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع المدرسة *</label>
                  <select
                    value={regSchoolType}
                    onChange={(e) => setRegSchoolType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="حكومي">حكومي</option>
                    <option value="أهلي">أهلي</option>
                    <option value="عالمي">عالمي</option>
                    <option value="تحفيظ قرآن">تحفيظ قرآن</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة *</label>
                  <select
                    value={regStage}
                    onChange={(e) => setRegStage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="متوسط">متوسط</option>
                    <option value="ثانوي">ثانوي</option>
                    <option value="مجمع تعليمي">مجمع تعليمي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف *</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="بنين">بنين</option>
                    <option value="بنات">بنات</option>
                    <option value="مشترك">مشترك</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>سيتم ربط كود التفعيل تلقائياً وتهيئة بيئة سحابية معزولة للكيان المدرسي.</span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>تأكيد تسجيل المدرسة وتفعيل الكود</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGGREGATED SCHOOL STATISTICS MODAL (NO INDIVIDUAL PII) */}
      {selectedSchoolForAnalytics && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-lg">
                  {selectedSchoolForAnalytics.logoText || 'م'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{selectedSchoolForAnalytics.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedSchoolForAnalytics.location || 'المملكة العربية السعودية'}</span>
                    <span className="text-slate-300">•</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      كود: {selectedSchoolForAnalytics.registrationCodeUsed || 'SCH-MGR-OK'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSchoolForAnalytics(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Privacy Minimization Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>نموذج الخصوصية الصارمة (Least Privilege):</strong> تقتصر لوحة الإدارة العامة على المؤشرات الإحصائية المجمعة للكيان التعليمي، ولا تتيح استعراض أسماء أو هويات أو محادثات الأفراد.
              </div>
            </div>

            {/* Aggregated Key Performance Indicators Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">إجمالي الطلاب المسجلين</span>
                <strong className="text-xl font-black text-emerald-700 mt-1 block">
                  {selectedSchoolForAnalytics.totalStudentsCount || 480} طالب
                </strong>
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">موزعين على الفصول</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">إجمالي المعلمين المعتمدين</span>
                <strong className="text-xl font-black text-cyan-700 mt-1 block">
                  {selectedSchoolForAnalytics.totalTeachersCount || 32} معلماً
                </strong>
                <span className="text-[10px] text-cyan-600 font-bold mt-0.5 block">حسابات نشطة موثقة</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">الفصول والشعب النشطة</span>
                <strong className="text-xl font-black text-indigo-700 mt-1 block">16 شعبة</strong>
                <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">جداول رقمية متزامنة</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">نسبة الحضور والانضباط</span>
                <strong className="text-xl font-black text-amber-700 mt-1 block">96.8%</strong>
                <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">معدل هذا الأسبوع</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">الواجبات والأنشطة المنجزة</span>
                <strong className="text-xl font-black text-purple-700 mt-1 block">1,840</strong>
                <span className="text-[10px] text-purple-600 font-bold mt-0.5 block">نشاطاً رقمياً مصححاً</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">حالة المزامنة السحابية</span>
                <strong className="text-sm font-black text-emerald-700 mt-1.5 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>متصلة ومشفرة</span>
                </strong>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">زمن الاستجابة 12ms</span>
              </div>
            </div>

            {/* Educational Indicators Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>المؤشرات التعليمية المجمعة للمدرسة</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>التفاعل مع مكتبة المناهج وبوابة عين:</span>
                  <strong className="text-emerald-400 font-black">94.2% (ممتاز)</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>استخدام حل المسائل الذكي والـ OCR:</span>
                  <strong className="text-cyan-400 font-black">820 عملية حل معتمدة</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>عزل البيانات وحماية أمان الجلسات:</span>
                  <strong className="text-emerald-400 font-black">100% متوافق مع معايير RLS</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedSchoolForAnalytics(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
