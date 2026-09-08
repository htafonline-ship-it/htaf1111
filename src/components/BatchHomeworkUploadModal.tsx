import React, { useState } from 'react';
import { HomeworkAssignment } from '../types';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';

interface BatchHomeworkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAddHomework: (homeworks: HomeworkAssignment[]) => void;
}

export const BatchHomeworkUploadModal: React.FC<BatchHomeworkUploadModalProps> = ({
  isOpen,
  onClose,
  onBatchAddHomework
}) => {
  if (!isOpen) return null;

  const [parsedRows, setParsedRows] = useState<Partial<HomeworkAssignment>[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvHeader = 'title,subject,gradeLevel,dueDate,totalPoints,description\n';
    const csvRows = [
      '"واجب تحليل المعادلات التربيعية","الرياضيات","الثالث المتوسط","2026-02-15","10","حل التمارين من صفحة 45 إلى 48 في دفتر التمارين."',
      '"واجب التفاعلات الكيميائية وتكافؤ العناصر","العلوم","الثالث المتوسط","2026-02-18","10","كتابة صيغ المركبات الواردة في التجربة العملية رقم 3."',
      '"واجب القراءة التنشيطية - نص الاستماع","اللغة العربية","الثالث المتوسط","2026-02-20","5","الإجابة عن أسئلة الفهم القرائي ص 32."'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_رفع_الواجبات_بالجملة.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload and parse user CSV / Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const lines = content
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        alert('ملف Excel / CSV غير صالح أو لا يحتوي على بيانات.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

      const list: Partial<HomeworkAssignment>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rawRow = lines[i];
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

        const title = getValue(['title', 'عنوان', 'اسم'], 0) || 'واجب دراسي جديد';
        const subject = getValue(['subject', 'مادة'], 1) || 'الرياضيات';
        const gradeLevel = getValue(['gradelevel', 'grade', 'صف'], 2) || 'الثالث المتوسط';
        const dueDate = getValue(['duedate', 'تاريخ', 'موعد'], 3) || '2026-02-20';
        const pointsVal = parseInt(getValue(['totalpoints', 'points', 'درجة'], 4) || '10', 10);
        const totalPoints = isNaN(pointsVal) ? 10 : pointsVal;
        const description = getValue(['description', 'وصف', 'تعليمات'], 5) || 'يرجى حل جميع الأسئلة المطلوبة في الموعد المترتب.';

        list.push({
          title,
          subject,
          gradeLevel,
          dueDate,
          totalPoints,
          description,
          status: 'pending',
          schoolSlug: 'al-namouthajya'
        });
      }

      setParsedRows(list);
      setSuccessNotice(`تم تحليل وقراءة ${list.length} واجب دراسي بنجاح من الملف (${file.name}).`);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Load sample data for quick preview
  const handleLoadSampleDemo = () => {
    const samples: Partial<HomeworkAssignment>[] = [
      {
        title: 'واجب تطبيق الدوال الخطية ورسم البيانات',
        subject: 'الرياضيات',
        gradeLevel: 'الثالث المتوسط',
        dueDate: '2026-02-16',
        totalPoints: 10,
        description: 'رسم البيانات المطلوبة في دفتر الرسم البياني مع شرح تفسيري.',
        status: 'pending',
        schoolSlug: 'al-namouthajya'
      },
      {
        title: 'واجب تجربة تكافؤ العناصر وتكوين الروابط',
        subject: 'العلوم',
        gradeLevel: 'الثالث المتوسط',
        dueDate: '2026-02-18',
        totalPoints: 10,
        description: 'تلخيص جدول العناصر الكيميائية وحل التجربة ص 52.',
        status: 'pending',
        schoolSlug: 'al-namouthajya'
      },
      {
        title: 'واجب قواعد اللغة العربية - المفعول لأجله',
        subject: 'اللغة العربية',
        gradeLevel: 'الثالث المتوسط',
        dueDate: '2026-02-22',
        totalPoints: 5,
        description: 'استخراج المفعول لأجله من الأبيات الشعرية المرفقة.',
        status: 'pending',
        schoolSlug: 'al-namouthajya'
      }
    ];

    setParsedRows(samples);
    setUploadedFileName('واجبات_الأسبوع_المقبل_نموذجي.csv');
    setSuccessNotice('تم تحضير 3 واجبات تجريبية جاهزة للاستيراد المباشر.');
  };

  const handleConfirmBatchUpload = () => {
    if (parsedRows.length === 0) return;

    const formattedList: HomeworkAssignment[] = parsedRows.map((item, idx) => ({
      id: `hw-batch-${Date.now()}-${idx}`,
      title: item.title || 'واجب جديد',
      subject: item.subject || 'المادة العامة',
      dueDate: item.dueDate || '2026-02-28',
      totalPoints: item.totalPoints || 10,
      status: 'pending',
      schoolSlug: item.schoolSlug || 'al-namouthajya',
      gradeLevel: item.gradeLevel || 'الثالث المتوسط',
      description: item.description || ''
    }));

    onBatchAddHomework(formattedList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 space-y-6 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                رفع وإسناد الواجبات بالجملة (Excel / CSV)
              </h3>
              <p className="text-xs text-slate-500">
                رفع ملفات المناهج والواجبات دفعة واحدة للطلاب بدلاً من الإدخال الفردي.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تحميل نموذج CSV القياسي</span>
            </button>

            <button
              onClick={handleLoadSampleDemo}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>تعبئة واجبات تجريبية</span>
            </button>
          </div>

          {parsedRows.length > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              تم تجهيز {parsedRows.length} واجبات
            </span>
          )}
        </div>

        {/* File Dropzone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 p-6 rounded-2xl transition text-center relative cursor-pointer space-y-2">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-800">
            انقر هنا أو اسحب ملف الواجبات (Excel / CSV) من جهازك
          </p>
          <p className="text-[11px] text-slate-500">
            يتضمن الأعمدة: (العنوان، المادة، الصف، موعد التسليم، الدرجات، الوصف)
          </p>

          {uploadedFileName && (
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300 mt-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>الملف: {uploadedFileName}</span>
            </div>
          )}
        </div>

        {successNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Preview Table */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-xs text-slate-700 flex items-center justify-between">
            <span>جدول الواجبات المعاينة ({parsedRows.length}):</span>
            {parsedRows.length > 0 && (
              <button
                onClick={() => {
                  setParsedRows([]);
                  setUploadedFileName(null);
                  setSuccessNotice(null);
                }}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                مسح القائمة
              </button>
            )}
          </h4>

          {parsedRows.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-60 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">عنوان الواجب</th>
                    <th className="p-3">المادة</th>
                    <th className="p-3">الصف</th>
                    <th className="p-3">آخر موعد</th>
                    <th className="p-3">الدرجة</th>
                    <th className="p-3">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-extrabold text-slate-900">{row.title}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {row.subject}
                        </span>
                      </td>
                      <td className="p-3">{row.gradeLevel}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{row.dueDate}</td>
                      <td className="p-3 font-bold text-amber-600">{row.totalPoints} درجات</td>
                      <td className="p-3">
                        <button
                          onClick={() => setParsedRows((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-bold space-y-1">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>لا توجد واجبات معروضة حالياً. حمّل ملف CSV أو اضغط "تعبئة واجبات تجريبية".</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirmBatchUpload}
            disabled={parsedRows.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>اعتماد وإسناد الواجبات للطلاب ({parsedRows.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
