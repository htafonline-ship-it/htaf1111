import React, { useState } from 'react';
import { CurriculumBook, SchoolCircular, SchoolTenant } from '../types';
import {
  Printer,
  FileText,
  X,
  Share2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Award,
  QrCode
} from 'lucide-react';

interface ReportPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'curriculum_single' | 'curriculum_stage' | 'circular_single' | 'circular_all';
  book?: CurriculumBook;
  books?: CurriculumBook[];
  stageLabel?: string;
  circular?: SchoolCircular;
  school?: SchoolTenant;
  circulars?: SchoolCircular[];
}

export const ReportPdfExportModal: React.FC<ReportPdfExportModalProps> = ({
  isOpen,
  onClose,
  type,
  book,
  books = [],
  stageLabel = 'جميع المراحل',
  circular,
  school,
  circulars = []
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const schoolName = school?.name || 'مدرسة الفيصل النموذجية';
  const principalName = school?.principalName || 'د. عبد الله بن محمد آل سعود';
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const documentRef = `MOH-${Math.floor(100000 + Math.random() * 900000)}-2026`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(`${url}#doc=${documentRef}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header Actions (Hidden in Print) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                معاينة تقرير PDF وتصديره للطابعة / الحفظ
              </h3>
              <p className="text-xs text-slate-400">
                جاهز للمشاركة المباشرة وصالح للاعتماد المدرسي والرسمي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition border border-slate-700"
              title="نسخ رابط التحقق والتتبع الرقمي"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div
          id="printable-pdf-document"
          className="p-8 sm:p-12 overflow-y-auto space-y-8 bg-white text-slate-900 custom-scrollbar print:p-8 print:overflow-visible print:text-black"
        >
          {/* Official Ministry / School Letterhead Header */}
          <div className="border-b-2 border-emerald-800 pb-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              {/* Right Column: Kingdom & Ministry */}
              <div className="space-y-1 text-right">
                <p className="font-black text-sm text-slate-900">المملكة العربية السعودية</p>
                <p className="text-slate-700">وزارة التعليم</p>
                <p className="text-emerald-800 font-black">{schoolName}</p>
                <p className="text-[11px] text-slate-500">منصة إدارة المناهج والتعاميم المعتمدة</p>
              </div>

              {/* Center Emblem / Emblem Badge */}
              <div className="text-center space-y-1">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-emerald-800 mx-auto flex items-center justify-center font-black shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-emerald-700" />
                </div>
                <p className="text-[10px] text-slate-500 font-bold">سجل وثائق رسمية</p>
              </div>

              {/* Left Column: Metadata */}
              <div className="space-y-1 text-left text-[11px] text-slate-600">
                <p><span className="font-bold text-slate-800">الرقم المرجعي:</span> {documentRef}</p>
                <p><span className="font-bold text-slate-800">التاريخ:</span> {currentDate}</p>
                <p><span className="font-bold text-slate-800">العام الدراسي:</span> 1448هـ - 2027م</p>
                <span className="inline-block bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-300">
                  موثق الكترونياً
                </span>
              </div>
            </div>
          </div>

          {/* DOCUMENT CONTENT: TYPE 1 - SINGLE CURRICULUM REPORT */}
          {type === 'curriculum_single' && book && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white font-black text-xs px-3 py-0.5 rounded-full">
                      تقرير مقرر دراسي رسمي
                    </span>
                    <span className="text-xs text-emerald-800 font-bold">{book.editionYear}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">{book.title}</h2>
                  <p className="text-xs text-slate-700 font-bold">
                    المادة: {book.subject} • الصف: {book.grade} • الفصل الدراسي: {book.term}
                  </p>
                </div>

                <div className="text-center sm:text-left space-y-1 border-t sm:border-t-0 sm:border-r border-emerald-200 pt-3 sm:pt-0 sm:pr-6">
                  <p className="text-xs text-slate-500 font-bold">إجمالي صفحات المقرر</p>
                  <p className="text-3xl font-black text-emerald-800">{book.totalPages} ص</p>
                  <span className="text-[10px] bg-white border border-emerald-300 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    مستخرج بالذكاء الاصطناعي
                  </span>
                </div>
              </div>

              {/* Book Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">المرحلة الدراسية</span>
                  <span className="font-black text-slate-800">
                    {book.stage === 'primary' ? 'الابتدائية' : book.stage === 'middle' ? 'المتوسطة' : 'الثانوية'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">المسار الأكاديمي</span>
                  <span className="font-black text-slate-800">{book.track || 'المسار العام'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">عدد الفصول المعتمدة</span>
                  <span className="font-black text-slate-800">{book.chapters.length} فصول</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">حالة المزامنة مع بوابة عين</span>
                  <span className="font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مُزامن ومحدث
                  </span>
                </div>
              </div>

              {/* Chapters & Detailed Index Breakdown Table */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2">
                  تفاصيل الفصول والوحدات التعليمية بالمقرر:
                </h3>

                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-extrabold">
                      <th className="p-3 rounded-tr-xl">#</th>
                      <th className="p-3">عنوان الفصل / الوحده</th>
                      <th className="p-3">نطاق الصفحات</th>
                      <th className="p-3 rounded-tl-xl">الدروس والمواضيع الفرعية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {book.chapters.map((ch, idx) => (
                      <tr key={ch.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-black text-slate-900">{ch.title}</td>
                        <td className="p-3 font-bold text-emerald-800 whitespace-nowrap">
                          {ch.pageStart ? `ص ${ch.pageStart} - ص ${ch.pageEnd}` : 'غير محدد'}
                        </td>
                        <td className="p-3">
                          <ul className="list-disc list-inside space-y-1 text-slate-700">
                            {ch.topics && ch.topics.map((tp, tIdx) => (
                              <li key={tIdx}>{tp}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DOCUMENT CONTENT: TYPE 2 - STAGE CURRICULUM SUMMARY REPORT */}
          {type === 'curriculum_stage' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded">
                    تقرير حصر المناهج الشامل
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">
                    تقرير المناهج الدراسية - {stageLabel}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    المكتبة المركزية للمناهج والكتب المعتمدة بوزارة التعليم
                  </p>
                </div>

                <div className="text-left border-r border-slate-700 pr-6">
                  <p className="text-xs text-slate-400">إجمالي الكتب المسجلة</p>
                  <p className="text-3xl font-black text-emerald-400">{books.length} كتاباً</p>
                </div>
              </div>

              {/* Books Summary Table */}
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold">
                    <th className="p-3">اسم المقرر والتصنيف</th>
                    <th className="p-3">المادة الدراسية</th>
                    <th className="p-3">الصف والفصل</th>
                    <th className="p-3">عدد الصفحات</th>
                    <th className="p-3">عدد الفصول</th>
                    <th className="p-3">حالة المزامنة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {books.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-black text-slate-900">
                        {b.title}
                        <span className="block text-[10px] text-slate-500 font-normal">{b.editionYear}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{b.subject}</td>
                      <td className="p-3 font-bold text-slate-800">{b.grade} (فـ{b.term})</td>
                      <td className="p-3 font-bold text-emerald-800">{b.totalPages} صفحة</td>
                      <td className="p-3 font-bold text-slate-700">{b.chapters.length} فصول</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          معتمد ومزامن
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENT CONTENT: TYPE 3 - SINGLE SCHOOL CIRCULAR */}
          {type === 'circular_single' && circular && (
            <div className="space-y-6">
              {/* Circular Title Banner */}
              <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      تعميم رقم: <span className="text-emerald-800">{circular.number}</span>
                    </span>
                    <span className="text-xs text-slate-500">• التاريخ: {circular.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${
                        circular.priority === 'عاجل'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : circular.priority === 'هام'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      درجة الأهمية: {circular.priority}
                    </span>
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full">
                      الفئة: {circular.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500">
                    المستهدفون بالتعميم: <span className="text-slate-900 font-extrabold">{circular.targetAudience}</span>
                  </p>
                  <h2 className="text-2xl font-black text-slate-900">{circular.title}</h2>
                </div>
              </div>

              {/* Official Circular Body */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 leading-relaxed text-slate-800 text-sm">
                <p className="font-bold text-slate-900">المكرمون {circular.targetAudience}، المحترمون</p>
                <p className="font-bold text-slate-800">السلام عليكم ورحمة الله وبركاته،، وبدعد:</p>
                
                <div className="p-4 bg-slate-50/80 rounded-xl border-r-4 border-emerald-600 text-justify text-slate-900 space-y-2 leading-loose whitespace-pre-line">
                  {circular.content}
                </div>

                {circular.attachedDocName && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>المرفق المرفق بالتعميم الرسمى: {circular.attachedDocName}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700">مرفق الكتروني معتمد</span>
                  </div>
                )}

                <p className="text-left font-bold text-slate-900 pt-4">شاكرين ومقدرين لكم حسن التعاون،،</p>
              </div>
            </div>
          )}

          {/* DOCUMENT CONTENT: TYPE 4 - ALL SCHOOL CIRCULARS REPORT */}
          {type === 'circular_all' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded">
                    سجل التعاميم المدرسية الرسمية
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">
                    تقرير التعاميم الصادرة - {schoolName}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    كشف بالتعاميم والقرارات الإدارية والتنظيمية الصادرة للطلاب والمعلمين
                  </p>
                </div>

                <div className="text-left border-r border-slate-700 pr-6">
                  <p className="text-xs text-slate-400">إجمالي التعاميم</p>
                  <p className="text-3xl font-black text-emerald-400">{circulars.length} تعاميم</p>
                </div>
              </div>

              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold">
                    <th className="p-3">رقم التعميم والتاريخ</th>
                    <th className="p-3">عنوان التعميم الرسمى</th>
                    <th className="p-3">الفئة</th>
                    <th className="p-3">الأهمية</th>
                    <th className="p-3">الفئة المستهدفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {circulars.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-black text-slate-900">
                        {c.number}
                        <span className="block text-[10px] text-slate-500 font-normal">{c.date}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{c.title}</td>
                      <td className="p-3 text-slate-700 font-bold">{c.category}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            c.priority === 'عاجل'
                              ? 'bg-red-100 text-red-800'
                              : c.priority === 'هام'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{c.targetAudience}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures & Seal Footer */}
          <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs items-center">
            {/* Signature 1 */}
            <div className="text-right space-y-2">
              <p className="font-extrabold text-slate-900">مدير المدرسة / المعتمد:</p>
              <p className="text-slate-800 font-black">{principalName}</p>
              <div className="h-8 border-b border-dashed border-slate-300 w-36" />
            </div>

            {/* Official Graphic Stamp / Seal */}
            <div className="text-center space-y-1">
              <div className="w-24 h-24 rounded-full border-4 border-double border-emerald-700 text-emerald-800 mx-auto flex flex-col items-center justify-center p-1 bg-emerald-50/50 shadow-sm relative">
                <Award className="w-6 h-6 text-emerald-700" />
                <span className="text-[8px] font-black text-center leading-tight mt-0.5 text-emerald-900">
                  ختم الاعتماد المدرسي الرسمى
                </span>
                <span className="text-[7px] text-emerald-700 font-bold">1448هـ - 2027م</span>
              </div>
            </div>

            {/* Verification QR Code */}
            <div className="text-left space-y-1 flex flex-col items-end">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-lg p-1.5 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-[9px] text-slate-500 font-bold">رمز التحقق الإلكتروني الذكي</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-500 border-t border-slate-100 pt-3">
            هذا المستند مستخرج رسمياً من منصة المناهج والتعاميم المدرسية الذكية ومحمي برقم التتبع الإلكتروني الموحد ({documentRef}).
          </div>
        </div>

      </div>
    </div>
  );
};
