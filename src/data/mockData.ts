import {
  SchoolTenant,
  CurriculumBook,
  HomeworkAssignment,
  QuizItem,
  StudentProfile,
  CounselingReferral,
  SchoolCircular,
  CurriculumSyncStatus,
  SupportTicket,
  StudyGroup,
  StudyGroupMessage,
  ModerationAuditLogItem,
  SchoolRegistrationCode,
  BulkStudentRow
} from '../types';
import { KHARJ_TENANT_SCHOOLS } from './kharjSchoolsData';

export const INITIAL_REGISTRATION_CODES: SchoolRegistrationCode[] = [];

export const INITIAL_BULK_STUDENTS_SAMPLE: BulkStudentRow[] = [];

export const INITIAL_SCHOOLS: SchoolTenant[] = KHARJ_TENANT_SCHOOLS;

export const INITIAL_CURRICULUM_SYNC_STATUS: CurriculumSyncStatus = {
  lastSyncTime: 'اليوم، 08:30 ص',
  portalSources: [
    'بوابة عين الوطنية الإثرائية (ien.edu.sa)',
    'منصة مدرستي الرقمية (madrasati.sa)',
    'مركز التخطيط والتطوير المناهجي بوزارة التعليم'
  ],
  currentAcademicYear: '1448هـ - 2027م (النظام الثلاثي للفصول المحدث)',
  activeTerm: 1,
  syncedBooksCount: 45,
  syncLogs: [
    {
      id: 'log-1',
      timestamp: '2026-08-13 08:30 ص',
      title: 'اعتماد واستيراد كافة مناهج العام الدراسي الجديد 1448هـ - 2027م',
      source: 'بوابة عين الوطنية (ien.edu.sa)',
      status: 'تم التحديث',
      details: 'مزامنة شاملة لكافة كتب الابتدائية والمتوسطة والثانوية مسارات لطبعة 1448هـ المحدثة.',
      bookId: 'book-math-m3-1448'
    },
    {
      id: 'log-2',
      timestamp: '2026-08-12 14:15 م',
      title: 'تحديث مقرر الذكاء الاصطناعي 2 والأمن السيبراني 1448هـ',
      source: 'منصة مدرستي الرقمية (madrasati.sa)',
      status: 'تم التحديث',
      details: 'رفع النسخة التفاعلية الجديدة 1448هـ وتحديث نماذج الممارسة الذكية.',
      bookId: 'book-ai-s3-1448'
    },
    {
      id: 'log-3',
      timestamp: '2026-08-10 10:00 ص',
      title: 'فحص مطابقة كتب المهارات الرقمية واللغة الإنجليزية (1448هـ)',
      source: 'مركز المناهج والكتب',
      status: 'مستقر',
      details: 'مطابقة 100% بين محتوى التمارين والخطة التدريسية الوزارية لجميع المراحل.'
    }
  ]
};

export const CURRICULUM_BOOKS: CurriculumBook[] = [
  // ==========================================
  // 1. المرحلة الابتدائية (PRIMARY STAGE - 1448هـ)
  // ==========================================
  {
    id: 'book-math-p1-1448',
    title: 'الرياضيات - الأول الابتدائي (طبعة 1448هـ)',
    book_name: 'الرياضيات - الأول الابتدائي',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الأول الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-p1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-p1-1448',
    coverIcon: '🔢',
    totalPages: 120,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-p1-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'p1-m-ch1',
        title: 'الفصل 1: المقارنة والتصنيف والأعداد حتى 5',
        pageStart: 10,
        pageEnd: 45,
        topics: ['التصنيف وفق خاصية واحدة', 'الأعداد 1، 2، 3', 'قراءة الأعداد وكتابتها حتى 5']
      },
      {
        id: 'p1-m-ch2',
        title: 'الفصل 2: الأعداد حتى 10 والجمع المباشر',
        pageStart: 46,
        pageEnd: 90,
        topics: ['الأعداد 6، 7، 8', 'قراءة العددين 9 و 10', 'مفهوم الجمع والتطبيقات المصورة']
      }
    ]
  },
  {
    id: 'book-arabic-p1-1448',
    title: 'لغتي الجميلة - الأول الابتدائي (طبعة 1448هـ)',
    book_name: 'لغتي الجميلة - الأول الابتدائي',
    subject: 'اللغة العربية',
    subject_name: 'اللغة العربية',
    grade: 'الصف الأول الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/arabic-p1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/arabic-p1-1448',
    coverIcon: '✏️',
    totalPages: 110,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/arabic-p1-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'p1-a-ch1',
        title: 'الوحدة 1: أسرتي وحروفي الأولى',
        pageStart: 12,
        pageEnd: 50,
        topics: ['حرف الميم (م)', 'حرف الباء (ب)', 'حرف اللام (ل)', 'حرف الدال (د)']
      }
    ]
  },
  {
    id: 'book-islamic-p3-1448',
    title: 'الدراسات الإسلامية - الثالث الابتدائي (طبعة 1448هـ)',
    book_name: 'الدراسات الإسلامية - الثالث الابتدائي',
    subject: 'الدراسات الإسلامية',
    subject_name: 'الدراسات الإسلامية',
    grade: 'الصف الثالث الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/islamic-p3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/islamic-p3-1448',
    coverIcon: '🕌',
    totalPages: 135,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/islamic-p3-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'p3-i-ch1',
        title: 'قسم التوحيد والفقه: أركان الإسلام والصلاة',
        pageStart: 10,
        pageEnd: 60,
        topics: ['مراتب الدين الأربعة', 'مكانة الصلاة وشروطها', 'آداب قراءة القرآن الكريم']
      }
    ]
  },
  {
    id: 'book-math-p4-1448',
    title: 'الرياضيات - الرابع الابتدائي (طبعة 1448هـ)',
    book_name: 'الرياضيات - الرابع الابتدائي',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الرابع الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-p4-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-p4-1448',
    coverIcon: '📐',
    totalPages: 150,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-p4-1448',
    chapters: [
      {
        id: 'p4-m-ch1',
        title: 'الفصل 1: القيمة المنزلية والجمع والطرح',
        pageStart: 12,
        pageEnd: 55,
        topics: ['القيمة المنزلية ضمن ملايين', 'مقارنة الأعداد وترتيبها', 'تقدير مجموع أعداد كبيرة']
      }
    ]
  },
  {
    id: 'book-arabic-p4-1448',
    title: 'لغتي الجميلة - الرابع الابتدائي (طبعة 1448هـ)',
    book_name: 'لغتي الجميلة - الرابع الابتدائي',
    subject: 'اللغة العربية',
    subject_name: 'اللغة العربية',
    grade: 'الصف الرابع الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/arabic-p4-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/arabic-p4-1448',
    coverIcon: '📖',
    totalPages: 130,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/arabic-p4-1448',
    chapters: [
      {
        id: 'p4-a-ch1',
        title: 'الوحدة 1: صحتي وبيئتي',
        pageStart: 10,
        pageEnd: 50,
        topics: ['أنواع المعارف والأسماء', 'الجملة الاسمية والفعلية', 'همزتا الوصل والقطع']
      }
    ]
  },
  {
    id: 'book-social-p4-1448',
    title: 'الدراسات الاجتماعية - الرابع الابتدائي (طبعة 1448هـ)',
    book_name: 'الدراسات الاجتماعية - الرابع الابتدائي',
    subject: 'الدراسات الاجتماعية',
    subject_name: 'الدراسات الاجتماعية',
    grade: 'الصف الرابع الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/social-p4-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/social-p4-1448',
    coverIcon: '🌍',
    totalPages: 110,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/social-p4-1448',
    chapters: [
      {
        id: 'p4-s-ch1',
        title: 'الوحدة 1: الدراسات الاجتماعية والمواطنة',
        pageStart: 10,
        pageEnd: 42,
        topics: ['مفهوم التاريخ والمكان', 'مفاهيم الجغرافيا ومكونات الخريطة', 'الهوية الوطنية السعودية']
      }
    ]
  },
  {
    id: 'book-digital-p4-1448',
    title: 'المهارات الرقمية - الرابع الابتدائي (طبعة 1448هـ)',
    book_name: 'المهارات الرقمية - الرابع الابتدائي',
    subject: 'المهارات الرقمية',
    subject_name: 'المهارات الرقمية',
    grade: 'الصف الرابع الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/digital-p4-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/digital-p4-1448',
    coverIcon: '💻',
    totalPages: 125,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/digital-p4-1448',
    chapters: [
      {
        id: 'p4-d-ch1',
        title: 'الوحدة 1: تعلم أساسيات الحاسب والمستندات',
        pageStart: 10,
        pageEnd: 48,
        topics: ['مكونات نظام الحاسب الآلي', 'تحرير النصوص ببرنامج Microsoft Word', 'أخلاقيات استخدام الإنترنت']
      }
    ]
  },
  {
    id: 'book-science-p5-1448',
    title: 'العلوم - الخامس الابتدائي (طبعة 1448هـ)',
    book_name: 'العلوم - الخامس الابتدائي',
    subject: 'العلوم',
    subject_name: 'العلوم',
    grade: 'الصف الخامس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/science-p5-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/science-p5-1448',
    coverIcon: '🌿',
    totalPages: 145,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/science-p5-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'p5-sc-ch1',
        title: 'الوحدة 1: تنوع الحياة والتصنيف',
        pageStart: 12,
        pageEnd: 55,
        topics: ['مملكة النباتات ومملكة الحيوانات', 'تركيب الخلية النباتية والحيوانية', 'الأجهزة الحيوية في الكائنات الحية']
      }
    ]
  },
  {
    id: 'book-english-p5-1448',
    title: 'اللغة الإنجليزية We Can 1 - الخامس الابتدائي (طبعة 1448هـ)',
    book_name: 'اللغة الإنجليزية We Can 1',
    subject: 'اللغة الإنجليزية',
    subject_name: 'اللغة الإنجليزية',
    grade: 'الصف الخامس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/english-wecan-p5-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/english-wecan-p5-1448',
    coverIcon: '🔤',
    totalPages: 115,
    editionYear: '1448هـ - 2027م (طبعة جديدة متطورة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/english-wecan-p5-1448',
    chapters: [
      {
        id: 'p5-e-ch1',
        title: 'Unit 1: Feelings and Things',
        pageStart: 8,
        pageEnd: 40,
        topics: ['Greetings & Introductions', 'Expressing Emotions & Moods', 'Basic Vocabulary & Phonics']
      }
    ]
  },
  {
    id: 'book-math-p6-1448',
    title: 'الرياضيات - السادس الابتدائي (طبعة 1448هـ)',
    book_name: 'الرياضيات - السادس الابتدائي',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف السادس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-p6-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-p6-1448',
    coverIcon: '🔢',
    totalPages: 165,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-p6-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'p6-m-ch1',
        title: 'الفصل 1: العمليات على الكسور والنسبة والمعدل',
        pageStart: 10,
        pageEnd: 55,
        topics: ['ضرب الكسور العادية وقسمتها', 'مفهوم النسبة والمعدل', 'تطبيقات النسبة المئوية في الحياة']
      }
    ]
  },
  {
    id: 'book-science-p6-1448',
    title: 'العلوم - السادس الابتدائي (طبعة 1448هـ)',
    book_name: 'العلوم - السادس الابتدائي',
    subject: 'العلوم',
    subject_name: 'العلوم',
    grade: 'الصف السادس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/science-p6-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/science-p6-1448',
    coverIcon: '🧪',
    totalPages: 155,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/science-p6-1448',
    chapters: [
      {
        id: 'p6-sc-ch1',
        title: 'الوحدة 1: الخلايا والوراثة والأنظمة الحية',
        pageStart: 12,
        pageEnd: 58,
        topics: ['نظرية الخلية وانقسامها', 'الصفات الوراثية والمورثات', 'الأجهزة في جسم الإنسان']
      }
    ]
  },
  {
    id: 'book-arabic-p6-1448',
    title: 'لغتي الجميلة - السادس الابتدائي (طبعة 1448هـ)',
    book_name: 'لغتي الجميلة - السادس الابتدائي',
    subject: 'اللغة العربية',
    subject_name: 'اللغة العربية',
    grade: 'الصف السادس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/arabic-p6-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/arabic-p6-1448',
    coverIcon: '✏️',
    totalPages: 140,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/arabic-p6-1448',
    chapters: [
      {
        id: 'p6-a-ch1',
        title: 'الوحدة 1: قدوات ومثل عليا',
        pageStart: 14,
        pageEnd: 52,
        topics: ['الأفعال الخمسة وإعرابها', 'الميزان الصرفي وتطبيقاته', 'كتابة المقال والتواصل اللغوي']
      }
    ]
  },
  {
    id: 'book-social-p6-1448',
    title: 'الدراسات الاجتماعية - السادس الابتدائي (طبعة 1448هـ)',
    book_name: 'الدراسات الاجتماعية - السادس الابتدائي',
    subject: 'الدراسات الاجتماعية',
    subject_name: 'الدراسات الاجتماعية',
    grade: 'الصف السادس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/social-p6-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/social-p6-1448',
    coverIcon: '🇸🇦',
    totalPages: 120,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/social-p6-1448',
    chapters: [
      {
        id: 'p6-s-ch1',
        title: 'الوحدة 1: تاريخ الدولة السعودية',
        pageStart: 10,
        pageEnd: 48,
        topics: ['تأسيس الدولة السعودية الأولى 1139هـ', 'الدولة السعودية الثانية والمؤسس الملك عبدالعزيز', 'رؤية المملكة 2030']
      }
    ]
  },
  {
    id: 'book-life-p6-1448',
    title: 'المهارات الحياتية والأسرية - السادس الابتدائي (طبعة 1448هـ)',
    book_name: 'المهارات الحياتية والأسرية - السادس الابتدائي',
    subject: 'المهارات الحياتية والأسرية',
    subject_name: 'المهارات الحياتية والأسرية',
    grade: 'الصف السادس الابتدائي',
    stage: 'primary',
    education_stage: 'primary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/life-p6-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/life-p6-1448',
    coverIcon: '🏡',
    totalPages: 105,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/life-p6-1448',
    chapters: [
      {
        id: 'p6-l-ch1',
        title: 'الوحدة 1: صحتي وسلامتي وادخاري',
        pageStart: 10,
        pageEnd: 40,
        topics: ['العناية الشخصية والأغذية الصحية', 'إدارة الوقت والمهارات المالية البسيطة', 'الإسعافات الأولية والتصرف في الطوارئ']
      }
    ]
  },

  // ==========================================
  // 2. المرحلة المتوسطة (MIDDLE STAGE - 1448هـ)
  // ==========================================
  {
    id: 'book-math-m1-1448',
    title: 'الرياضيات - الأول المتوسط (طبعة 1448هـ)',
    book_name: 'الرياضيات - الأول المتوسط',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الأول المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-m1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-m1-1448',
    coverIcon: '📐',
    totalPages: 175,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-m1-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'm1-m-ch1',
        title: 'الفصل 1: الجبر والدوال والأعداد الصحيحة',
        pageStart: 12,
        pageEnd: 58,
        topics: ['الخطوات الأربع لحل المسألة', 'الأعداد الصحيحة والقيمة المطلقة', 'جمع وطرح الأعداد الصحيحة']
      }
    ]
  },
  {
    id: 'book-science-m1-1448',
    title: 'العلوم - الأول المتوسط (طبعة 1448هـ)',
    book_name: 'العلوم - الأول المتوسط',
    subject: 'العلوم',
    subject_name: 'العلوم',
    grade: 'الصف الأول المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/science-m1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/science-m1-1448',
    coverIcon: '🧪',
    totalPages: 160,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/science-m1-1448',
    chapters: [
      {
        id: 'm1-sc-ch1',
        title: 'الوحدة 1: طبيعة العلم والتكنولوجيا',
        pageStart: 10,
        pageEnd: 50,
        topics: ['الأسلوب العلمي والفرضيات', 'القياس أدواته وحداته', 'نماذج الخلايا والأنسجة']
      }
    ]
  },
  {
    id: 'book-tajweed-m1-tahfeez-1447',
    title: 'التجويد - الأول المتوسط (مدارس تحفيظ القرآن الكريم)',
    book_name: 'التجويد - الأول المتوسط (مدارس تحفيظ القرآن الكريم)',
    subject: 'التجويد',
    subject_name: 'التجويد (تحفيظ القرآن الكريم)',
    grade: 'الصف الأول المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1447هـ - 2025م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/tajweed-m1-tahfeez-1447.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/tajweed-m1-tahfeez-1447',
    coverIcon: '📖',
    totalPages: 156,
    editionYear: 'طبعة 1447هـ - 2025م (مدارس تحفيظ القرآن الكريم)',
    portalUrl: 'https://ien.edu.sa/Home/Book/tajweed-m1-tahfeez-1447',
    isLatestSync: true,
    chapters: [
      {
        id: 'tajweed-m1-ch0',
        title: 'المدخل والمقدمة وفهرس المقرر',
        pageStart: 1,
        pageEnd: 7,
        topics: [
          'ص 1-2: الغلاف والاعتماد الوزاري ورقم الإيداع 15240/1446هـ',
          'ص 3-5: البسملة ومقدمة الكتاب وأهداف تدريس التجويد بمدارس التحفيظ',
          'ص 6-7: الفهرس العام لموضوعات الجزء الأول'
        ]
      },
      {
        id: 'tajweed-m1-ch1',
        title: 'الدرس الأول: علم التجويد',
        pageStart: 8,
        pageEnd: 12,
        topics: [
          'أهداف الدرس وتعريف التجويد لغة واصطلاحاً',
          'نشأة علم التجويد واستمداده من قراءة النبي ﷺ',
          'حكم التجويد (فرض كفاية وفرض عين) وفائدته',
          'الشاهد من الجزرية: والأخذ بالتجويد حتم لازم',
          'حل أنشطة ص 9، ص 10 وأسئلة التقويم ص 12'
        ]
      },
      {
        id: 'tajweed-m1-ch2',
        title: 'الدرس الثاني: اللحن في قراءة القرآن الكريم',
        pageStart: 13,
        pageEnd: 18,
        topics: [
          'معنى اللحن: الخطأ والميل عن الصواب',
          'اللحن الجلي: تعريفه وأمثلته (ضم تاء أنعمت، إبدال الحركات)',
          'اللحن الخفي: تعريفه وأمثلته (نقص الغنن والمدود)',
          'جدول المقارنة وحل أنشطة وتطبيقات سورة الحجرات',
          'الشاهد من كلام الداني وحل أسئلة التقويم ص 17-18'
        ]
      },
      {
        id: 'tajweed-m1-ch3',
        title: 'الدرس الثالث: الاستعاذة والبسملة والأوجه بين السورتين',
        pageStart: 19,
        pageEnd: 26,
        topics: [
          'معنى الاستعاذة وأحكامها وسنيتها عند البدء',
          'معنى البسملة وأحكامها في أوائل وأوساط السور وسورة التوبة',
          'أوجه البسملة الثلاثة الجائزة بين السورتين والوجه الممتنع',
          'أوجه ما بين الأنفال والتوبة: الوقف، السكت، الوصل بلا بسملة',
          'الشواهد وحل الأنشطة وأسئلة التقويم ص 25'
        ]
      },
      {
        id: 'tajweed-m1-ch4',
        title: 'الدرس الرابع: مراتب القراءة',
        pageStart: 27,
        pageEnd: 31,
        topics: [
          'مرتبة التحقيق: القراءة بتأن واطمئنان مع توفية الحروف',
          'مرتبة الحدر: السرعة في القراءة دون إخلال بالأحكام',
          'مرتبة التدوير: المرتبة المتوسطة بين التحقيق والحدر',
          'الشاهد من الخاقانية والتحفة وحل أسئلة التقويم ص 30'
        ]
      },
      {
        id: 'tajweed-m1-ch5',
        title: 'الدرس الخامس: أحكام النون الساكنة والتنوين',
        pageStart: 32,
        pageEnd: 36,
        topics: [
          'تعريف النون الساكنة والتنوين والفرق الجوهري بينهما',
          'الأحكام الأربعة: الإظهار، الإدغام، الإقلاب، الإخفاء',
          'تطبيقات واستخراج الأحكام من سورة يوسف',
          'الشاهد من الجزرية والتحفة وحل أسئلة التقويم ص 36'
        ]
      },
      {
        id: 'tajweed-m1-ch6',
        title: 'الدرس السادس: الإظهار الحلقي',
        pageStart: 37,
        pageEnd: 43,
        topics: [
          'تعريف الإظهار الحلقي لغة واصطلاحاً',
          'حروف الحلق الستة: الهمزة، الهاء، العين، الحاء، الغين، الخاء',
          'أمثلة النون الساكنة والتنوين مع حروف الإظهار',
          'الشاهد من تحفة الأطفال وعلامة الضبط بالمصحف (رأس خاء)',
          'حل أنشطة ص 40، ص 41، والتقويم ص 42'
        ]
      },
      {
        id: 'tajweed-m1-ch7',
        title: 'الدرس السابع: الإدغام',
        pageStart: 44,
        pageEnd: 49,
        topics: [
          'تعريف الإدغام لغة واصطلاحاً وحروفه الستة (يرملون)',
          'الإدغام بغنة (ينمو) والإدغام بغير غنة (رل)',
          'شرط الإدغام من كلمتين وحكم الإظهار المطلق (دنيا، بنيان، قنوان، صنوان)',
          'الشاهد من تحفة الأطفال وتطبيق سورة يوسف',
          'حل أنشطة ص 46، ص 47، والتقويم ص 48'
        ]
      },
      {
        id: 'tajweed-m1-ch8',
        title: 'الدرس الثامن: الإقلاب',
        pageStart: 50,
        pageEnd: 56,
        topics: [
          'تعريف الإقلاب لغة واصطلاحاً وحرفه الوحيد (الباء)',
          'كيفية أداء الإقلاب: قلب النون ميماً مع الغنة والإخفاء',
          'علامة الإقلاب بالمصحف (ميم صغيرة قائمة بدل السكون)',
          'الشاهد من تحفة الأطفال: والثالث الإقلاب عند الباء',
          'حل أنشطة ص 52، ص 53، والتقويم ص 55'
        ]
      },
      {
        id: 'tajweed-m1-ch9',
        title: 'الدرس التاسع: الإخفاء الحقيقي',
        pageStart: 57,
        pageEnd: 62,
        topics: [
          'تعريف الإخفاء الحقيقي لغة واصطلاحاً وحروفه الـ 15',
          'بيت التحفة: صف ذا ثنا كم جاد شخص قد سما...',
          'كيفية نطق الإخفاء بحالة متوسطة بين الإظهار والإدغام بلا تشديد مع الغنة',
          'تطبيقات سورة يوسف وحل أنشطة ص 60، ص 61، والتقويم ص 61-62'
        ]
      },
      {
        id: 'tajweed-m1-ch10',
        title: 'الدرس العاشر: أحكام الميم الساكنة',
        pageStart: 63,
        pageEnd: 70,
        topics: [
          'تعريف الميم الساكنة (الخالية من الحركة)',
          'الإخفاء الشفوي عند حرف الباء',
          'الإدغام الشفوي (الصغير) عند حرف الميم',
          'الإظهار الشفوي عند باقي الحروف الـ 26 والتحذير من إخفائها عند الواو والفاء',
          'الشواهد وحل الأنشطة والتقويم ص 69'
        ]
      },
      {
        id: 'tajweed-m1-ch11',
        title: 'الدرس الحادي عشر: حكم الميم والنون المشددتين',
        pageStart: 71,
        pageEnd: 76,
        topics: [
          'تعريف الميم والنون المشددتين وحكمهما (إظهار الغنة حركتين)',
          'مراتب الغنة الثلاث (المشدد والمدغم كامل التشديد، المدغم بغنة، المخفى)',
          'الشاهد من تحفة الأطفال: وغن ميماً ثم نوناً شددا',
          'حل أنشطة ص 73، ص 74، وأسئلة التقويم ص 75'
        ]
      },
      {
        id: 'tajweed-m1-ch12',
        title: 'الجزء الثاني: اللامات السواكن ولام (أل) ولام الفعل',
        pageStart: 77,
        pageEnd: 96,
        topics: [
          'ص 77-79: مقدمة الجزء الثاني وفهرس دروس اللامات والمدود',
          'ص 80-84: اللامات السواكن وتعريفها وأقسامها وحكمها بين الإظهار والإدغام',
          'ص 85-90: لام (أل) - اللام القمرية (ابغ حجك وخف عقيمه) واللام الشمسية (طب ثم صل...)',
          'ص 91-96: لام الفعل وأحكام إظهارها وإدغامها في اللام والراء'
        ]
      },
      {
        id: 'tajweed-m1-ch13',
        title: 'الجزء الثاني: المد وتعريفه وأقسامه والمد الطبيعي',
        pageStart: 97,
        pageEnd: 114,
        topics: [
          'ص 97-101: تعريف المد وحروفه الثلاثة وشروطها ومقاديره (القصر، التوسط، الإشباع)',
          'ص 102-108: أقسام المد (المد الأصلي الطبيعي والمد الفرعي بسبب الهمز أو السكون)',
          'ص 109-114: المد الطبيعي (الأصلي) وحالات ثبوته وصلاً ووقفاً ومقداره حركتان'
        ]
      },
      {
        id: 'tajweed-m1-ch14',
        title: 'الجزء الثاني: المدود الفرعية (المتصل، المنفصل، البدل، العارض، اللازم)',
        pageStart: 115,
        pageEnd: 156,
        topics: [
          'ص 115-121: المد المتصل (حكمه الوجوب ومقداره 4-5 حركات وشاهد الجمزوري)',
          'ص 122-131: المد المنفصل (حكمه الجواز وصوره وأحكام قصر المنفصل)',
          'ص 132-135: مد البدل (تقدم الهمز على حرف المد وحكمه ومقداره حركتان)',
          'ص 136-142: المد العارض للسكون (أوجهه الثلاثة: قصر وتوسط وإشباع)',
          'ص 143-147: المد اللازم (سكون أصلي ثابت، حكمه اللزوم، ومقداره 6 حركات)',
          'ص 148-155: أقسام المد اللازم الأربعة (كلمي وحرفي مثقل ومخفف) وشاهد التحفة',
          'ص 156: المخطط الشجري الشامل لجميع أقسام المد الأصلي والفرعي'
        ]
      }
    ]
  },
  {
    id: 'book-arabic-m1-1448',
    title: 'لغتي الخالدة - الأول المتوسط (طبعة 1448هـ)',
    book_name: 'لغتي الخالدة - الأول المتوسط',
    subject: 'اللغة العربية',
    subject_name: 'اللغة العربية',
    grade: 'الصف الأول المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/arabic-m1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/arabic-m1-1448',
    coverIcon: '📖',
    totalPages: 150,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/arabic-m1-1448',
    chapters: [
      {
        id: 'm1-a-ch1',
        title: 'الوحدة 1: القيم الإسلامية والتواصل الحضاري',
        pageStart: 14,
        pageEnd: 55,
        topics: ['المبتدأ والخبر وأنواعهما', 'مبني والمعرب من الأسماء', 'مهارات الرسالة الرسمية الإدارية']
      }
    ]
  },
  {
    id: 'book-english-m1-1448',
    title: 'اللغة الإنجليزية Super Goal 1 - الأول المتوسط (طبعة 1448هـ)',
    book_name: 'اللغة الإنجليزية Super Goal 1',
    subject: 'اللغة الإنجليزية',
    subject_name: 'اللغة الإنجليزية',
    grade: 'الصف الأول المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/english-m1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/english-m1-1448',
    coverIcon: '🇬🇧',
    totalPages: 135,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/english-m1-1448',
    chapters: [
      {
        id: 'm1-e-ch1',
        title: 'Unit 1: Good Morning! & What Day Is It?',
        pageStart: 10,
        pageEnd: 42,
        topics: ['Verb to be & Subject Pronouns', 'Days, Months & Cardinal Numbers', 'Real Life Conversations']
      }
    ]
  },
  {
    id: 'book-math-m2-1448',
    title: 'الرياضيات - الثاني المتوسط (طبعة 1448هـ)',
    book_name: 'الرياضيات - الثاني المتوسط',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الثاني المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-m2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-m2-1448',
    coverIcon: '🔢',
    totalPages: 180,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-m2-1448',
    chapters: [
      {
        id: 'm2-m-ch1',
        title: 'الفصل 1: الأعداد النسبية والقوى والجذور',
        pageStart: 12,
        pageEnd: 60,
        topics: ['كتابة أعداد نسبية ككسور عشرية', 'القوى والصيغ العلمية', 'الجذور التربيعية ونظرية فيثاغورس']
      }
    ]
  },
  {
    id: 'book-science-m2-1448',
    title: 'العلوم - الثاني المتوسط (طبعة 1448هـ)',
    book_name: 'العلوم - الثاني المتوسط',
    subject: 'العلوم',
    subject_name: 'العلوم',
    grade: 'الصف الثاني المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/science-m2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/science-m2-1448',
    coverIcon: '🧪',
    totalPages: 165,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/science-m2-1448',
    chapters: [
      {
        id: 'm2-sc-ch1',
        title: 'الوحدة 1: دراسة المادة والمخاليط والمحاليل',
        pageStart: 10,
        pageEnd: 52,
        topics: ['خصائص المادة وحالاتها', 'المخاليط المتجانسة وغير المتجانسة', 'الأحماض والقواعد والقيم الهيدروجينية pH']
      }
    ]
  },
  {
    id: 'book-islamic-m2-1448',
    title: 'الدراسات الإسلامية - الثاني المتوسط (طبعة 1448هـ)',
    book_name: 'الدراسات الإسلامية - الثاني المتوسط',
    subject: 'الدراسات الإسلامية',
    subject_name: 'الدراسات الإسلامية',
    grade: 'الصف الثاني المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/islamic-m2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/islamic-m2-1448',
    coverIcon: '🕌',
    totalPages: 160,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/islamic-m2-1448',
    chapters: [
      {
        id: 'm2-i-ch0',
        title: 'المدخل ودليل المنهج والرموز التعليمية وبوابة عين',
        pageStart: 1,
        pageEnd: 9,
        topics: [
          'بيانات الاعتماد الوزاري وطبعة 1448هـ',
          'مقدمة الكتاب ورؤية السعودية 2030',
          'الفهرس العام وتوزيع الوحدات والدروس',
          'دليل الرموز والأيقونات المعتمدة ومسار التقويم'
        ]
      },
      {
        id: 'm2-i-ch1',
        title: 'الوحدة الأولى: التوحيد والعقيدة الإسلامية',
        pageStart: 10,
        pageEnd: 45,
        topics: [
          'وجوب التوحيد وفضل تحقيقه وأدلته من القرآن والسنة',
          'الشرك الأكبر: تعريفه وأنواعه ومحبطات الأعمال',
          'الشرك الأصغر والرياء والحلف بغير الله تعالى',
          'حكم التمائم والرقى والتطير ووسائل حماية التوحيد'
        ]
      },
      {
        id: 'm2-i-ch2',
        title: 'الوحدة الثانية: التفسير وعلوم القرآن الكريم',
        pageStart: 46,
        pageEnd: 85,
        topics: [
          'تفسير سورة الفرقان (صفات عباد الرحمن وجزاؤهم)',
          'تفسير سورة النور (آداب الاستئذان وحرمة البيوت)',
          'تفسير سورة النور (حفظ الفروج وغض البصر وعفة المجتمع)'
        ]
      },
      {
        id: 'm2-i-ch3',
        title: 'الوحدة الثالثة: الحديث الشريف والسيرة النبوية',
        pageStart: 86,
        pageEnd: 120,
        topics: [
          'حديث شعب الإيمان وفضل خلق الحياء',
          'حديث الصدق والأمانة في التعامل والمعاملات',
          'حديث الأخوة الإيمانية وحقوق المسلم على المسلم'
        ]
      },
      {
        id: 'm2-i-ch4',
        title: 'الوحدة الرابعة: الفقه الإسلامي وأحكام المعاملات',
        pageStart: 121,
        pageEnd: 160,
        topics: [
          'كتاب البيوع: تعريفه وحكمه وشروط صحة البيع السبعة',
          'البيوع المنهي عنها: بيع الغرر والنجش',
          'أحكام الربا وصوره: ربا الفضل وربا النسيئة',
          'الخيارات في البيع والعقود والمعاملات المعاصرة'
        ]
      }
    ]
  },
  {
    id: 'book-math-m3-1448',
    title: 'الرياضيات - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'الرياضيات - الثالث المتوسط',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-m3-1448',
    coverIcon: '📐',
    totalPages: 190,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-m3-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'm3-m-ch1',
        title: 'الفصل 1: المعادلات الخطية والدوال',
        pageStart: 10,
        pageEnd: 55,
        topics: ['حل المعادلات ذات الخطوة الواحدة والمتعددة الخطوات', 'حل معادلات تتضمن قيم مطلقة', 'العلاقات والدوال البيانية']
      },
      {
        id: 'm3-m-ch2',
        title: 'الفصل 2: الأنظمة الخطية والمتباينات',
        pageStart: 56,
        pageEnd: 110,
        topics: ['حل نظام من معادلتين بيانيا وبالتعويض', 'الحل بالحذف بالجمع والطرح', 'حل المتباينات المتعددة الخطوات']
      }
    ]
  },
  {
    id: 'book-science-m3-1448',
    title: 'العلوم - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'العلوم - الثالث المتوسط',
    subject: 'العلوم',
    subject_name: 'العلوم',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/science-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/science-m3-1448',
    coverIcon: '🧪',
    totalPages: 170,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/science-m3-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 'm3-sc-ch1',
        title: 'الوحدة 1: الحركة والتسارع وقوانين نيوتن',
        pageStart: 12,
        pageEnd: 60,
        topics: ['السرعة المتجهة والتسارع', 'قوانين الحركة لنيوتن الثلاثة', 'الشغل الآلات البسيطة المركبة']
      }
    ]
  },
  {
    id: 'book-arabic-m3-1448',
    title: 'لغتي الخالدة - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'لغتي الخالدة - الثالث المتوسط',
    subject: 'اللغة العربية',
    subject_name: 'اللغة العربية',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/arabic-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/arabic-m3-1448',
    coverIcon: '📖',
    totalPages: 145,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/arabic-m3-1448',
    chapters: [
      {
        id: 'm3-a-ch1',
        title: 'الوحدة 1: حقوق وواجبات مجتمعية',
        pageStart: 15,
        pageEnd: 58,
        topics: ['اسم الفاعل واسم المفعول واعمالهما', 'الاستثناء بـ إلا وغير وسوى', 'صياغة التقارير الإدارية والمحاضر الرسمية']
      }
    ]
  },
  {
    id: 'book-social-m3-1448',
    title: 'الدراسات الاجتماعية - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'الدراسات الاجتماعية - الثالث المتوسط',
    subject: 'الدراسات الاجتماعية',
    subject_name: 'الدراسات الاجتماعية',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/social-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/social-m3-1448',
    coverIcon: '🗺️',
    totalPages: 135,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/social-m3-1448',
    chapters: [
      {
        id: 'm3-s-ch1',
        title: 'الوحدة 1: جغرافية المملكة والتنمية المستدامة',
        pageStart: 10,
        pageEnd: 50,
        topics: ['الموقع الفلكي والجغرافي للمملكة', 'السكان والتوزيع الديموغرافي', 'مشاريع رؤية 2030 الكبرى (نيوم، المربع، البحر الأحمر)']
      }
    ]
  },
  {
    id: 'book-digital-m3-1448',
    title: 'المهارات الرقمية والتفكير البرمجي - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'المهارات الرقمية والتفكير البرمجي',
    subject: 'المهارات الرقمية',
    subject_name: 'المهارات الرقمية',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/digital-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/digital-m3-1448',
    coverIcon: '💻',
    totalPages: 150,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/digital-m3-1448',
    chapters: [
      {
        id: 'm3-d-ch1',
        title: 'الوحدة 1: البرمجة بلغة بايثون Python والتصميم الرقمي',
        pageStart: 10,
        pageEnd: 60,
        topics: ['المتغيرات وأنواع البيانات في Python', 'الجمل الشرطية If..Else وتكرار For/While', 'تصميم المواقع وتطبيقات الويب']
      }
    ]
  },
  {
    id: 'book-critical-m3-1448',
    title: 'التفكير النقدي - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'التفكير النقدي - الثالث المتوسط',
    subject: 'التفكير النقدي',
    subject_name: 'التفكير النقدي',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/critical-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/critical-m3-1448',
    coverIcon: '🧠',
    totalPages: 130,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/critical-m3-1448',
    chapters: [
      {
        id: 'm3-cr-ch1',
        title: 'الوحدة 1: التفكير ومعايير الحجة والمنطق',
        pageStart: 12,
        pageEnd: 55,
        topics: ['مفهوم التفكير الناقد ومعاييره', 'التمييز بين الحقيقة والرأي والحجة المنطقية', 'المغالطات المنطقية وتفنيدها']
      }
    ]
  },
  {
    id: 'book-english-m3-1448',
    title: 'اللغة الإنجليزية Super Goal 3 - الثالث المتوسط (طبعة 1448هـ)',
    book_name: 'اللغة الإنجليزية Super Goal 3',
    subject: 'اللغة الإنجليزية',
    subject_name: 'اللغة الإنجليزية',
    grade: 'الصف الثالث المتوسط',
    stage: 'middle',
    education_stage: 'middle',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/english-m3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/english-m3-1448',
    coverIcon: '🔠',
    totalPages: 140,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/english-m3-1448',
    chapters: [
      {
        id: 'm3-e-ch1',
        title: 'Unit 1: Lifestyles & Life Experiences',
        pageStart: 10,
        pageEnd: 48,
        topics: ['Simple Present vs Present Continuous', 'Simple Past & Present Perfect Tenses', 'Essay Writing & Speaking Skills']
      }
    ]
  },

  // ==========================================
  // 3. المرحلة الثانوية - نظام المسارات (SECONDARY STAGE - 1448هـ)
  // ==========================================
  {
    id: 'book-physics-s1-1448',
    title: 'الفيزياء 1 - الأول الثانوي (المسار العام والمستقبلي 1448هـ)',
    book_name: 'الفيزياء 1 - الأول الثانوي',
    subject: 'الفيزياء',
    subject_name: 'الفيزياء',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/physics-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/physics-s1-1448',
    track: 'المسار العام',
    coverIcon: '⚡',
    totalPages: 215,
    editionYear: '1448هـ - 2027م (طبعة وزارة التعليم المحدثة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/physics-s1-1448',
    chapters: [
      {
        id: 's1-p-ch1',
        title: 'الفصل 1: مدخل إلى علم الفيزياء والحركة',
        pageStart: 10,
        pageEnd: 58,
        topics: ['الرياضيات والفيزياء والنظام الدولي SI', 'وصف الحركة والسرعة المتوسطة', 'الحركة المتسارعة وقوانين نيوتن']
      }
    ]
  },
  {
    id: 'book-chemistry-s1-1448',
    title: 'الكيمياء 1 - الأول الثانوي (طبعة 1448هـ)',
    book_name: 'الكيمياء 1 - الأول الثانوي',
    subject: 'الكيمياء',
    subject_name: 'الكيمياء',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/chemistry-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/chemistry-s1-1448',
    track: 'المسار العام',
    coverIcon: '🧪',
    totalPages: 200,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/chemistry-s1-1448',
    chapters: [
      {
        id: 's1-ch-ch1',
        title: 'الفصل 1: قصة الكيمياء والمادة وتغيراتها',
        pageStart: 12,
        pageEnd: 52,
        topics: ['مفهوم المادة وطبقة الأوزون والمواد الكيميائية', 'الخواص والتغيرات الفيزيائية والكيميائية', 'قانون حفظ الكتلة']
      }
    ]
  },
  {
    id: 'book-math-s1-1448',
    title: 'الرياضيات 1-1 - الأول الثانوي (طبعة 1448هـ)',
    book_name: 'الرياضيات 1-1 - الأول الثانوي',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-s1-1448',
    track: 'المسار العام',
    coverIcon: '📐',
    totalPages: 230,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-s1-1448',
    chapters: [
      {
        id: 's1-m-ch1',
        title: 'الفصل 1: التبرير والبرهان والهندسة الاستدلالية',
        pageStart: 10,
        pageEnd: 65,
        topics: ['التبرير الاستقرائي والتخمين', 'المنطق والعبارات الشرطية', 'البرهان الجبري والبرهان الهندسي']
      }
    ]
  },
  {
    id: 'book-tech-s1-1448',
    title: 'التقنية الرقمية 1 - الأول الثانوي (طبعة 1448هـ)',
    book_name: 'التقنية الرقمية 1 - الأول الثانوي',
    subject: 'التقنية الرقمية',
    subject_name: 'التقنية الرقمية',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/tech-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/tech-s1-1448',
    track: 'المسار العام',
    coverIcon: '🖥️',
    totalPages: 185,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/tech-s1-1448',
    chapters: [
      {
        id: 's1-t-ch1',
        title: 'الوحدة 1: الأساسيات الرقمية ومعالجة الصور والتصميم',
        pageStart: 12,
        pageEnd: 60,
        topics: ['تمثيل البيانات والنظام الثنائي', 'تحرير الصور الرقمية برامج GIMP', 'أساسيات لغة HTML5 والتنسيق CSS3']
      }
    ]
  },
  {
    id: 'book-arabic-s1-1448',
    title: 'الكفايات اللغوية 1 - الأول الثانوي (طبعة 1448هـ)',
    book_name: 'الكفايات اللغوية 1 - الأول الثانوي',
    subject: 'اللغة العربية',
    subject_name: 'اللغة العربية',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/arabic-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/arabic-s1-1448',
    track: 'المسار العام',
    coverIcon: '📚',
    totalPages: 160,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/arabic-s1-1448',
    chapters: [
      {
        id: 's1-a-ch1',
        title: 'الكفاية النحوية والإملائية والكتابية',
        pageStart: 10,
        pageEnd: 62,
        topics: ['الجملة العربية النواسخ والمعربات', 'همزتا الوصل والقطع والألف اللينة', 'مهارات الإلقاء والتواصل الشفهي']
      }
    ]
  },
  {
    id: 'book-health-s1-1448',
    title: 'اللياقة والثقافة الصحية - الأول الثانوي (طبعة 1448هـ)',
    book_name: 'اللياقة والثقافة الصحية - الأول الثانوي',
    subject: 'اللياقة والصحة',
    subject_name: 'اللياقة والصحة',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/health-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/health-s1-1448',
    track: 'المسار العام',
    coverIcon: '🏃‍♂️',
    totalPages: 140,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/health-s1-1448',
    chapters: [
      {
        id: 's1-h-ch1',
        title: 'الوحدة 1: النشاط البدني والغذاء المتوازن والتغذية الرياضية',
        pageStart: 10,
        pageEnd: 50,
        topics: ['مستويات النشاط البدني اليومي', 'حساب السعرات ومؤشر كتلة الجسم BMI', 'الوقاية من الأمراض المزمنة']
      }
    ]
  },
  {
    id: 'book-english-s1-1448',
    title: 'اللغة الإنجليزية Mega Goal 1 - الأول الثانوي (طبعة 1448هـ)',
    book_name: 'اللغة الإنجليزية Mega Goal 1',
    subject: 'اللغة الإنجليزية',
    subject_name: 'اللغة الإنجليزية',
    grade: 'الصف الأول الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/english-s1-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/english-s1-1448',
    track: 'المسار العام',
    coverIcon: '🌐',
    totalPages: 165,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/english-s1-1448',
    chapters: [
      {
        id: 's1-e-ch1',
        title: 'Unit 1: Big Changes & Future Prospects',
        pageStart: 10,
        pageEnd: 50,
        topics: ['Present Perfect Simple & Continuous', 'Expressing Predictions & Future Intentions', 'Formal Correspondence Writing']
      }
    ]
  },
  {
    id: 'book-ai-s2-1448',
    title: 'الذكاء الاصطناعي 1 - الثاني الثانوي (مسار الهندسة والحاسب 1448هـ)',
    book_name: 'الذكاء الاصطناعي 1 - مسار الهندسة والحاسب',
    subject: 'الذكاء الاصطناعي',
    subject_name: 'الذكاء الاصطناعي',
    grade: 'الصف الثاني الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/ai-s2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/ai-s2-1448',
    track: 'مسار الهندسة والحاسب',
    coverIcon: '🤖',
    totalPages: 210,
    editionYear: '1448هـ - 2027م (تحديث جديد عين)',
    portalUrl: 'https://ien.edu.sa/Home/Book/ai-s2-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 's2-ai-ch1',
        title: 'الوحدة 1: أساسيات تعلم الآلة والشبكات العصبية الاصطناعية',
        pageStart: 12,
        pageEnd: 68,
        topics: ['التعلم الموجه Supervised Learning', 'نماذج خوارزمية Decision Trees و KNN', 'خوارزميات الرؤية الحاسوبية ومعالجة الصور']
      },
      {
        id: 's2-ai-ch2',
        title: 'الوحدة 2: النمذجة التنبؤية وأخلاقيات AI',
        pageStart: 69,
        pageEnd: 125,
        topics: ['التحيز في البيانات والبيانات العادلة Fair Data', 'تقييم كفاءة النموذج Precision & Recall', 'الأمن السيبراني ونماذج الذكاء التوليدي']
      }
    ]
  },
  {
    id: 'book-biology-s2-1448',
    title: 'علم الأحياء 2 - الثاني الثانوي (مسار الصحة والحياة 1448هـ)',
    book_name: 'علم الأحياء 2 - مسار الصحة والحياة',
    subject: 'الأحياء',
    subject_name: 'الأحياء',
    grade: 'الصف الثاني الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/biology-s2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/biology-s2-1448',
    track: 'مسار الصحة والحياة',
    coverIcon: '🧬',
    totalPages: 225,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/biology-s2-1448',
    chapters: [
      {
        id: 's2-b-ch1',
        title: 'الفصل 1: الجهاز العصبي والغدد والمناعة البشرية',
        pageStart: 15,
        pageEnd: 70,
        topics: ['تركيب السيال العصبي والخلية العصبية', 'التشريح الوظيفي لجهاز الغدد الصماء', 'المناعة المتخصصة والأجسام المضادة']
      }
    ]
  },
  {
    id: 'book-physics-s2-1448',
    title: 'الفيزياء 2 - الثاني الثانوي (مسار الهندسة والحاسب 1448هـ)',
    book_name: 'الفيزياء 2 - مسار الهندسة والحاسب',
    subject: 'الفيزياء',
    subject_name: 'الفيزياء',
    grade: 'الصف الثاني الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/physics-s2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/physics-s2-1448',
    track: 'مسار الهندسة والحاسب',
    coverIcon: '⚡',
    totalPages: 220,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/physics-s2-1448',
    chapters: [
      {
        id: 's2-p-ch1',
        title: 'الفصل 1: الحركة الدورانية والزخم وحفظه',
        pageStart: 10,
        pageEnd: 65,
        topics: ['الإزاحة والسرعة والتسارع الزاوي', 'عزم القوة ودوران الأجسام الصلبة', 'قانون حفظ الزخم وتطبيقات التصادم']
      }
    ]
  },
  {
    id: 'book-chemistry-s2-1448',
    title: 'الكيمياء 2 - الثاني الثانوي (طبعة 1448هـ)',
    book_name: 'الكيمياء 2 - الثاني الثانوي',
    subject: 'الكيمياء',
    subject_name: 'الكيمياء',
    grade: 'الصف الثاني الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/chemistry-s2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/chemistry-s2-1448',
    track: 'مسار الصحة والحياة',
    coverIcon: '⚗️',
    totalPages: 210,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/chemistry-s2-1448',
    chapters: [
      {
        id: 's2-ch-ch1',
        title: 'الفصل 1: الإلكترونات في الذرات والجدول الدوري',
        pageStart: 12,
        pageEnd: 58,
        topics: ['الضوء والطاقة المكمأة', 'النموذج الكمي للذرة', 'التوزيع الإلكتروني والتكافؤ']
      }
    ]
  },
  {
    id: 'book-math-s2-1448',
    title: 'الرياضيات 2-1 - الثاني الثانوي (طبعة 1448هـ)',
    book_name: 'الرياضيات 2-1 - الثاني الثانوي',
    subject: 'الرياضيات',
    subject_name: 'الرياضيات',
    grade: 'الصف الثاني الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/math-s2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/math-s2-1448',
    track: 'المسار العام',
    coverIcon: '📊',
    totalPages: 240,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/math-s2-1448',
    chapters: [
      {
        id: 's2-m-ch1',
        title: 'الفصل 1: الدوال والمصفوفات والمصفوفة العكسية',
        pageStart: 10,
        pageEnd: 65,
        topics: ['خصائص الأعداد الحقيقية والعلاقات والدوال', 'العمليات على المصفوفات والمحددات', 'حل أنظمة المعادلات بالمصفوفات']
      }
    ]
  },
  {
    id: 'book-finance-s2-1448',
    title: 'الإدارة المالية - الثاني الثانوي (مسار إدارة الأعمال 1448هـ)',
    book_name: 'الإدارة المالية - مسار إدارة الأعمال',
    subject: 'إدارة الأعمال',
    subject_name: 'إدارة الأعمال',
    grade: 'الصف الثاني الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/finance-s2-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/finance-s2-1448',
    track: 'مسار إدارة الأعمال',
    coverIcon: '💼',
    totalPages: 195,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/finance-s2-1448',
    chapters: [
      {
        id: 's2-f-ch1',
        title: 'الوحدة 1: القوائم المالية والميزانية والأسواق المالية',
        pageStart: 10,
        pageEnd: 55,
        topics: ['ميزانية الشركات وقائمة الدخل', 'القيمة الزمنية للأنشطة المالية', 'إدارة المخاطر والاستثمار في الأسهم']
      }
    ]
  },
  {
    id: 'book-ai-s3-1448',
    title: 'الذكاء الاصطناعي 2 والأمن السيبراني - الثالث الثانوي (طبعة 1448هـ)',
    book_name: 'الذكاء الاصطناعي 2 والأمن السيبراني',
    subject: 'الذكاء الاصطناعي',
    subject_name: 'الذكاء الاصطناعي',
    grade: 'الصف الثالث الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/ai-s3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/ai-s3-1448',
    track: 'مسار الهندسة والحاسب',
    coverIcon: '🔐',
    totalPages: 230,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/ai-s3-1448',
    isLatestSync: true,
    chapters: [
      {
        id: 's3-ai-ch1',
        title: 'الوحدة 1: التعلم العميق Deep Learning والنماذج التوليدية',
        pageStart: 12,
        pageEnd: 70,
        topics: ['الشبكات العصبية التلافيفية CNN للصور', 'نماذج اللغات الضخمة LLMs والتوليد الذكي', 'التشفير الرقمي والسيبراني لحماية النماذج']
      }
    ]
  },
  {
    id: 'book-datascience-s3-1448',
    title: 'علم البيانات والتصميم الهندسي - الثالث الثانوي (طبعة 1448هـ)',
    book_name: 'علم البيانات والتصميم الهندسي',
    subject: 'علم البيانات',
    subject_name: 'علم البيانات',
    grade: 'الصف الثالث الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/datascience-s3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/datascience-s3-1448',
    track: 'مسار الهندسة والحاسب',
    coverIcon: '📈',
    totalPages: 215,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/datascience-s3-1448',
    chapters: [
      {
        id: 's3-ds-ch1',
        title: 'الوحدة 1: تنظيف البيانات وتحليلها باستخدام مكتبات Pandas & Seaborn',
        pageStart: 10,
        pageEnd: 65,
        topics: ['جمع البيانات الاستكشافية EDA', 'تمثيل البيانات بصرياً والشاشات التفاعلية', 'التنبؤ والتحليل الإحصائي الاستدلالي']
      }
    ]
  },
  {
    id: 'book-islamic-s3-1448',
    title: 'الدراسات الإسلامية والقرآن الكريم - الثالث الثانوي (طبعة 1448هـ)',
    book_name: 'الدراسات الإسلامية والقرآن الكريم',
    subject: 'الدراسات الإسلامية',
    subject_name: 'الدراسات الإسلامية',
    grade: 'الصف الثالث الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/islamic-s3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/islamic-s3-1448',
    track: 'المسار العام',
    coverIcon: '📖',
    totalPages: 180,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/islamic-s3-1448',
    chapters: [
      {
        id: 's3-i-ch1',
        title: 'التفسير والمواريث والفرائض والقضايا الفقهية المعاصرة',
        pageStart: 10,
        pageEnd: 60,
        topics: ['تفسير آيات الأحكام والمواطنة', 'علم المواريث والفرائض وتطبيقاتها', 'القضايا الطبية والمالية المعاصرة']
      }
    ]
  },
  {
    id: 'book-english-s3-1448',
    title: 'اللغة الإنجليزية Mega Goal 3 - الثالث الثانوي (طبعة 1448هـ)',
    book_name: 'اللغة الإنجليزية Mega Goal 3',
    subject: 'اللغة الإنجليزية',
    subject_name: 'اللغة الإنجليزية',
    grade: 'الصف الثالث الثانوي',
    stage: 'secondary',
    education_stage: 'secondary',
    term: 1,
    semester: 1,
    academic_year: '1448هـ - 2027م',
    is_active: true,
    book_pdf_url: 'https://ien.edu.sa/preview/english-s3-1448.pdf',
    source_url: 'https://ien.edu.sa/Home/Book/english-s3-1448',
    track: 'المسار العام',
    coverIcon: '🎓',
    totalPages: 180,
    editionYear: '1448هـ - 2027م (طبعة معتمدة جديدة)',
    portalUrl: 'https://ien.edu.sa/Home/Book/english-s3-1448',
    chapters: [
      {
        id: 's3-e-ch1',
        title: 'Unit 1: Innovation, Career Paths & Advanced Discourse',
        pageStart: 10,
        pageEnd: 55,
        topics: ['Advanced Modal Verbs & Conditionals', 'Academic Research & Argumentative Essays', 'IELTS / TOEFL Preparation Techniques']
      }
    ]
  }
];

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  id: '',
  name: '',
  grade: '',
  stage: 'middle',
  avatar: '🧑‍🎓',
  schoolSlug: '',
  screenTimeDailyLimitMinutes: 120,
  screenTimeUsedTodayMinutes: 0,
  aiQuestionsCountToday: 0,
  subjectsPerformance: [],
  upcomingExams: [],
  aiRevisionPlan: undefined
};

export const INITIAL_HOMEWORKS: HomeworkAssignment[] = [];

export const INITIAL_QUIZZES: QuizItem[] = [];

export const INITIAL_REFERRALS: CounselingReferral[] = [];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];

export const INITIAL_STUDY_GROUPS: StudyGroup[] = [];

export const INITIAL_STUDY_MESSAGES: StudyGroupMessage[] = [];

export const INITIAL_AUDIT_LOGS: ModerationAuditLogItem[] = [];

