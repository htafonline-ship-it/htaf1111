import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  FileText,
  Video,
  CheckCircle2,
  Trash2,
  MoveRight,
  MoveLeft,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Eye,
  Lock,
  Globe,
  Award,
  AlertCircle,
  Save,
  Send,
  Star
} from 'lucide-react';
import {
  AchievementRecord,
  AchievementMedia,
  AchievementParticipant,
  AchievementCategory,
  AchievementLevel,
  AchievementVisibility,
  AuthUser
} from '../../types';
import {
  ACHIEVEMENT_CATEGORIES,
  uploadAchievementMediaFile,
  saveAchievementDraft,
  getAchievementDraft,
  clearAchievementDraft,
  createAchievement,
  updateAchievement
} from '../../lib/achievementsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  schoolId: string;
  initialAchievement?: AchievementRecord | null;
  onSuccess: (achievement: AchievementRecord) => void;
  availableStudents?: { id: string; name: string; grade?: string; classroom?: string }[];
  availableTeachers?: { id: string; name: string; subject?: string }[];
}

export const AchievementFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  schoolId,
  initialAchievement,
  onSuccess,
  availableStudents = [],
  availableTeachers = []
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  // Form State
  const [category, setCategory] = useState<AchievementCategory>('school_project');
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [outcomeResult, setOutcomeResult] = useState('');
  const [prizeAward, setPrizeAward] = useState('');

  const [subject, setSubject] = useState('علوم');
  const [grade, setGrade] = useState('الصف الأول المتوسط');
  const [className, setClassName] = useState('1/1');
  const [term, setTerm] = useState('الفصل الدراسي الثاني');
  const [academicYear, setAcademicYear] = useState('1447هـ - 2026م');

  const [participationType, setParticipationType] = useState<'individual' | 'group'>('individual');
  const [participants, setParticipants] = useState<AchievementParticipant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantRole, setNewParticipantRole] = useState('عضو مشارك');

  const [mediaList, setMediaList] = useState<AchievementMedia[]>([]);
  const [mainImageIdx, setMainImageIdx] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [externalLinkInput, setExternalLinkInput] = useState('');
  const [externalLinks, setExternalLinks] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [achievementDate, setAchievementDate] = useState(new Date().toISOString().split('T')[0]);
  const [achievementLevel, setAchievementLevel] = useState<AchievementLevel>('school');

  const [visibility, setVisibility] = useState<AchievementVisibility>('student_teacher');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isTeacher = currentUser.role === 'teacher';
  const isStudent = currentUser.role === 'student';
  const isSchoolAdmin = currentUser.role === 'principal' || currentUser.role === 'school_admin' || currentUser.role === 'vice_principal';

  // Load initial data or draft
  useEffect(() => {
    if (initialAchievement) {
      setCategory(initialAchievement.category);
      setCustomCategory(initialAchievement.customCategory || '');
      setTitle(initialAchievement.title);
      setDescription(initialAchievement.description);
      setOutcomeResult(initialAchievement.outcomeResult || '');
      setPrizeAward(initialAchievement.prizeAward || '');
      setSubject(initialAchievement.subject || 'علوم');
      setGrade(initialAchievement.grade || 'الصف الأول المتوسط');
      setClassName(initialAchievement.className || '1/1');
      setTerm(initialAchievement.term || 'الفصل الدراسي الثاني');
      setAcademicYear(initialAchievement.academicYear || '1447هـ - 2026م');
      setParticipants(initialAchievement.participants || []);
      setParticipationType(initialAchievement.participants && initialAchievement.participants.length > 0 ? 'group' : 'individual');
      setMediaList(initialAchievement.media || []);
      setVideoUrl(initialAchievement.videoUrl || '');
      setExternalLinks(initialAchievement.externalLinks || []);
      setAchievementDate(initialAchievement.achievementDate);
      setAchievementLevel(initialAchievement.achievementLevel);
      setVisibility(initialAchievement.visibility);
      setCurrentStep(1);
    } else {
      // Check for saved draft
      const draft = getAchievementDraft(currentUser.id);
      if (draft && !initialAchievement) {
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.category) setCategory(draft.category);
        if (draft.subject) setSubject(draft.subject);
        if (draft.grade) setGrade(draft.grade);
        if (draft.className) setClassName(draft.className);
      }
    }
  }, [initialAchievement, isOpen, currentUser.id]);

  // Auto-Save draft on change
  useEffect(() => {
    if (!initialAchievement && (title || description)) {
      saveAchievementDraft(currentUser.id, {
        title,
        description,
        category,
        subject,
        grade,
        className,
        term,
        academicYear,
        achievementDate,
        achievementLevel,
        visibility
      });
    }
  }, [title, description, category, subject, grade, className, term, academicYear, achievementDate, achievementLevel, visibility]);

  // Handle file uploads (Images & PDFs)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const uploadedMedia: AchievementMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Max 25MB check
        if (file.size > 25 * 1024 * 1024) {
          setErrorMessage(`حجم الملف ${file.name} يتجاوز الحد المسموح (25 ميغابايت)`);
          continue;
        }

        const res = await uploadAchievementMediaFile(file, schoolId, `ach_${Date.now()}`);
        if (res) {
          uploadedMedia.push({
            id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            achievementId: initialAchievement?.id || 'temp',
            fileUrl: res.url,
            fileType: res.type,
            fileName: res.name,
            fileSize: res.size,
            isMain: mediaList.length === 0 && uploadedMedia.length === 0,
            displayOrder: mediaList.length + uploadedMedia.length,
            createdAt: new Date().toISOString()
          });
        }
      }

      setMediaList((prev) => [...prev, ...uploadedMedia]);
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage('تعذر رفع بعض الملفات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
    if (mainImageIdx === index) {
      setMainImageIdx(0);
    } else if (mainImageIdx > index) {
      setMainImageIdx(mainImageIdx - 1);
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIdx(index);
    setMediaList((prev) =>
      prev.map((m, i) => ({
        ...m,
        isMain: i === index
      }))
    );
  };

  // Add Participant
  const addParticipant = (studentId?: string, studentName?: string) => {
    const nameToAdd = studentName || newParticipantName.trim();
    if (!nameToAdd) return;

    const newPart: AchievementParticipant = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      achievementId: initialAchievement?.id || 'temp',
      studentId: studentId || `std_manual_${Date.now()}`,
      studentName: nameToAdd,
      roleInProject: newParticipantRole,
      className,
      createdAt: new Date().toISOString()
    };

    setParticipants((prev) => [...prev, newPart]);
    setNewParticipantName('');
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // Add External Link
  const addExternalLink = () => {
    if (!externalLinkInput.trim()) return;
    setExternalLinks((prev) => [...prev, externalLinkInput.trim()]);
    setExternalLinkInput('');
  };

  const removeExternalLink = (index: number) => {
    setExternalLinks((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (submitType: 'draft' | 'pending_teacher' | 'approved_teacher' | 'approved_school') => {
    if (!title.trim()) {
      setErrorMessage('عنوان الإنجاز مطلوب');
      setCurrentStep(2);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const mainImg = mediaList[mainImageIdx]?.fileUrl || mediaList.find((m) => m.isMain)?.fileUrl || mediaList[0]?.fileUrl;

      const payload = {
        schoolId,
        creatorId: currentUser.id,
        creatorRole: currentUser.role,
        targetType: (isTeacher && participationType === 'group')
          ? ('group' as const)
          : isTeacher
          ? ('teacher' as const)
          : ('student' as const),

        // Context
        studentId: isStudent ? currentUser.id : undefined,
        studentName: isStudent ? currentUser.name : undefined,
        teacherId: isTeacher ? currentUser.id : undefined,
        teacherName: isTeacher ? currentUser.name : undefined,

        title: title.trim(),
        description: description.trim(),
        category,
        customCategory: category === 'custom' ? customCategory.trim() : undefined,
        subject,
        grade,
        className,
        term,
        academicYear,
        achievementDate,
        achievementLevel,
        outcomeResult: outcomeResult.trim() || undefined,
        prizeAward: prizeAward.trim() || undefined,

        mainImageUrl: mainImg,
        media: mediaList,
        participants,
        externalLinks,
        videoUrl: videoUrl.trim() || undefined,

        approvalStatus: submitType,
        approvedForSchoolPublish: isSchoolAdmin && submitType === 'approved_school',
        visibility,

        nominationType: 'none' as const,
        nominationStatus: 'none' as const,
        approvalNotes: teacherNotes.trim() || undefined
      };

      let savedRecord: AchievementRecord;
      if (initialAchievement) {
        const updated = await updateAchievement(initialAchievement.id, payload);
        if (!updated) throw new Error('فشل تحديث الإنجاز');
        savedRecord = updated;
      } else {
        savedRecord = await createAchievement(payload);
      }

      clearAchievementDraft(currentUser.id);
      onSuccess(savedRecord);
      onClose();
    } catch (err: any) {
      console.error('Submit achievement error:', err);
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ الإنجاز');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0a1126] border border-blue-900/50 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#070d1e] border-b border-blue-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                {initialAchievement ? 'تعديل الإنجاز' : 'إضافة إنجاز رقمي جديد'}
              </h2>
              <div className="text-[11px] text-slate-400">
                الخطوة {currentStep} من {totalSteps}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 shrink-0">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Indicator Badges (Horizontal scroll) */}
        <div className="px-6 py-2.5 bg-[#090f23] border-b border-blue-900/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-[11px] font-bold">
          {[
            '1. التصنيف',
            '2. العنوان والوصف',
            '3. المادة والصف',
            '4. المشاركون',
            '5. المرفقات والصور',
            '6. التاريخ والمستوى',
            '7. الخصوصية',
            '8. المعاينة',
            '9. الحفظ والاعتماد'
          ].map((stepName, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurr = stepNum === currentStep;
            return (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                  isCurr
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : isDone
                    ? 'bg-blue-950 text-cyan-300 border border-blue-800/60'
                    : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                {stepName}
              </button>
            );
          })}
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 text-right space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">اختر نوع الإنجاز:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حدد التصنيف الأنسب من بين أكثر من 22 نوعاً معتمداً بالمنصة:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
                {ACHIEVEMENT_CATEGORIES.filter((c) => {
                  if (isStudent && c.target === 'teacher') return false;
                  return true;
                }).map((cat) => {
                  const isSelected = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-[#0e1730] border-blue-900/30 text-slate-300 hover:border-blue-700/50 hover:bg-[#131f40]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{cat.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {category === 'custom' && (
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اكتب مسمى الإنجاز المخصص:
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="مثال: مخيم الابتكار البيئي"
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: TITLE & DESCRIPTION & PRIZE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-200 mb-1">
                  عنوان الإنجاز <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مشروع الروبوت الذكي لفرز النفايات المدرسية"
                  className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-200 mb-1">
                  وصف الإنجاز والأهداف والنتائج المحققة:
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح طبيعة العمل، المشكلة التي يعالجها، الأدوات المستخدمة، والدروس المستفادة..."
                  className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl p-3 text-xs text-white outline-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    النتيجة أو الدرجة المحققة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={outcomeResult}
                    onChange={(e) => setOutcomeResult(e.target.value)}
                    placeholder="مثال: المركز الأول / الدرجة الكاملة"
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الجائزة أو وسام التكريم إن وجد:
                  </label>
                  <input
                    type="text"
                    value={prizeAward}
                    onChange={(e) => setPrizeAward(e.target.value)}
                    placeholder="مثال: الميدالية الذهبية للابتكار"
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUBJECT, GRADE, CLASS, TERM */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">الارتباط الأكاديمي والصف:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ربط الإنجاز بالمادة الدراسية والصف والفصل لتوثيقه في السجل الصفي
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المادة الدراسية:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  >
                    <option value="العلوم">العلوم</option>
                    <option value="الرياضيات">الرياضيات</option>
                    <option value="الفيزياء">الفيزياء</option>
                    <option value="الكيمياء">الكيمياء</option>
                    <option value="الأحياء">الأحياء</option>
                    <option value="المهارات الرقمية">المهارات الرقمية / الحاسب</option>
                    <option value="اللغة العربية">اللغة العربية</option>
                    <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                    <option value="النشاط والابتكار المدرسي">النشاط والابتكار المدرسي</option>
                    <option value="التربية البدنية">التربية البدنية</option>
                    <option value="التربية الفنية">التربية الفنية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المرحلة والصف:</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  >
                    <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                    <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                    <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                    <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                    <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                    <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                    <option value="الصف الأول المتوسط">الصف الأول المتوسط</option>
                    <option value="الصف الثاني المتوسط">الصف الثاني المتوسط</option>
                    <option value="الصف الثالث المتوسط">الصف الثالث المتوسط</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الفصل / الشعبة:</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="مثال: 1/1 أو موهوبين أ"
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الفصل الدراسي:</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    <option value="الفصل الدراسي الثالث">الفصل الدراسي الثالث</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">السنة الدراسية:</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PARTICIPATION (INDIVIDUAL VS GROUP) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">نوع المشاركة وفريق العمل:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  هل الإنجاز عمل فردي أم مشروع جماعي مشترك بين عدة طلاب؟
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setParticipationType('individual')}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs transition ${
                    participationType === 'individual'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-[#080e22] border-blue-900/40 text-slate-400'
                  }`}
                >
                  إنجاز فردي
                </button>

                <button
                  type="button"
                  onClick={() => setParticipationType('group')}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs transition ${
                    participationType === 'group'
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md'
                      : 'bg-[#080e22] border-blue-900/40 text-slate-400'
                  }`}
                >
                  مشروع جماعي (فريق طلاب)
                </button>
              </div>

              {participationType === 'group' && (
                <div className="p-4 bg-[#080e22] border border-purple-900/40 rounded-xl space-y-3">
                  <div className="text-xs font-black text-purple-300">
                    قائمة الطلاب المشاركين في المشروع:
                  </div>

                  {/* Add from list if available */}
                  {availableStudents.length > 0 && (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        إضافة طالب من المدرسة:
                      </label>
                      <select
                        onChange={(e) => {
                          const std = availableStudents.find((s) => s.id === e.target.value);
                          if (std) addParticipant(std.id, std.name);
                          e.target.value = '';
                        }}
                        className="w-full bg-[#0c142b] border border-blue-900/50 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                      >
                        <option value="">-- اختر طالباً لإضافته للمشروع --</option>
                        {availableStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.classroom || s.grade || 'طالب'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Manual add */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      placeholder="اسم الطالب المشارك..."
                      className="flex-1 bg-[#0c142b] border border-blue-900/50 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    />
                    <select
                      value={newParticipantRole}
                      onChange={(e) => setNewParticipantRole(e.target.value)}
                      className="bg-[#0c142b] border border-blue-900/50 rounded-xl px-2 py-2 text-xs text-white outline-hidden"
                    >
                      <option value="قائد الفريق">قائد الفريق</option>
                      <option value="مبرمج">مبرمج</option>
                      <option value="باحث">باحث</option>
                      <option value="مصمم">مصمم</option>
                      <option value="عضو مشارك">عضو مشارك</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => addParticipant()}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>

                  {/* Participant Chips */}
                  {participants.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/50 text-xs text-purple-200"
                        >
                          <Users className="w-3 h-3 text-purple-400" />
                          <span>{p.studentName}</span>
                          <span className="text-[10px] text-purple-400">({p.roleInProject})</span>
                          <button
                            type="button"
                            onClick={() => removeParticipant(p.id)}
                            className="text-rose-400 hover:text-rose-300 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      لم يتم تحديد أعضاء إضافيين بعد.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: MEDIA, IMAGES, PDF, VIDEO LINKS */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">الصور والمرفقات الرقمية:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ارفع صور المشروع، الشهادات، ملفات PDF، أو روابط مقاطع الفيديو
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-6 text-center cursor-pointer bg-[#080e22] hover:bg-[#0c1636] transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,video/mp4"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-black text-cyan-300">
                  {isUploading ? 'جارٍ رفع وضغط الملفات...' : 'انقر لرفع الصور والملفات أو اسحبها هنا'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  يدعم صور JPG, PNG, WEBP، ومستندات PDF ومقاطع الفيديو (الحد الأقصى 25 ميغابايت)
                </div>
              </div>

              {/* Uploaded Media Grid */}
              {mediaList.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    المرفقات المرفوعة ({mediaList.length}):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {mediaList.map((m, idx) => {
                      const isMain = mainImageIdx === idx;
                      return (
                        <div
                          key={m.id || idx}
                          className={`relative rounded-xl overflow-hidden border bg-slate-900 group ${
                            isMain ? 'border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400' : 'border-slate-800'
                          }`}
                        >
                          {m.fileType === 'image' ? (
                            <img
                              src={m.fileUrl}
                              alt={m.fileName}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 flex flex-col items-center justify-center bg-slate-950 p-2 text-center">
                              <FileText className="w-8 h-8 text-cyan-400 mb-1" />
                              <span className="text-[10px] text-slate-300 truncate w-full">
                                {m.fileName}
                              </span>
                            </div>
                          )}

                          {/* Main Image Star */}
                          {isMain && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-slate-950" />
                              <span>الرئيسية</span>
                            </div>
                          )}

                          {/* Hover Overlay Controls */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                            {!isMain && m.fileType === 'image' && (
                              <button
                                type="button"
                                onClick={() => setAsMainImage(idx)}
                                title="تعيين كصورة رئيسية للغلاف"
                                className="p-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold"
                              >
                                رئيسية
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeMedia(idx)}
                              className="p-1 rounded bg-rose-600 text-white"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Video Link */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رابط فيديو المشروع (YouTube أو Google Drive):
                </label>
                <div className="flex gap-2">
                  <div className="p-2.5 bg-slate-900 border border-blue-900/50 rounded-xl text-slate-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* External Links */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  روابط ومراجع خارجية:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={externalLinkInput}
                    onChange={(e) => setExternalLinkInput(e.target.value)}
                    placeholder="رابط المنشور أو منصة المعرض..."
                    className="flex-1 bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={addExternalLink}
                    className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    إضافة
                  </button>
                </div>

                {externalLinks.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {externalLinks.map((link, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#080e22] border border-blue-900/40 text-cyan-300"
                      >
                        <span className="truncate max-w-[80%]">{link}</span>
                        <button
                          type="button"
                          onClick={() => removeExternalLink(i)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: DATE & ACHIEVEMENT LEVEL */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">تاريخ ومستوى الإنجاز:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حدد تاريخ تحقيق الإنجاز ونطاق المنافسة أو التكريم
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الإنجاز:</label>
                <input
                  type="date"
                  value={achievementDate}
                  onChange={(e) => setAchievementDate(e.target.value)}
                  className="w-full bg-[#080e22] border border-blue-900/50 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مستوى نطاق الإنجاز:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'school', label: 'مدرسي (داخل المدرسة)', desc: 'أنشطة ومشاريع وفصول المدرسة' },
                    { key: 'local', label: 'محلي (على مستوى إدارة التعليم / المكتب)', desc: 'معارض ومسابقات المنطقة' },
                    { key: 'national', label: 'وطني (على مستوى المملكة)', desc: 'موهبة / إبداع / الوزارة' },
                    { key: 'regional', label: 'إقليمي (الخليج أو الوطن العربي)', desc: 'مشاركات وجوائز عربية' },
                    { key: 'international', label: 'دولي (عالمي)', desc: 'آيسف / المعارض الدولية' },
                    { key: 'other', label: 'أخرى', desc: 'مشاركات خاصة' }
                  ].map((lvl) => {
                    const isSelected = achievementLevel === lvl.key;
                    return (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setAchievementLevel(lvl.key as AchievementLevel)}
                        className={`p-3 rounded-xl border text-right transition ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                            : 'bg-[#080e22] border-blue-900/40 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-black">{lvl.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PRIVACY & VISIBILITY */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">إعدادات الخصوصية والعرض:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  التحكم في من يحق له مشاهدة هذا الإنجاز
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'private_owner', label: 'خاص بصاحب الحساب فقط', desc: 'لا يظهر إلا لك في مسودتك الشخصية' },
                  { key: 'student_teacher', label: 'الطالب والمعلم المشرف', desc: 'الوضع الافتراضي: مرئي للطالب ومعلم المادة' },
                  { key: 'parent', label: 'مرئي لولي الأمر أيضاً', desc: 'يظهر في صفحة «إنجازات أبنائي» لولي الأمر بعد الاعتماد' },
                  { key: 'class', label: 'مرئي لطلاب الفصل', desc: 'يُعرض في صفحة «إنجازات الفصل» كنموذج ملهم' },
                  { key: 'school', label: 'مرئي لمنسوبي المدرسة', desc: 'يظهر في معرض إنجازات المدرسة بعد موافقة الإدارة' },
                  { key: 'public', label: 'عام', desc: 'إنجاز مفتوح للتوثيق والتحقق الخارجي' }
                ].map((vis) => {
                  const isSelected = visibility === vis.key;
                  return (
                    <button
                      key={vis.key}
                      type="button"
                      onClick={() => setVisibility(vis.key as AchievementVisibility)}
                      className={`w-full p-3 rounded-xl border text-right transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                          : 'bg-[#080e22] border-blue-900/40 text-slate-300 hover:bg-[#0c1636]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black">{vis.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{vis.desc}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 8: SUMMARY PREVIEW */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">معاينة الإنجاز قبل الحفظ:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  راجع تفاصيل الإنجاز وتأكد من اكتمال كافة المرفقات
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c152e] border border-blue-900/50 space-y-4">
                {/* Header preview */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {category}
                    </span>
                    <h4 className="text-base font-black text-white mt-2">{title || 'بدون عنوان'}</h4>
                    <div className="text-xs text-slate-400 mt-1">
                      {subject} • {grade} • {className}
                    </div>
                  </div>

                  {mediaList[mainImageIdx] && (
                    <img
                      src={mediaList[mainImageIdx].fileUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-blue-800/40"
                    />
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-[#080e22] p-3 rounded-xl">
                  {description || 'لا يوجد وصف'}
                </p>

                {/* Details Pills */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800">
                    📅 التاريخ: {achievementDate}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800">
                    🏛️ المستوى: {achievementLevel}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800">
                    🔒 الخصوصية: {visibility}
                  </span>
                  {prizeAward && (
                    <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      🏆 {prizeAward}
                    </span>
                  )}
                </div>

                {/* Participants */}
                {participants.length > 0 && (
                  <div className="text-xs text-slate-300">
                    <strong>فريق العمل ({participants.length}):</strong>{' '}
                    {participants.map((p) => p.studentName).join('، ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 9: SAVE / SUBMIT FOR APPROVAL */}
          {currentStep === 9 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-white">طريقة الحفظ والاعتماد:</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اختر الإجراء المناسب لحفظ الإنجاز في النظام
                </p>
              </div>

              {isStudent && (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSubmit('pending_teacher')}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg shadow-cyan-500/20 transition"
                  >
                    <div className="text-right">
                      <div className="text-sm">إرسال الإنجاز لاعتماد المعلم</div>
                      <div className="text-[11px] text-slate-900/80 font-bold">
                        سيتم إشعار معلم المادة بمراجعة الإنجاز واعتماده أو طلب تعديلات
                      </div>
                    </div>
                    <Send className="w-5 h-5 text-slate-950" />
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSubmit('draft')}
                    className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700 transition"
                  >
                    <div className="text-right">
                      <div>حفظ كمسودة خاصة بي</div>
                      <div className="text-[10px] text-slate-400">
                        لن يراه المعلم حتى تقوم بإرساله لاحقاً
                      </div>
                    </div>
                    <Save className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {isTeacher && (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSubmit('approved_teacher')}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg transition"
                  >
                    <div className="text-right">
                      <div className="text-sm">اعتماد ونشر في ملف الإنجاز مباشرة</div>
                      <div className="text-[11px] text-slate-900/80 font-bold">
                        يوثق في ملفك الصفي وملف الطالب/الطلاب المشاركين فوراً
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSubmit('draft')}
                    className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700 transition"
                  >
                    <div className="text-right">
                      <div>حفظ كمسودة</div>
                      <div className="text-[10px] text-slate-400">حفظ مؤقت دون النشر للطلاب</div>
                    </div>
                    <Save className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {isSchoolAdmin && (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSubmit('approved_school')}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg transition"
                  >
                    <div className="text-right">
                      <div className="text-sm">اعتماد ونشر في السجل المدرسي الرسمي</div>
                      <div className="text-[11px] text-slate-900/80 font-bold">
                        يظهر في إنجازات المدرسة الرسمية ويصبح متاحاً لإصدار الشهادات
                      </div>
                    </div>
                    <Award className="w-5 h-5 text-slate-950" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls Footer */}
        <div className="px-6 py-4 bg-[#070d1e] border-t border-blue-900/40 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                <MoveRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2 && !title.trim()) {
                    setErrorMessage('يرجى كتابة عنوان الإنجاز');
                    return;
                  }
                  setErrorMessage('');
                  setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition"
              >
                <span>التالي</span>
                <MoveLeft className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
