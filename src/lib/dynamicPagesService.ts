import { DynamicPageBlock, DynamicFormSubmission, DynamicBlockType, CustomFieldItem } from '../types/dynamicPages';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_DYNAMIC_BLOCKS = 'htaf_dynamic_page_blocks_v1';
const STORAGE_KEY_DYNAMIC_SUBMISSIONS = 'htaf_dynamic_form_submissions_v1';

// Initial default blocks for various pages to demonstrate rich dynamic capabilities
const DEFAULT_DYNAMIC_BLOCKS: DynamicPageBlock[] = [
  {
    id: 'block-dashboard-kpi-1',
    pageId: 'dashboard',
    title: 'مؤشرات الأداء الأكاديمي والتحصيل السريع',
    subtitle: 'خانات إحصائية ومؤشرات تفاعلية مخصصة من قبل إدارة المنصة والمدرسة',
    type: 'custom_fields_grid',
    position: 'top',
    order: 1,
    isActive: true,
    visibleToRoles: 'all',
    colorScheme: 'cyan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      fields: [
        {
          id: 'fld-1',
          label: 'معدل التفاعل الأسبوعي',
          value: '94.8%',
          type: 'badge',
          color: 'emerald',
          iconName: 'Activity',
          helpText: 'محسوب وفقاً للدروس المنجزة والواجبات'
        },
        {
          id: 'fld-2',
          label: 'عدد الساعات المكتسبة',
          value: '38 ساعة',
          type: 'text',
          color: 'cyan',
          iconName: 'Clock'
        },
        {
          id: 'fld-3',
          label: 'الحالة الإشرافية المباشرة',
          value: 'نشط ومنتظم',
          type: 'badge',
          color: 'blue',
          iconName: 'ShieldCheck'
        },
        {
          id: 'fld-4',
          label: 'رمز مسار التميز الرقمي',
          value: 'SA-2026-STEM',
          type: 'text',
          color: 'purple',
          iconName: 'Award'
        }
      ]
    }
  },
  {
    id: 'block-dashboard-quick-actions',
    pageId: 'dashboard',
    title: 'إجراءات الوصول السريع والخدمات الإضافية',
    subtitle: 'أزرار ديناميكية مخصصة قابلة للتعديل والإضافة من قبل المسؤول',
    type: 'quick_actions',
    position: 'top',
    order: 2,
    isActive: true,
    visibleToRoles: 'all',
    colorScheme: 'indigo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      actions: [
        {
          id: 'qa-1',
          label: 'حلال المسائل الذكي بالـ OCR',
          actionType: 'navigate_tab',
          actionValue: 'solver',
          iconName: 'ScanLine',
          colorScheme: 'blue'
        },
        {
          id: 'qa-2',
          label: 'المعلم الذكي التفاعلي',
          actionType: 'navigate_tab',
          actionValue: 'smart-teacher',
          iconName: 'Bot',
          colorScheme: 'purple'
        },
        {
          id: 'qa-3',
          label: 'المكتبة الوزارية التفاعلية',
          actionType: 'navigate_tab',
          actionValue: 'curriculum',
          iconName: 'BookOpen',
          colorScheme: 'emerald'
        },
        {
          id: 'qa-4',
          label: 'غرف المذاكرة والتواصل',
          actionType: 'navigate_tab',
          actionValue: 'messaging',
          iconName: 'MessageSquare',
          colorScheme: 'cyan'
        }
      ]
    }
  },
  {
    id: 'block-curriculum-notice',
    pageId: 'curriculum',
    title: 'تحديثات المناهج الدراسية والكتب المطورة',
    type: 'announcement_banner',
    position: 'top',
    order: 1,
    isActive: true,
    visibleToRoles: 'all',
    colorScheme: 'blue',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      bannerType: 'info',
      bannerMessage: 'تمت مزامنة جميع كتب ومناهج وزارة التعليم للفصل الدراسي الحالي، مع إتاحة المعاينة التفاعلية والتصدير الرقمي بدقة عالية.',
      isDismissible: true
    }
  },
  {
    id: 'block-smart-teacher-faq',
    pageId: 'smart-teacher',
    title: 'دليل وخانات التوجيه لمعلم الذكاء الاصطناعي',
    subtitle: 'إرشادات مخصصة وموجهات تم إعدادها ديناميكياً بواسطة إدارة المنصة',
    type: 'collapsible_accordion',
    position: 'bottom',
    order: 1,
    isActive: true,
    visibleToRoles: 'all',
    colorScheme: 'purple',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      accordionItems: [
        {
          id: 'faq-1',
          title: 'كيف يتم ربط المعلم الذكي بالمناهج الوزارية المعتمدة؟',
          content: 'يقوم المعلم الذكي باستخراج النصوص والأشكال والمفاهيم مباشرة من الكتب الرقمية الرسمية المرفوعة وتقديم شرح مخصص متوافق مع نواتج التعلم السعودية.',
          badge: 'تكامل وزاري'
        },
        {
          id: 'faq-2',
          title: 'هل يمكن للأدمن تخصيص أنماط الشرح وتعديل المخرجات؟',
          content: 'نعم، يمكن للمسؤول تخصيص أسلوب المحادثة، وإضافة خانات مخصصة لتقييم الشرح أو جمع ملاحظات الطلاب والمعلمين في أي وقت.',
          badge: 'مرونة كاملة'
        }
      ]
    }
  },
  {
    id: 'block-school-mgmt-custom-form',
    pageId: 'school-mgmt',
    title: 'استمارة متابعة المبادرات المدرسية والأنشطة',
    subtitle: 'نموذج إدخال ديناميكي مخصص لجمع البيانات وحفظها فورياً',
    type: 'custom_form',
    position: 'bottom',
    order: 2,
    isActive: true,
    visibleToRoles: 'all',
    colorScheme: 'emerald',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      submitButtonLabel: 'حفظ وتوثيق النشاط المدرسي',
      successMessage: 'تم توثيق النشاط وحفظه بنجاح في سجلات المدرسة والمنصة!',
      fields: [
        {
          id: 'init-name',
          label: 'اسم النشاط أو المبادرة',
          value: '',
          type: 'text',
          placeholder: 'مثال: أسبوع الابتكار والذكاء الاصطناعي',
          isRequired: true,
          isEditableByUser: true
        },
        {
          id: 'init-category',
          label: 'المسار المستهدف',
          value: 'علمي وتقني',
          type: 'select',
          options: ['علمي وتقني', 'ثقافي وإبداعي', 'إرشادي وتوجيهي', 'رياضي وتطوعي'],
          isRequired: true,
          isEditableByUser: true
        },
        {
          id: 'init-date',
          label: 'تاريخ التنفيذ المجدول',
          value: '2026-09-01',
          type: 'date',
          isRequired: true,
          isEditableByUser: true
        },
        {
          id: 'init-notes',
          label: 'أهداف المبادرة والمخرجات المتوقعة',
          value: '',
          type: 'textarea',
          placeholder: 'أدخل تفاصيل ومؤشرات النجاح...',
          isRequired: false,
          isEditableByUser: true
        }
      ]
    }
  }
];

// Helper to get all blocks
export function getAllDynamicBlocks(): DynamicPageBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_BLOCKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DYNAMIC_BLOCKS, JSON.stringify(DEFAULT_DYNAMIC_BLOCKS));
      return DEFAULT_DYNAMIC_BLOCKS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_DYNAMIC_BLOCKS, JSON.stringify(DEFAULT_DYNAMIC_BLOCKS));
      return DEFAULT_DYNAMIC_BLOCKS;
    }
    return parsed;
  } catch (err) {
    console.warn('Error reading dynamic blocks from storage:', err);
    return DEFAULT_DYNAMIC_BLOCKS;
  }
}

// Get blocks for a specific page
export function getDynamicBlocksForPage(pageId: string): DynamicPageBlock[] {
  const all = getAllDynamicBlocks();
  return all
    .filter(b => (b.pageId === pageId || b.pageId === 'all') && b.isActive)
    .sort((a, b) => a.order - b.order);
}

// Get all blocks for admin view (including inactive)
export function getAdminBlocksForPage(pageId: string): DynamicPageBlock[] {
  const all = getAllDynamicBlocks();
  return all
    .filter(b => b.pageId === pageId || b.pageId === 'all')
    .sort((a, b) => a.order - b.order);
}

// Save all blocks
export function saveDynamicBlocks(blocks: DynamicPageBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DYNAMIC_BLOCKS, JSON.stringify(blocks));
    
    // Also sync to Supabase if configured (as platform settings / app state)
    if (isSupabaseConfigured) {
      supabase
        .from('platform_settings')
        .upsert({
          key: 'dynamic_page_blocks',
          value: blocks,
          updated_at: new Date().toISOString()
        })
        .then();
    }
  } catch (err) {
    console.warn('Error saving dynamic blocks:', err);
  }
}

// Add or update a block
export function upsertDynamicBlock(block: DynamicPageBlock): DynamicPageBlock {
  const all = getAllDynamicBlocks();
  const existingIdx = all.findIndex(b => b.id === block.id);
  
  const updatedBlock = {
    ...block,
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updatedBlock;
  } else {
    all.push(updatedBlock);
  }

  saveDynamicBlocks(all);
  return updatedBlock;
}

// Delete a block
export function deleteDynamicBlock(blockId: string): boolean {
  const all = getAllDynamicBlocks();
  const filtered = all.filter(b => b.id !== blockId);
  saveDynamicBlocks(filtered);
  return true;
}

// Toggle block active status
export function toggleDynamicBlockActive(blockId: string): boolean {
  const all = getAllDynamicBlocks();
  const block = all.find(b => b.id === blockId);
  if (!block) return false;
  block.isActive = !block.isActive;
  block.updatedAt = new Date().toISOString();
  saveDynamicBlocks(all);
  return block.isActive;
}

// Add a custom field to a block
export function addCustomFieldToBlock(blockId: string, field: CustomFieldItem): DynamicPageBlock | null {
  const all = getAllDynamicBlocks();
  const block = all.find(b => b.id === blockId);
  if (!block) return null;

  if (!block.data.fields) {
    block.data.fields = [];
  }
  block.data.fields.push(field);
  block.updatedAt = new Date().toISOString();
  saveDynamicBlocks(all);
  return block;
}

// Create a new custom block quickly
export function createQuickCustomBlock(
  pageId: string, 
  title: string, 
  type: DynamicBlockType, 
  position: 'top' | 'bottom' | 'banner' = 'top'
): DynamicPageBlock {
  const all = getAllDynamicBlocks();
  const newBlock: DynamicPageBlock = {
    id: `dyn-block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pageId,
    title,
    type,
    position,
    order: all.filter(b => b.pageId === pageId).length + 1,
    isActive: true,
    visibleToRoles: 'all',
    colorScheme: 'cyan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      fields: type === 'custom_fields_grid' || type === 'custom_form' ? [
        {
          id: `fld-${Date.now()}-1`,
          label: 'خانة جديدة',
          value: 'قيمة تجريبية',
          type: 'text',
          isRequired: false,
          isEditableByUser: true
        }
      ] : undefined,
      bannerType: type === 'announcement_banner' ? 'info' : undefined,
      bannerMessage: type === 'announcement_banner' ? 'محتوى الإعلان أو التنبيه المخصص...' : undefined,
      columns: type === 'data_table' ? [
        { key: 'col1', label: 'العنصر', type: 'text' },
        { key: 'col2', label: 'الحالة', type: 'badge' },
        { key: 'col3', label: 'القيمة / التاريخ', type: 'text' }
      ] : undefined,
      rows: type === 'data_table' ? [
        { id: 'r-1', values: { col1: 'مهمة 1', col2: 'مكتمل', col3: '2026-08-17' } },
        { id: 'r-2', values: { col1: 'مهمة 2', col2: 'قيد التنفيذ', col3: '2026-08-18' } }
      ] : undefined,
      actions: type === 'quick_actions' ? [
        {
          id: `qa-${Date.now()}-1`,
          label: 'إجراء سريع مخصص',
          actionType: 'navigate_tab',
          actionValue: 'curriculum',
          colorScheme: 'blue'
        }
      ] : undefined,
      accordionItems: type === 'collapsible_accordion' ? [
        {
          id: `acc-${Date.now()}-1`,
          title: 'عنوان القسم القابل للطي',
          content: 'أدخل هنا التفاصيل والشروحات الإضافية الخاصة بهذا القسم.',
          badge: 'معلومات'
        }
      ] : undefined,
      metricLabel: type === 'metric_progress' ? 'نسبة الإنجاز العام' : undefined,
      currentValue: type === 'metric_progress' ? 78 : undefined,
      targetValue: type === 'metric_progress' ? 100 : undefined,
      unit: type === 'metric_progress' ? '%' : undefined,
      notes: type === 'rich_content' ? 'أدخل الملاحظات والتوجيهات الإدارية المخصصة هنا...' : undefined
    }
  };

  all.push(newBlock);
  saveDynamicBlocks(all);
  return newBlock;
}

// Submissions Handler
export function saveDynamicFormSubmission(submission: Omit<DynamicFormSubmission, 'id' | 'submittedAt'>): DynamicFormSubmission {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_SUBMISSIONS);
    const submissions: DynamicFormSubmission[] = raw ? JSON.parse(raw) : [];
    
    const newSubmission: DynamicFormSubmission = {
      ...submission,
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: new Date().toISOString()
    };

    submissions.unshift(newSubmission);
    localStorage.setItem(STORAGE_KEY_DYNAMIC_SUBMISSIONS, JSON.stringify(submissions));

    if (isSupabaseConfigured) {
      supabase
        .from('form_submissions')
        .insert({
          block_id: newSubmission.blockId,
          page_id: newSubmission.pageId,
          submitted_by: newSubmission.submittedBy,
          data: newSubmission.data,
          created_at: newSubmission.submittedAt
        })
        .then();
    }

    return newSubmission;
  } catch (err) {
    console.warn('Error saving form submission:', err);
    return {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
  }
}

export function getSubmissionsForBlock(blockId: string): DynamicFormSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_SUBMISSIONS);
    if (!raw) return [];
    const submissions: DynamicFormSubmission[] = JSON.parse(raw);
    return submissions.filter(s => s.blockId === blockId);
  } catch (err) {
    console.warn('Error reading submissions:', err);
    return [];
  }
}

// Reset to factory defaults
export function resetDynamicBlocksToDefault(): DynamicPageBlock[] {
  saveDynamicBlocks(DEFAULT_DYNAMIC_BLOCKS);
  return DEFAULT_DYNAMIC_BLOCKS;
}
