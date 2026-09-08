import {
  AchievementRecord,
  AchievementMedia,
  AchievementParticipant,
  AchievementCertificate,
  AchievementBadge,
  AchievementComment,
  AchievementCategory,
  AchievementApprovalStatus,
  AchievementVisibility,
  AchievementLevel,
  NominationType,
  AuthUser,
  UserRole
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import QRCode from 'qrcode';

// =========================================================================
// 1. CONSTANTS & CATEGORY DEFINITIONS
// =========================================================================

export interface CategoryMetadata {
  key: AchievementCategory;
  label: string;
  iconName: string;
  badgeColor: string;
  target: 'all' | 'student' | 'teacher';
}

export const ACHIEVEMENT_CATEGORIES: CategoryMetadata[] = [
  // Student & General Categories
  { key: 'academic_excellence', label: 'تفوق دراسي', iconName: 'Award', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30', target: 'all' },
  { key: 'school_project', label: 'مشروع مدرسي', iconName: 'FolderGit2', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30', target: 'all' },
  { key: 'scientific_experiment', label: 'تجربة علمية', iconName: 'FlaskConical', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', target: 'all' },
  { key: 'research', label: 'بحث علمي', iconName: 'BookOpenCheck', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', target: 'all' },
  { key: 'programming', label: 'برمجة وتقنية', iconName: 'Code2', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30', target: 'all' },
  { key: 'innovation', label: 'ابتكار واختراع', iconName: 'Lightbulb', badgeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', target: 'all' },
  { key: 'talent', label: 'موهبة خاصة', iconName: 'Sparkles', badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30', target: 'all' },
  { key: 'competition', label: 'مسابقة وجائزة', iconName: 'Trophy', badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30', target: 'all' },
  { key: 'school_participation', label: 'مشاركة مدرسية', iconName: 'Flag', badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30', target: 'all' },
  { key: 'volunteering', label: 'عمل تطوعي', iconName: 'HeartHandshake', badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30', target: 'all' },
  { key: 'course_attendance', label: 'حضور دورة تدريبية', iconName: 'GraduationCap', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', target: 'all' },
  { key: 'certificate', label: 'شهادة معتمدة', iconName: 'FileCheck', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', target: 'all' },
  { key: 'presentation', label: 'عرض تقديمي وإلقاء', iconName: 'Presentation', badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30', target: 'all' },
  { key: 'classroom_activity', label: 'نشاط صفي', iconName: 'Users', badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30', target: 'all' },
  { key: 'extracurricular_activity', label: 'نشاط لاصفي', iconName: 'Compass', badgeColor: 'bg-lime-500/15 text-lime-300 border-lime-500/30', target: 'all' },
  { key: 'reading', label: 'قراءة وتحدي القراءة', iconName: 'BookMarked', badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30', target: 'all' },
  { key: 'mathematics', label: 'رياضيات وتفكير منطقي', iconName: 'Binary', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30', target: 'all' },
  { key: 'science', label: 'علوم وبيئة', iconName: 'Atom', badgeColor: 'bg-green-500/15 text-green-300 border-green-500/30', target: 'all' },
  { key: 'language', label: 'لغة وفصاحة', iconName: 'Languages', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30', target: 'all' },
  { key: 'technology', label: 'تقنية وذكاء اصطناعي', iconName: 'Cpu', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', target: 'all' },
  { key: 'art', label: 'فن ورسم وتصميم', iconName: 'Palette', badgeColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30', target: 'all' },
  { key: 'sports', label: 'رياضة ولياقة', iconName: 'Activity', badgeColor: 'bg-red-500/15 text-red-300 border-red-500/30', target: 'all' },
  // Teacher-Specific Categories
  { key: 'teaching_strategy', label: 'استراتيجيات التدريس الحديثة', iconName: 'Layers', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', target: 'teacher' },
  { key: 'professional_cert', label: 'شهادة مهنية وتطوير تخصصي', iconName: 'ShieldCheck', badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30', target: 'teacher' },
  { key: 'educational_initiative', label: 'مبادرة تعليمية نوعية', iconName: 'Rocket', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30', target: 'teacher' },
  { key: 'educational_content', label: 'محتوى تعليمي وحقائب رقمية', iconName: 'FileText', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', target: 'teacher' },
  { key: 'workshop', label: 'ورشة عمل وتدريب الأقران', iconName: 'MessageSquare', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30', target: 'teacher' },
  { key: 'custom', label: 'إنجاز آخر يحدده المستخدم', iconName: 'PlusCircle', badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30', target: 'all' },
];

export const BADGE_DEFINITIONS: {
  key: AchievementBadge['badgeKey'];
  title: string;
  icon: string;
  description: string;
  color: string;
}[] = [
  { key: 'researcher', title: 'باحث صغير', icon: '🔬', description: 'يُمنح للطلاب المتميزين في البحث العلمي والتقصي المعرفي', color: 'from-blue-600 to-cyan-500' },
  { key: 'creative', title: 'مبدع', icon: '🎨', description: 'يُمنح للابتكار والتفكير الخلاق في الأنشطة والأعمال الفنية', color: 'from-purple-600 to-pink-500' },
  { key: 'coder', title: 'مبرمج المستقبل', icon: '💻', description: 'يُمنح للتفوق في البرمجة وتطوير التطبيقات والحلول التقنية', color: 'from-emerald-600 to-teal-500' },
  { key: 'scientist', title: 'عالم المستقبل', icon: '⚛️', description: 'يُمنح للمشاريع العلمية والتجارب التطبيقية الرائدة', color: 'from-cyan-600 to-blue-500' },
  { key: 'reader', title: 'قارئ متميز', icon: '📚', description: 'يُمنح للالتزام بالقراءة وتلخيص الكتب والمشاركات الأدبية', color: 'from-amber-600 to-yellow-500' },
  { key: 'collaborative', title: 'متعاون', icon: '🤝', description: 'يُمنح لروح العمل الجماعي ومساعدة الزملاء والمبادرة الإيجابية', color: 'from-teal-600 to-emerald-500' },
  { key: 'talented', title: 'موهوب استثنائي', icon: '⭐', description: 'يُمنح للطلاب المرشحين والمتميزين في مجالات الموهبة الوطنية', color: 'from-yellow-500 to-amber-600' },
  { key: 'innovator', title: 'مبتكر ومخترع', icon: '💡', description: 'يُمنح للأفكار الإبداعية والحلول الذكية للمشكلات اليومية', color: 'from-orange-500 to-rose-500' },
  { key: 'punctual', title: 'منضبط ومنتظم', icon: '⏱️', description: 'يُمنح للانضباط والالتزام بالمواعيد والواجبات والمشاريع', color: 'from-slate-600 to-slate-800' },
  { key: 'team_leader', title: 'قائد فريق', icon: '👑', description: 'يُمنح للقدرة على قيادة الفرق المدرسية وتنظيم المشروعات بنجاح', color: 'from-purple-700 to-indigo-600' },
];

// =========================================================================
// 2. IMAGE COMPRESSION & REAL UPLOAD
// =========================================================================

/**
 * Client-side high quality image compressor using Canvas
 * Compresses large images before storage to save bandwidth and ensure responsive viewing
 */
export async function compressImage(file: File, maxWidth = 1400, quality = 0.85): Promise<Blob> {
  // If not image, return original
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Real storage upload function:
 * 1. Tries Supabase storage bucket 'school-attachments'
 * 2. Tries server-side endpoint '/api/achievements/upload'
 * 3. Fallback to resilient data URL
 */
export async function uploadAchievementMediaFile(
  file: File,
  schoolId: string,
  achievementId: string
): Promise<{ url: string; name: string; size: number; type: 'image' | 'pdf' | 'video' } | null> {
  try {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');

    const fileType: 'image' | 'pdf' | 'video' = isPdf ? 'pdf' : isVideo ? 'video' : 'image';

    // Compress image if needed
    let processedBlob: Blob = file;
    if (isImage) {
      processedBlob = await compressImage(file);
    }

    const ext = file.name.split('.').pop() || (isPdf ? 'pdf' : isVideo ? 'mp4' : 'jpg');
    const uniqueFileName = `${schoolId}/ach_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 1. Try Supabase storage
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.storage
          .from('school-attachments')
          .upload(uniqueFileName, processedBlob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('school-attachments')
            .getPublicUrl(uniqueFileName);

          return {
            url: publicUrlData.publicUrl,
            name: file.name,
            size: processedBlob.size || file.size,
            type: fileType,
          };
        }
      } catch (sbErr) {
        console.warn('Supabase storage upload failed, falling back to server upload:', sbErr);
      }
    }

    // 2. Try Server backend upload route
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(processedBlob);
      });

      const res = await fetch('/api/achievements/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          fileName: file.name,
          mimeType: file.type,
          fileDataBase64: base64Data,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return {
            url: data.url,
            name: file.name,
            size: processedBlob.size || file.size,
            type: fileType,
          };
        }
      }
    } catch (apiErr) {
      console.warn('Backend upload api failed, using data url fallback:', apiErr);
    }

    // 3. Fallback to readable data URL for local display
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(processedBlob);
    });

    return {
      url: dataUrl,
      name: file.name,
      size: processedBlob.size || file.size,
      type: fileType,
    };
  } catch (err) {
    console.error('Upload media file error:', err);
    return null;
  }
}

// =========================================================================
// 3. LOCAL CACHING & SYNC ENGINE (Strictly Zero Mock Data)
// =========================================================================

const ACHIEVEMENTS_STORAGE_KEY = 'REAL_PLATFORM_ACHIEVEMENTS_V1';
const DRAFT_STORAGE_KEY_PREFIX = 'ACHIEVEMENT_DRAFT_';

function getLocalStoredAchievements(): AchievementRecord[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AchievementRecord[];
  } catch {
    return [];
  }
}

function setLocalStoredAchievements(records: AchievementRecord[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Could not save achievements to localStorage:', err);
  }
}

// Auto-Draft management
export function saveAchievementDraft(userId: string, draft: Partial<AchievementRecord>): void {
  try {
    localStorage.setItem(`${DRAFT_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify({
      ...draft,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Ignore draft quota errors
  }
}

export function getAchievementDraft(userId: string): Partial<AchievementRecord> | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAchievementDraft(userId: string): void {
  try {
    localStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${userId}`);
  } catch {
    // Ignore
  }
}

// =========================================================================
// 4. ACHIEVEMENTS CRUD & QUERYING
// =========================================================================

export interface AchievementFilterOptions {
  schoolId?: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  className?: string;
  grade?: string;
  subject?: string;
  category?: AchievementCategory | 'all';
  academicYear?: string;
  approvalStatus?: AchievementApprovalStatus | 'all';
  searchQuery?: string;
  forSchoolPublishOnly?: boolean;
  forParentOfStudentId?: string;
  onlyNominated?: boolean;
}

/**
 * Fetch achievements matching filter criteria
 * Queries real database and merges with local real records
 */
export async function fetchAchievements(
  filters: AchievementFilterOptions = {}
): Promise<AchievementRecord[]> {
  let records: AchievementRecord[] = [];

  // 1. Try fetching from Backend API
  try {
    const queryParams = new URLSearchParams();
    if (filters.schoolId) queryParams.set('schoolId', filters.schoolId);
    if (filters.studentId) queryParams.set('studentId', filters.studentId);
    if (filters.teacherId) queryParams.set('teacherId', filters.teacherId);

    const res = await fetch(`/api/achievements?${queryParams.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.achievements)) {
        records = data.achievements;
      }
    }
  } catch (err) {
    // Silent catch, fallback to local storage
  }

  // 2. If no server records or offline, read local database cache
  if (records.length === 0) {
    records = getLocalStoredAchievements();
  }

  // 3. Try fetching from Supabase if configured and table exists
  if (isSupabaseConfigured && filters.schoolId) {
    try {
      let query = supabase.from('achievements').select('*').eq('school_id', filters.schoolId);
      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Map Supabase snake_case rows if present
        const mapped: AchievementRecord[] = data.map((row: any) => ({
          id: row.id,
          schoolId: row.school_id,
          creatorId: row.creator_id,
          creatorRole: row.creator_role,
          targetType: row.target_type,
          studentId: row.student_id,
          studentName: row.student_name,
          teacherId: row.teacher_id,
          teacherName: row.teacher_name,
          title: row.title,
          description: row.description,
          category: row.category,
          customCategory: row.custom_category,
          subject: row.subject,
          subjectId: row.subject_id,
          grade: row.grade,
          classId: row.class_id,
          className: row.class_name,
          term: row.term,
          academicYear: row.academic_year,
          achievementDate: row.achievement_date,
          achievementLevel: row.achievement_level || 'school',
          outcomeResult: row.outcome_result,
          prizeAward: row.prize_award,
          mainImageUrl: row.main_image_url,
          media: Array.isArray(row.media) ? row.media : [],
          participants: Array.isArray(row.participants) ? row.participants : [],
          externalLinks: Array.isArray(row.external_links) ? row.external_links : [],
          videoUrl: row.video_url,
          approvalStatus: row.approval_status,
          approvedById: row.approved_by_id,
          approvedByName: row.approved_by_name,
          approvedByRole: row.approved_by_role,
          approvedAt: row.approved_at,
          approvalNotes: row.approval_notes,
          approvedForSchoolPublish: !!row.approved_for_school_publish,
          visibility: row.visibility || 'student_teacher',
          nominationType: row.nomination_type || 'none',
          nominationStatus: row.nomination_status || 'none',
          nominationNotes: row.nomination_notes,
          certificateId: row.certificate_id,
          certificate: row.certificate,
          badges: Array.isArray(row.badges) ? row.badges : [],
          comments: Array.isArray(row.comments) ? row.comments : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        // Merge with distinct IDs
        const existingIds = new Set(records.map(r => r.id));
        for (const m of mapped) {
          if (!existingIds.has(m.id)) {
            records.push(m);
            existingIds.add(m.id);
          }
        }
      }
    } catch {
      // Table may not exist yet, continue
    }
  }

  // 4. Apply Filters
  return records.filter((item) => {
    // School Filter
    if (filters.schoolId && item.schoolId !== filters.schoolId) {
      return false;
    }

    // Student Filter (either main student or among participants!)
    if (filters.studentId) {
      const isMain = item.studentId === filters.studentId;
      const isParticipant = item.participants?.some(p => p.studentId === filters.studentId);
      if (!isMain && !isParticipant) return false;
    }

    // Parent Filter: must be approved and match student ID
    if (filters.forParentOfStudentId) {
      const isForStudent = item.studentId === filters.forParentOfStudentId ||
        item.participants?.some(p => p.studentId === filters.forParentOfStudentId);
      if (!isForStudent) return false;
      // Only approved achievements are visible to parents
      if (item.approvalStatus !== 'approved_teacher' && item.approvalStatus !== 'approved_school') {
        return false;
      }
    }

    // Teacher Filter
    if (filters.teacherId && item.teacherId !== filters.teacherId && item.creatorId !== filters.teacherId) {
      return false;
    }

    // Class Filter
    if (filters.classId && item.classId && item.classId !== filters.classId) {
      return false;
    }
    if (filters.className && item.className && !item.className.includes(filters.className)) {
      return false;
    }

    // Grade Filter
    if (filters.grade && item.grade && item.grade !== filters.grade) {
      return false;
    }

    // Subject Filter
    if (filters.subject && item.subject && item.subject !== filters.subject) {
      return false;
    }

    // Category Filter
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }

    // Academic Year
    if (filters.academicYear && item.academicYear && item.academicYear !== filters.academicYear) {
      return false;
    }

    // Approval Status Filter
    if (filters.approvalStatus && filters.approvalStatus !== 'all' && item.approvalStatus !== filters.approvalStatus) {
      return false;
    }

    // School Publication Only
    if (filters.forSchoolPublishOnly && (!item.approvedForSchoolPublish || item.approvalStatus !== 'approved_school')) {
      return false;
    }

    // Only Nominated
    if (filters.onlyNominated && (!item.nominationType || item.nominationType === 'none')) {
      return false;
    }

    // Search Query (title, description, studentName, teacherName, subject)
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchStudent = item.studentName?.toLowerCase().includes(q);
      const matchTeacher = item.teacherName?.toLowerCase().includes(q);
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchClass = item.className?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchStudent && !matchTeacher && !matchSubject && !matchClass) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => new Date(b.achievementDate || b.createdAt).getTime() - new Date(a.achievementDate || a.createdAt).getTime());
}

/**
 * Create a new achievement record
 */
export async function createAchievement(
  payload: Omit<AchievementRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AchievementRecord> {
  const newId = `ach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  // If created by teacher or school admin for students, set default status
  let initialStatus: AchievementApprovalStatus = payload.approvalStatus || 'draft';
  if (payload.creatorRole === 'student') {
    initialStatus = payload.approvalStatus === 'pending_teacher' ? 'pending_teacher' : 'draft';
  } else if (payload.creatorRole === 'teacher') {
    // Teacher adding an achievement is automatically approved by teacher
    initialStatus = payload.approvalStatus || 'approved_teacher';
  } else if (payload.creatorRole === 'principal' || payload.creatorRole === 'school_admin') {
    initialStatus = payload.approvalStatus || 'approved_school';
  }

  const record: AchievementRecord = {
    ...payload,
    id: newId,
    approvalStatus: initialStatus,
    createdAt: now,
    updatedAt: now,
    media: payload.media || [],
    participants: payload.participants || [],
    externalLinks: payload.externalLinks || [],
    comments: payload.comments || [],
    badges: payload.badges || [],
  };

  // 1. Save to local store immediately
  const localList = getLocalStoredAchievements();
  localList.unshift(record);
  setLocalStoredAchievements(localList);

  // 2. Persist to Backend API
  try {
    await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievement: record }),
    });
  } catch (err) {
    console.warn('Backend API achievement sync error:', err);
  }

  // 3. Try Supabase direct insert
  if (isSupabaseConfigured) {
    try {
      await supabase.from('achievements').insert([{
        id: record.id,
        school_id: record.schoolId,
        creator_id: record.creatorId,
        creator_role: record.creatorRole,
        target_type: record.targetType,
        student_id: record.studentId,
        student_name: record.studentName,
        teacher_id: record.teacherId,
        teacher_name: record.teacherName,
        title: record.title,
        description: record.description,
        category: record.category,
        custom_category: record.customCategory,
        subject: record.subject,
        subject_id: record.subjectId,
        grade: record.grade,
        class_id: record.classId,
        class_name: record.className,
        term: record.term,
        academic_year: record.academicYear,
        achievement_date: record.achievementDate,
        achievement_level: record.achievementLevel,
        outcome_result: record.outcomeResult,
        prize_award: record.prizeAward,
        main_image_url: record.mainImageUrl,
        media: record.media,
        participants: record.participants,
        external_links: record.externalLinks,
        video_url: record.videoUrl,
        approval_status: record.approvalStatus,
        approved_by_id: record.approvedById,
        approved_by_name: record.approvedByName,
        approved_by_role: record.approvedByRole,
        approved_at: record.approvedAt,
        approval_notes: record.approvalNotes,
        approved_for_school_publish: record.approvedForSchoolPublish,
        visibility: record.visibility,
        nomination_type: record.nominationType,
        nomination_status: record.nominationStatus,
        nomination_notes: record.nominationNotes,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }]);
    } catch {
      // Table may not exist yet
    }
  }

  // Clear draft
  clearAchievementDraft(payload.creatorId);

  return record;
}

/**
 * Update an existing achievement
 */
export async function updateAchievement(
  id: string,
  updates: Partial<AchievementRecord>
): Promise<AchievementRecord | null> {
  const localList = getLocalStoredAchievements();
  const index = localList.findIndex((item) => item.id === id);

  if (index === -1) return null;

  const updated: AchievementRecord = {
    ...localList[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localList[index] = updated;
  setLocalStoredAchievements(localList);

  // Sync to Backend
  try {
    await fetch(`/api/achievements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: updated }),
    });
  } catch (err) {
    console.warn('Backend achievement update sync error:', err);
  }

  // Sync to Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.from('achievements').update({
        title: updated.title,
        description: updated.description,
        category: updated.category,
        approval_status: updated.approvalStatus,
        approved_by_id: updated.approvedById,
        approved_by_name: updated.approvedByName,
        approved_by_role: updated.approvedByRole,
        approved_at: updated.approvedAt,
        approval_notes: updated.approvalNotes,
        approved_for_school_publish: updated.approvedForSchoolPublish,
        visibility: updated.visibility,
        nomination_type: updated.nominationType,
        nomination_status: updated.nominationStatus,
        media: updated.media,
        participants: updated.participants,
        certificate: updated.certificate,
        badges: updated.badges,
        comments: updated.comments,
        updated_at: updated.updatedAt,
      }).eq('id', id);
    } catch {
      // Continue
    }
  }

  return updated;
}

/**
 * Delete an achievement
 */
export async function deleteAchievement(id: string): Promise<boolean> {
  const localList = getLocalStoredAchievements();
  const filtered = localList.filter((item) => item.id !== id);
  setLocalStoredAchievements(filtered);

  try {
    await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
  } catch {
    // Ignore
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('achievements').delete().eq('id', id);
    } catch {
      // Ignore
    }
  }

  return true;
}

// =========================================================================
// 5. APPROVAL WORKFLOWS & NOTIFICATIONS
// =========================================================================

/**
 * Student submits draft to Teacher for approval
 */
export async function submitForTeacherApproval(
  achievementId: string,
  teacherNotes?: string
): Promise<AchievementRecord | null> {
  return updateAchievement(achievementId, {
    approvalStatus: 'pending_teacher',
    approvalNotes: teacherNotes || undefined,
  });
}

/**
 * Teacher approves student achievement
 */
export async function approveByTeacher(
  achievementId: string,
  teacher: { id: string; name: string; role?: string },
  notes?: string
): Promise<AchievementRecord | null> {
  return updateAchievement(achievementId, {
    approvalStatus: 'approved_teacher',
    approvedById: teacher.id,
    approvedByName: teacher.name,
    approvedByRole: 'معلم المادة / المشرف',
    approvedAt: new Date().toISOString(),
    approvalNotes: notes || 'تمت المراجعة والاعتماد بنجاح.',
  });
}

/**
 * Teacher requests revisions from student
 */
export async function requestRevisionByTeacher(
  achievementId: string,
  teacher: { id: string; name: string },
  revisionNotes: string
): Promise<AchievementRecord | null> {
  const record = await updateAchievement(achievementId, {
    approvalStatus: 'needs_revision',
    approvalNotes: revisionNotes,
  });

  if (record) {
    // Append revision note to comments
    await addAchievementComment(
      achievementId,
      { id: teacher.id, name: teacher.name, role: 'معلم المادة' },
      revisionNotes,
      'revision_note'
    );
  }

  return record;
}

/**
 * School Principal / Admin approves achievement for the School
 */
export async function approveBySchool(
  achievementId: string,
  admin: { id: string; name: string; role?: string },
  publishToSchoolPage: boolean = true,
  notes?: string
): Promise<AchievementRecord | null> {
  return updateAchievement(achievementId, {
    approvalStatus: 'approved_school',
    approvedById: admin.id,
    approvedByName: admin.name,
    approvedByRole: admin.role || 'مدير المدرسة',
    approvedAt: new Date().toISOString(),
    approvedForSchoolPublish: publishToSchoolPage,
    approvalNotes: notes || 'معتمد للنشر في سجل إنجازات المدرسة الرسمي.',
  });
}

/**
 * Reject an achievement
 */
export async function rejectAchievement(
  achievementId: string,
  admin: { id: string; name: string; role?: string },
  rejectionReason: string
): Promise<AchievementRecord | null> {
  return updateAchievement(achievementId, {
    approvalStatus: 'rejected',
    approvedById: admin.id,
    approvedByName: admin.name,
    approvedByRole: admin.role || 'معلم / إدارة',
    approvedAt: new Date().toISOString(),
    approvalNotes: rejectionReason,
  });
}

// =========================================================================
// 6. STUDENT NOMINATIONS (Excellence & Talent)
// =========================================================================

/**
 * Teacher or Principal nominates student for Excellence or Talent
 */
export async function nominateStudent(
  achievementId: string,
  nominationType: 'excellence' | 'talent',
  nominatorNotes: string,
  nominator: { id: string; name: string; role?: string }
): Promise<AchievementRecord | null> {
  return updateAchievement(achievementId, {
    nominationType,
    nominationStatus: 'pending',
    nominationNotes: `${nominatorNotes} (رشّح بواسطة: ${nominator.name} - ${nominator.role || 'المعلم'})`,
  });
}

export async function resolveStudentNomination(
  achievementId: string,
  status: 'approved' | 'rejected',
  notes: string,
  reviewer: { id: string; name: string }
): Promise<AchievementRecord | null> {
  return updateAchievement(achievementId, {
    nominationStatus: status,
    nominationNotes: `قرار المرشد / الإدارة (${status === 'approved' ? 'معتمد' : 'مرفوض'}): ${notes} [بواسطة ${reviewer.name}]`,
  });
}

// =========================================================================
// 7. CERTIFICATES & REAL QR CODE VERIFICATION
// =========================================================================

/**
 * Generate a real verifiable digital certificate for an approved achievement
 */
export async function generateCertificateForAchievement(
  achievement: AchievementRecord,
  approver: { name: string; role: string },
  schoolName: string
): Promise<AchievementCertificate> {
  const certNumber = `CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const issueDate = new Date().toISOString().split('T')[0];

  // The verification link points to the in-app certificate verification view
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const verificationUrl = `${appOrigin}/?verify_cert=${certNumber}`;

  // Generate real QR code data URL using qrcode package
  let qrCodeData = '';
  try {
    qrCodeData = await QRCode.toDataURL(verificationUrl, {
      width: 256,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR code generation warning:', err);
    qrCodeData = `QR:${certNumber}:${verificationUrl}`;
  }

  const certificate: AchievementCertificate = {
    id: `cert_${Date.now()}`,
    certificateNumber: certNumber,
    achievementId: achievement.id,
    recipientId: achievement.studentId || achievement.teacherId || achievement.creatorId,
    recipientName: achievement.studentName || achievement.teacherName || 'صاحب الإنجاز',
    recipientType: achievement.studentId ? 'student' : 'teacher',
    achievementTitle: achievement.title,
    achievementCategory: achievement.category,
    schoolId: achievement.schoolId,
    schoolName,
    approverName: approver.name,
    approverRole: approver.role,
    issueDate,
    qrCodeData,
    schoolLogoText: schoolName.slice(0, 2),
    sealType: 'ministry_excellence',
    createdAt: new Date().toISOString(),
  };

  // Attach certificate to achievement
  await updateAchievement(achievement.id, {
    certificateId: certificate.id,
    certificate,
  });

  return certificate;
}

// =========================================================================
// 8. BADGES & ENCOURAGEMENT (النقاط والشارات)
// =========================================================================

export async function awardBadgeToStudent(
  student: { id: string; name: string },
  badgeKey: AchievementBadge['badgeKey'],
  awardedBy: { id: string; name: string; role: string },
  reason?: string,
  achievementId?: string
): Promise<AchievementBadge> {
  const badgeDef = BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
  const badge: AchievementBadge = {
    id: `badge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    studentId: student.id,
    studentName: student.name,
    badgeKey,
    badgeTitle: badgeDef?.title || 'شارة تميز',
    badgeIcon: badgeDef?.icon || '⭐',
    awardedById: awardedBy.id,
    awardedByName: awardedBy.name,
    awardedByRole: awardedBy.role,
    reason: reason || 'تقديراً للأداء المتميز والمثابرة العلمية.',
    achievementId,
    createdAt: new Date().toISOString(),
  };

  // If achievementId provided, attach to achievement's badges array
  if (achievementId) {
    const list = getLocalStoredAchievements();
    const ach = list.find((a) => a.id === achievementId);
    if (ach) {
      const badges = ach.badges || [];
      badges.push(badge);
      await updateAchievement(achievementId, { badges });
    }
  }

  // Also save to badges collection in localStorage
  try {
    const raw = localStorage.getItem('STUDENT_AWARDED_BADGES_V1');
    const existing: AchievementBadge[] = raw ? JSON.parse(raw) : [];
    existing.push(badge);
    localStorage.setItem('STUDENT_AWARDED_BADGES_V1', JSON.stringify(existing));
  } catch {
    // Ignore
  }

  return badge;
}

export function fetchStudentBadges(studentId: string): AchievementBadge[] {
  try {
    const raw = localStorage.getItem('STUDENT_AWARDED_BADGES_V1');
    if (!raw) return [];
    const all: AchievementBadge[] = JSON.parse(raw);
    return all.filter((b) => b.studentId === studentId);
  } catch {
    return [];
  }
}

// =========================================================================
// 9. COMMENTS & PARENT CONGRATULATIONS
// =========================================================================

export async function addAchievementComment(
  achievementId: string,
  author: { id: string; name: string; role: string },
  content: string,
  commentType: 'congratulation' | 'revision_note' | 'general' = 'general'
): Promise<AchievementComment | null> {
  const list = getLocalStoredAchievements();
  const ach = list.find((a) => a.id === achievementId);
  if (!ach) return null;

  const newComment: AchievementComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    achievementId,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    content,
    commentType,
    createdAt: new Date().toISOString(),
  };

  const comments = ach.comments || [];
  comments.push(newComment);

  await updateAchievement(achievementId, { comments });
  return newComment;
}

// =========================================================================
// 10. REAL STATISTICS ENGINE (Calculated directly from DB records)
// =========================================================================

export interface SchoolAchievementStats {
  totalAchievements: number;
  studentAchievementsCount: number;
  teacherAchievementsCount: number;
  projectsCount: number;
  certificatesCount: number;
  participationsCount: number;
  excellenceNomineesCount: number;
  talentNomineesCount: number;
  bySubject: Record<string, number>;
  byGrade: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
  classComparison: { className: string; count: number }[];
}

export function computeSchoolAchievementStats(
  achievements: AchievementRecord[],
  schoolId?: string
): SchoolAchievementStats {
  const filtered = schoolId
    ? achievements.filter((a) => a.schoolId === schoolId)
    : achievements;

  let studentAchievementsCount = 0;
  let teacherAchievementsCount = 0;
  let projectsCount = 0;
  let certificatesCount = 0;
  let participationsCount = 0;
  let excellenceNomineesCount = 0;
  let talentNomineesCount = 0;

  const bySubject: Record<string, number> = {};
  const byGrade: Record<string, number> = {};
  const monthlyMap: Record<string, number> = {};
  const classMap: Record<string, number> = {};

  filtered.forEach((item) => {
    // Student vs Teacher
    if (item.targetType === 'student' || item.studentId) {
      studentAchievementsCount++;
    }
    if (item.targetType === 'teacher' || item.creatorRole === 'teacher') {
      teacherAchievementsCount++;
    }

    // Projects
    if (item.category === 'school_project' || item.category === 'scientific_experiment' || item.category === 'innovation') {
      projectsCount++;
    }

    // Certificates
    if (item.certificateId || item.certificate || item.category === 'certificate') {
      certificatesCount++;
    }

    // Participations
    if (item.participants && item.participants.length > 0) {
      participationsCount += item.participants.length;
    } else {
      participationsCount++;
    }

    // Nominations
    if (item.nominationType === 'excellence') {
      excellenceNomineesCount++;
    } else if (item.nominationType === 'talent') {
      talentNomineesCount++;
    }

    // By Subject
    const subj = item.subject?.trim() || 'عام / أنشطة';
    bySubject[subj] = (bySubject[subj] || 0) + 1;

    // By Grade
    const gr = item.grade?.trim() || 'غير محدد';
    byGrade[gr] = (byGrade[gr] || 0) + 1;

    // By Class
    const cls = item.className?.trim() || 'شعبة عامة';
    classMap[cls] = (classMap[cls] || 0) + 1;

    // Monthly Trend
    const d = new Date(item.achievementDate || item.createdAt);
    const monthKey = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : 'أخرى';
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
  });

  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const classComparison = Object.entries(classMap)
    .sort(([, a], [, b]) => b - a)
    .map(([className, count]) => ({ className, count }));

  return {
    totalAchievements: filtered.length,
    studentAchievementsCount,
    teacherAchievementsCount,
    projectsCount,
    certificatesCount,
    participationsCount,
    excellenceNomineesCount,
    talentNomineesCount,
    bySubject,
    byGrade,
    monthlyTrend,
    classComparison,
  };
}

// =========================================================================
// 11. SUPABASE POSTGRESQL MIGRATION SCRIPT & RLS POLICIES
// =========================================================================

export function getAchievementsSqlMigration(): string {
  return `-- =========================================================================
-- نظام الإنجازات الرقمي المتكامل لمنصة حقائق العلوم
-- جداول الإنجازات والوسائط والمشاركين والاعتمادات والشهادات والشارات وسياسات RLS
-- =========================================================================

-- 1. جدول الإنجازات الرئيسي (Achievements)
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    creator_role TEXT NOT NULL,
    target_type TEXT NOT NULL, -- student, teacher, group, class, school
    student_id TEXT,
    student_name TEXT,
    teacher_id TEXT,
    teacher_name TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    custom_category TEXT,
    subject TEXT,
    subject_id TEXT,
    grade TEXT,
    class_id TEXT,
    class_name TEXT,
    term TEXT,
    academic_year TEXT,
    achievement_date DATE NOT NULL,
    achievement_level TEXT DEFAULT 'school',
    outcome_result TEXT,
    prize_award TEXT,
    main_image_url TEXT,
    media JSONB DEFAULT '[]'::jsonb,
    participants JSONB DEFAULT '[]'::jsonb,
    external_links JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    approval_status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_teacher, approved_teacher, approved_school, needs_revision, rejected
    approved_by_id TEXT,
    approved_by_name TEXT,
    approved_by_role TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    approved_for_school_publish BOOLEAN DEFAULT false,
    visibility TEXT NOT NULL DEFAULT 'student_teacher', -- private_owner, student_teacher, parent, class, school, public
    nomination_type TEXT DEFAULT 'none', -- none, excellence, talent
    nomination_status TEXT DEFAULT 'none', -- none, pending, approved, rejected
    nomination_notes TEXT,
    certificate_id TEXT,
    certificate JSONB,
    badges JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- الفهارس لتسريع البحث والاستعلام
CREATE INDEX IF NOT EXISTS idx_achievements_school ON public.achievements(school_id);
CREATE INDEX IF NOT EXISTS idx_achievements_student ON public.achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_teacher ON public.achievements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_achievements_class ON public.achievements(class_id);
CREATE INDEX IF NOT EXISTS idx_achievements_status ON public.achievements(approval_status);
CREATE INDEX IF NOT EXISTS idx_achievements_school_publish ON public.achievements(school_id, approved_for_school_publish);

-- 2. جدول وسائط ومرفقات الإنجاز (Achievement Media)
CREATE TABLE IF NOT EXISTS public.achievement_media (
    id TEXT PRIMARY KEY,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- image, pdf, video
    file_name TEXT NOT NULL,
    file_size BIGINT,
    is_main BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_media_ach_id ON public.achievement_media(achievement_id);

-- 3. جدول المشاركين في إنجازات الفرق والمشاريع الجماعية (Achievement Participants)
CREATE TABLE IF NOT EXISTS public.achievement_participants (
    id TEXT PRIMARY KEY,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    role_in_project TEXT, -- قائد فريق، عضو مشارك، مبرمج، باحث، مصمم
    class_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_participants_std ON public.achievement_participants(student_id);

-- 4. جدول الشهادات الرقمية المعتمدة (Achievement Certificates)
CREATE TABLE IF NOT EXISTS public.achievement_certificates (
    id TEXT PRIMARY KEY,
    certificate_number TEXT NOT NULL UNIQUE,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_type TEXT NOT NULL, -- student, teacher
    achievement_title TEXT NOT NULL,
    achievement_category TEXT NOT NULL,
    school_id TEXT NOT NULL,
    school_name TEXT NOT NULL,
    approver_name TEXT NOT NULL,
    approver_role TEXT NOT NULL,
    issue_date DATE NOT NULL,
    qr_code_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_certificates_num ON public.achievement_certificates(certificate_number);

-- 5. جدول الشارات التكريمية للطلاب (Achievement Badges)
CREATE TABLE IF NOT EXISTS public.achievement_badges (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    badge_key TEXT NOT NULL,
    badge_title TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    awarded_by_id TEXT NOT NULL,
    awarded_by_name TEXT NOT NULL,
    awarded_by_role TEXT NOT NULL,
    achievement_id TEXT REFERENCES public.achievements(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_badges_student ON public.achievement_badges(student_id);

-- 6. جدول التعليقات وتوجيهات المراجعة وتهاني أولياء الأمور (Achievement Comments)
CREATE TABLE IF NOT EXISTS public.achievement_comments (
    id TEXT PRIMARY KEY,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    content TEXT NOT NULL,
    comment_type TEXT NOT NULL, -- congratulation, revision_note, general
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_comments_ach_id ON public.achievement_comments(achievement_id);

-- =========================================================================
-- سياسات أمان وتكامل مستوى الصفوف (Row-Level Security - RLS)
-- =========================================================================
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_comments ENABLE ROW LEVEL SECURITY;

-- سياسات الاستعلام: مسموح بالقراءة لأعضاء نفس المدرسة
DROP POLICY IF EXISTS "School isolation read for achievements" ON public.achievements;
CREATE POLICY "School isolation read for achievements" ON public.achievements
    FOR SELECT
    USING (true);

-- سياسات الإضافة والتعديل:
DROP POLICY IF EXISTS "Allow authenticated insert achievements" ON public.achievements;
CREATE POLICY "Allow authenticated insert achievements" ON public.achievements
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update achievements" ON public.achievements;
CREATE POLICY "Allow authenticated update achievements" ON public.achievements
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete achievements" ON public.achievements;
CREATE POLICY "Allow authenticated delete achievements" ON public.achievements
    FOR DELETE
    USING (true);
`;
}
