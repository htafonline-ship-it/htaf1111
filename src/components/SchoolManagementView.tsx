import React, { useState, useEffect } from 'react';
import { SchoolTenant, SchoolCircular, CounselingReferral, ModerationAuditLogItem, ParentLinkRequest } from '../types';
import { fetchSchoolParentLinkRequests, reviewParentLinkRequest } from '../lib/supabase';
import { BulkExcelImportView } from './BulkExcelImportView';
import { ReportPdfExportModal } from './ReportPdfExportModal';
import { PrincipalDashboard } from './dashboards/PrincipalDashboard';
import {
  School,
  FileText,
  ShieldAlert,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Building,
  UserCheck,
  Megaphone,
  Sparkles,
  Search,
  Lock,
  EyeOff,
  AlertTriangle,
  UserX,
  Activity,
  Trash2,
  Filter,
  FileSpreadsheet,
  Printer,
  BarChart3,
  Edit3,
  RefreshCw,
  Radar,
  QrCode,
  Zap,
  ChevronDown,
  Users,
  Check,
  XCircle,
  Loader2,
  Phone,
  Mail,
  GraduationCap,
  X,
  AlertCircle,
  Copy
} from 'lucide-react';
import { SchoolServicesManager } from './SchoolServicesManager';

interface SchoolManagementViewProps {
  currentSchool: SchoolTenant;
  referrals: CounselingReferral[];
  auditLogs?: ModerationAuditLogItem[];
  onAddReferral: (referral: CounselingReferral) => void;
  onAddCircular: (circular: SchoolCircular) => void;
  onOpenInviteStudentModal?: () => void;
  onOpenEditSchool?: (school: SchoolTenant) => void;
  onOpenManualAddSchool?: () => void;
  onRefreshSchools?: () => Promise<void> | void;
  isRefreshingSchools?: boolean;
  onOpenRadar?: () => void;
  onOpenSchoolBarcode?: () => void;
  onDeleteSchool?: (schoolId: string) => Promise<void> | void;
  onUpdateSchool?: (updatedSchool: SchoolTenant) => Promise<void> | void;
  allSchools?: SchoolTenant[];
  onSelectSchool?: (school: SchoolTenant) => void;
}

export const SchoolManagementView: React.FC<SchoolManagementViewProps> = ({
  currentSchool,
  referrals,
  auditLogs = [],
  onAddReferral,
  onAddCircular,
  onOpenInviteStudentModal,
  onOpenEditSchool,
  onOpenManualAddSchool,
  onRefreshSchools,
  isRefreshingSchools = false,
  onOpenRadar,
  onOpenSchoolBarcode,
  onDeleteSchool,
  onUpdateSchool,
  allSchools = [],
  onSelectSchool
}) => {
  const [activeTab, setActiveTab] = useState<'principal_dashboard' | 'services' | 'circulars' | 'referrals' | 'audit' | 'bulk_excel' | 'parent_requests'>('principal_dashboard');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmSchoolNameInput, setConfirmSchoolNameInput] = useState('');

  // Parent link requests state
  const [parentRequests, setParentRequests] = useState<ParentLinkRequest[]>([]);
  const [isLoadingParentRequests, setIsLoadingParentRequests] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [parentRequestsFilter, setParentRequestsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [parentRequestsSearch, setParentRequestsSearch] = useState('');
  const [rejectingRequest, setRejectingRequest] = useState<ParentLinkRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const loadParentRequests = async () => {
    if (!currentSchool?.id) return;
    setIsLoadingParentRequests(true);
    try {
      const list = await fetchSchoolParentLinkRequests(currentSchool.id);
      setParentRequests(list);
    } catch (err) {
      console.warn('Error fetching school parent link requests:', err);
    } finally {
      setIsLoadingParentRequests(false);
    }
  };

  useEffect(() => {
    if (currentSchool?.id) {
      loadParentRequests();
    }
  }, [currentSchool?.id]);

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject', customReason?: string) => {
    setReviewingRequestId(requestId);
    setReviewMessage(null);
    try {
      const reviewer = 'إدارة المدرسة';
      const reason = action === 'reject' ? (customReason || 'عدم تطابق بيانات الطالب أو صلة القرابة') : undefined;
      const res = await reviewParentLinkRequest(requestId, action, reviewer, reason);
      setReviewMessage({ success: res.success, text: res.message });
      if (res.success) {
        await loadParentRequests();
        setRejectingRequest(null);
        setRejectionReasonInput('');
      }
    } catch (err: any) {
      setReviewMessage({ success: false, text: err?.message || 'فشلت معالجة الطلب' });
    } finally {
      setReviewingRequestId(null);
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  };

  const [importedStudentsNotice, setImportedStudentsNotice] = useState<number | null>(null);

  // Restricted users state for moderation
  const [restrictedUsers, setRestrictedUsers] = useState<string[]>([
    'طالب مخالف (تم تقييد النشر)'
  ]);
  const [newRestrictName, setNewRestrictName] = useState('');

  // Form states for new circular
  const [showCircularModal, setShowCircularModal] = useState(false);
  const [circTitle, setCircTitle] = useState('');
  const [circContent, setCircContent] = useState('');
  const [circPriority, setCircPriority] = useState<'عاجل' | 'هام' | 'عادي'>('عادي');
  const [circCategory, setCircCategory] = useState<'إداري' | 'اختبارات' | 'نشاط مالي/مدرسي' | 'إرشاد طلابي'>('إداري');

  // PDF Export Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfExportType, setPdfExportType] = useState<'circular_single' | 'circular_all'>('circular_single');
  const [selectedPdfCircular, setSelectedPdfCircular] = useState<SchoolCircular | undefined>(undefined);

  // Form states for new referral
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [refStudentName, setRefStudentName] = useState('');
  const [refGrade, setRefGrade] = useState('الصف الثالث المتوسط');
  const [refCategory, setRefCategory] = useState<'أكاديمي' | 'سلوكي' | 'اجتماعي' | 'غياب وتأخر'>('أكاديمي');
  const [refPriority, setRefPriority] = useState<'عاجل' | 'متوسط' | 'روتيني'>('متوسط');
  const [refReason, setRefReason] = useState('');

  const handleToggleRestrictUser = (name: string) => {
    if (restrictedUsers.includes(name)) {
      setRestrictedUsers(restrictedUsers.filter((u) => u !== name));
    } else {
      setRestrictedUsers([...restrictedUsers, name]);
    }
  };

  const handleAddRestrictUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestrictName.trim()) return;
    setRestrictedUsers([...restrictedUsers, newRestrictName]);
    setNewRestrictName('');
  };

  const handleCreateCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circTitle.trim() || !circContent.trim()) return;

    const newCirc: SchoolCircular = {
      id: `circ-${Date.now()}`,
      title: circTitle,
      number: `ت-2026/${Math.floor(Math.random() * 90 + 10)}`,
      date: new Date().toISOString().split('T')[0],
      priority: circPriority,
      category: circCategory,
      content: circContent,
      targetAudience: 'الجميع'
    };

    onAddCircular(newCirc);
    setCircTitle('');
    setCircContent('');
    setShowCircularModal(false);
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refStudentName.trim() || !refReason.trim()) return;

    const newRef: CounselingReferral = {
      id: `ref-${Date.now()}`,
      studentName: refStudentName,
      grade: refGrade,
      referrerName: 'أ. عبد الله العتيبي (معلم الصف)',
      referrerRole: 'معلم',
      date: new Date().toISOString().split('T')[0],
      category: refCategory,
      priority: refPriority,
      status: 'جديد',
      reason: refReason,
      confidentialNotes: [],
      actionPlan: ''
    };

    onAddReferral(newRef);
    setRefStudentName('');
    setRefReason('');
    setShowReferralModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* School Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            {currentSchool.logoText}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">{currentSchool.name}</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {currentSchool.badge}
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1">{currentSchool.motto}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
              <span>📍 {currentSchool.location}</span>
              <span>• الرابط المخصص (Slug): /school/{currentSchool.slug}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
          {onOpenRadar && (
            <button
              onClick={onOpenRadar}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Radar className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>رادار ربط المدارس</span>
            </button>
          )}

          {onRefreshSchools && (
            <button
              onClick={onRefreshSchools}
              disabled={isRefreshingSchools}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition disabled:opacity-60"
              title="تحديث ومزامنة بيانات المدارس"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingSchools ? 'animate-spin' : ''}`} />
              <span>{isRefreshingSchools ? 'جاري التحديث...' : 'تحديث المدارس'}</span>
            </button>
          )}

          {onOpenEditSchool && (
            <button
              onClick={() => onOpenEditSchool(currentSchool)}
              className="bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تحديث بيانات المدرسة</span>
            </button>
          )}

          {onOpenManualAddSchool && (
            <button
              onClick={onOpenManualAddSchool}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مدرسة يدوياً</span>
            </button>
          )}

          {onOpenSchoolBarcode && (
            <button
              onClick={onOpenSchoolBarcode}
              className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
              title="عرض وتنزيل باركود المدرسة الذكي"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>باركود المدرسة</span>
            </button>
          )}

          {/* School Selector Dropdown if multiple schools */}
          {allSchools && allSchools.length > 1 && onSelectSchool && (
            <div className="relative inline-block">
              <select
                value={currentSchool.id}
                onChange={(e) => {
                  const target = allSchools.find(s => s.id === e.target.value);
                  if (target) onSelectSchool(target);
                }}
                className="bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 outline-none cursor-pointer hover:bg-slate-750 transition"
              >
                {allSchools.map(sch => (
                  <option key={sch.id} value={sch.id}>
                    🏫 {sch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Delete School Button */}
          {onDeleteSchool && (
            <button
              onClick={() => {
                setConfirmSchoolNameInput('');
                setShowDeleteConfirm(true);
              }}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition"
              title="حذف المدرسة وإلغاء تسجيلها من المنصة"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>حذف المدرسة</span>
            </button>
          )}

          <button
            onClick={() => setShowCircularModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>تعميم مدرسي</span>
          </button>

          <button
            onClick={() => setShowReferralModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>إحالة طلابية</span>
          </button>

          <button
            onClick={() => setActiveTab('parent_requests')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition ${
              activeTab === 'parent_requests'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
            }`}
            title="مراجعة طلبات ربط أولياء الأمور بالأبناء"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>طلبات أولياء الأمور</span>
            {parentRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px] font-black animate-pulse">
                {parentRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('principal_dashboard')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'principal_dashboard'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>لوحة مؤشرات مدير المدرسة</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-600" />
          <span>إدارة وإلغاء خدمات المدرسة</span>
        </button>

        <button
          onClick={() => setActiveTab('circulars')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'circulars'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>التعاميم المدرسية الرسمية ({currentSchool.circulars.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'referrals'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>طلبات الإحالة للموجه الطلابي ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk_excel')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bulk_excel'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>استيراد الطلاب بالجملة (Excel)</span>
        </button>

        <button
          id="school-mgmt-tab-parent-requests"
          onClick={() => setActiveTab('parent_requests')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'parent_requests'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>طلبات ربط أولياء الأمور</span>
          {parentRequests.filter((r) => r.status === 'pending').length > 0 ? (
            <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px] font-black animate-pulse">
              {parentRequests.filter((r) => r.status === 'pending').length} معلق
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-[10px] font-bold">
              {parentRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>سجل الرقابة والأمن الرقمي ({auditLogs.length})</span>
        </button>
      </div>

      {/* SERVICES MANAGEMENT TAB */}
      {activeTab === 'services' && (
        <SchoolServicesManager
          school={currentSchool}
          onSchoolUpdated={(updated) => {
            if (onUpdateSchool) onUpdateSchool(updated);
          }}
        />
      )}

      {/* PRINCIPAL DASHBOARD TAB */}
      {activeTab === 'principal_dashboard' && (
        <PrincipalDashboard
          currentSchool={currentSchool}
          referrals={referrals}
          auditLogs={auditLogs}
          onAddReferral={onAddReferral}
          onAddCircular={onAddCircular}
          onOpenInviteStudentModal={onOpenInviteStudentModal}
          onOpenSchoolBarcode={onOpenSchoolBarcode}
        />
      )}

      {/* BULK EXCEL IMPORT TAB */}
      {activeTab === 'bulk_excel' && (
        <BulkExcelImportView
          currentSchool={currentSchool}
          onImportSuccess={(cnt) => setImportedStudentsNotice(cnt)}
        />
      )}

      {/* CIRCULARS TAB */}
      {activeTab === 'circulars' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              التعاميم المدرسية الصادرة للطلاب وأولياء الأمور
            </h3>

            {currentSchool.circulars.length > 0 && (
              <button
                onClick={() => {
                  setPdfExportType('circular_all');
                  setSelectedPdfCircular(undefined);
                  setShowPdfModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>تصدير تقرير التعاميم الشامل (PDF)</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {currentSchool.circulars.map((circ) => (
              <div
                key={circ.id}
                className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-3 hover:border-emerald-300 transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        circ.priority === 'عاجل'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : circ.priority === 'هام'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {circ.priority}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{circ.number}</span>
                    <span className="text-xs text-slate-400">• {circ.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      الفئة: {circ.category}
                    </span>

                    <button
                      onClick={() => {
                        setPdfExportType('circular_single');
                        setSelectedPdfCircular(circ);
                        setShowPdfModal(true);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 transition"
                      title="تصدير هذا التعميم بتنسيق PDF رسمي"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تصدير PDF</span>
                    </button>
                  </div>
                </div>

                <h4 className="font-extrabold text-slate-900 text-base">{circ.title}</h4>
                <p className="text-slate-700 text-xs leading-relaxed">{circ.content}</p>

                {circ.attachedDocName && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>الملف المرفق بالتعميم: {circ.attachedDocName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                سجل المتابعة والأمن الرقمي الإداري (Audit Log)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                رصد تلقائي لعمليات الفلترة الآلية، أحداث حذف المحتوى المخالف، وتقييد نشر الحسابات.
              </p>
            </div>

            {/* Restrict student quick control */}
            <form onSubmit={handleAddRestrictUserSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newRestrictName}
                onChange={(e) => setNewRestrictName(e.target.value)}
                placeholder="اسم الطالب المقيد..."
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>تقييد النشر</span>
              </button>
            </form>
          </div>

          {/* Restricted Users Pill List */}
          {restrictedUsers.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200/80 p-4 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>قائمة الطلاب المقيدين مؤقتاً من غرف المذاكرة والنشر ({restrictedUsers.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {restrictedUsers.map((usr, i) => (
                  <span
                    key={i}
                    className="bg-white text-rose-900 border border-rose-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <span>{usr}</span>
                    <button
                      onClick={() => handleToggleRestrictUser(usr)}
                      title="إلغاء التقييد"
                      className="text-rose-400 hover:text-emerald-600 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audit Logs Feed */}
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    log.severity === 'عالي'
                      ? 'bg-rose-100 text-rose-700'
                      : log.severity === 'متوسط'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{log.action}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        بواسطة: {log.actorName}
                      </span>
                      {log.targetUser && (
                        <span className="text-[10px] bg-rose-50 text-rose-800 px-2 py-0.5 rounded font-bold border border-rose-100">
                          المستهدف: {log.targetUser}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700">{log.details}</p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARENT LINK REQUESTS TAB */}
      {activeTab === 'parent_requests' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    طلبات ربط أولياء الأمور بالأبناء
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    مراجعة واعتماد طلبات ربط أولياء الأمور الحقيقية (parent_link_requests) وتحديث الحالة مباشرة في Supabase
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadParentRequests}
                disabled={isLoadingParentRequests}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingParentRequests ? 'animate-spin' : ''}`} />
                <span>تحديث الطلبات</span>
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {reviewMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                reviewMessage.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {reviewMessage.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{reviewMessage.text}</span>
              </div>
              <button
                onClick={() => setReviewMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Bar */}
          {(() => {
            const pendingCount = parentRequests.filter((r) => r.status === 'pending').length;
            const approvedCount = parentRequests.filter((r) => r.status === 'approved').length;
            const rejectedCount = parentRequests.filter((r) => r.status === 'rejected').length;
            const totalCount = parentRequests.length;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setParentRequestsFilter('pending')}
                  className={`p-4 rounded-2xl border text-right transition ${
                    parentRequestsFilter === 'pending'
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-sm ring-2 ring-amber-500/30'
                      : 'bg-amber-50/60 border-amber-200/70 hover:bg-amber-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-amber-800">قيد المراجعة والاعتماد</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-950 flex items-center gap-2">
                    <span>{pendingCount}</span>
                    {pendingCount > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 animate-pulse">
                        جديد
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setParentRequestsFilter('approved')}
                  className={`p-4 rounded-2xl border text-right transition ${
                    parentRequestsFilter === 'approved'
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-emerald-50/60 border-emerald-200/70 hover:bg-emerald-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-emerald-800">تم الاعتماد والربط</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-950">{approvedCount}</div>
                </button>

                <button
                  onClick={() => setParentRequestsFilter('rejected')}
                  className={`p-4 rounded-2xl border text-right transition ${
                    parentRequestsFilter === 'rejected'
                      ? 'bg-rose-500/15 border-rose-500/60 shadow-sm ring-2 ring-rose-500/30'
                      : 'bg-rose-50/60 border-rose-200/70 hover:bg-rose-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-rose-800">طلبات مرفوضة</span>
                    <XCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-950">{rejectedCount}</div>
                </button>

                <button
                  onClick={() => setParentRequestsFilter('all')}
                  className={`p-4 rounded-2xl border text-right transition ${
                    parentRequestsFilter === 'all'
                      ? 'bg-slate-800 text-white border-slate-700 shadow-sm ring-2 ring-slate-400/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold ${parentRequestsFilter === 'all' ? 'text-slate-200' : 'text-slate-600'}`}>
                      إجمالي الطلبات
                    </span>
                    <Users className={`w-4 h-4 ${parentRequestsFilter === 'all' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                  <div className={`text-2xl font-black ${parentRequestsFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>
                    {totalCount}
                  </div>
                </button>
              </div>
            );
          })()}

          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
              <button
                onClick={() => setParentRequestsFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  parentRequestsFilter === 'pending'
                    ? 'bg-white text-amber-800 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>قيد المراجعة</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800">
                  {parentRequests.filter((r) => r.status === 'pending').length}
                </span>
              </button>

              <button
                onClick={() => setParentRequestsFilter('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  parentRequestsFilter === 'approved'
                    ? 'bg-white text-emerald-800 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>المعتمدة</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800">
                  {parentRequests.filter((r) => r.status === 'approved').length}
                </span>
              </button>

              <button
                onClick={() => setParentRequestsFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  parentRequestsFilter === 'rejected'
                    ? 'bg-white text-rose-800 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>المرفوضة</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-100 text-rose-800">
                  {parentRequests.filter((r) => r.status === 'rejected').length}
                </span>
              </button>

              <button
                onClick={() => setParentRequestsFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  parentRequestsFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>الكل</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-800">
                  {parentRequests.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم ولي الأمر أو الطالب..."
                value={parentRequestsSearch}
                onChange={(e) => setParentRequestsSearch(e.target.value)}
                className="w-full pl-8 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition"
              />
              {parentRequestsSearch && (
                <button
                  onClick={() => setParentRequestsSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Requests Cards List */}
          {isLoadingParentRequests ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="font-bold">جاري تحميل طلبات أولياء الأمور من Supabase...</span>
            </div>
          ) : (() => {
            const filtered = parentRequests.filter((req) => {
              if (parentRequestsFilter !== 'all' && req.status !== parentRequestsFilter) {
                return false;
              }
              if (parentRequestsSearch.trim()) {
                const q = parentRequestsSearch.trim().toLowerCase();
                const pName = (req.parentName || '').toLowerCase();
                const sName = (req.studentName || '').toLowerCase();
                const pPhone = (req.parentPhone || '').toLowerCase();
                const pEmail = (req.parentEmail || '').toLowerCase();
                const sNum = (req.studentNumber || '').toLowerCase();
                return pName.includes(q) || sName.includes(q) || pPhone.includes(q) || pEmail.includes(q) || sNum.includes(q);
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="py-14 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-3xl p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="font-extrabold text-slate-700 text-sm">
                    {parentRequestsSearch
                      ? 'لا توجد طلبات مطابقة للبحث'
                      : parentRequestsFilter === 'pending'
                      ? 'لا توجد طلبات ربط معلقة حالياً'
                      : 'لا توجد طلبات مسجلة في هذا القسم'}
                  </div>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    {parentRequestsFilter === 'pending'
                      ? 'جميع طلبات أولياء الأمور تمت مراجعتها واعتمادها أو رفضها.'
                      : 'عند قيام ولي أمر بالبحث عن ابنه وإرسال طلب ربط، سيظهر هنا مباشرة.'}
                  </p>
                  {parentRequestsSearch && (
                    <button
                      onClick={() => setParentRequestsSearch('')}
                      className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                    >
                      إلغاء تصفية البحث
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filtered.map((req) => {
                  const isReviewing = reviewingRequestId === req.id;
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  const relationLabel =
                    req.relationship === 'mother' ? 'أم' : req.relationship === 'guardian' ? 'ولي أمر معتمد' : 'أب';

                  return (
                    <div
                      key={req.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-gradient-to-r from-amber-50/40 via-white to-white border-amber-300 shadow-sm'
                          : isApproved
                          ? 'bg-white border-slate-200 hover:border-emerald-200'
                          : 'bg-slate-50/70 border-slate-200 opacity-90'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Parent & Student Details */}
                        <div className="space-y-3 flex-1">
                          {/* Parent info line */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-black text-slate-900 text-base">
                              {req.parentName}
                            </span>
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                              صلة القرابة: {relationLabel}
                            </span>

                            {isPending && (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                <span>بانتظار الاعتماد</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>معتمد وموثق</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300/80 flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>مرفوض</span>
                              </span>
                            )}
                          </div>

                          {/* Contact details */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            {req.parentPhone && (
                              <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <a href={`tel:${req.parentPhone}`} className="hover:text-emerald-700" dir="ltr">
                                  {req.parentPhone}
                                </a>
                                <button
                                  onClick={() => handleCopyPhone(req.id, req.parentPhone!)}
                                  className="text-slate-400 hover:text-slate-600 mr-1"
                                  title="نسخ رقم الجوال"
                                >
                                  {copiedPhoneId === req.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}

                            {req.parentEmail && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <a href={`mailto:${req.parentEmail}`} className="hover:underline" dir="ltr">
                                  {req.parentEmail}
                                </a>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <span>تاريخ الطلب:</span>
                              <span dir="ltr">{new Date(req.createdAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>

                          {/* Targeted Student Box */}
                          <div className="bg-slate-100/90 rounded-xl p-3 border border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-slate-500">الطالب المستهدف:</span>
                              <strong className="text-slate-900 font-black text-sm">
                                {req.studentName || 'طالب مسجل'}
                              </strong>
                            </div>

                            {req.studentNumber && (
                              <div className="text-slate-600">
                                <span className="text-slate-400">رقم الطالب / الهوية: </span>
                                <span className="font-mono font-bold">{req.studentNumber}</span>
                              </div>
                            )}

                            {req.gradeName && (
                              <div className="text-slate-600">
                                <span className="text-slate-400">الصف: </span>
                                <span className="font-bold">{req.gradeName}</span>
                              </div>
                            )}

                            {req.classroomName && (
                              <div className="text-slate-600">
                                <span className="text-slate-400">الفصل: </span>
                                <span className="font-bold">{req.classroomName}</span>
                              </div>
                            )}
                          </div>

                          {/* Review Details / Rejection Reason */}
                          {req.rejectionReason && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-black">سبب الرفض المسجل: </span>
                                <span>{req.rejectionReason}</span>
                              </div>
                            </div>
                          )}

                          {req.reviewedBy && isApproved && (
                            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تم التوثيق والاعتماد بواسطة {req.reviewedBy}</span>
                              {req.reviewedAt && (
                                <span className="text-slate-400" dir="ltr">
                                  ({new Date(req.reviewedAt).toLocaleDateString('ar-SA')})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="shrink-0 flex items-center gap-2 self-end lg:self-center">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleReviewRequest(req.id, 'approve')}
                                disabled={isReviewing}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                                title="اعتماد الربط وتوثيقه في قاعدة البيانات"
                              >
                                {isReviewing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span>اعتماد وتوثيق الربط</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingRequest(req);
                                  setRejectionReasonInput('');
                                }}
                                disabled={isReviewing}
                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5 transition disabled:opacity-50"
                                title="رفض الطلب مع تحديد السبب"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>رفض</span>
                              </button>
                            </>
                          ) : isApproved ? (
                            <div className="text-center">
                              <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-100/90 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>معتمد في Supabase</span>
                              </span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-100/90 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span>مرفوض</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>رفض طلب ربط ولي الأمر</span>
              </h3>
              <button
                onClick={() => setRejectingRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">ولي الأمر: </span>
                <strong className="text-slate-900">{rejectingRequest.parentName}</strong>
              </div>
              <div>
                <span className="text-slate-500">الطالب المطلوب ربطه: </span>
                <strong className="text-slate-900">{rejectingRequest.studentName || 'طالب مسجل'}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                حدد سبب الرفض (سيظهر في حساب ولي الأمر):
              </label>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  'عدم تطابق بيانات الطالب مع السجل المدني',
                  'صلة القرابة غير مثبتة بالسجلات المدرسية',
                  'رقم الهاتف لا يطابق المسجل في ملف الطالب',
                  'يرجى مراجعة إدارة المدرسة شخصياً لمطابقة الأوراق'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReasonInput(reason)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border text-right transition ${
                      rejectionReasonInput === reason
                        ? 'bg-rose-100 border-rose-300 text-rose-900 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="أو اكتب سبب الرفض بالتفصيل هنا..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => handleReviewRequest(rejectingRequest.id, 'reject', rejectionReasonInput)}
                disabled={reviewingRequestId === rejectingRequest.id}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                {reviewingRequestId === rejectingRequest.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>تأكيد الرفض وتحديث Supabase</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showCircularModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              إصدار تعميم مدرسي جديد
            </h3>

            <form onSubmit={handleCreateCircular} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان التعميم</label>
                <input
                  type="text"
                  value={circTitle}
                  onChange={(e) => setCircTitle(e.target.value)}
                  placeholder="مثال: الخطة الزمنية لاختبارات الشهر"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">درجة الأهمية</label>
                  <select
                    value={circPriority}
                    onChange={(e) => setCircPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  >
                    <option value="عادي">عادي</option>
                    <option value="هام">هام</option>
                    <option value="عاجل">عاجل جداً</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الفئة</label>
                  <select
                    value={circCategory}
                    onChange={(e) => setCircCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  >
                    <option value="إداري">إداري</option>
                    <option value="اختبارات">اختبارات</option>
                    <option value="إرشاد طلابي">إرشاد طلابي</option>
                    <option value="نشاط مالي/مدرسي">نشاط مالي/مدرسي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نص التعميم الرسمي</label>
                <textarea
                  rows={4}
                  value={circContent}
                  onChange={(e) => setCircContent(e.target.value)}
                  placeholder="اكتب تفاصيل التعميم والتعليمات الموجهة لجميع الفئات..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCircularModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow"
                >
                  نشر التعميم الرسمي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW REFERRAL MODAL */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-600" />
              رفع طلب إحالة للموجه الطلابي (Confidential)
            </h3>

            <form onSubmit={handleCreateReferral} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم الطالب رباعياً</label>
                <input
                  type="text"
                  value={refStudentName}
                  onChange={(e) => setRefStudentName(e.target.value)}
                  placeholder="مثال: أحمد خالد العتيبي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الصف والشعبة</label>
                  <input
                    type="text"
                    value={refGrade}
                    onChange={(e) => setRefGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تصنيف الحالة</label>
                  <select
                    value={refCategory}
                    onChange={(e) => setRefCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  >
                    <option value="أكاديمي">أكاديمي وتراجع تحصيلي</option>
                    <option value="سلوكي">سلوكي وانضباطي</option>
                    <option value="اجتماعي">اجتماعي ونفسي</option>
                    <option value="غياب وتأخر">غياب وتأخر صباحي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">سبب الإحالة والملاحظات السريّة</label>
                <textarea
                  rows={4}
                  value={refReason}
                  onChange={(e) => setRefReason(e.target.value)}
                  placeholder="اذكر الملاحظات السلوكية أو الأكاديمية بدقة لإرسالها للموجّه الطلابي..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow"
                >
                  إرسال الإحالة سرّياً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SCHOOL CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-rose-900/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-white">تأكيد حذف المدرسة نهائياً</h3>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                أنت على وشك حذف مدرسة <strong className="text-white underline">{currentSchool.name}</strong> من المنصة وقاعدة البيانات السحابية.
              </p>
              <div className="bg-rose-950/40 border border-rose-900/40 p-3 rounded-xl text-[11px] text-rose-300 text-right space-y-1">
                <p>• سيتم تعطيل حسابات الدخول المرتبطة بالمدرسة.</p>
                <p>• سيتم أرشفة بيانات الفصول والتعاميم والخدمات.</p>
                <p>• لا يمكن التراجع عن هذا الإجراء دون التواصل مع الدعم الفني.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                للتأكيد، اكتب اسم المدرسة أو كلمة <span className="text-rose-400 font-mono">حذف</span>:
              </label>
              <input
                type="text"
                value={confirmSchoolNameInput}
                onChange={(e) => setConfirmSchoolNameInput(e.target.value)}
                placeholder="اكتب كلمة 'حذف' هنا..."
                className="w-full bg-[#070e22] border border-rose-900/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-rose-500 text-center"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-blue-900/40">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                disabled={isDeleting || (confirmSchoolNameInput.trim() !== 'حذف' && confirmSchoolNameInput.trim() !== currentSchool.name.trim())}
                onClick={async () => {
                  if (onDeleteSchool) {
                    setIsDeleting(true);
                    try {
                      await onDeleteSchool(currentSchool.id);
                      setShowDeleteConfirm(false);
                    } catch (e) {
                      console.error('Failed deleting school:', e);
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PDF EXPORT MODAL */}
      <ReportPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        type={pdfExportType}
        circular={selectedPdfCircular}
        school={currentSchool}
        circulars={currentSchool.circulars}
      />
    </div>
  );
};
