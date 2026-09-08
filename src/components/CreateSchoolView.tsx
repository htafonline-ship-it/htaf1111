import React, { useState } from 'react';
import { createSupabaseSchool, DbSchool } from '../lib/supabase';
import { AuthUser } from '../types';
import {
  Building2,
  CheckCircle2,
  Globe,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Award,
  Link as LinkIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface CreateSchoolViewProps {
  currentUser?: AuthUser | null;
  user?: AuthUser | null;
  onSuccess?: (school: DbSchool) => void;
  onSchoolCreated?: (school: DbSchool) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const CreateSchoolView: React.FC<CreateSchoolViewProps> = ({
  currentUser: propCurrentUser,
  user: propUser,
  onSuccess,
  onSchoolCreated,
  onCancel,
  onClose
}) => {
  const activeUser = propCurrentUser || propUser;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('مدارس هتاف العالمية');
  const [type, setType] = useState('عالمية'); // حكومية / أهلية / عالمية
  const [genderType, setGenderType] = useState('مشتركة'); // بنين / بنات / مشتركة
  const [stage, setStage] = useState('مجمع تعليمي (جميع المراحل)'); // ابتدائي / متوسط / ثانوي / مجمع
  const [country, setCountry] = useState('المملكة العربية السعودية');
  const [region, setRegion] = useState('منطقة الرياض');
  const [city, setCity] = useState('الرياض');
  const [principalName, setPrincipalName] = useState(activeUser?.fullName || 'أحمد العاصمي');
  const [phone, setPhone] = useState('0500000000');
  const [email, setEmail] = useState(activeUser?.email || 'admin@hataf.edu.sa');
  const [licenseNumber, setLicenseNumber] = useState('LIC-2026-9901');
  const [academicYear, setAcademicYear] = useState('1447 - 1448 هـ (2026/2027م)');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150');
  const [slug, setSlug] = useState('hataf-school');

  const handleCloseView = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const handleCreatedView = (school: DbSchool) => {
    if (onSuccess) onSuccess(school);
    if (onSchoolCreated) onSchoolCreated(school);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const formattedSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');

      const { school } = await createSupabaseSchool(
        {
          name,
          type,
          gender_type: genderType,
          stage,
          country,
          region,
          city,
          principal_name: principalName,
          phone,
          email,
          license_number: licenseNumber,
          academic_year: academicYear,
          logo_url: logoUrl,
          slug: formattedSlug,
        },
        activeUser?.id || 'admin-user',
        activeUser?.email || email || 'admin@hataf.edu.sa',
        activeUser?.fullName || principalName || 'مدير المدرسة'
      );

      handleCreatedView(school);
    } catch (err: any) {
      console.error('Error creating school:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ سجل المدرسة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 dir-rtl flex items-center justify-center">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-8 p-6 sm:p-10 my-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-600/20 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-300 inline-block mb-1">
                تسجيل واعتماد مدرسة جديدة
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">إنشاء وتأسيس مدرسة جديدة بالمنصة</h2>
              <p className="text-xs text-slate-500 mt-1">
                إدخال بيانات المدرسة لتفعيل لوحة التحكم والروابط المخصصة
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseView}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold space-y-1">
            <span className="block font-black text-rose-950">⚠️ تنبيه خطأ في الحفظ:</span>
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic School Identity */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>هوية وبيانات المدرسة الأساسية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  اسم المدرسة <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مدارس هتاف العالمية"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  اسم رابط المدرسة المطلوب (Domain Slug) <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="hataf-school"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono dir-ltr text-left"
                  />
                  <span className="text-xs text-slate-400 font-mono font-bold shrink-0 dir-ltr">
                    .platform.com
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">نوع المدرسة</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="عالمية">عالمية</option>
                  <option value="أهلية">أهلية</option>
                  <option value="حكومية">حكومية</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">نوع الطلاب والفرع</label>
                <select
                  value={genderType}
                  onChange={(e) => setGenderType(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="مشتركة">مشتركة (بنين وبنات)</option>
                  <option value="بنين">بنين فقط</option>
                  <option value="بنات">بنات فقط</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">المرحلة الدراسية</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="مجمع تعليمي (جميع المراحل)">مجمع تعليمي (ابتدائي - متوسط - ثانوي)</option>
                  <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">العام الدراسي الحالي</label>
                <input
                  type="text"
                  required
                  placeholder="1447 - 1448 هـ"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Licensing */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>الموقع والتراخيص الرسمية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">الدولة</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">المنطقة التعليمية</label>
                <input
                  type="text"
                  required
                  placeholder="منطقة الرياض"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">المدينة</label>
                <input
                  type="text"
                  required
                  placeholder="الرياض"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  الرقم التعريفي / رقم الترخيص (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="LIC-2026-9901"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  رابط شعار المدرسة (Logo URL - اختياري)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-left"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Principal & Contact Info */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>بيانات مدير المدرسة والدخول</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">اسم مدير المدرسة</label>
                <input
                  type="text"
                  required
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">رقم الجوال الرسمي</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-mono dir-ltr text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">البريد الإلكتروني للإدارة</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-left font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCloseView}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold px-5 py-3 rounded-xl transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs px-8 py-4 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري إنشاء سجل المدرسة...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تأسيس وإنشاء المدرسة الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
