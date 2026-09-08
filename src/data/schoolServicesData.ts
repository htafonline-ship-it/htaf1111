import { SchoolTenant, SchoolServiceItem } from '../types';

export const DEFAULT_PLATFORM_SERVICES: SchoolServiceItem[] = [
  {
    id: 'service-ai-tutor',
    name: 'المساعد الذكي "هتاف العاصمي" لحل المسائل وتفسير الدروس',
    nameEn: 'Htaf AI Intelligent Tutor',
    category: 'ai',
    description: 'تمكين الطلاب من طرح المسائل بالصور والنصوص، والحصول على خطوات حل تعليمية تفاعلية مدعومة بالذكاء الاصطناعي مع ربطها المباشر بالمنهج الوزاري.',
    iconName: 'Bot',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'pro',
    priceLabel: 'مشمول في الباقة المعتمدة'
  },
  {
    id: 'service-sms-broadcast',
    name: 'بوابة الرسائل النصية القصيرة SMS والتعاميم العاجلة',
    nameEn: 'SMS Gateway & Urgent Broadcasts',
    category: 'communication',
    description: 'إرسال إشعارات فورية ورسائل نصية قصيرة SMS لأولياء الأمور بالغياب، التأخر، جدول الاختبارات، والإعلانات الإدارية الطارئة.',
    iconName: 'MessageSquare',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'enterprise',
    priceLabel: 'مفعل للمدرسة'
  },
  {
    id: 'service-digital-id',
    name: 'بطاقات الهوية الرقمية والباركود الذكي (QR Attendance)',
    nameEn: 'Digital Student ID & QR Pass',
    category: 'security',
    description: 'إصدار بطاقات هوية رقمية معتمدة لكل طالب ومعلم مع رمز QR وبث مشفر لتسجيل الحضور الذكي والتحقق عند بوابات المدرسة والمختبرات.',
    iconName: 'QrCode',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'pro',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-quiz-bank',
    name: 'بنك الأسئلة والاختبارات الذكية والتصحيح الآلي',
    nameEn: 'Smart Quiz Bank & Auto-Grading',
    category: 'academic',
    description: 'مستودع ضخم لأسئلة المناهج السعودية وتوليد الاختبارات الدورية وتصحيحها آلياً مع تقديم تحليلات دقيقة لنتائج ومستويات الطلاب.',
    iconName: 'FileCheck2',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'basic',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-counseling-care',
    name: 'نظام التوجيه والإرشاد والتحويلات التربوية السرية',
    nameEn: 'Counseling & Student Care Referral',
    category: 'counseling',
    description: 'منظومة سرية ومحمية تماماً تتيح للمعلمين تحويل الحالات السلوكية أو الأكاديمية للمرشد الطلابي، ومتابعة الخطط العلاجية بدقة وسرية.',
    iconName: 'ShieldAlert',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'enterprise',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-parent-portal',
    name: 'بوابة المتابعة اللحظية لأولياء الأمور (Parent Connect)',
    nameEn: 'Parent Portal & Engagement',
    category: 'communication',
    description: 'تطبيق وبوابة مخصصة تُمكّن ولي الأمر من تتبع أداء الأبناء الأكاديمي، سلوكهم، حضورهم، والتواصل المباشر مع المعلمين وإدارة المدرسة.',
    iconName: 'Users',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'basic',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-portfolio-achievements',
    name: 'سجل الإنجاز الرقمي وتوثيق المشاريع والمواهب',
    nameEn: 'Digital Student Portfolios & Badges',
    category: 'academic',
    description: 'توثيق رسمي لإنجازات الطلاب، البحوث، المشاريع العلمية، الأوسمة والشهادات الرقمية القابلة للتحقق الفوري عبر الباركود.',
    iconName: 'Award',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'pro',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-virtual-rooms',
    name: 'غرف المذاكرة التفاعلية وحلقات النقاش الآمنة',
    nameEn: 'Virtual Study Circles & Class Rooms',
    category: 'academic',
    description: 'فضاءات رقمية صفية آمنة تدار بإشراف المعلمين لتبادل الأسئلة، مراجعة الاختبارات، والتعاون الطلابي مع فلترة تلقائية للمحتوى.',
    iconName: 'Laptop',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'pro',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-attendance-tracker',
    name: 'نظام الحضور والغياب والمواظبة اللحظي',
    nameEn: 'Smart Daily Attendance Tracker',
    category: 'administrative',
    description: 'رصد فوري لغياب وتأخر الحصص واليوم الدراسي مع إحصائيات تراكمية وتنبيهات مبكرة للتعثر أو الانقطاع.',
    iconName: 'Clock',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'basic',
    priceLabel: 'مفعل'
  },
  {
    id: 'service-curriculum-sync',
    name: 'المزامنة السحابية المباشرة مع المناهج والكتب الوزارية',
    nameEn: 'Curriculum & Ministry Books Live Sync',
    category: 'academic',
    description: 'تحديث تلقائي وفوري لمحتوى المناهج والكتب المدرسية الإلكترونية لجميع المراحل والصفوف للفصول الدراسية الثلاثة.',
    iconName: 'BookOpen',
    isEnabled: true,
    activatedAt: '2026-01-01',
    planLevel: 'enterprise',
    priceLabel: 'مفعل'
  }
];

/**
 * Returns the effective services for a given school tenant,
 * merging platform defaults with school's specific toggles or custom services.
 */
export function getSchoolServices(school: SchoolTenant | null): SchoolServiceItem[] {
  if (!school) return DEFAULT_PLATFORM_SERVICES;

  const enabledSet = school.enabledServices ? new Set(school.enabledServices) : null;
  const customList = school.customServices || [];

  // Map platform defaults with enabled flag
  const platformServices = DEFAULT_PLATFORM_SERVICES.map(service => {
    // If school has explicit enabledServices array, check membership
    const isEnabled = enabledSet ? enabledSet.has(service.id) : service.isEnabled;
    return {
      ...service,
      isEnabled
    };
  });

  // Filter out any duplicates if custom services override a default
  const platformIds = new Set(platformServices.map(s => s.id));
  const uniqueCustom = customList.filter(c => !platformIds.has(c.id));

  return [...platformServices, ...uniqueCustom];
}

/**
 * Toggle a service's enabled status for a school.
 */
export function toggleSchoolService(
  school: SchoolTenant,
  serviceId: string,
  enable: boolean
): SchoolTenant {
  const currentServices = getSchoolServices(school);
  const updatedServices = currentServices.map(s => {
    if (s.id === serviceId) {
      return {
        ...s,
        isEnabled: enable,
        activatedAt: enable ? (s.activatedAt || new Date().toISOString().split('T')[0]) : undefined
      };
    }
    return s;
  });

  const enabledIds = updatedServices.filter(s => s.isEnabled).map(s => s.id);
  const customList = updatedServices.filter(s => !DEFAULT_PLATFORM_SERVICES.some(def => def.id === s.id));

  return {
    ...school,
    enabledServices: enabledIds,
    customServices: customList
  };
}

/**
 * Add a custom service to a school.
 */
export function addCustomSchoolService(
  school: SchoolTenant,
  newService: Omit<SchoolServiceItem, 'id'>
): { updatedSchool: SchoolTenant; newServiceItem: SchoolServiceItem } {
  const id = `service-custom-${Date.now()}`;
  const serviceItem: SchoolServiceItem = {
    ...newService,
    id,
    isEnabled: true,
    activatedAt: new Date().toISOString().split('T')[0]
  };

  const currentCustom = school.customServices || [];
  const updatedCustom = [serviceItem, ...currentCustom];
  const enabledIds = Array.from(new Set([...(school.enabledServices || DEFAULT_PLATFORM_SERVICES.map(s => s.id)), id]));

  const updatedSchool: SchoolTenant = {
    ...school,
    enabledServices: enabledIds,
    customServices: updatedCustom
  };

  return { updatedSchool, newServiceItem: serviceItem };
}

/**
 * Delete a custom service or cancel it permanently.
 */
export function removeSchoolService(
  school: SchoolTenant,
  serviceId: string
): SchoolTenant {
  const enabledIds = (school.enabledServices || DEFAULT_PLATFORM_SERVICES.map(s => s.id)).filter(id => id !== serviceId);
  const updatedCustom = (school.customServices || []).filter(s => s.id !== serviceId);

  return {
    ...school,
    enabledServices: enabledIds,
    customServices: updatedCustom
  };
}
