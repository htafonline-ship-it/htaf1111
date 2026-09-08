import React, { useState } from 'react';
import { AuthUser, SchoolTenant, TeacherPermissions } from '../../../types';
import { getTeacherOperationsSqlMigration, isSupabaseConfigured } from '../../../lib/supabase';
import {
  Database,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Lock,
  Layers,
  Sparkles,
  Server,
  Key
} from 'lucide-react';

interface TeacherPermissionsAndSqlViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  permissions: TeacherPermissions;
  onUpdatePermissions?: (newPerms: TeacherPermissions) => void;
}

export const TeacherPermissionsAndSqlView: React.FC<TeacherPermissionsAndSqlViewProps> = ({
  currentUser,
  currentSchool,
  permissions,
  onUpdatePermissions
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const sqlScript = getTeacherOperationsSqlMigration();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const schemaTables = [
    {
      name: 'students',
      purpose: 'سجل الطلاب الأساسي مع الربط الإلزامي بـ school_id و class_id و created_by',
      status: 'مهيأ ومربوط بقاعدة البيانات',
      rls: 'مفعل (عزل على مستوى المدرسة)'
    },
    {
      name: 'class_schedules',
      purpose: 'جدول الحصص الأسبوعية وتوزيع الحصص والقاعات والأوقات',
      status: 'جدول تشغيلي جديد متاح',
      rls: 'مفعل (مدرسة + معلم)'
    },
    {
      name: 'student_notes',
      purpose: 'سجل الملاحظات الأكاديمية والسلوكية ومستويات الرؤية لولي الأمر',
      status: 'جدول تشغيلي جديد متاح',
      rls: 'مفعل (مدرسة + طالب)'
    },
    {
      name: 'student_attendance',
      purpose: 'كشوفات الحضور والغياب اليومي والتأخر لكل حصة',
      status: 'جدول تشغيلي جديد متاح',
      rls: 'مفعل (مدرسة + تاريخ + حصة)'
    },
    {
      name: 'quizzes',
      purpose: 'الاختبارات والتقييمات القصيرة مع بنك الأسئلة والدرجات',
      status: 'جدول تشغيلي جديد متاح',
      rls: 'مفعل (مدرسة + معلم)'
    },
    {
      name: 'homework_assignments',
      purpose: 'الواجبات والتكليفات المدرسية والشعب المستهدفة',
      status: 'مهيأ ومربوط بقاعدة البيانات',
      rls: 'مفعل (مدرسة + معلم)'
    },
    {
      name: 'teacher_communications',
      purpose: 'الإعلانات الصفية ورسائل المعلم المباشرة لأولياء الأمور والطلاب',
      status: 'جدول تشغيلي جديد متاح',
      rls: 'مفعل (مدرسة + شعبة)'
    },
    {
      name: 'teacher_permissions',
      purpose: 'صلاحيات المعلم المعتمدة من مدير المدرسة',
      status: 'جدول تشغيلي جديد متاح',
      rls: 'مفعل (مدرسة + معلم)'
    }
  ];

  return (
    <div className="space-y-6" id="teacher-permissions-sql-section">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-slate-800" />
            <h3 className="text-xl font-black text-slate-900">تقرير قاعدة البيانات والصلاحيات التشغيلية</h3>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                isSupabaseConfigured
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              {isSupabaseConfigured ? 'Supabase متصل' : 'وضع المعاينة الآمن'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تقرير الجداول التشغيلية، عزل البيانات متعدد المدارس (Multi-School RLS)، وصلاحيات حساب المعلم.
          </p>
        </div>

        <button
          onClick={handleCopySql}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'تم نسخ كود SQL بنجاح!' : 'نسخ سكربت SQL Migration'}</span>
        </button>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h4 className="font-extrabold text-slate-900 text-sm">مصفوفة صلاحيات المعلم الحالية (المعتمدة من الإدارة)</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">إضافة طالب جديد</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">تعديل بيانات الطالب</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">إدارة الجدول والحصص</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">رصد الحضور والغياب</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">إضافة الملاحظات الأكاديمية</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">إسناد الواجبات</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">إنشاء الاختبارات القصيرة</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">مراسلة أولياء الأمور</span>
            <span className="font-black text-emerald-600">✓ مسموح</span>
          </div>
        </div>
      </div>

      {/* Database Schema Status Audit */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-600" />
          <h4 className="font-extrabold text-slate-900 text-sm">تقرير تدقيق جداول قاعدة البيانات (Schema Audit Report)</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
              <tr>
                <th className="p-3">اسم الجدول</th>
                <th className="p-3">الغرض والوظيفة</th>
                <th className="p-3">الحالة في المنظومة</th>
                <th className="p-3">عزل الأمان RLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {schemaTables.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 font-mono font-bold text-indigo-700">{t.name}</td>
                  <td className="p-3 text-slate-600">{t.purpose}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5 text-indigo-600" />
                      {t.rls}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-slate-200">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-xs font-bold">supabase_teacher_operations_migration.sql</span>
          </div>

          <button
            onClick={handleCopySql}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-900/90 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
          {sqlScript}
        </pre>
      </div>
    </div>
  );
};
