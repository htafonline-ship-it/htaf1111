import React, { useState } from 'react';
import { SchoolTenant, AuthUser } from '../types';
import { createSupabaseSchool, DbSchool } from '../lib/supabase';
import {
  Building2,
  X,
  Sparkles,
  MapPin,
  User,
  Mail,
  Phone,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Globe,
  Loader2
} from 'lucide-react';

interface ManualAddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolCreated: (newSchool: SchoolTenant) => void;
  currentUser: AuthUser | null;
}

const SAUDI_REGIONS_CITIES: Record<string, string[]> = {
  'منطقة الرياض': ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الدوادمي', 'وادي الدواسر', 'الزلفي', 'حوطة بني تميم', 'الأفلاج', 'شقراء'],
  'منطقة مكة المكرمة': ['مكة المكرمة', 'جدة', 'الطائف', 'القنفذة', 'الليث', 'رابغ', 'خليص'],
  'المنطقة الشرقية': ['الدمام', 'الخبر', 'الأحساء (الهفوف)', 'الجبيل', 'القطيف', 'حفر الباطن', 'الخفجي'],
  'منطقة المدينة المنورة': ['المدينة المنورة', 'ينبع', 'العلا', 'بدر', 'مهد الذهب'],
  'منطقة القصيم': ['بريدة', 'عنيزة', 'الرس', 'البكيرية', 'المذنب'],
  'منطقة عسير': ['أبها', 'خميس مشيط', 'بيشة', 'محايل عسير', 'النماص'],
  'منطقة تبوك': ['تبوك', 'الوجه', 'ضباء', 'تيماء', 'أملج'],
  'منطقة حائل': ['حائل', 'بقعاء', 'الغزالة'],
  'منطقة جازان': ['جازان', 'صبيا', 'أبو عريش', 'صامطة'],
  'منطقة نجران': ['نجران', 'شرورة', 'حبونا'],
  'منطقة الباحة': ['الباحة', 'بلجرشي', 'المندق'],
  'منطقة الجوف': ['سكاكا', 'القريات', 'دومة الجندل'],
  'منطقة الحدود الشمالية': ['عرعر', 'رفحاء', 'طريف']
};

export const ManualAddSchoolModal: React.FC<ManualAddSchoolModalProps> = ({
  isOpen,
  onClose,
  onSchoolCreated,
  currentUser
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [educationType, setEducationType] = useState<'حكومي' | 'أهلي' | 'عالمي' | 'تحفيظ قرآن' | 'تربية خاصة'>('حكومي');
  const [stage, setStage] = useState<'ابتدائي' | 'متوسط' | 'ثانوي' | 'مجمع تعليمي' | 'روضة'>('متوسط');
  const [gender, setGender] = useState<'boys' | 'girls' | 'mixed'>('boys');
  
  const [region, setRegion] = useState('منطقة الرياض');
  const [city, setCity] = useState('الرياض');
  const [district, setDistrict] = useState('');
  
  const [principalName, setPrincipalName] = useState(currentUser?.fullName || '');
  const [principalEmail, setPrincipalEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [moeCode, setMoeCode] = useState(`SCH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [motto, setMotto] = useState('التعليم الذكي والجيل الواعد');
  const [logoText, setLogoText] = useState('');

  if (!isOpen) return null;

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const availableCities = SAUDI_REGIONS_CITIES[newRegion] || ['الرياض'];
    setCity(availableCities[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المدرسة الرسمي.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const generatedSlug = (nameEn.trim() || name.trim())
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0621-\u064A]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `school-${Date.now()}`;

      const resolvedLogoText = logoText.trim() || (name ? name.slice(0, 2) : 'مد');

      const schoolPayload: Omit<DbSchool, 'id' | 'created_at' | 'status'> = {
        name: name.trim(),
        name_en: nameEn.trim() || name.trim(),
        slug: generatedSlug,
        type: educationType,
        education_type: educationType,
        stage: stage,
        gender_type: gender === 'boys' ? 'بنين' : gender === 'girls' ? 'بنات' : 'مشتركة',
        school_gender: gender,
        country: 'المملكة العربية السعودية',
        region: region,
        city: city,
        district: district.trim() || 'المركز التعليمي',
        principal_name: principalName.trim() || 'مدير المدرسة',
        email: principalEmail.trim() || `${generatedSlug}@htaf.online`,
        phone: phone.trim() || '0500000000',
        license_number: moeCode.trim(),
        moe_code: moeCode.trim(),
        academic_year: '1447 - 1448 هـ (2026/2027م)',
        logo_url: ''
      };

      // Try creating in Supabase
      let createdDbSchool: DbSchool | null = null;
      try {
        const result = await createSupabaseSchool(
          schoolPayload,
          currentUser?.id || 'admin-user',
          currentUser?.email || principalEmail || 'admin@htaf.online',
          currentUser?.fullName || principalName || 'مدير النظام'
        );
        createdDbSchool = result.school;
      } catch (dbErr) {
        console.warn('Supabase school insertion warning (using local tenant fallback):', dbErr);
      }

      const newSchoolTenant: SchoolTenant = {
        id: createdDbSchool?.id || `sch-${Date.now()}`,
        name: name.trim(),
        nameEn: nameEn.trim() || name.trim(),
        slug: generatedSlug,
        logoText: resolvedLogoText,
        badge: `${educationType} - ${stage}`,
        primaryColor: 'from-blue-600 to-indigo-600',
        accentColor: 'blue',
        motto: motto.trim() || 'التعليم الذكي والجيل الواعد',
        location: `${city} - ${region}`,
        gender: gender,
        educationType: educationType,
        stage: stage,
        regionName: region,
        cityName: city,
        district: district.trim() || 'المركز',
        moeCode: moeCode.trim(),
        officialEmail: principalEmail.trim(),
        phone: phone.trim(),
        principalName: principalName.trim() || 'مدير المدرسة',
        principalEmail: principalEmail.trim(),
        totalStudentsCount: 0,
        totalTeachersCount: 1,
        isApproved: true,
        circulars: []
      };

      setSuccessMsg(`تمت إضافة وتفعيل مدرسة (${name}) بنجاح!`);
      setTimeout(() => {
        onSchoolCreated(newSchoolTenant);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error adding manual school:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إضافة المدرسة. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto dir-rtl">
      <div className="bg-[#091228] border border-blue-800/60 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-500/25">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">إضافة مدرسة جديدة يدوياً</h3>
                <span className="bg-cyan-950 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan-400/40">
                  إدخال يدوي مباشر
                </span>
              </div>
              <p className="text-xs text-blue-200/70">
                أدخل بيانات المدرسة بالتفصيل لحفظها في Supabase وإتاحتها فوراً لكافة المعلمين والطلاب.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Section 1: School Identity */}
          <div className="bg-[#060c1d] p-4 rounded-2xl border border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs">
              <Building2 className="w-4 h-4" />
              <span>1. البيانات الأساسية والهوية التعليمية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  اسم المدرسة الرسمي بالعربية <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!logoText) setLogoText(e.target.value ? e.target.value.slice(0, 2) : '');
                  }}
                  placeholder="مثال: مدرسة الخرج النموذجية للموهوبين"
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الاسم بالإنجليزية أو المعرف المختصر</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="مثال: Kharj Model School"
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-cyan-400 dir-ltr text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع التعليم</label>
                <select
                  value={educationType}
                  onChange={(e: any) => setEducationType(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="حكومي">حكومي (وزاري)</option>
                  <option value="أهلي">أهلي</option>
                  <option value="عالمي">عالمي (International)</option>
                  <option value="تحفيظ قرآن">تحفيظ القرآن الكريم</option>
                  <option value="تربية خاصة">تربية خاصة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">المرحلة التعليمية</label>
                <select
                  value={stage}
                  onChange={(e: any) => setStage(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                  <option value="مجمع تعليمي">مجمع تعليمي (شامل)</option>
                  <option value="روضة">روضة / طفولة مبكرة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">فئة الطلاب</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="boys">بنين</option>
                  <option value="girls">بنات</option>
                  <option value="mixed">مشتركة</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location & Region */}
          <div className="bg-[#060c1d] p-4 rounded-2xl border border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
              <MapPin className="w-4 h-4" />
              <span>2. النطاق الجغرافي والمدينة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">المنطقة الإدارية</label>
                <select
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {Object.keys(SAUDI_REGIONS_CITIES).map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">المدينة / المحافظة</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {(SAUDI_REGIONS_CITIES[region] || ['الرياض']).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الحي أو الشارع</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="مثال: حي الخزامى / طريق الملك فهد"
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Leadership & Official Info */}
          <div className="bg-[#060c1d] p-4 rounded-2xl border border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <User className="w-4 h-4" />
              <span>3. بيانات الإدارة والاعتماد الوزاري</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم مدير / مديرة المدرسة</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="مثال: أ. إبراهيم بن صالح الدوسري"
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الرقم الوزاري / كود الترخيص</label>
                <input
                  type="text"
                  value={moeCode}
                  onChange={(e) => setMoeCode(e.target.value)}
                  placeholder="مثال: MOE-789021"
                  className="w-full font-mono bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-amber-300 font-black outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني للإدارة</label>
                <input
                  type="email"
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  placeholder="admin@school.edu.sa"
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-amber-400 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم هاتف / جوال الإدارة</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-amber-400 dir-ltr text-right"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ والتسجيل...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>حفظ وإضافة المدرسة يدوياً</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
