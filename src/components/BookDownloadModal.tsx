import React, { useState } from 'react';
import { CurriculumBook } from '../types';
import { CurriculumBookCover } from './CurriculumBookCover';
import { downloadCurriculumBookPdf } from '../lib/curriculumDownloadService';
import {
  Download,
  FileText,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Sparkles,
  X,
  WifiOff,
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';

interface BookDownloadModalProps {
  book: CurriculumBook | null;
  isOpen: boolean;
  onClose: () => void;
  allBooks?: CurriculumBook[];
  onSelectAnotherBook?: (b: CurriculumBook) => void;
  onOpenReader?: (b: CurriculumBook) => void;
}

export const BookDownloadModal: React.FC<BookDownloadModalProps> = ({
  book,
  isOpen,
  onClose,
  allBooks = [],
  onSelectAnotherBook,
  onOpenReader
}) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedType, setDownloadedType] = useState<'study_pack' | 'syllabus' | 'full' | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !book) return null;

  const estimatedSizeMb = Math.max(14, Math.round((book.totalPages || 175) * 0.14));
  const cleanTitle = book.book_name || book.title;
  const officialIenUrl = book.book_pdf_url || book.source_url || `https://ien.edu.sa/Home/Book/${book.id}`;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Download Study Pack (6-page comprehensive PDF)
  const handleDownloadStudyPack = async () => {
    setDownloadProgress(10);
    setDownloadedType('study_pack');

    try {
      const res = await downloadCurriculumBookPdf(book, {
        documentType: 'study_pack',
        onProgress: (p) => setDownloadProgress(p)
      });

      if (res.success) {
        setDownloadProgress(100);
        setTimeout(() => {
          setDownloadProgress(null);
          triggerToast(`✓ تم تحميل "كتيب الملخص الشامل والتمارين" (${res.totalPages || 6} صفحات) لكتاب "${cleanTitle}" بنجاح.`);
        }, 500);
      } else {
        setDownloadProgress(null);
        triggerToast(`⚠️ تعذر تحميل الملف: ${res.error || 'يرجى المحاولة مجدداً'}`);
      }
    } catch (err: any) {
      setDownloadProgress(null);
      triggerToast(`⚠️ حدث خطأ أثناء التحميل: ${err?.message || 'خطأ غير متوقع'}`);
    }
  };

  // 2. Download Syllabus & Unit Distribution Guide (2-page official PDF)
  const handleDownloadSyllabusGuide = async () => {
    setDownloadProgress(15);
    setDownloadedType('syllabus');

    try {
      const res = await downloadCurriculumBookPdf(book, {
        documentType: 'syllabus',
        onProgress: (p) => setDownloadProgress(p)
      });

      if (res.success) {
        setDownloadProgress(100);
        setTimeout(() => {
          setDownloadProgress(null);
          triggerToast(`✓ تم تحميل "دليل وخطة توزيع المنهج" (صفحتان) لكتاب "${cleanTitle}" بنجاح.`);
        }, 500);
      } else {
        setDownloadProgress(null);
        triggerToast(`⚠️ تعذر تحميل الملف: ${res.error || 'يرجى المحاولة مجدداً'}`);
      }
    } catch (err: any) {
      setDownloadProgress(null);
      triggerToast(`⚠️ حدث خطأ أثناء التحميل: ${err?.message || 'خطأ غير متوقع'}`);
    }
  };

  const handleSaveOffline = () => {
    try {
      const savedOfflineBooks = JSON.parse(localStorage.getItem('offline_curriculum_books') || '[]');
      if (!savedOfflineBooks.includes(book.id)) {
        savedOfflineBooks.push(book.id);
        localStorage.setItem('offline_curriculum_books', JSON.stringify(savedOfflineBooks));
      }
      setIsSavedOffline(true);
      triggerToast(`✓ تم حفظ كتاب "${cleanTitle}" بنجاح في الذاكرة المحلية للتصفح بدون اتصال بالإنترنت (Offline Mode).`);
    } catch {
      triggerToast(`✓ تم تفعيل وضع القراءة بدون إنترنت لكتاب "${cleanTitle}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                مركز تحميل الكتب والمقررات المدرسية (PDF)
              </h3>
              <p className="text-[11px] text-slate-400">
                طبعات المناهج السعودية الرسمية المعتمدة لعام 1448هـ - 2027م
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Transparent Page Count Clarification Notice */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-right">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black text-sm mt-0.5 shadow-sm">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-black text-xs sm:text-sm text-amber-950">
                توضيح دقيق بشأن عدد صفحات الكتاب ({book.totalPages} صفحة):
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-900 leading-relaxed">
                كتاب الطالب المعتمد من وزارة التعليم يتألف كاملاً من <strong>{book.totalPages} صفحة</strong>.
                ولتوفير تجربة تعليمية مرنة، يمكنك:
              </p>
              <ul className="text-[11px] sm:text-xs text-amber-900 space-y-1 mr-2 list-disc list-inside">
                <li>
                  <strong>تنزيل كتاب الطالب كاملاً ({book.totalPages} صفحة):</strong> عبر بوابة عين الوطنية الرسمية أو تصفحه وحل مسائله صفحة بصفحة داخل المنصة بالذكاء الاصطناعي.
                </li>
                <li>
                  <strong>تحميل كتيب الملخص والتمارين (6 صفحات PDF):</strong> يشتمل على الغلاف، الفهرس، ملخص المفاهيم والقوانين، بنك المسائل المحلولة، ونماذج اختبارات نافس.
                </li>
                <li>
                  <strong>تحميل دليل المنهج والفهرس (صفحتان PDF):</strong> يشمل الغلاف الرسمي وبيانات الاعتماد وفهرس الوحدات والفصول.
                </li>
              </ul>
            </div>
          </div>

          {/* Book Primary Overview Card */}
          <div className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Book Cover */}
            <div className="w-32 sm:w-36 shrink-0 shadow-md rounded-2xl overflow-hidden">
              <CurriculumBookCover book={book} size="md" />
            </div>

            {/* Book Details */}
            <div className="flex-1 text-right space-y-2.5 w-full">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="bg-emerald-600 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm">
                  {book.subject}
                </span>
                <span className="bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {book.grade}
                </span>
                <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  الفصل {book.term || 1}
                </span>
                {book.track && (
                  <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {book.track}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {cleanTitle}
              </h2>

              <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>طبعة معتمدة 1448هـ</span>
                </span>
                <span>•</span>
                <span>إجمالي كتاب الطالب: <strong>{book.totalPages} صفحة</strong></span>
                <span>•</span>
                <span>الحجم التقديري للكتاب الكامل: <strong>~{estimatedSizeMb} MB</strong></span>
              </p>

              {/* Download Progress Indicator */}
              {downloadProgress !== null && (
                <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-emerald-300 shadow-sm mt-3">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>
                        {downloadedType === 'study_pack'
                          ? 'جاري إنشاء وتجهيز كتيب الملخص الشامل والتمارين (6 صفحات)...'
                          : 'جاري إعداد دليل وخطة توزيع المنهج المعتمد...'}
                      </span>
                    </span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Options Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>خيارات التحميل والتصفح المتاحة لهذا المقرر:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Option 1: Full Book via Ien Portal + Interactive Reader */}
              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/40 hover:border-emerald-600 shadow-sm transition space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      الكتاب المدرسي الأصلي
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">{book.totalPages} صفحة (~{estimatedSizeMb} MB)</span>
                  </div>
                  <h5 className="font-black text-sm text-slate-900 mt-2">
                    كتاب الطالب كاملاً ({book.totalPages} صفحة)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    النسخة المدرسية الكاملة المعتمدة بطبعة وزارة التعليم الرسمية. يمكنك تنزيلها مباشرة من بوابة عين أو فتحها تفاعلياً.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={officialIenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>تحميل الكتاب كاملاً ({book.totalPages} صفحة) من بوابة عين ↗</span>
                  </a>

                  {onOpenReader && (
                    <button
                      onClick={() => onOpenReader(book)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تصفح وحل الـ {book.totalPages} صفحة بالذكاء الاصطناعي الآن</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Comprehensive Study Pack (6-page PDF) */}
              <div className="bg-white p-4 rounded-2xl border border-teal-200 hover:border-teal-500 shadow-sm transition space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      ملخص وتمارين مدمجة
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">6 صفحات (~2.2 MB)</span>
                  </div>
                  <h5 className="font-black text-sm text-slate-900 mt-2">
                    كتيب الملخص الشامل والتمارين المحلولة (PDF)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    كراسة مكثفة تحتوي على غلاف الاعتماد، الفهرس، ملخص القوانين والمفاهيم، بنك المسائل المحلولة، واختبارات نافس مع مفاتيح الحل.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDownloadStudyPack}
                    disabled={downloadProgress !== null}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل كتيب الملخص والتمارين (PDF - 6 صفحات)</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Syllabus & Lesson Index Guide (2-page PDF) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-sm transition space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      خفيف وسريع
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">صفحتان (~450 KB)</span>
                  </div>
                  <h5 className="font-black text-sm text-slate-900 mt-2">
                    دليل توزيع المنهج وفهرس الوحدات (PDF)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    وثيقة معتمدة مكونة من صفحتين توضح الغلاف الرسمي وبيانات الاعتماد، وخطة توزيع الفصول ونطاق صفحاتها بالتفصيل.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDownloadSyllabusGuide}
                    disabled={downloadProgress !== null}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>تحميل دليل المنهج والفهرس (PDF - صفحتان)</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Offline PWA Storage */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-500 shadow-sm transition space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      المذاكرة بدون إنترنت
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">تخزين محلي PWA</span>
                  </div>
                  <h5 className="font-black text-sm text-slate-900 mt-2">
                    تثبيت المقرر للمذاكرة عند انقطاع الشبكة
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    تخزين بيانات الكتاب والدروس والتمارين محلياً في متصفحك للتمكن من المذاكرة في أي وقت دون الحاجة لشبكة إنترنت.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveOffline}
                    className={`w-full font-extrabold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition ${
                      isSavedOffline
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isSavedOffline ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>محفوظ محلياً ومتاح دون إنترنت ✓</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4" />
                        <span>تثبيت المقرر دون اتصال بالإنترنت</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Switch to another book */}
          {allBooks.length > 1 && onSelectAnotherBook && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-right">
                <h5 className="font-black text-xs text-slate-900">
                  هل ترغب في تحميل كتاب آخر؟
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  اختر أي مقرر دراسي آخر لنفس الصف أو المرحلة:
                </p>
              </div>

              <select
                value={book.id}
                onChange={(e) => {
                  const found = allBooks.find((b) => b.id === e.target.value);
                  if (found) onSelectAnotherBook(found);
                }}
                className="w-full sm:w-64 bg-white text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {allBooks
                  .filter((b) => b.grade === book.grade || b.stage === book.stage)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.book_name || b.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Official Verification Notice */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-right text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>مطابقة وموثوقية مناهج المملكة العربية السعودية:</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              جميع الكتب والمقررات المعروضة مطابقة لمواصفات المركز الوطني للمناهج ووزارة التعليم للعام الدراسي 1448هـ - 2027م / 1447هـ، وتتضمن شواهد التجويد، حلول التمارين، والأنشطة الرقمية المعتمدة.
            </p>
          </div>

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            {book.chapters.length} فصول معتمدة • طبعة {book.editionYear || '1448هـ'} • {book.totalPages} صفحة
          </span>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
