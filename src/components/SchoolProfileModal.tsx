import React, { useState } from 'react';
import {
  X,
  Building2,
  UserCheck,
  Users,
  GraduationCap,
  BookOpen,
  School,
  MapPin,
  ShieldCheck,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  Activity,
  Calendar,
  Percent,
  Hash,
  Share2,
  Lock
} from 'lucide-react';
import { KharjSchool } from '../data/kharjSchoolsData';
import { RealSchoolStats, SchoolLinkStatus } from '../types';

interface SchoolProfileModalProps {
  school: KharjSchool;
  stats: RealSchoolStats;
  onClose: () => void;
  onUpdateStatus?: (schoolId: string, newStatus: SchoolLinkStatus) => void;
  onSendInvitation?: (schoolId: string) => void;
  userRole?: string;
  isPlatformAdmin?: boolean;
}

const LINK_STATUS_LABELS: Record<SchoolLinkStatus, { label: string; bg: string; text: string; border: string; desc: string }> = {
  draft: {
    label: 'مسودة دعوة',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    desc: 'تم إعداد بيانات المدرسة ولكن لم يتم إرسال دعوة الانضمام بعد.'
  },
  sent: {
    label: 'دعوة مرسلة',
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    desc: 'تم توليد الخطاب وإرسال رمز الدعوة الرقمي لإدارة المدرسة.'
  },
  pending: {
    label: 'بانتظار الاعتماد',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    desc: 'قامت المدرسة بتأكيد الدخول وبانتظار اعتماد الربط الأكاديمي النهائي.'
  },
  linked: {
    label: 'مرتبطة',
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    desc: 'المدرسة مرتبطة حالياً بمنظومة هتاف وتستقبل الحسابات والمقررات.'
  },
  active: {
    label: 'نشطة ومفعلة',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    desc: 'المدرسة تعمل بكامل طاقتها التشغيلية مع تواجد الطلاب والكوادر.'
  },
  suspended: {
    label: 'موقوفة مؤقتاً',
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    desc: 'تم إيقاف ربط المدرسة مؤقتاً بموجب قرار إداري أو صيانة.'
  }
};

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  school,
  stats,
  onClose,
  onUpdateStatus,
  onSendInvitation,
  userRole = 'platform_admin',
  isPlatformAdmin = true
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentStatus = (stats.linkStatus || school.invitationStatus || 'draft') as SchoolLinkStatus;
  const statusCfg = LINK_STATUS_LABELS[currentStatus] || LINK_STATUS_LABELS.draft;

  // Gender terminology
  const isGirls = school.gender === 'بنات' || school.name.includes('بنات');
  const isBoys = school.gender === 'بنين' || school.name.includes('بنين');
  const studentLabel = isGirls ? 'طالبة' : isBoys ? 'طالب' : 'طالب/ـة';
  const teacherLabel = isGirls ? 'معلمة' : isBoys ? 'معلم' : 'معلم/ـة';
  const principalRoleLabel = isGirls ? 'مديرة المدرسة' : isBoys ? 'مدير المدرسة' : 'مدير/مديرة المدرسة';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div
        id={`school-profile-modal-${school.id}`}
        className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none print:p-0"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5 gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-emerald-500/30">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <School className="w-7 h-7 text-emerald-100" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  قطاع {school.center}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {school.stage} ({school.gender})
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {school.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {school.district || 'حي الخالدية'} • {school.city || 'السيح'} • محافظة الخرج • {school.region || 'منطقة الرياض'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-slate-200"
              title="طباعة ملف المدرسة"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Banner */}
        <div className="bg-gradient-to-l from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>ملف التوثيق والربط السحابي المعتمد في منصة هتاف التعليمية</span>
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-50">
              {principalRoleLabel}: {stats.principalName || 'لم يتم تعيين مدير/مديرة'}
            </div>
            <div className="text-xs text-slate-300">
              حالة المنظومة: {statusCfg.desc}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <div className="text-[10px] text-emerald-200 font-bold">نسبة التفعيل الإجمالية</div>
              <div className="text-xl font-black text-emerald-300">{stats.activationRate}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <div className="text-[10px] text-slate-200 font-bold">المستخدمون النشطون</div>
              <div className="text-xl font-black text-white">{stats.activeUsersCount}</div>
            </div>
          </div>
        </div>

        {/* Real Metrics Grid - 4 Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.studentsCount}</div>
            <div className="text-xs font-bold text-slate-600">إجمالي الـ{studentLabel} المسجلين</div>
            <div className="text-[11px] font-semibold text-emerald-600">
              {stats.activeStudentsCount} {studentLabel} نشط
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.teachersCount}</div>
            <div className="text-xs font-bold text-slate-600">إجمالي الـ{teacherLabel}</div>
            <div className="text-[11px] font-semibold text-emerald-600">
              {stats.activeTeachersCount} {teacherLabel} نشط
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.classesCount}</div>
            <div className="text-xs font-bold text-slate-600">عدد الفصول الدراسية</div>
            <div className="text-[11px] font-semibold text-slate-500">
              {stats.classesCount > 0 ? `${stats.classesCount} شعبة مسجلة` : '0 فصول مفعلة'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.parentsCount}</div>
            <div className="text-xs font-bold text-slate-600">أولياء الأمور المرتبطين</div>
            <div className="text-[11px] font-semibold text-slate-500">
              عبر بوابة ولي الأمر
            </div>
          </div>
        </div>

        {/* Detailed Data & Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: البيانات الرسمية والإدارية */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>البيانات الإدارية والمكانية للمدرسة</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">اسم الصرح التعليمي:</span>
                <span className="font-extrabold text-slate-900">{school.name}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{principalRoleLabel}:</span>
                <span className={`font-black ${stats.principalName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {stats.principalName || 'لم يتم تعيين مدير/مديرة'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">المنطقة الإدارية:</span>
                <span className="font-medium text-slate-800">{school.region || 'منطقة الرياض'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">المحافظة:</span>
                <span className="font-medium text-slate-800">{school.governorate || 'محافظة الخرج'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">المدينة / المركز:</span>
                <span className="font-medium text-slate-800">{school.city || school.center || 'السيح'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">الحي:</span>
                <span className="font-medium text-slate-800">{school.district || 'حي الخالدية'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">الرقم الوزاري (MOE):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">
                    {school.moeCode || 'لا يوجد رقم وزاري مسجل'}
                  </span>
                  {school.moeCode && (
                    <button
                      onClick={() => handleCopy(school.moeCode!, 'moe')}
                      className="text-slate-400 hover:text-emerald-700 p-0.5"
                      title="نسخ الرقم الوزاري"
                    >
                      {copiedField === 'moe' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">رمز المدرسة / الدعوة:</span>
                <div className="flex items-center gap-1.5">
                  <code className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                    {school.registrationCode || 'لا يوجد رمز دعوة'}
                  </code>
                  {school.registrationCode && (
                    <button
                      onClick={() => handleCopy(school.registrationCode!, 'code')}
                      className="text-slate-400 hover:text-emerald-700 p-0.5"
                      title="نسخ الرمز"
                    >
                      {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-bold">الرقم المرجعي للدعوة:</span>
                <span className="font-mono font-bold text-slate-700">{school.referenceNumber || 'INV-2026-0001'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: مؤشرات الأداء والتفعيل الحقيقية */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>مؤشرات التفعيل والنشاط الحقيقية</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* تفعيل الطلاب */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>نسبة تفعيل حسابات الـ{studentLabel}:</span>
                  <span className="font-mono text-emerald-700">{stats.studentActivationRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.studentActivationRate))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-left">
                  {stats.activeStudentsCount} مفعل من إجمالي {stats.studentsCount}
                </div>
              </div>

              {/* تفعيل المعلمين */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>نسبة تفعيل حسابات الـ{teacherLabel}:</span>
                  <span className="font-mono text-purple-700">{stats.teacherActivationRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.teacherActivationRate))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-left">
                  {stats.activeTeachersCount} نشط من إجمالي {stats.teachersCount}
                </div>
              </div>

              {/* نسبة الحضور */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-slate-600 font-bold">نسبة الحضور المسجلة:</span>
                <span className="font-bold text-slate-800">
                  {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : 'لا توجد بيانات حضور مسجلة'}
                </span>
              </div>

              {/* آخر نشاط للمدرسة */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-slate-600 font-bold">آخر نشاط مسجل:</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{stats.lastActivity || 'لا يوجد نشاط مسجل'}</span>
                </span>
              </div>

              {/* حالة الربط التفاعلية */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>حالة الربط بالمنصة:</span>
                  <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {statusCfg.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Administrative Status Controller (Platform Admins only) */}
        {isPlatformAdmin && onUpdateStatus && (
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  لوحة تحكم حالة الربط والاعتماد (إدارة المنصة):
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                حفظ فوري في Supabase
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(['draft', 'sent', 'pending', 'linked', 'active', 'suspended'] as SchoolLinkStatus[]).map((st) => {
                const cfg = LINK_STATUS_LABELS[st];
                const isCurrent = currentStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(school.id, st)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition text-center border flex flex-col items-center justify-center gap-0.5 ${
                      isCurrent
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-emerald-500/40 shadow-xs`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    {isCurrent && <span className="text-[9px] text-emerald-700 font-bold">(الحالية)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy and RLS Security Disclaimer */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-emerald-950 text-xs flex items-start gap-2.5 leading-relaxed">
          <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-black">معايير الخصوصية وعزل البيانات (RLS): </span>
            <span>
              جميع الإحصائيات والأرقام المعروضة محتسبة مباشرة من سجلات قاعدة بيانات Supabase الحقيقية. لا يتم عرض أسماء الطلاب أو أرقام الجوال الشخصية للمعلمين أو الإداريين في بطاقات العرض العامة التزاماً بسياسات حماية البيانات وحوكمة المنظومة التعليمية.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 print:hidden">
          <div className="text-xs text-slate-400 font-medium">
            معرّف السجل: <span className="font-mono">{school.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {isPlatformAdmin && onSendInvitation && (
              <button
                onClick={() => onSendInvitation(school.id)}
                className="text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال / إعادة إرسال الدعوة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
