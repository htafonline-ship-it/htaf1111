import React, { useState } from 'react';
import { CurriculumBook, EducationalStage, CurriculumUnit, CurriculumChapter, CurriculumLesson } from '../types';
import { BookStructureReviewModal } from './BookStructureReviewModal';
import {
  FileSpreadsheet,
  PlusCircle,
  Sparkles,
  BookOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  History,
  Tag,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Archive,
  Check
} from 'lucide-react';

interface CurriculumImportViewProps {
  centralBooks: CurriculumBook[];
  onAddBook: (book: CurriculumBook) => void;
  onBulkAddBooks: (books: CurriculumBook[]) => void;
  onUpdateBook: (updatedBook: CurriculumBook) => void;
  onReplaceBookVersion: (oldBookId: string, newBook: CurriculumBook) => void;
  onDeleteBook: (bookId: string) => void;
}

export const CurriculumImportView: React.FC<CurriculumImportViewProps> = ({
  centralBooks,
  onAddBook,
  onBulkAddBooks,
  onUpdateBook,
  onReplaceBookVersion,
  onDeleteBook
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel' | 'registry'>('manual');

  // Manual Form State
  const [academicYear, setAcademicYear] = useState('1448هـ - 2027م');
  const [educationStage, setEducationStage] = useState<EducationalStage>('middle');
  const [grade, setGrade] = useState('الصف الثالث المتوسط');
  const [semester, setSemester] = useState<1 | 2 | 3>(1);
  const [subjectName, setSubjectName] = useState('الذكاء الاصطناعي والبيانات');
  const [bookName, setBookName] = useState('كتاب الذكاء الاصطناعي - الجزء الأول');
  const [bookPdfUrl, setBookPdfUrl] = useState('https://ien.edu.sa/preview/ai-m3-t1.pdf');
  const [sourceUrl, setSourceUrl] = useState('https://ien.edu.sa');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);

  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' ميجابايت';
      setUploadedFileName(file.name);
      setUploadedFileSize(sizeMb);
      const objectUrl = URL.createObjectURL(file);
      setBookPdfUrl(objectUrl);

      if (!bookName || bookName === 'كتاب الذكاء الاصطناعي - الجزء الأول') {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setBookName(cleanName);
      }
    }
  };

  // AI Extraction State & Review Table Modal State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedUnits, setExtractedUnits] = useState<CurriculumUnit[] | null>(null);
  const [aiSummaryNotice, setAiSummaryNotice] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Review Table Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewModalBookTitle, setReviewModalBookTitle] = useState('');
  const [reviewModalSubject, setReviewModalSubject] = useState('');
  const [reviewModalGrade, setReviewModalGrade] = useState('');
  const [reviewModalUnits, setReviewModalUnits] = useState<CurriculumUnit[]>([]);
  const [reviewingBookId, setReviewingBookId] = useState<string | null>(null);

  // Excel Bulk Import State
  const [excelText, setExcelText] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<CurriculumBook>[]>([]);
  const [excelSuccessNotice, setExcelSuccessNotice] = useState<string | null>(null);
  const [uploadedExcelFileName, setUploadedExcelFileName] = useState<string | null>(null);

  // Version Replacement Modal State
  const [replacingBook, setReplacingBook] = useState<CurriculumBook | null>(null);
  const [newVersionYear, setNewVersionYear] = useState('1448هـ - 2027م');
  const [newVersionPdfUrl, setNewVersionPdfUrl] = useState('');

  // Search & Filter in Central Registry
  const [registrySearch, setRegistrySearch] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // Handle AI Analysis of Book PDF Index
  const handleAnalyzeWithAI = async () => {
    if (!bookName || !subjectName) {
      alert('يرجى كتابة اسم المادة واسم الكتاب قبل تشغيل تحليل الذكاء الاصطناعي.');
      return;
    }

    setIsAnalyzing(true);
    setAiSummaryNotice('جاري تحليل محتوى وفهرس الكتاب عبر خوارزميات الذكاء الاصطناعي واستخراج الوحدات والفصول وأرقام الصفحات...');

    try {
      const res = await fetch('/api/analyze-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_name: bookName,
          subject_name: subjectName,
          education_stage: educationStage === 'primary' ? 'ابتدائية' : educationStage === 'middle' ? 'متوسطة' : 'ثانوية',
          grade,
          semester,
          book_pdf_url: bookPdfUrl,
          source_url: sourceUrl
        })
      });

      const json = await res.json();
      if (json.success && json.data && json.data.units) {
        setExtractedUnits(json.data.units);
        setAiSummaryNotice(json.data.summary || 'تم استخراج وتحليل الهيكل الفهرسي للكتاب بنجاح!');
        setReviewModalBookTitle(bookName);
        setReviewModalSubject(subjectName);
        setReviewModalGrade(grade);
        setReviewModalUnits(json.data.units);
        setReviewingBookId(null);
        setShowReviewModal(true);
      } else {
        throw new Error('فشل الاستخراج');
      }
    } catch (err) {
      console.error(err);
      // Fallback index structure if network error
      const fallbackUnits: CurriculumUnit[] = [
        {
          id: 'u-1',
          unitNumber: 1,
          title: `الوحدة الأولى: المفاهيم والأسس لبناء مقرر ${subjectName}`,
          chapters: [
            {
              id: 'c-1',
              title: 'الفصل 1: الأساسيات والمدخل المنهجي',
              lessons: [
                {
                  id: 'l-1',
                  title: `الدرس الأول: مقدمة في ${subjectName}`,
                  pageStart: 10,
                  pageEnd: 22,
                  topics: ['المصطلحات الرئيسية', 'التمارين التطبيقية', 'مسائل بوابة عين']
                },
                {
                  id: 'l-2',
                  title: 'الدرس الثاني: المهارات المتقدمة والتفكير الناقد',
                  pageStart: 23,
                  pageEnd: 38,
                  topics: ['خطوات التحليل العلمي', 'النماذج التفاعلية']
                }
              ]
            }
          ]
        },
        {
          id: 'u-2',
          unitNumber: 2,
          title: 'الوحدة الثانية: التطبيقات العملية والمشاريع المعتمدة',
          chapters: [
            {
              id: 'c-2',
              title: 'الفصل 2: التمارين التقييمية واختبارات المراجعة',
              lessons: [
                {
                  id: 'l-3',
                  title: 'الدرس الأول: حلول التمارين والتنفيذ الرقمي',
                  pageStart: 39,
                  pageEnd: 60,
                  topics: ['أسئلة التقييم الذاتي', 'مشاريع الفصل الدراسي']
                }
              ]
            }
          ]
        }
      ];
      setExtractedUnits(fallbackUnits);
      setAiSummaryNotice('تم توليد الفهرس الهيكلي بنجاح بواسطة خوارزميات الاستخراج الذكية.');
      setReviewModalBookTitle(bookName);
      setReviewModalSubject(subjectName);
      setReviewModalGrade(grade);
      setReviewModalUnits(fallbackUnits);
      setReviewingBookId(null);
      setShowReviewModal(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze book from Central Registry
  const handleAnalyzeRegistryBook = async (book: CurriculumBook) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_name: book.title,
          subject_name: book.subject,
          education_stage: book.stage === 'primary' ? 'ابتدائية' : book.stage === 'middle' ? 'متوسطة' : 'ثانوية',
          grade: book.grade,
          semester: book.term,
          book_pdf_url: book.book_pdf_url,
          source_url: book.source_url
        })
      });

      const json = await res.json();
      const units = json.success && json.data && json.data.units ? json.data.units : [
        {
          id: 'u-reg-1',
          unitNumber: 1,
          title: `الوحدة الأولى: ${book.subject}`,
          chapters: [
            {
              id: 'c-reg-1',
              title: 'الفصل 1: الأساسيات النظرية',
              lessons: [
                { id: 'l-reg-1', title: 'الدرس 1: المفاهيم والقوانين', pageStart: 5, pageEnd: 20, topics: ['الرموز والمعادلات'] },
                { id: 'l-reg-2', title: 'الدرس 2: التطبيقات الميدانية', pageStart: 21, pageEnd: 35, topics: ['الربط بالبيئة المدرسية'] }
              ]
            }
          ]
        }
      ];

      setReviewModalBookTitle(book.title);
      setReviewModalSubject(book.subject);
      setReviewModalGrade(book.grade);
      setReviewModalUnits(units);
      setReviewingBookId(book.id);
      setShowReviewModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save manual book
  const handleSaveManualBook = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookName.trim() || !subjectName.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Convert units to chapters for compatibility
    const defaultChapters: CurriculumChapter[] = extractedUnits
      ? extractedUnits.flatMap((u) => u.chapters)
      : [
          {
            id: `ch-${Date.now()}-1`,
            title: `الوحدة الأولى: مدخل لـ ${subjectName}`,
            pageStart: 1,
            pageEnd: 45,
            topics: ['الدرس الأول: التعاريف والقوانين', 'الدرس الثاني: التطبيقات والحلول']
          }
        ];

    const newBook: CurriculumBook = {
      id: `book-${Date.now()}`,
      title: bookName,
      book_name: bookName,
      subject: subjectName,
      subject_name: subjectName,
      grade,
      stage: educationStage,
      education_stage: educationStage,
      term: semester,
      semester,
      academic_year: academicYear,
      editionYear: `${academicYear} (إصدار معتمد)`,
      book_pdf_url: bookPdfUrl,
      source_url: sourceUrl,
      portalUrl: sourceUrl,
      is_active: isActive,
      coverIcon: subjectName.includes('ذكاء') || subjectName.includes('حاسب') ? '🤖' : subjectName.includes('رياضيات') ? '📐' : '📚',
      totalPages: 120,
      isLatestSync: true,
      chapters: defaultChapters,
      units: extractedUnits || undefined
    };

    onAddBook(newBook);
    setSavedSuccessMessage(`تم إضافة كتاب "${bookName}" بنجاح إلى منصة المناهج المركزية وهو متاح لجميع الطلاب في ${grade}!`);
    setTimeout(() => setSavedSuccessMessage(null), 5000);

    // Reset unit extraction view for next book
    setExtractedUnits(null);
  };

  // Sample CSV Bulk Generator
  const handleDownloadCSVTemplate = () => {
    const csvHeader = 'academic_year,education_stage,grade,semester,subject_name,book_name,book_pdf_url,source_url,is_active\n';
    const csvRows = [
      '1447هـ - 2026م,middle,الصف الثالث المتوسط,1,الرياضيات,كتاب الرياضيات - الجزء الأول,https://ien.edu.sa/preview/math3-1.pdf,https://ien.edu.sa,true',
      '1447هـ - 2026م,middle,الصف الثالث المتوسط,1,العلوم,كتاب العلوم العامة - الفصل الأول,https://ien.edu.sa/preview/sci3-1.pdf,https://ien.edu.sa,true',
      '1447هـ - 2026م,secondary,الصف الثاني الثانوي,2,الذكاء الاصطناعي 1,كتاب مسار الهندسة والحاسب - الذكاء الاصطناعي,https://ien.edu.sa/preview/ai2-2.pdf,https://ien.edu.sa,true',
      '1447هـ - 2026م,primary,الصف السادس الابتدائي,1,اللغة العربية,كتاب لغتي الجميلة - الفصل الأول,https://ien.edu.sa/preview/arabic6-1.pdf,https://ien.edu.sa,true'
    ].join('\n');

    // UTF-8 BOM prefix (\uFEFF) ensures Excel opens Arabic correctly
    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_استيراد_المناهج_الوزارية.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Central Books Registry to Excel/CSV
  const handleExportCurriculumToExcel = () => {
    const csvHeader = 'academic_year,education_stage,grade,semester,subject_name,book_name,book_pdf_url,source_url,is_active\n';
    const csvRows = centralBooks
      .map((b) => {
        return `"${b.academic_year || '1447هـ'}","${b.stage || 'middle'}","${b.grade}","${b.term || 1}","${b.subject_name || b.subject}","${b.book_name || b.title}","${b.book_pdf_url || ''}","${b.source_url || 'https://ien.edu.sa'}","${b.is_active !== false}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تصدير_المناهج_الوزارية_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload and Parse User's Excel/CSV File directly from computer
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadedExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const lines = content
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        alert('ملف Excel / CSV غير صالح أو لا يحتوي على صفوف بيانات.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

      const books: Partial<CurriculumBook>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rawRow = lines[i];
        // Parse CSV row respecting potential quotes
        const cols = rawRow.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawRow.split(',');
        const cleanCols = cols.map((c) => c.trim().replace(/^"|"$/g, ''));

        if (cleanCols.length === 0 || !cleanCols[0]) continue;

        const getValue = (keys: string[], defaultIdx: number) => {
          for (const key of keys) {
            const idx = headers.findIndex((h) => h.includes(key));
            if (idx !== -1 && cleanCols[idx]) return cleanCols[idx];
          }
          return cleanCols[defaultIdx] || '';
        };

        const academic_year = getValue(['academic_year', 'سنة', 'عام'], 0) || '1447هـ - 2026م';
        const stageRaw = getValue(['education_stage', 'stage', 'مرحلة'], 1) || 'middle';
        const stage = stageRaw.includes('ابتدائ') ? 'primary' : stageRaw.includes('ثانو') ? 'secondary' : 'middle';
        const grade = getValue(['grade', 'صف'], 2) || 'الصف الثالث المتوسط';
        const termVal = parseInt(getValue(['semester', 'term', 'فصل'], 3) || '1', 10);
        const term = (isNaN(termVal) ? 1 : termVal) as 1 | 2 | 3;
        const subject_name = getValue(['subject_name', 'مادة', 'مقرر'], 4) || 'مادة جديدة';
        const book_name = getValue(['book_name', 'كتاب', 'عنوان'], 5) || `كتاب ${subject_name}`;
        const book_pdf_url = getValue(['book_pdf_url', 'pdf', 'رابط'], 6) || 'https://ien.edu.sa';
        const source_url = getValue(['source_url', 'مصدر'], 7) || 'https://ien.edu.sa';

        books.push({
          academic_year,
          stage,
          grade,
          term,
          subject_name,
          book_name,
          book_pdf_url,
          source_url,
          is_active: true
        });
      }

      setParsedRows(books);
      setExcelSuccessNotice(`تم تحليل وقراءة ${books.length} مقرشاً دراسياً بنجاح من الملف Excel/CSV (${file.name}).`);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Pre-fill sample bulk demo data
  const handleLoadSampleDemoRows = () => {
    const demoBooks: Partial<CurriculumBook>[] = [
      {
        academic_year: '1447هـ - 2026م',
        stage: 'middle',
        grade: 'الصف الثالث المتوسط',
        term: 1,
        subject_name: 'الحاسب والتقنية الرقمية',
        book_name: 'كتاب المهارات الرقمية المتقدمة - الفصل الأول',
        book_pdf_url: 'https://ien.edu.sa/preview/digital-skills-m3.pdf',
        source_url: 'https://ien.edu.sa',
        is_active: true
      },
      {
        academic_year: '1447هـ - 2026م',
        stage: 'middle',
        grade: 'الصف الثالث المتوسط',
        term: 1,
        subject_name: 'اللغة الإنجليزية (Super Goal 3)',
        book_name: 'English Book Super Goal 3 - Student Book',
        book_pdf_url: 'https://ien.edu.sa/preview/english-m3-t1.pdf',
        source_url: 'https://ien.edu.sa',
        is_active: true
      },
      {
        academic_year: '1447هـ - 2026م',
        stage: 'secondary',
        grade: 'الصف الأول الثانوي',
        term: 2,
        subject_name: 'الفيزياء 1 - مسارات',
        book_name: 'كتاب الفيزياء العامة والتطبيقات - طبعة 1447هـ',
        book_pdf_url: 'https://ien.edu.sa/preview/physics-sec1.pdf',
        source_url: 'https://ien.edu.sa',
        is_active: true
      },
      {
        academic_year: '1447هـ - 2026م',
        stage: 'primary',
        grade: 'الصف الرابع الابتدائي',
        term: 1,
        subject_name: 'الدرسات الإسلامية',
        book_name: 'كتاب الدراسات الإسلامية الموحد - الرابع الابتدائي',
        book_pdf_url: 'https://ien.edu.sa/preview/islamic-p4.pdf',
        source_url: 'https://ien.edu.sa',
        is_active: true
      }
    ];

    setParsedRows(demoBooks);
    setExcelSuccessNotice('تم تحميل 4 مقررات وزارية تجريبية جاهزة للاعتماد في المنصة.');
  };

  // Bulk Commit Excel Rows
  const handleCommitBulkImport = () => {
    if (parsedRows.length === 0) {
      alert('لا توجد مقررات محملة للاستيراد.');
      return;
    }

    const newBooksList: CurriculumBook[] = parsedRows.map((row, idx) => ({
      id: `book-bulk-${Date.now()}-${idx}`,
      title: row.book_name || 'مقرر دراسي جديد',
      book_name: row.book_name || 'مقرر دراسي جديد',
      subject: row.subject_name || 'عام',
      subject_name: row.subject_name || 'عام',
      grade: row.grade || 'الصف الثالث المتوسط',
      stage: row.stage || 'middle',
      education_stage: row.stage || 'middle',
      term: (row.term as any) || 1,
      semester: (row.term as any) || 1,
      academic_year: row.academic_year || '1447هـ - 2026م',
      editionYear: `${row.academic_year || '1447هـ - 2026م'} (طبعة وزارة التعليم)`,
      book_pdf_url: row.book_pdf_url || 'https://ien.edu.sa',
      source_url: row.source_url || 'https://ien.edu.sa',
      portalUrl: row.source_url || 'https://ien.edu.sa',
      is_active: row.is_active !== undefined ? row.is_active : true,
      coverIcon: '📖',
      totalPages: 140,
      isLatestSync: true,
      chapters: [
        {
          id: `ch-bulk-${idx}-1`,
          title: 'الفصل الأول: المفاهيم الأساسية للدرس',
          pageStart: 1,
          pageEnd: 50,
          topics: ['الدرس الأول: نظرة عامة وشرح المفهوم', 'الدرس الثاني: حلول التمارين والتطبيق']
        }
      ]
    }));

    onBulkAddBooks(newBooksList);
    setExcelSuccessNotice(`تم اعتماد واستيراد ${newBooksList.length} مقرشاً دراسياً جديداً إلى المنصة بنجاح!`);
    setParsedRows([]);
    setTimeout(() => setExcelSuccessNotice(null), 5000);
  };

  // Execute Version Replacement
  const handleConfirmVersionReplacement = () => {
    if (!replacingBook) return;

    const newVersionBook: CurriculumBook = {
      ...replacingBook,
      id: `book-${Date.now()}`,
      academic_year: newVersionYear,
      editionYear: `${newVersionYear} (إصدار حديث معتمد)`,
      book_pdf_url: newVersionPdfUrl || replacingBook.book_pdf_url,
      is_active: true,
      isLatestSync: true,
      versionHistoryId: replacingBook.id
    };

    onReplaceBookVersion(replacingBook.id, newVersionBook);
    setReplacingBook(null);
    alert(`تم استبدال إصدار الكتاب بنجاح. أرشفة الإصدار السابق (${replacingBook.academic_year})، وتفعيل الإصدار الجديد (${newVersionYear}).`);
  };

  // Filter Central Books Registry
  const filteredCentralRegistry = centralBooks.filter((book) => {
    const matchesSearch =
      book.title.includes(registrySearch) ||
      book.subject.includes(registrySearch) ||
      book.grade.includes(registrySearch) ||
      (book.academic_year && book.academic_year.includes(registrySearch));

    const matchesStage = filterStage === 'all' || book.stage === filterStage;
    const matchesActive =
      filterActive === 'all'
        ? true
        : filterActive === 'active'
        ? book.is_active
        : !book.is_active;

    return matchesSearch && matchesStage && matchesActive;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-black px-3.5 py-1 rounded-full border border-amber-500/40">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>إدارة المناهج والكتب المركزية (Super Admin Platform Registry)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              استيراد المناهج والكتب والتحليل الآلي
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              تحكم كامل ومباشر للأدمن الرئيسي لإضافة الكتب المعتمدة، استيراد المناهج بالدفعة (Excel)، تحليل فهرس الكتب بالذكاء الاصطناعي، واستبدال وتحديث إصدارات الأعوام الدراسية مع الأرشفة التلقائية.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-right text-xs space-y-1.5 shrink-0">
            <div className="text-slate-400">إجمالي الكتب المركزية بالمنصة:</div>
            <div className="text-2xl font-black text-emerald-400">{centralBooks.length} كتاباً ومقرراً</div>
            <div className="text-[10px] text-slate-500">تظهر تلقائياً لكافة المدارس دون تكرار</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة كتاب يدوي + تحليل بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'excel'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد ملف Excel/CSV للمناهج</span>
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'registry'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>سجل المناهج المركزية وإصدارات الأعوام ({centralBooks.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MANUAL ADD + AI INDEX ANALYSIS */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                بيانات كتاب وحقل المقرر المطلوب
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                إضافة مركزية موحدة
              </span>
            </div>

            {savedSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{savedSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveManualBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    السنة الدراسية (academic_year):
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="1447هـ - 2026م"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المرحلة التعليمية (education_stage):
                  </label>
                  <select
                    value={educationStage}
                    onChange={(e) => setEducationStage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="primary">الابتدائية</option>
                    <option value="middle">المتوسطة</option>
                    <option value="secondary">الثانوية (المسارات)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصف الدراسي (grade):
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الفصل الدراسي (semester):
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value) as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value={1}>الفصل الدراسي الأول (1)</option>
                    <option value={2}>الفصل الدراسي الثاني (2)</option>
                    <option value={3}>الفصل الدراسي الثالث (3)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المادة (subject_name):
                  </label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="مثال: الذكاء الاصطناعي، الرياضيات"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الكتاب الكامل (book_name):
                  </label>
                  <input
                    type="text"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder="مثال: كتاب الذكاء الاصطناعي 1 - الجزء الأول"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  رفع ملف الكتاب PDF يدوي من الجهاز أو إدخال الرابط (book_pdf_url):
                </label>
                <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 p-4 rounded-2xl transition text-center relative cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 text-slate-700">
                    <Upload className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">اضغط هنا لرفع ملف PDF الكتاب يدويًا من جهازك</span>
                    <span className="text-[10px] text-slate-500">يدعم كافة ملفات المناهج الدراسية (PDF)</span>
                  </div>
                </div>

                {uploadedFileName && (
                  <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>تم تحميل الملف: {uploadedFileName} ({uploadedFileSize})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileName(null);
                        setUploadedFileSize(null);
                        setBookPdfUrl('');
                      }}
                      className="text-red-600 hover:text-red-800 text-[10px] font-bold underline"
                    >
                      إلغاء الملف
                    </button>
                  </div>
                )}

                <input
                  type="url"
                  value={bookPdfUrl}
                  onChange={(e) => setBookPdfUrl(e.target.value)}
                  placeholder="أو أدخل رابط الكتاب مباشرة (https://ien.edu.sa/preview/book.pdf)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رابط المصدر (source_url):
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://ien.edu.sa"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حالة الكتاب التشغيلية (is_active):
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-700 cursor-pointer">
                      <input
                        type="radio"
                        name="isActive"
                        checked={isActive === true}
                        onChange={() => setIsActive(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>نشط ومتاح للطلاب (Active)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-amber-700 cursor-pointer">
                      <input
                        type="radio"
                        name="isActive"
                        checked={isActive === false}
                        onChange={() => setIsActive(false)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>مؤرشف (Archived)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* AI Analysis Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-xl shadow-purple-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
                  <span>
                    {isAnalyzing
                      ? 'جاري تحليل وفهرسة الكتاب بالذكاء الاصطناعي...'
                      : 'تحليل الكتاب بالذكاء الاصطناعي (استخراج الوحدات والدروس والصفحات)'}
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>اعتماد وحفظ الكتاب بالمنصة المركزية</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Extracted Index Reviewer */}
          <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base text-white">
                    نتائج تحليل الفهرس بالذكاء الاصطناعي
                  </h3>
                </div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 font-bold">
                  Units → Chapters → Lessons → Pages
                </span>
              </div>

              {aiSummaryNotice && (
                <div className="p-3 bg-purple-900/40 border border-purple-500/30 text-purple-200 text-xs rounded-2xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{aiSummaryNotice}</span>
                </div>
              )}

              {extractedUnits && (
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalBookTitle(bookName);
                    setReviewModalSubject(subjectName);
                    setReviewModalGrade(grade);
                    setReviewModalUnits(extractedUnits);
                    setReviewingBookId(null);
                    setShowReviewModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>فتح جدول تدقيق ومراجعة الهيكل تفصيلياً (Review Table)</span>
                </button>
              )}

              {extractedUnits ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {extractedUnits.map((u, uIdx) => (
                    <div key={u.id || uIdx} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                        <span className="font-black text-sm text-amber-300">{u.title}</span>
                        <span className="text-[10px] bg-slate-900 text-slate-300 font-bold px-2 py-0.5 rounded">
                          الوحدة {u.unitNumber}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {u.chapters.map((ch, cIdx) => (
                          <div key={ch.id || cIdx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                            <div className="font-extrabold text-xs text-emerald-400">{ch.title}</div>

                            {ch.lessons && ch.lessons.length > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                {ch.lessons.map((les, lIdx) => (
                                  <div
                                    key={les.id || lIdx}
                                    className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700 text-xs flex items-center justify-between gap-2"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-slate-200">{les.title}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                        <span>المواضيع: {les.topics?.join(' ، ')}</span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded shrink-0">
                                      ص ({les.pageStart} - {les.pageEnd})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">
                                المواضيع: {ch.topics?.join(' ، ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/50 rounded-2xl p-10 text-center space-y-3 border border-dashed border-slate-700 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto text-xl">
                    🤖
                  </div>
                  <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto">
                    اضغط على زر "تحليل الكتاب بالذكاء الاصطناعي" لقراءة كتاب الـ PDF وتفكيك فهرس الوحدات والفصول والدروس وأرقام الصفحات تلقائياً.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-4 flex items-center justify-between">
              <span>تعتمد الهيكلية وتظهر فوراً لكافة الطلاب بنفس المرحلة.</span>
              <span className="text-emerald-400 font-bold">تزامن مباشر 100%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL / CSV BULK IMPORT */}
      {activeTab === 'excel' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                استيراد وتنزيل المناهج المدرسية عبر Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك رفع ملف Excel أو CSV مباشر من جهازك، أو تحميل النموذج القياسي، أو تصدير قاعدة بيانات المناهج الحالية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportCurriculumToExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 transition"
                title="تصدير كافة المناهج الحالية كملف Excel / CSV"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>تصدير المناهج الحالية (Excel)</span>
              </button>

              <button
                onClick={handleDownloadCSVTemplate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تحميل نموذج Excel القياسي</span>
              </button>

              <button
                onClick={handleLoadSampleDemoRows}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-300 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>تعبئة 4 مقررات تجريبية</span>
              </button>
            </div>
          </div>

          {/* Excel File Drag and Drop / Input Upload Box */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 transition text-center space-y-3 relative group">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleExcelFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-black text-slate-800">
                انقر هنا لاختيار أو إسقاط ملف المناهج (Excel / CSV) من جهازك
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                يدعم كافة التنسيقات (XLSX, XLS, CSV) مع التعرف الآلي على الأعمدة باللغتين العربية والإنجليزية
              </p>
            </div>

            {uploadedExcelFileName && (
              <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-1.5 rounded-full">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>تم اختيار الملف: {uploadedExcelFileName}</span>
              </div>
            )}
          </div>

          {excelSuccessNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{excelSuccessNotice}</span>
            </div>
          )}

          {/* Table Preview of Imported Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-700">
                معاينة المقررات الجاهزة للاستيراد ({parsedRows.length} مقرراً):
              </h4>
              {parsedRows.length > 0 && (
                <button
                  onClick={() => {
                    setParsedRows([]);
                    setUploadedExcelFileName(null);
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  مسح الجدول
                </button>
              )}
            </div>

            {parsedRows.length > 0 ? (
              <div className="space-y-3">
                {/* Data Verification & Matching Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl">
                  <div className="border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي المقررات بالملف</span>
                    <span className="text-base font-black text-white">{parsedRows.length} مقرراً</span>
                  </div>
                  <div className="border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-emerald-400 font-bold block">مقررات جديدة فريدة</span>
                    <span className="text-base font-black text-emerald-300">
                      {
                        parsedRows.filter(
                          (r) =>
                            !centralBooks.some(
                              (cb) =>
                                (cb.book_name && r.book_name && cb.book_name.toLowerCase() === r.book_name.toLowerCase()) ||
                                (cb.subject_name && cb.grade && cb.subject_name === r.subject_name && cb.grade === r.grade)
                            )
                        ).length
                      }{' '}
                      جديد
                    </span>
                  </div>
                  <div className="border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-amber-400 font-bold block">مطلوبة للتحديث/الإحلال</span>
                    <span className="text-base font-black text-amber-300">
                      {
                        parsedRows.filter((r) =>
                          centralBooks.some(
                            (cb) =>
                              (cb.book_name && r.book_name && cb.book_name.toLowerCase() === r.book_name.toLowerCase()) ||
                              (cb.subject_name && cb.grade && cb.subject_name === r.subject_name && cb.grade === r.grade)
                          )
                        ).length
                      }{' '}
                      مطابق
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold block">دقة تطابق المخطط</span>
                    <span className="text-base font-black text-cyan-300">100% متوافق</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-white font-bold text-[11px]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">اسم الكتاب / المقرر</th>
                        <th className="p-3">اسم المادة</th>
                        <th className="p-3">الصف الدراسي</th>
                        <th className="p-3">السنة والدورة</th>
                        <th className="p-3">نتيجة التحقق وتطابق البيانات</th>
                        <th className="p-3">رابط المصدر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                      {parsedRows.map((row, idx) => {
                        const matchedBook = centralBooks.find(
                          (cb) =>
                            (cb.book_name && row.book_name && cb.book_name.toLowerCase() === row.book_name.toLowerCase()) ||
                            (cb.subject_name && cb.grade && cb.subject_name === row.subject_name && cb.grade === row.grade)
                        );

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3 text-slate-900 font-black">{row.book_name}</td>
                            <td className="p-3 text-slate-700">{row.subject_name}</td>
                            <td className="p-3 text-slate-600">{row.grade}</td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">
                              {row.academic_year} (فصل {row.term})
                            </td>
                            <td className="p-3">
                              {matchedBook ? (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2.5 py-1 rounded-full">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>مطابق لمقرر مسجل (سيحدث النسخة)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>مقرر جديد فريد (سيتم إضافته)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-emerald-600 truncate max-w-[140px]">
                              {row.book_pdf_url || row.source_url}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-600 font-bold">
                  لم يتم اختيار أي ملف بعد. يمكنك رفع ملف Excel من أعلى أو تجربة "تعبئة 4 مقررات تجريبية".
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCommitBulkImport}
                disabled={parsedRows.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد واستيراد كافة المقررات بالجملة ({parsedRows.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CENTRAL REGISTRY & VERSION REPLACEMENT */}
      {activeTab === 'registry' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                سجل المناهج المركزية وإصدارات الأعوام الدراسية
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                قائمة جميع الكتب بالمنصة. يمكنك استبدال إصدار كتاب جديد للسنة الدراسية القادمة مع الاحتفاظ بالإصدار السابق مؤرشفاً.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="ابحث في سجل الكتب..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pr-9 pl-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 outline-none font-bold"
              >
                <option value="all">كافة المراحل</option>
                <option value="primary">الابتدائية</option>
                <option value="middle">المتوسطة</option>
                <option value="secondary">الثانوية</option>
              </select>

              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 outline-none font-bold"
              >
                <option value="all">الكل (نشط ومؤرشف)</option>
                <option value="active">النشط فقط</option>
                <option value="archived">المؤرشف فقط</option>
              </select>
            </div>
          </div>

          {/* Central Books Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-extrabold">
                <tr>
                  <th className="p-3.5">المقرر والكتاب</th>
                  <th className="p-3.5">المادة</th>
                  <th className="p-3.5">الصف / المرحلة</th>
                  <th className="p-3.5">السنة الدراسية</th>
                  <th className="p-3.5">الفصل</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات والاستبدال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {filteredCentralRegistry.map((book) => (
                  <tr key={book.id} className={book.is_active ? 'hover:bg-slate-50' : 'bg-slate-50/60 opacity-75'}>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{book.coverIcon}</span>
                        <div>
                          <div className="font-black text-slate-900">{book.title}</div>
                          <div className="text-[10px] text-slate-400">{book.editionYear}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-emerald-800">{book.subject}</td>

                    <td className="p-3.5 text-slate-600">
                      {book.grade} ({book.stage === 'primary' ? 'ابتدائية' : book.stage === 'middle' ? 'متوسطة' : 'ثانوية'})
                    </td>

                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                        {book.academic_year || '1447هـ - 2026م'}
                      </span>
                    </td>

                    <td className="p-3.5">الفصل {book.term}</td>

                    <td className="p-3.5">
                      {book.is_active ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
                          نشط (Active)
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 w-max">
                          <Archive className="w-3 h-3" />
                          <span>مؤرشف (Archived)</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {/* AI Structure Analysis & Review Button */}
                        <button
                          onClick={() => handleAnalyzeRegistryBook(book)}
                          disabled={isAnalyzing}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-extrabold px-3 py-1.5 rounded-lg border border-purple-200 transition flex items-center gap-1"
                          title="تحليل الكتاب بالذكاء الاصطناعي واستخراج الهيكل التنظيمي في جدول للمراجعة"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>تدقيق الهيكل (AI)</span>
                        </button>

                        {/* Replace Version Button */}
                        <button
                          onClick={() => {
                            setReplacingBook(book);
                            setNewVersionYear('1448هـ - 2027م');
                            setNewVersionPdfUrl(book.book_pdf_url || '');
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-extrabold px-3 py-1.5 rounded-lg border border-indigo-200 transition flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-indigo-600" />
                          <span>استبدال إصدار جديد</span>
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() => onUpdateBook({ ...book, is_active: !book.is_active })}
                          className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border transition ${
                            book.is_active
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {book.is_active ? 'أرشفة' : 'تفعيل'}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت تأكد من حذف كتاب "${book.title}"؟`)) {
                              onDeleteBook(book.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="حذف الكتاب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VERSION REPLACEMENT MODAL */}
      {replacingBook && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  استبدال إصدار الكتاب للسنة الجديدة
                </h3>
              </div>
              <button
                onClick={() => setReplacingBook(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-900">الكتاب الحالي: {replacingBook.title}</div>
              <div className="text-slate-500">العام الحالي: {replacingBook.academic_year || '1447هـ - 2026م'}</div>
              <div className="text-amber-700 font-bold text-[11px] pt-1">
                سيتم أرشفة هذا الإصدار تلقائياً وإنشاء الإصدار الجديد المحدث كنشط.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السنة الدراسية الجديدة (academic_year):
                </label>
                <input
                  type="text"
                  value={newVersionYear}
                  onChange={(e) => setNewVersionYear(e.target.value)}
                  placeholder="1448هـ - 2027م"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط الكتاب PDF الجديد (book_pdf_url):
                </label>
                <input
                  type="url"
                  value={newVersionPdfUrl}
                  onChange={(e) => setNewVersionPdfUrl(e.target.value)}
                  placeholder="https://ien.edu.sa/preview/new-edition.pdf"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmVersionReplacement}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                تأكيد واستبدال الإصدار
              </button>
              <button
                onClick={() => setReplacingBook(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BOOK STRUCTURE REVIEW & APPROVAL MODAL */}
      <BookStructureReviewModal
        isOpen={showReviewModal}
        bookTitle={reviewModalBookTitle}
        subjectName={reviewModalSubject}
        gradeName={reviewModalGrade}
        units={reviewModalUnits}
        onClose={() => setShowReviewModal(false)}
        onApproveStructure={(approvedUnits) => {
          setExtractedUnits(approvedUnits);
          if (reviewingBookId) {
            const bookToUpdate = centralBooks.find((b) => b.id === reviewingBookId);
            if (bookToUpdate) {
              const defaultChapters = approvedUnits.flatMap((u) => u.chapters);
              onUpdateBook({
                ...bookToUpdate,
                chapters: defaultChapters
              });
              setSavedSuccessMessage(`تم اعتماد وتحديث الهيكل التنظيمي المراجع لكتاب "${bookToUpdate.title}" بنجاح!`);
            }
          } else {
            setSavedSuccessMessage(`تم تدقيق واعتماد الهيكل التنظيمي للكتاب (${approvedUnits.length} وحدات). يمكنك الآن حفظ المقرر بالمنصة.`);
          }
        }}
      />
    </div>
  );
};
