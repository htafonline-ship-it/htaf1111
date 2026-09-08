import { CustomFieldDefinition, CustomFieldType, CustomFieldCategory, UserRole } from '../types';

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
];

export const DEFAULT_PRESET_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'field_gpa',
    key: 'gpa',
    label: 'المعدل التراكمي / النسبة الأكاديمية (%)',
    type: 'number',
    category: 'academic',
    placeholder: 'مثال: 98.5',
    helperText: 'النسبة المئوية أو المعدل التراكمي العام',
    iconName: 'GraduationCap',
    isDefaultPreset: true
  },
  {
    id: 'field_skills',
    key: 'skills',
    label: 'المهارات والاهتمامات العلمية',
    type: 'tags',
    category: 'skills',
    placeholder: 'أدخل المهارة واضغط Enter (مثال: الذكاء الاصطناعي، البرمجة، الفيزياء)',
    helperText: 'المهارات والاهتمامات المعتمدة للمستخدم',
    iconName: 'Sparkles',
    options: ['الذكاء الاصطناعي', 'الروبوتات', 'البرمجة', 'الفيزياء التطبيقية', 'الكيمياء الحيوية', 'الرياضيات المتقدمة', 'البلاغة', 'اللغة الإنجليزية', 'التصميم والابتكار'],
    isDefaultPreset: true
  },
  {
    id: 'field_portfolio',
    key: 'portfolio_url',
    label: 'رابط ملف الإنجاز أو معرض الأعمال (Portfolio / Link)',
    type: 'url',
    category: 'academic',
    placeholder: 'https://example.com/my-portfolio',
    helperText: 'رابط معرض أعمالك، حساب LinkedIn، أو ملف الإنجاز الرقمي',
    iconName: 'Globe',
    isDefaultPreset: true
  },
  {
    id: 'field_backup_phone',
    key: 'backup_phone',
    label: 'رقم هاتف ولي الأمر أو التواصل الإضافي',
    type: 'phone',
    category: 'contact',
    placeholder: '05xxxxxxxx',
    helperText: 'رقم هاتف احتياطي للتواصل الرسمي وإشعارات المنصة',
    iconName: 'PhoneCall',
    isDefaultPreset: true
  },
  {
    id: 'field_specialization',
    key: 'specialization',
    label: 'المسار التعليمي / التخصص',
    type: 'select',
    category: 'academic',
    placeholder: 'اختر المسار الأكاديمي',
    options: ['المسار العام', 'مسار علوم الحاسب والهندسة', 'مسار الصحة والحياة', 'مسار إدارة الأعمال', 'المسار الشرعي', 'المرحلة المتوسطة', 'المرحلة الابتدائية', 'التعليم المستمر'],
    helperText: 'المسار التخصصي للطالب أو التخصص الأكاديمي للمعلم',
    iconName: 'BookOpen',
    isDefaultPreset: true
  },
  {
    id: 'field_career_goal',
    key: 'career_goal',
    label: 'الهدف المستقبلي والرؤية المهنية',
    type: 'textarea',
    category: 'personal',
    placeholder: 'ما هو طموحك العلمي والمهني المستقبلي؟',
    helperText: 'نبذة عن الأهداف المهنية والأكاديمية',
    iconName: 'Target',
    isDefaultPreset: true
  },
  {
    id: 'field_awards',
    key: 'awards_and_honors',
    label: 'الجوائز والتكريمات والشهادات',
    type: 'tags',
    category: 'academic',
    placeholder: 'أضف شهادة أو جائزة (مثال: درع التفوق العلمي 2026)',
    helperText: 'الأوسمة والشهادات التقديرية المكتسبة',
    iconName: 'Award',
    options: ['وسام التفوق الأكاديمي', 'جائزة موهبة', 'شهادة أولمبياد العلوم', 'درع التميز المدرسي', 'شهادة مشاركة بالمعرض العلمي'],
    isDefaultPreset: true
  },
  {
    id: 'field_city_district',
    key: 'city_district',
    label: 'المدينة والحي السكني',
    type: 'text',
    category: 'contact',
    placeholder: 'مثال: الرياض - حي النرجس / الخرج - حي السلام',
    helperText: 'المدينة والحي السكني لتسهيل الخدمات المدرسية واللوجستية',
    iconName: 'MapPin',
    isDefaultPreset: true
  }
];

export const CATEGORY_LABELS: Record<CustomFieldCategory, { label: string; icon: string; color: string }> = {
  academic: { label: 'بيانات أكاديمية ومسارات', icon: 'GraduationCap', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' },
  skills: { label: 'المهارات والاهتمامات', icon: 'Sparkles', color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' },
  contact: { label: 'معلومات الاتصال والتواصل', icon: 'Phone', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' },
  personal: { label: 'بيانات شخصية وطموحات', icon: 'User', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' },
  custom: { label: 'خانات مخصصة وإضافية', icon: 'Plus', color: 'text-blue-400 bg-blue-950/60 border-blue-800/60' }
};

export const FIELD_TYPE_LABELS: Record<CustomFieldType, { name: string; description: string }> = {
  text: { name: 'نص قصير', description: 'حقل نصي لسطر واحد (مثل المدينة أو اللقب)' },
  textarea: { name: 'نص طويل / وصف', description: 'حقل نصوص متعدد الأسطر (مثل الأهداف أو النبذة)' },
  number: { name: 'رقم أو نسبة مئوية', description: 'حقل للأرقام والنسب والمعدلات' },
  select: { name: 'قائمة اختيار منسدلة', description: 'قائمة بخيارات محددة يختار منها المستخدم' },
  date: { name: 'تاريخ', description: 'محدد تاريخ دقيق (مثل تاريخ الميلاد أو التخرج)' },
  url: { name: 'رابط إنترنت (URL)', description: 'رابط مباشر قابل للفتح والنقر' },
  phone: { name: 'رقم هاتف / واتساب', description: 'رقم للتواصل المباشر' },
  email: { name: 'بريد إلكتروني إضافي', description: 'بريد إلكتروني بديل' },
  tags: { name: 'وسوم / مهارات متعددة', description: 'عناصر متعددة وقابلة للإضافة كـ Chips' },
  boolean: { name: 'مفتاح نعم / لا (Toggle)', description: 'خيار تفعيل أو تعطيل ثنائي' }
};

const STORAGE_FIELDS_PREFIX = 'htaf_user_custom_fields_';
const STORAGE_VALUES_PREFIX = 'htaf_user_custom_values_';

export function getUserCustomFields(userId: string, role?: UserRole): CustomFieldDefinition[] {
  if (!userId) return DEFAULT_PRESET_FIELDS;
  try {
    const raw = localStorage.getItem(`${STORAGE_FIELDS_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading custom fields from localStorage', e);
  }

  // Filter default presets sensibly by role if initial
  if (role === 'teacher') {
    return DEFAULT_PRESET_FIELDS.filter(f => f.key !== 'gpa');
  }
  return DEFAULT_PRESET_FIELDS;
}

export function saveUserCustomFields(userId: string, fields: CustomFieldDefinition[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_FIELDS_PREFIX}${userId}`, JSON.stringify(fields));
  } catch (e) {
    console.warn('Error saving custom fields to localStorage', e);
  }
}

export function getUserCustomValues(userId: string): Record<string, any> {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_VALUES_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading custom values from localStorage', e);
  }
  return {};
}

export function saveUserCustomValues(userId: string, values: Record<string, any>): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_VALUES_PREFIX}${userId}`, JSON.stringify(values));
  } catch (e) {
    console.warn('Error saving custom values to localStorage', e);
  }
}

export function addCustomField(
  userId: string,
  field: Omit<CustomFieldDefinition, 'id'>
): CustomFieldDefinition {
  const current = getUserCustomFields(userId);
  const newField: CustomFieldDefinition = {
    ...field,
    id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };
  const updated = [...current, newField];
  saveUserCustomFields(userId, updated);
  return newField;
}

export function removeCustomField(userId: string, fieldId: string): CustomFieldDefinition[] {
  const current = getUserCustomFields(userId);
  const updated = current.filter(f => f.id !== fieldId);
  saveUserCustomFields(userId, updated);
  return updated;
}

export function updateCustomField(userId: string, updatedField: CustomFieldDefinition): CustomFieldDefinition[] {
  const current = getUserCustomFields(userId);
  const updated = current.map(f => (f.id === updatedField.id ? updatedField : f));
  saveUserCustomFields(userId, updated);
  return updated;
}
