import React, { useState, useRef } from 'react';
import { CurriculumBook, EducationalStage, CurriculumChapter } from '../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  BookOpen,
  X,
  Layers,
  AlertCircle,
  Trash2,
  Plus,
  Download,
  BookMarked,
  FileCheck,
  Compass,
  GraduationCap
} from 'lucide-react';

interface UserBookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: (newBook: CurriculumBook) => void;
  onOpenReader?: (book: CurriculumBook) => void;
  onOpenTeacher?: (subject: string, grade: string, topic?: string) => void;
  defaultStage?: EducationalStage;
  defaultGrade?: string;
}

const COMMON_SUBJECTS = [
  'الرياضيات',
  'العلوم',
  'لغتي الخالدة',
  'لغتي الجميلة',
  'التقنية الرقمية',
  'الذكاء الاصطناعي والبيانات',
  'الدراسات الإسلامية',
  'اللغة الإنجليزية (Mega Goal)',
  'اللغة الإنجليزية (We Can)',
  'التفكير الناقد',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'المهارات الحياتية والأسرية',
  'الدراسات الاجتماعية'
];

const STAGE_GRADES: Record<EducationalStage, string[]> = {
  primary: [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي'
  ],
  middle: [
    'الصف الأول المتوسط',
    'الصف الثاني المتوسط',
    'الصف الثالث المتوسط'
  ],
  secondary: [
    'السنة الأولى المشتركة (الأول الثانوي)',
    'الصف الثاني الثانوي - مسار عام',
    'الصف الثاني الثانوي - مسار علوم الحاسب والهندسة',
    'الصف الثاني الثانوي - مسار الصحة والحياة',
    'الصف الثالث الثانوي - مسار عام',
    'الصف الثالث الثانوي - مسار إدارة الأعمال'
  ],
  kindergarten: ['مستوى الروضة الأول', 'مستوى الروضة الثاني'],
  all: ['جميع الصفوف']
};

const COVER_ICONS = ['📚', '📐', '🔬', '💻', '🧠', '📖', '🧪', '🌍', '🕋', '📝', '✨', '🏆'];

export const UserBookUploadModal: React.FC<UserBookUploadModalProps> = ({
  isOpen,
  onClose,
  onBookAdded,
  onOpenReader,
  onOpenTeacher,
  defaultStage = 'middle',
  defaultGrade
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBlobUrl, setFileBlobUrl] = useState<string>('');
  const [fileSizeText, setFileSizeText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form Fields
  const [bookTitle, setBookTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('الرياضيات');
  const [stage, setStage] = useState<EducationalStage>(defaultStage === 'all' ? 'middle' : defaultStage);
  const [grade, setGrade] = useState<string>(
    defaultGrade || STAGE_GRADES[defaultStage === 'all' ? 'middle' : defaultStage][0]
  );
  const [term, setTerm] = useState<1 | 2 | 3>(1);
  const [totalPages, setTotalPages] = useState<number>(160);
  const [coverIcon, setCoverIcon] = useState<string>('📚');
  const [notes, setNotes] = useState<string>('');

  // Chapters & Topics List
  const [chapters, setChapters] = useState<CurriculumChapter[]>([
    {
      id: 'ch-1',
      title: 'الوحدة الأولى: المبادئ والمفاهيم الأساسية',
      pageStart: 1,
      pageEnd: 45,
      topics: ['الدرس الأول: مقدمة وتمهيد', 'الدرس الثاني: التطبيقات والأنشطة']
    },
    {
      id: 'ch-2',
      title: 'الوحدة الثانية: التحليل والمسائل العملية',
      pageStart: 46,
      pageEnd: 95,
      topics: ['الدرس الأول: التمارين المحلولة', 'الدرس الثاني: التقييم الختامي']
    }
  ]);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');

  // Success Confirmation State
  const [createdBook, setCreatedBook] = useState<CurriculumBook | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeText(`${sizeMb} ميجابايت`);

    // Create persistent object URL
    const objectUrl = URL.createObjectURL(file);
    setFileBlobUrl(objectUrl);

    // Auto-detect or suggest book title from file name
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (!bookTitle) {
      setBookTitle(`كتاب ${rawName}`);
    }

    // Guess subject if contained in filename
    for (const sub of COMMON_SUBJECTS) {
      if (rawName.includes(sub)) {
        setSubject(sub);
        break;
      }
    }

    // Auto estimate pages based on file size if not set
    const estimatedPages = Math.max(50, Math.min(450, Math.round((file.size / 1024 / 1024) * 8) + 40));
    setTotalPages(estimatedPages);

    setErrorMessage(null);
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const nextStart = chapters.length > 0 ? (chapters[chapters.length - 1].pageEnd || 0) + 1 : 1;
    const nextEnd = nextStart + 35;
    const newCh: CurriculumChapter = {
      id: `ch-user-${Date.now()}`,
      title: newChapterTitle.trim(),
      pageStart: nextStart,
      pageEnd: nextEnd,
      topics: ['المفاهيم والشرح الرئيسي', 'تمارين وتطبيقات']
    };
    setChapters([...chapters, newCh]);
    setNewChapterTitle('');
  };

  const handleRemoveChapter = (id: string) => {
    setChapters(chapters.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      setErrorMessage('يرجى كتابة عنوان أو اسم الكتاب');
      return;
    }

    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 10;
        if (prev >= 90) {
          clearInterval(interval);
          completeBookCreation();
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  const completeBookCreation = () => {
    const cleanTitle = bookTitle.trim();
    const newBookId = `user-book-${Date.now()}`;

    const newBook: CurriculumBook = {
      id: newBookId,
      title: cleanTitle,
      book_name: cleanTitle,
      subject: subject,
      subject_name: subject,
      grade: grade,
      stage: stage,
      education_stage: stage,
      term: term,
      semester: term,
      academic_year: '1448هـ - 2027م',
      editionYear: '1448هـ (طبعة خاصة مرفوعة)',
      coverIcon: coverIcon,
      totalPages: totalPages || 160,
      chapters: chapters.length > 0 ? chapters : [
        {
          id: `ch-default-1`,
          title: 'الوحدة الأولى: المحتوى والمفاهيم المقررة',
          pageStart: 1,
          pageEnd: totalPages || 160,
          topics: ['شرح موضوعات الكتاب', 'الأنشطة والتقييمات']
        }
      ],
      is_active: true,
      source_type: 'school_upload',
      book_pdf_url: fileBlobUrl || undefined
    };

    // Save locally to persist user uploads across reloads
    try {
      const saved = localStorage.getItem('my_custom_uploaded_books');
      const parsed: CurriculumBook[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('my_custom_uploaded_books', JSON.stringify([newBook, ...parsed]));
    } catch (e) {
      console.warn('Could not save to local storage', e);
    }

    onBookAdded(newBook);
    setCreatedBook(newBook);
    setUploadProgress(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 text-right">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <span>📥 خانة تحميل ورفع كتبي الدراسية (PDF)</span>
                <span className="text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  طبعة 1448هـ
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                ارفع كتابك أو مقررك الدراسي بصيغة PDF ليتم دمجه فوراً في مكتبتك الدراسية وقراءته وربطه بالمعلم الذكي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* If Book has been successfully uploaded */}
          {createdBook ? (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  تم تحميل وإضافة الكتاب بنجاح إلى مكتبتك!
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  كتاب <span className="font-bold text-emerald-700">«{createdBook.title}»</span> أصبح الآن متاحاً في
                  قسم «كتبي ومقرراتي» وجاهزاً للقراءة وحل المسائل.
                </p>
              </div>

              {/* Book Summary Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl max-w-lg mx-auto text-right flex items-center gap-4">
                <div className="w-14 h-18 bg-emerald-800 text-white rounded-xl flex items-center justify-center text-2xl shrink-0 shadow">
                  {createdBook.coverIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {createdBook.title}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                    <span>المادة: {createdBook.subject}</span>
                    <span>• {createdBook.grade}</span>
                    <span>• الفصل {createdBook.term}</span>
                    <span>• {createdBook.totalPages} صفحة</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                {onOpenReader && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReader(createdBook);
                    }}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs flex flex-col items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>فتح وقراءة الكتاب</span>
                  </button>
                )}

                {onOpenTeacher && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTeacher(createdBook.subject, createdBook.grade, createdBook.title);
                    }}
                    className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs flex flex-col items-center gap-1.5 shadow-md transition"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>سؤال المعلم الذكي</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCreatedBook(null);
                    setSelectedFile(null);
                    setBookTitle('');
                  }}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs flex flex-col items-center gap-1.5 border border-slate-200 transition"
                >
                  <Plus className="w-5 h-5 text-slate-600" />
                  <span>تحميل كتاب آخر</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. File Upload Dropzone (Supports Drag-and-Drop and Click Selection) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  ملف الكتاب الدراسي (PDF أو DOCX):
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50'
                      : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between gap-3 text-right">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 line-clamp-1">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-emerald-700 font-bold mt-0.5">
                            تم اختيار الملف بنجاح • الحجم: {fileSizeText}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFileBlobUrl('');
                        }}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
                        title="إلغاء الملف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-extrabold text-slate-800">
                        اسحب وأفلت ملف الكتاب هنا، أو <span className="text-emerald-600 underline">اضغط للاختيار من جهازك</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        يدعم صيغ PDF، DOCX، بحد أقصى 150 ميجابايت للمقرر
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Primary Book Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Book Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-black text-slate-800">
                    اسم الكتاب أو المقرر الدراسي *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="مثال: كتاب الرياضيات - الثالث المتوسط (الجزء الأول)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  />
                </div>

                {/* Subject Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    المادة الدراسية:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
                  >
                    {COMMON_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stage Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    المرحلة التعليمية:
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => {
                      const newStage = e.target.value as EducationalStage;
                      setStage(newStage);
                      setGrade(STAGE_GRADES[newStage][0] || 'الصف الأول');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
                  >
                    <option value="primary">المرحلة الابتدائية</option>
                    <option value="middle">المرحلة المتوسطة</option>
                    <option value="secondary">المرحلة الثانوية (مسارات)</option>
                    <option value="kindergarten">مرحلة الروضة</option>
                  </select>
                </div>

                {/* Grade Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    الصف الدراسي:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
                  >
                    {(STAGE_GRADES[stage] || STAGE_GRADES.middle).map((grd) => (
                      <option key={grd} value={grd}>
                        {grd}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    الفصل الدراسي:
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
                  >
                    <option value={1}>الفصل الدراسي الأول (1)</option>
                    <option value={2}>الفصل الدراسي الثاني (2)</option>
                    <option value={3}>الفصل الدراسي الثالث (3)</option>
                  </select>
                </div>

                {/* Total Pages */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    إجمالي عدد الصفحات التقريبي:
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={800}
                    value={totalPages}
                    onChange={(e) => setTotalPages(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
                  />
                </div>

                {/* Cover Icon Selector */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    رمز الغلاف:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {COVER_ICONS.map((icon) => (
                      <button
                        type="button"
                        key={icon}
                        onClick={() => setCoverIcon(icon)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition ${
                          coverIcon === icon
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Chapters & Units Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فهرس الوحدات والفصول المقررة ({chapters.length}):</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-bold">
                    يمكن تعديلها أو إضافتها لسهولة التنقل في القارئ
                  </span>
                </div>

                {/* Existing Chapters */}
                <div className="space-y-2">
                  {chapters.map((ch, idx) => (
                    <div
                      key={ch.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{ch.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          ص {ch.pageStart} - {ch.pageEnd}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChapter(ch.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title="حذف الفصل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Chapter Form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="عنوان الوحدة أو الفصل الجديد..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة وحدة</span>
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Upload Progress Bar if processing */}
              {uploadProgress !== null && (
                <div className="space-y-1.5 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <div className="flex justify-between text-xs font-black text-emerald-900">
                    <span>جاري معالجة وتحميل ملف الكتاب...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={uploadProgress !== null}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>حفظ وإدراج الكتاب في مكتبتي</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
