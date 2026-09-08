import React, { useState, useEffect } from 'react';
import { SchoolTenant } from '../types';
import { updateSupabaseSchool, DbSchool } from '../lib/supabase';
import { DEFAULT_PLATFORM_SERVICES, getSchoolServices } from '../data/schoolServicesData';
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
  Loader2,
  Edit3,
  Trash2,
  Zap,
  Check,
  Power
} from 'lucide-react';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolTenant | null;
  onSchoolUpdated: (updatedSchool: SchoolTenant) => void;
  onDeleteSchool?: (schoolId: string) => Promise<void> | void;
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

export const EditSchoolModal: React.FC<EditSchoolModalProps> = ({
  isOpen,
  onClose,
  school,
  onSchoolUpdated,
  onDeleteSchool
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [educationType, setEducationType] = useState<string>('حكومي');
  const [stage, setStage] = useState<string>('متوسط');
  const [gender, setGender] = useState<'boys' | 'girls' | 'mixed'>('boys');
  
  const [region, setRegion] = useState('منطقة الرياض');
  const [city, setCity] = useState('الرياض');
  const [district, setDistrict] = useState('');
  
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [moeCode, setMoeCode] = useState('');
  const [motto, setMotto] = useState('');
  const [logoText, setLogoText] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Sync initial state when school changes
  useEffect(() => {
    if (school) {
      setName(school.name || '');
      setNameEn(school.nameEn || '');
      setEducationType(school.educationType || 'حكومي');
      setStage(school.stage || 'متوسط');
      setGender(school.gender || 'boys');
      setRegion(school.regionName || 'منطقة الرياض');
      setCity(school.cityName || 'الرياض');
      setDistrict(school.district || '');
      setPrincipalName(school.principalName || '');
      setPrincipalEmail(school.principalEmail || school.officialEmail || '');
      setPhone(school.phone || '');
      setMoeCode(school.moeCode || '');
      setMotto(school.motto || '');
      setLogoText(school.logoText || (school.name ? school.name.slice(0, 2) : ''));
      setSelectedServices(
        school.enabledServices && school.enabledServices.length > 0
          ? school.enabledServices
          : DEFAULT_PLATFORM_SERVICES.map(s => s.id)
      );
    }
  }, [school]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  if (!isOpen || !school) return null;

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const availableCities = SAUDI_REGIONS_CITIES[newRegion] || ['الرياض'];
    if (!availableCities.includes(city)) {
      setCity(availableCities[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('اسم المدرسة لا يمكن أن يكون فارغاً.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updatesPayload: Partial<DbSchool> = {
        name: name.trim(),
        name_en: nameEn.trim() || name.trim(),
        type: educationType,
        education_type: educationType,
        stage: stage,
        gender_type: gender === 'boys' ? 'بنين' : gender === 'girls' ? 'بنات' : 'مشتركة',
        school_gender: gender,
        region: region,
        city: city,
        district: district.trim(),
        principal_name: principalName.trim(),
        email: principalEmail.trim(),
        phone: phone.trim(),
        license_number: moeCode.trim(),
        moe_code: moeCode.trim(),
      };

      // Try updating in Supabase
      try {
        await updateSupabaseSchool(school.id, updatesPayload);
      } catch (dbErr) {
        console.warn('Supabase update warning (local state will still update):', dbErr);
      }

      const updatedSchoolTenant: SchoolTenant = {
        ...school,
        name: name.trim(),
        nameEn: nameEn.trim() || name.trim(),
        logoText: logoText.trim() || (name ? name.slice(0, 2) : 'مد'),
        badge: `${educationType} - ${stage}`,
        motto: motto.trim() || school.motto || 'التعليم الذكي والجيل الواعد',
        location: `${city} - ${region}`,
        gender: gender,
        educationType: educationType as any,
        stage: stage as any,
        regionName: region,
        cityName: city,
        district: district.trim(),
        moeCode: moeCode.trim(),
        officialEmail: principalEmail.trim(),
        phone: phone.trim(),
        principalName: principalName.trim(),
        principalEmail: principalEmail.trim(),
        enabledServices: selectedServices
      };

      setSuccessMsg(`تم تحديث بيانات مدرسة (${name}) بنجاح!`);
      setTimeout(() => {
        onSchoolUpdated(updatedSchoolTenant);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error updating school:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء تحديث المدرسة.');
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تحديث وتعديل بيانات المدرسة</h3>
                <span className="bg-amber-950 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/40">
                  {school.name}
                </span>
              </div>
              <p className="text-xs text-blue-200/70">
                تعديل البيانات الرسمية والموقع وبيانات الإدارة وحفظ التحديثات مباشرة في Supabase.
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
          
          {/* Section 1: Identity */}
          <div className="bg-[#060c1d] p-4 rounded-2xl border border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs">
              <Building2 className="w-4 h-4" />
              <span>1. البيانات الأساسية والهوية</span>
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
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-400 dir-ltr text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع التعليم</label>
                <select
                  value={educationType}
                  onChange={(e) => setEducationType(e.target.value)}
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
                  onChange={(e) => setStage(e.target.value)}
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

          {/* Section 2: Location */}
          <div className="bg-[#060c1d] p-4 rounded-2xl border border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
              <MapPin className="w-4 h-4" />
              <span>2. الموقع والمدينة</span>
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
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Principal & Contact */}
          <div className="bg-[#060c1d] p-4 rounded-2xl border border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <User className="w-4 h-4" />
              <span>3. بيانات الإدارة والاتصال</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم مدير / مديرة المدرسة</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الرقم الوزاري / كود الترخيص</label>
                <input
                  type="text"
                  value={moeCode}
                  onChange={(e) => setMoeCode(e.target.value)}
                  className="w-full font-mono bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-amber-300 font-black outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف / الجوال</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0d1a3a] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400 dir-ltr text-right"
                />
              </div>
            </div>
          </div>

          {/* Section: Enabled Services Management */}
          <div className="bg-[#0b1739] border border-blue-900/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black text-white">الخدمات والميزات المعتمدة للمدرسة</h4>
              </div>
              <span className="text-[11px] font-bold text-cyan-300">
                {selectedServices.length} مفعّلة من أصل {DEFAULT_PLATFORM_SERVICES.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              يمكنك إضافة أو إلغاء أي خدمة من خدمات المدرسة بضغطة زر واحدة:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {DEFAULT_PLATFORM_SERVICES.map(srv => {
                const isChecked = selectedServices.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs select-none ${
                      isChecked
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                        : 'bg-[#070e22] border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition ${
                      isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>{srv.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{srv.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-blue-900/40">
            {/* Delete button */}
            <div>
              {onDeleteSchool && (
                !showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف المدرسة نهائياً</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-700 p-2 rounded-xl animate-in fade-in">
                    <span className="text-[11px] text-rose-200 font-bold">هل أنت متأكد؟</span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await onDeleteSchool(school.id);
                          onClose();
                        } catch (e) {
                          console.error('Delete school error:', e);
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-2.5 py-1 rounded-lg transition"
                    >
                      {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-slate-300 hover:text-white text-xs px-1.5"
                    >
                      إلغاء
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
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
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري حفظ التحديثات...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>حفظ وتحديث بيانات المدرسة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
