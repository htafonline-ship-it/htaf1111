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

export const INITIAL_REGISTRATION_CODES: SchoolRegistrationCode[] = [
  {
    id: 'code-101',
    code: 'SCH-2026-RIYADH-01',
    schoolNameAssigned: 'مدرسة النموذجية الذكية بفرع الرياض',
    createdDate: '2026-01-01',
    status: 'مستخدم',
    usedBySchoolId: 'school-1',
    usedAtDate: '2026-01-05',
    cityRegion: 'الرياض'
  },
  {
    id: 'code-102',
    code: 'SCH-2026-JEDDAH-02',
    schoolNameAssigned: 'معد ومدارس الأجيال العالمية والأهلية',
    createdDate: '2026-01-10',
    status: 'مستخدم',
    usedBySchoolId: 'school-2',
    usedAtDate: '2026-01-12',
    cityRegion: 'جدة'
  },
  {
    id: 'code-103',
    code: 'SCH-2026-DAMMAM-03',
    schoolNameAssigned: 'مدارس المجد النموذجية الأهلية',
    createdDate: '2026-01-15',
    status: 'مستخدم',
    usedBySchoolId: 'school-3',
    usedAtDate: '2026-01-18',
    cityRegion: 'الدمام'
  },
  {
    id: 'code-104',
    code: 'SCH-2026-VIP-99',
    schoolNameAssigned: 'مدرسة جديدة (قيد التجهيز)',
    createdDate: '2026-02-01',
    status: 'نشط',
    cityRegion: 'الرياض - تعليم شرق'
  },
  {
    id: 'code-105',
    code: 'SCH-2026-MAKKAH-88',
    schoolNameAssigned: 'مدرسة مكة المتقدمة',
    createdDate: '2026-02-05',
    status: 'نشط',
    cityRegion: 'مكة المكرمة'
  }
];

export const INITIAL_BULK_STUDENTS_SAMPLE: BulkStudentRow[] = [
  {
    id: 'row-1',
    fullName: 'عبدالله بن فهد القحطاني',
    nationalId: '1098827361',
    grade: 'الصف الثالث المتوسط',
    section: '3/أ',
    parentPhone: '0501234567',
    status: 'valid'
  },
  {
    id: 'row-2',
    fullName: 'سعد بن عبدالعزيز الشهري',
    nationalId: '1087723910',
    grade: 'الصف الثالث المتوسط',
    section: '3/أ',
    parentPhone: '0559876543',
    status: 'valid'
  },
  {
    id: 'row-3',
    fullName: 'عمر بن خالد الدوسري',
    nationalId: '1098827361', // Duplicate ID for test demo
    grade: 'الصف الثالث المتوسط',
    section: '3/ب',
    parentPhone: '0543332211',
    status: 'duplicate_id'
  },
  {
    id: 'row-4',
    fullName: 'محمد بن راشد العتيبي',
    nationalId: '1076612984',
    grade: 'الصف الأول الثانوي',
    section: '1/ج',
    parentPhone: '0567788990',
    status: 'valid'
  },
  {
    id: 'row-5',
    fullName: 'يوسف بن سلمان الحربي',
    nationalId: '',
    grade: 'الصف الثاني المتوسط',
    section: '2/أ',
    parentPhone: '0500001122',
    status: 'missing_info'
  }
];

export const INITIAL_SCHOOLS: SchoolTenant[] = [
  {
    id: 'school-1',
    name: 'مدرسة النموذجية الذكية بفرع الرياض',
    nameEn: 'Al-Namouthajya Smart School',
    slug: 'al-namouthajya',
    logoText: 'هـ',
    badge: 'مدرسة متميزة VIP',
    primaryColor: '#059669', // Emerald
    accentColor: '#10b981',
    motto: 'نصنع قادة المستقبل برؤية تعليمية ذكية',
    location: 'الرياض - حي حطين',
    registrationCodeUsed: 'SCH-2026-RIYADH-01',
    isApproved: true,
    principalName: 'أ. د. عبدالمحسن العتيبي',
    principalEmail: 'principal@alnamouthajya.edu.sa',
    totalStudentsCount: 420,
    totalTeachersCount: 35,
    circulars: [
      {
        id: 'circ-101',
        title: 'الخطة الزمنية لاختبارات منتصف الفصل الدراسي الثاني',
        number: 'ت-2026/04',
        date: '2026-02-10',
        priority: 'عاجل',
        category: 'اختبارات',
        content: 'المكرمون أولياء الأمور والطلاب، نفيدكم ببدء اختبارات منتصف الفصل الدراسي الثاني اعتباراً من الأحد القادم. نأمل الالتزام بالحضور المبكر والاستعانة بخطط المراجعة في المنصة.',
        targetAudience: 'الجميع',
        attachedDocName: 'جدول_الاختبارات_النصفية.pdf'
      },
      {
        id: 'circ-102',
        title: 'تفعيل المساعد الذكي "هتاف العاصمي" لحل المسائل',
        number: 'ت-2026/02',
        date: '2026-02-01',
        priority: 'هام',
        category: 'إداري',
        content: 'تم تفعيل تقنية الذكاء الاصطناعي لحل المسائل وربطها بالكتب الوزارية المعتمدة. نوصي بفتح حسابات المتابعة لأولياء الأمور.',
        targetAudience: 'الجميع'
      }
    ]
  },
  {
    id: 'school-2',
    name: 'معد ومدارس الأجيال العالمية والأهلية',
    nameEn: 'Al-Ajeal Schools',
    slug: 'al-ajeal',
    logoText: 'جـ',
    badge: 'اعتماد دولي',
    primaryColor: '#2563eb', // Blue
    accentColor: '#3b82f6',
    motto: 'الأصالة والتطوير العلمي',
    location: 'جدة - حي الشاطئ',
    registrationCodeUsed: 'SCH-2026-JEDDAH-02',
    isApproved: true,
    principalName: 'د. سارة الماجد',
    principalEmail: 'principal@alajeal.edu.sa',
    totalStudentsCount: 310,
    totalTeachersCount: 28,
    circulars: [
      {
        id: 'circ-201',
        title: 'ورشة عمل التوجيه والإرشاد الطلابي للتفوق الأكاديمي',
        number: 'ت-ج/88',
        date: '2026-02-05',
        priority: 'عادي',
        category: 'إرشاد طلابي',
        content: 'يدعو قسم الإرشاد الطلابي أولياء أمور الطلاب لحضور الجلسة التفاعلية الذكية حول الاستعداد النفسي للاختبارات النهائية.',
        targetAudience: 'أولياء الأمور'
      }
    ]
  },
  {
    id: 'school-3',
    name: 'مدارس المجد النموذجية الأهلية',
    nameEn: 'Al-Majd Schools',
    slug: 'al-majd',
    logoText: 'مـ',
    badge: 'رائدة التكنولوجيا',
    primaryColor: '#7c3aed', // Purple
    accentColor: '#8b5cf6',
    motto: 'علمٌ يضيء ورؤية ترتقي',
    location: 'الدمام - حي الشاطئ الشرقي',
    registrationCodeUsed: 'SCH-2026-DAMMAM-03',
    isApproved: true,
    principalName: 'أ. خالد التميمي',
    principalEmail: 'principal@almajd.edu.sa',
    totalStudentsCount: 280,
    totalTeachersCount: 22,
    circulars: []
  }
];

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
        topics: ['التصنيف وفق خاصية واحدة', 'الأعداد 1، 2، 3', 'قراءة الأعداد وكتباتها حتى 5']
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
        topics: ['مملكة النباتات ومملكة الحيوانات', 'تركيب الخلية النباتية والحيوانية', 'الأجهزة الحييوية في الكائنات الحية']
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
        id: 'm2-i-ch1',
        title: 'التفسير والحديث والتوقيد والفقه',
        pageStart: 10,
        pageEnd: 70,
        topics: ['تفسير سور الفرقان والنور', 'حديث الإيمان والحياء', 'أحكام المعاملات المالية والمبيعات في الفقه']
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
        topics: ['مفهوم التفكير الناقد ومعاييره', 'التمييز بين الحقيقة والرأي والحجة المنطقية', 'المغالطات المنطقية وتفنيذها']
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
        topics: ['التحيز في البيانات البيانات العادلة Fair Data', 'تقييم كفاءة النموذج Precision & Recall', 'الأمن السبراني ونماذج الذكاء التوليدي']
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
        topics: ['تركيب السيال العصبي والخليلة العصبية', 'التشريح الوظيفي لجهاز الغدد الصماء', 'المناعة المتخصصة والأجسام المضادة']
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
        topics: ['خصائص الأعداد الحقيقية والعلاقات والدوال', 'العمليات على المصفوفات والحددات', 'حل أنظمة المعادلات بالمصفوفات']
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
        title: 'التفسير التوافق والفرائض والقضايا الفقهية المعاصرة',
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
  id: 'std-2026-01',
  name: 'طالب منصة هتاف العاصمي',
  grade: 'الصف الثالث المتوسط (شعبة 3/أ)',
  stage: 'middle',
  avatar: '🧑‍🎓',
  schoolSlug: 'al-namouthajya',
  screenTimeDailyLimitMinutes: 90,
  screenTimeUsedTodayMinutes: 42,
  aiQuestionsCountToday: 8,
  subjectsPerformance: [
    {
      subject: 'الرياضيات',
      scorePercentage: 94,
      gradeLetter: 'ممتاز A+',
      masteryLevel: 'ممتاز',
      homeworkCompleted: 12,
      totalHomework: 12
    },
    {
      subject: 'العلوم',
      scorePercentage: 88,
      gradeLetter: 'جيد جداً A',
      masteryLevel: 'جيد جداً',
      homeworkCompleted: 10,
      totalHomework: 11
    },
    {
      subject: 'الفيزياء',
      scorePercentage: 82,
      gradeLetter: 'جيد جداً B+',
      masteryLevel: 'جيد جداً',
      homeworkCompleted: 7,
      totalHomework: 9
    },
    {
      subject: 'اللغة العربية',
      scorePercentage: 96,
      gradeLetter: 'ممتاز A+',
      masteryLevel: 'ممتاز',
      homeworkCompleted: 14,
      totalHomework: 14
    }
  ],
  upcomingExams: [
    {
      id: 'ex-1',
      subject: 'الرياضيات',
      date: '2026-02-15',
      topic: 'الفصل 6: تحليل المعادلات التربيعية وتطبيقاتها',
      difficulty: 'متوسط إلى متقدم'
    },
    {
      id: 'ex-2',
      subject: 'العلوم',
      date: '2026-02-18',
      topic: 'التفاعلات الكيميائية والجدول الدوري',
      difficulty: 'متوسط'
    }
  ],
  aiRevisionPlan: {
    title: 'خطة التفوق والاستعداد لاختبار الرياضيات والعلوم',
    description: 'خطة مراجعة ذكية مصممة خصيصاً لسارة بناءً على تحليل نقاط القوة وتدريبات منصة «هتاف العاصمي».',
    daysCount: 5,
    tasks: [
      { day: 1, title: 'مراجعة تحليل وحيدات الحد والمربعات الكاملة (كتاب الرياضيات - ص 52)', completed: true, subject: 'الرياضيات' },
      { day: 2, title: 'حل 5 مسائل على القانون العام والمميز ب²-4أج واستخدام حلال المسائل الذكي', completed: true, subject: 'الرياضيات' },
      { day: 3, title: 'مراجعة التركيب الذري والروابط الكيميائية (كتاب العلوم - ص 62)', completed: false, subject: 'العلوم' },
      { day: 4, title: 'جلسة المعلم التفاعلي الذكي للتأكد من فهم تفاعلات الأكسدة والسرعة الكيميائية', completed: false, subject: 'العلوم' },
      { day: 5, title: 'حل نموذج اختبار تجريبي شامل مع التقييم الفوري', completed: false, subject: 'الرياضيات' }
    ]
  }
};

export const INITIAL_HOMEWORKS: HomeworkAssignment[] = [
  {
    id: 'hw-101',
    title: 'حل واجب تحليل المعادلات التربيعية',
    subject: 'الرياضيات',
    dueDate: '2026-02-12',
    totalPoints: 10,
    status: 'pending',
    schoolSlug: 'al-namouthajya',
    gradeLevel: 'الثالث المتوسط',
    description: 'قم بحل المسائل رقم 3 و 7 و 12 في كتاب الطالب صفحة 64 مع توضيح خطوات الحل التفصيلية.',
    textbookPage: 64
  },
  {
    id: 'hw-102',
    title: 'تقرير مصغر عن الروابط التساهمية والأيونية',
    subject: 'العلوم',
    dueDate: '2026-02-14',
    totalPoints: 15,
    status: 'submitted',
    score: 14,
    feedback: 'عمل ممتاز يا سارة، الرسوم التوضيحية كانت واضحة ومتقنة.',
    schoolSlug: 'al-namouthajya',
    gradeLevel: 'الثالث المتوسط',
    description: 'كتابة ملخص من 200 كلمة يوضح الفرق بين الرابطة الأيونية والتساهمية مع إعطاء مثال لكل منهما من واقع الحياة.'
  },
  {
    id: 'hw-103',
    title: 'استخراج أسماء الفاعلين والمفعولين من نص النصيحة',
    subject: 'اللغة العربية',
    dueDate: '2026-02-10',
    totalPoints: 10,
    status: 'graded',
    score: 10,
    feedback: 'درجة كاملة، إجابات دقيقة واعراب صحيح.',
    schoolSlug: 'al-namouthajya',
    gradeLevel: 'الثالث المتوسط',
    description: 'استخرج من النص في صفحة 30 ثلاثة أسماء فاعل وزنتها واذكر أفعالها الثلاثية.'
  }
];

export const INITIAL_QUIZZES: QuizItem[] = [
  {
    id: 'qz-201',
    title: 'اختبار قصير: المعادلات الخطية ونظام المعادلتين',
    subject: 'الرياضيات',
    durationMinutes: 15,
    status: 'available',
    totalQuestions: 4,
    questions: [
      {
        id: 'q1',
        question: 'ما قيمة س في المعادلة: 2س + 5 = 15؟',
        options: ['س = 3', 'س = 5', 'س = 10', 'س = 7'],
        correctAnswer: 1,
        explanation: 'بطرح 5 من الطرفين: 2س = 10، ثم بالقسمة على 2 نحصل على س = 5.'
      },
      {
        id: 'q2',
        question: 'المقدار المميز في القانون العام للمعادلات التربيعية يساوي:',
        options: ['أ² + ب²', 'ب² - 4أج', '2أ / ب', 'ب / (2أ)'],
        correctAnswer: 1,
        explanation: 'المميز هو ب² - 4أج ويحدد عدد ونوع جذور المعادلة التربيعية.'
      },
      {
        id: 'q3',
        question: 'إذا كان المميز أقل من الصفر (سالب)، فإن المعادلة التربيعية:',
        options: ['لها حلان حقيقيان', 'لها حل حقيقي واحد', 'ليس لها حلول حقيقية (حلول مركبة)', 'لها عدد لا نهائي من الحلول'],
        correctAnswer: 2,
        explanation: 'عندما يكون المميز سالباً، لا يوجد جذر تربيعي حقيقي له وبالتالي لا توجد حلول حقيقية.'
      },
      {
        id: 'q4',
        question: 'تحليل المقدار س² + 5س + 6 هو:',
        options: ['(س + 1)(س + 6)', '(س + 2)(س + 3)', '(س - 2)(س - 3)', '(س + 5)(س + 1)'],
        correctAnswer: 1,
        explanation: 'نبحث عن عددين حاصل ضربهما 6 ومجموعهما 5، وهما 2 و 3.'
      }
    ]
  },
  {
    id: 'qz-202',
    title: 'اختبار قصير: الجدول الدوري والتوزيع الإلكتروني',
    subject: 'العلوم',
    durationMinutes: 10,
    status: 'completed',
    score: 100,
    totalQuestions: 3,
    questions: [
      {
        id: 'qs1',
        question: 'شحنة النواة في الذرة تكون دائماً:',
        options: ['سالبة', 'موجبة', 'متعادلة', 'متغيرة'],
        correctAnswer: 1,
        explanation: 'النواة تحتوي على البروتونات الموجبة والنيوترونات المتعادلة، فتكون شحنتها الكلية موجبة.'
      }
    ]
  }
];

export const INITIAL_REFERRALS: CounselingReferral[] = [
  {
    id: 'ref-301',
    studentName: 'أحمد خالد الشمري',
    grade: 'الصف الأول الثانوي (شعبة 1/ب)',
    referrerName: 'أ. منصور العتيبي',
    referrerRole: 'معلم',
    date: '2026-02-08',
    category: 'أكاديمي',
    priority: 'متوسط',
    status: 'قيد المتابعة',
    reason: 'تراجع ملحوظ في درجات مادة الفيزياء وقسوة التشتت أثناء الحصص الأخيرة.',
    confidentialNotes: [
      {
        id: 'cn-1',
        author: 'الموجه الطلابي د. إبراهيم السعيد',
        date: '2026-02-09',
        note: 'تمت مقابلة الطالب ودياً، وتبين وجود صعوبة في مراجعة دروس الحركة المتسارعة. تم تحويله لخطة التمكين واستخدام المساعد الذكي "منصة هتاف العاصمي".'
      }
    ],
    actionPlan: 'جلسة أسبوعية مع الموجه الطلابي + استدعاء ولي الأمر لتنسيق تنظيم وقت الاستيعاب.'
  },
  {
    id: 'ref-302',
    studentName: 'ريان فهد العبد الله',
    grade: 'الصف الثاني المتوسط (شعبة 2/أ)',
    referrerName: 'أم ريان (ولي أمر)',
    referrerRole: 'ولي أمر',
    date: '2026-02-04',
    category: 'غياب وتأخر',
    priority: 'عاجل',
    status: 'جديد',
    reason: 'طلب مساعدة من الموجه الطلابي لمعالجة القلق النفسي الشديد قبل الاختبارات القصيرة.',
    confidentialNotes: [],
    actionPlan: ''
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-101',
    studentName: 'سارة عبد الله العاصمي',
    grade: 'الثالث المتوسط (3/أ)',
    category: 'استفسار أكاديمي',
    subject: 'طلب توضيح آلية درجات منتصف الفصل في مادة الرياضيات',
    status: 'قيد المعالجة',
    createdAt: '2026-02-08 09:15 ص',
    lastUpdated: '2026-02-09 08:10 ص',
    priority: 'متوسط',
    messages: [
      {
        id: 'msg-t1',
        senderRole: 'student',
        senderName: 'سارة عبد الله العاصمي',
        text: 'السلام عليكم ورحمة الله، أود الاستفسار عن توزيع درجات المشروعات العملية في مادة الرياضيات وهل تم احتساب حلول المسائل عبر المنصة؟',
        timestamp: '2026-02-08 09:15 ص'
      },
      {
        id: 'msg-t2',
        senderRole: 'principal',
        senderName: 'إدارة شؤون الطلاب - أ. عبد العزيز المقرن',
        text: 'وعليكم السلام ورحمة الله وبركاته، أهلاً يا سارة. نعم، يتم احتساب 10% من الدرجة للأنشطة الذكية وحل الواجبات عبر منصة هتاف العاصمي. يسعدنا حرصك وتفوقك!',
        timestamp: '2026-02-09 08:10 ص'
      }
    ]
  },
  {
    id: 'tkt-102',
    studentName: 'فيصل محمد الدوسري',
    grade: 'الصف الثاني الثانوي',
    category: 'طلب مستندات رسمية',
    subject: 'طلب تعريف طالب إلكتروني مختوم لمسار الهندسة',
    status: 'مكتمل',
    createdAt: '2026-02-07 11:30 ص',
    lastUpdated: '2026-02-07 14:00 م',
    priority: 'عادي',
    messages: [
      {
        id: 'msg-f1',
        senderRole: 'student',
        senderName: 'فيصل محمد الدوسري',
        text: 'أرجو إصدار مشهد إثبات طالب لمسار الهندسة والحاسب موجه للجهات المعنية.',
        timestamp: '2026-02-07 11:30 ص'
      },
      {
        id: 'msg-f2',
        senderRole: 'principal',
        senderName: 'إدارة التسجيل والقبول',
        text: 'تم إصدار المشهد رسمياً وتصديقه رقمياً. تجدون الملف مرفقاً أدناه.',
        timestamp: '2026-02-07 14:00 م',
        attachmentName: 'إثبات_طالب_مختوم_2026.pdf'
      }
    ]
  }
];

export const INITIAL_STUDY_GROUPS: StudyGroup[] = [
  {
    id: 'group-math-m3',
    name: 'غرفة مذاكرة الرياضيات - الثالث المتوسط',
    subject: 'الرياضيات',
    grade: 'الصف الثالث المتوسط',
    membersCount: 28,
    icon: '📐',
    description: 'مجموعة مخصصة للمناقشة الجماعية وتداول حلول مسائل المعادلات التربيعية المنهجية.'
  },
  {
    id: 'group-science-m3',
    name: 'نادي العلوم والابتكار (الثالث المتوسط)',
    subject: 'العلوم',
    grade: 'الصف الثالث المتوسط',
    membersCount: 22,
    icon: '🧪',
    description: 'مناقشة تجارب التفاعلات الكيميائية والجدول الدوري وتحضير الاختبارات القصيرة.'
  },
  {
    id: 'group-ai-s2',
    name: 'مجموعة مسار الهندسة والحاسب - الذكاء الاصطناعي',
    subject: 'الذكاء الاصطناعي',
    grade: 'الصف الثاني الثانوي',
    membersCount: 19,
    icon: '🤖',
    description: 'نقاشات التعلم الآلي، البرمجة، وتطبيقات منصة مدرستي وعين.'
  }
];

export const INITIAL_STUDY_MESSAGES: StudyGroupMessage[] = [
  {
    id: 'sgm-1',
    groupId: 'group-math-m3',
    senderName: 'سارة عبد الله العاصمي',
    senderAvatar: '👧',
    senderRole: 'student',
    text: 'يا زميلاتي، من جربت حل مسألة المميز في صفحة 64؟ القانون هو ب² - 4 أ ج والحل دقيق جداً باستخدام المساعد الذكي!',
    timestamp: 'منذ 10 دقائق',
    problemCitation: {
      question: 'أوجد مميز المعادلة: 2س² + 5س + 3 = 0',
      finalAnswer: 'المميز = 1 (حلان حقيقيان نسبيا)',
      bookName: 'الرياضيات - الثالث المتوسط',
      page: 64
    }
  },
  {
    id: 'sgm-2',
    groupId: 'group-math-m3',
    senderName: 'نورة الفهد',
    senderAvatar: '👩',
    senderRole: 'student',
    text: 'شرح ممتاز جداً يا سارة، جزاك الله خيراً! استوعبت خطوة التعويض الآن.',
    timestamp: 'منذ 5 دقائق'
  },
  {
    id: 'sgm-3',
    groupId: 'group-math-m3',
    senderName: 'أ. منصور العتيبي (معلم المادة)',
    senderAvatar: '👨‍🏫',
    senderRole: 'teacher',
    text: 'ممتازات يا طالبات، إجابة سارة صحيحة 100%. واصلن المراجعة معاً ولا تترددن في طرح الأفكار الصعبة.',
    timestamp: 'منذ دقيقتين'
  }
];

export const INITIAL_AUDIT_LOGS: ModerationAuditLogItem[] = [
  {
    id: 'audit-1',
    timestamp: '2026-02-09 08:32 ص',
    actorName: 'نظام الفلترة الآلي (AI Content Guard)',
    actorRole: 'super_admin',
    action: 'تنبيه فلترة آلية',
    targetUser: 'طالب في مجموعة العامة',
    details: 'تم رصد استخدام كلمة غير لائق محتواه وتفعيل الحظر الآلي لمنع النشر في غرفة المذاكرة.',
    severity: 'متوسط'
  },
  {
    id: 'audit-2',
    timestamp: '2026-02-08 11:20 ص',
    actorName: 'أ. عبد العزيز المقرن (مدير النظام)',
    actorRole: 'principal',
    action: 'تحديث منهج من بوابة عين',
    details: 'استنزال النسخة التفاعلية لكتاب الذكاء الاصطناعي 1 - مسارات 1447هـ.',
    severity: 'منخفض'
  },
  {
    id: 'audit-3',
    timestamp: '2026-02-07 15:45 م',
    actorName: 'د. إبراهيم السعيد (الموجه الطلابي)',
    actorRole: 'counselor',
    action: 'إغلاق تكت استفسار',
    targetUser: 'سارة العاصمي',
    details: 'إغلاق تكت التوجيه الأكاديمي بعد تزويد الطالبة بخطة المراجعة الذكية.',
    severity: 'منخفض'
  }
];

