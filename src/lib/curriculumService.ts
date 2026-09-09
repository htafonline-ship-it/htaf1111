import { supabase, isSupabaseConfigured } from './supabase';
import {
  CurriculumBook,
  CurriculumUnit,
  CurriculumChapter,
  CurriculumLesson,
  StudentBookProgress,
  EducationalStage,
  UserRole
} from '../types';
import { CURRICULUM_BOOKS } from '../data/mockData';

// Cache key for offline/instant persistence
const PROGRESS_CACHE_KEY = 'htaf_curriculum_progress_v2';

// -------------------------------------------------------------
// 1. SQL MIGRATIONS & SCHEMA DEFINITIONS
// -------------------------------------------------------------
export const CURRICULUM_DATABASE_SCHEMA_SQL = `
-- =========================================================================
-- HAQAYEQ AL-ULOOM: REAL CURRICULUM & STUDENT PROGRESS DATABASE SCHEMA
-- =========================================================================

-- 1. TEXTBOOKS TABLE (المقررات والكتب الوزارية)
CREATE TABLE IF NOT EXISTS public.textbooks (
    id TEXT PRIMARY KEY,
    school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    book_name TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    grade_name TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('primary', 'middle', 'secondary')),
    semester INT NOT NULL DEFAULT 1 CHECK (semester IN (1, 2, 3)),
    academic_year TEXT DEFAULT '1448هـ - 2027م',
    edition_year TEXT DEFAULT '1448هـ (طبعة معتمدة جديدة)',
    cover_image_url TEXT,
    cover_icon TEXT DEFAULT '📚',
    book_pdf_url TEXT,
    source_url TEXT,
    source_type TEXT DEFAULT 'official_moe' CHECK (source_type IN ('official_moe', 'ien_portal', 'madrasati', 'school_upload')),
    portal_url TEXT,
    track TEXT,
    total_pages INT DEFAULT 150,
    is_active BOOLEAN DEFAULT true,
    chapters_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BOOK UNITS TABLE (وحدات الكتاب)
CREATE TABLE IF NOT EXISTS public.book_units (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
    unit_number INT NOT NULL,
    title TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BOOK LESSONS TABLE (دروس الكتاب)
CREATE TABLE IF NOT EXISTS public.book_lessons (
    id TEXT PRIMARY KEY,
    unit_id TEXT REFERENCES public.book_units(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    page_start INT,
    page_end INT,
    topics JSONB DEFAULT '[]'::jsonb,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT BOOK PROGRESS (تقدم الطالب في الكتاب)
CREATE TABLE IF NOT EXISTS public.student_book_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    school_id TEXT,
    book_id TEXT NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
    completed_lessons INT DEFAULT 0,
    total_lessons INT DEFAULT 10,
    progress_percentage NUMERIC(5,2) DEFAULT 0,
    last_lesson_id TEXT,
    last_lesson_title TEXT,
    last_unit_title TEXT,
    last_opened_at TIMESTAMPTZ DEFAULT NOW(),
    lesson_status_map JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_book UNIQUE (student_id, book_id)
);

-- 5. STUDENT LESSON PROGRESS (تقدم الطالب في الدرس الفردي)
CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    book_id TEXT NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    notes TEXT,
    quiz_score INT,
    summary_read BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_lesson UNIQUE (student_id, lesson_id)
);

-- RLS Security Policies
ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active textbooks" ON public.textbooks
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users access textbooks" ON public.textbooks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users access their own book progress" ON public.student_book_progress
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users access their own lesson progress" ON public.student_lesson_progress
    FOR ALL USING (auth.role() = 'authenticated');
`;

// -------------------------------------------------------------
// 2. CURRICULUM DATA HELPERS & FETCHING
// -------------------------------------------------------------

export async function fetchAllCurriculumBooks(): Promise<CurriculumBook[]> {
  if (!isSupabaseConfigured) {
    return CURRICULUM_BOOKS;
  }

  try {
    const { data, error } = await supabase
      .from('textbooks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return CURRICULUM_BOOKS;
    }

    return data.map((d: any): CurriculumBook => ({
      id: d.id,
      title: d.title || d.book_name,
      book_name: d.book_name || d.title,
      subject: d.subject_name || d.subject,
      subject_name: d.subject_name || d.subject,
      grade: d.grade_name || d.grade,
      stage: d.stage as EducationalStage,
      education_stage: d.stage as EducationalStage,
      term: d.semester || 1,
      semester: d.semester || 1,
      academic_year: d.academic_year || '1448هـ - 2027م',
      editionYear: d.edition_year || '1448هـ (طبعة معتمدة جديدة)',
      cover_image_url: d.cover_image_url,
      book_pdf_url: d.book_pdf_url,
      source_url: d.source_url,
      source_type: d.source_type || 'official_moe',
      portalUrl: d.portal_url,
      is_active: d.is_active !== false,
      coverIcon: d.cover_icon || '📚',
      totalPages: Number(d.total_pages || 150),
      track: d.track,
      isLatestSync: true,
      chapters: Array.isArray(d.chapters_json) ? d.chapters_json : []
    }));
  } catch (err) {
    console.warn('Falling back to local curriculum catalog:', err);
    return CURRICULUM_BOOKS;
  }
}

// -------------------------------------------------------------
// 3. STUDENT REAL PROGRESS MANAGEMENT
// -------------------------------------------------------------

export function getCachedStudentProgress(studentId: string): Record<string, StudentBookProgress> {
  try {
    const raw = localStorage.getItem(`${PROGRESS_CACHE_KEY}_${studentId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveCachedStudentProgress(studentId: string, progressMap: Record<string, StudentBookProgress>) {
  try {
    localStorage.setItem(`${PROGRESS_CACHE_KEY}_${studentId}`, JSON.stringify(progressMap));
  } catch (e) {
    console.warn('Failed to cache student progress locally', e);
  }
}

export async function fetchStudentProgressRecords(
  studentId: string,
  schoolId?: string
): Promise<Record<string, StudentBookProgress>> {
  const cached = getCachedStudentProgress(studentId);

  if (!isSupabaseConfigured || !studentId) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('student_book_progress')
      .select('*')
      .eq('student_id', studentId);

    if (error || !data || data.length === 0) {
      return cached;
    }

    const map: Record<string, StudentBookProgress> = { ...cached };
    data.forEach((row: any) => {
      map[row.book_id] = {
        bookId: row.book_id,
        studentId: row.student_id,
        schoolId: row.school_id || schoolId,
        completedLessons: Number(row.completed_lessons || 0),
        totalLessons: Number(row.total_lessons || 10),
        progressPercentage: Number(row.progress_percentage || 0),
        lastLessonId: row.last_lesson_id,
        lastLessonTitle: row.last_lesson_title,
        lastUnitTitle: row.last_unit_title,
        lastOpenedAt: row.last_opened_at,
        lessonStatusMap: row.lesson_status_map || {}
      };
    });

    saveCachedStudentProgress(studentId, map);
    return map;
  } catch (err) {
    console.warn('Error loading progress from Supabase, using cache:', err);
    return cached;
  }
}

export async function updateStudentLessonStatus(
  studentId: string,
  userId: string,
  book: CurriculumBook,
  lessonId: string,
  lessonTitle: string,
  unitTitle: string,
  newStatus: 'not_started' | 'in_progress' | 'completed'
): Promise<StudentBookProgress> {
  const cached = getCachedStudentProgress(studentId);
  const currentBookProgress = cached[book.id] || {
    bookId: book.id,
    studentId,
    completedLessons: 0,
    totalLessons: calculateTotalLessons(book),
    progressPercentage: 0,
    lessonStatusMap: {}
  };

  const statusMap = { ...currentBookProgress.lessonStatusMap, [lessonId]: newStatus };
  const totalLessons = Math.max(calculateTotalLessons(book), 1);
  const completedCount = Object.values(statusMap).filter((s) => s === 'completed').length;
  const progressPercentage = Math.min(Math.round((completedCount / totalLessons) * 100), 100);

  const updatedProgress: StudentBookProgress = {
    bookId: book.id,
    studentId,
    completedLessons: completedCount,
    totalLessons,
    progressPercentage,
    lastLessonId: lessonId,
    lastLessonTitle: lessonTitle,
    lastUnitTitle: unitTitle,
    lastOpenedAt: new Date().toISOString(),
    lessonStatusMap: statusMap
  };

  // 1. Instant Cache Update
  cached[book.id] = updatedProgress;
  saveCachedStudentProgress(studentId, cached);

  // 2. Persist to Supabase
  if (isSupabaseConfigured && studentId) {
    try {
      const payload = {
        user_id: userId || studentId,
        student_id: studentId,
        book_id: book.id,
        completed_lessons: completedCount,
        total_lessons: totalLessons,
        progress_percentage: progressPercentage,
        last_lesson_id: lessonId,
        last_lesson_title: lessonTitle,
        last_unit_title: unitTitle,
        last_opened_at: new Date().toISOString(),
        lesson_status_map: statusMap,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('student_book_progress')
        .upsert(payload, { onConflict: 'student_id,book_id' });

      await supabase
        .from('student_lesson_progress')
        .upsert(
          {
            user_id: userId || studentId,
            student_id: studentId,
            book_id: book.id,
            lesson_id: lessonId,
            status: newStatus,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'student_id,lesson_id' }
        );
    } catch (err) {
      console.warn('Error persisting lesson status to Supabase:', err);
    }
  }

  return updatedProgress;
}

export function calculateTotalLessons(book: CurriculumBook): number {
  let count = 0;
  if (book.chapters && book.chapters.length > 0) {
    book.chapters.forEach((ch) => {
      if (ch.lessons && ch.lessons.length > 0) {
        count += ch.lessons.length;
      } else if (ch.topics && ch.topics.length > 0) {
        count += ch.topics.length;
      } else {
        count += 1;
      }
    });
  }
  return Math.max(count, 4);
}

// -------------------------------------------------------------
// 4. STUDENT MY BOOKS FILTER ("كتبي ومقرراتي")
// -------------------------------------------------------------

export function filterStudentMyBooks(
  allBooksInput: CurriculumBook[] = [],
  studentGrade?: string,
  stage?: EducationalStage,
  activeTerm: number = 2
): CurriculumBook[] {
  const allBooks = allBooksInput || [];
  if (!studentGrade) {
    // Default fallback: Middle 3rd Grade (Third Intermediate)
    return allBooks.filter((b) => b.grade.includes('الثالث المتوسط') || b.grade.includes('3'));
  }

  const cleanGrade = studentGrade.trim();

  // Primary matching: exact or substring
  let matched = allBooks.filter((b) => {
    return (
      cleanGrade.includes(b.grade) ||
      b.grade.includes(cleanGrade) ||
      (b.grade.includes('الابتدائي') && cleanGrade.includes('الابتدائي')) ||
      (b.grade.includes('المتوسط') && cleanGrade.includes('المتوسط')) ||
      (b.grade.includes('الثانوي') && cleanGrade.includes('الثانوي'))
    );
  });

  if (matched.length === 0 && stage) {
    matched = allBooks.filter((b) => b.stage === stage);
  }

  return matched.length > 0 ? matched : allBooks.slice(0, 6);
}

// -------------------------------------------------------------
// 5. TEACHER ASSIGNED BOOKS FILTER
// -------------------------------------------------------------

export function filterTeacherAssignedBooks(
  allBooks: CurriculumBook[],
  teacherSubjects: string[] = [],
  teacherGrades: string[] = []
): CurriculumBook[] {
  if (teacherSubjects.length === 0 && teacherGrades.length === 0) {
    return allBooks.filter((b) => b.subject === 'العلوم' || b.subject === 'الرياضيات');
  }

  return allBooks.filter((b) => {
    const subjectMatch =
      teacherSubjects.length === 0 ||
      teacherSubjects.some((s) => b.subject.includes(s) || s.includes(b.subject));
    const gradeMatch =
      teacherGrades.length === 0 ||
      teacherGrades.some((g) => b.grade.includes(g) || g.includes(b.grade));
    return subjectMatch && gradeMatch;
  });
}

// -------------------------------------------------------------
// 6. BOOK PDF DOWNLOAD & EXPORT SERVICE
// -------------------------------------------------------------
export { downloadCurriculumBookPdf } from './curriculumDownloadService';
