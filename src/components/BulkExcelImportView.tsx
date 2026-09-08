import React, { useState } from 'react';
import { BulkStudentRow, SchoolTenant } from '../types';
import { INITIAL_BULK_STUDENTS_SAMPLE } from '../data/mockData';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  Download,
  Users,
  RefreshCw,
  KeyRound,
  FileCheck,
  Check,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface BulkExcelImportViewProps {
  currentSchool: SchoolTenant;
  onImportSuccess: (importedCount: number) => void;
}

export const BulkExcelImportView: React.FC<BulkExcelImportViewProps> = ({
  currentSchool,
  onImportSuccess
}) => {
  const [rows, setRows] = useState<BulkStudentRow[]>(INITIAL_BULK_STUDENTS_SAMPLE);
  const [columnMapping, setColumnMapping] = useState({
    fullName: 'الاسم الكامل',
    nationalId: 'رقم السجل المدني / الهوية',
    grade: 'الصف الدراسي',
    section: 'الشعبة / الفصل',
    parentPhone: 'رقم تواصل ولي الأمر'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [generatedAccountsCount, setGeneratedAccountsCount] = useState(0);

  // Print Roster Modal & Passcode Security
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [showPasscodes, setShowPasscodes] = useState(false);

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Simulate smart parsing from Excel / CSV
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      // Fresh mock data representing parsed excel file
      const parsedNewData: BulkStudentRow[] = [
        {
          id: `parse-1-${Date.now()}`,
          fullName: 'فهد بن سلطان المطيري',
          nationalId: '1091122334',
          grade: 'الصف الثالث المتوسط',
          section: '3/أ',
          parentPhone: '0511112233',
          status: 'valid'
        },
        {
          id: `parse-2-${Date.now()}`,
          fullName: 'تركي بن نايف العتيبي',
          nationalId: '1082233445',
          grade: 'الصف الثالث المتوسط',
          section: '3/أ',
          parentPhone: '0522223344',
          status: 'valid'
        },
        {
          id: `parse-3-${Date.now()}`,
          fullName: 'ماجد بن عبدالله الغامدي',
          nationalId: '1073344556',
          grade: 'الصف الثالث المتوسط',
          section: '3/ب',
          parentPhone: '0533334455',
          status: 'valid'
        },
        {
          id: `parse-4-${Date.now()}`,
          fullName: 'خالد بن طلال الزهراني',
          nationalId: '1064455667',
          grade: 'الصف الثاني المتوسط',
          section: '2/أ',
          parentPhone: '0544445566',
          status: 'valid'
        },
        {
          id: `parse-5-${Date.now()}`,
          fullName: 'زياد بن محمد القرني',
          nationalId: '1064455667', // duplicate test
          grade: 'الصف الثاني المتوسط',
          section: '2/أ',
          parentPhone: '0555556677',
          status: 'duplicate_id'
        }
      ];
      setRows(parsedNewData);
      setImportCompleted(false);
    }, 1200);
  };

  const handleDownloadTemplate = () => {
    // Generates a sample CSV template for download
    const csvContent =
      'data:text/csv;charset=utf-8,الاسم الكامل,رقم السجل المدني / الهوية,الصف الدراسي,الشعبة / الفصل,رقم تواصل ولي الأمر\n' +
      'عبدالله بن فهد القحطاني,1098827361,الصف الثالث المتوسط,3/أ,0501234567\n' +
      'سعد بن عبدالعزيز الشهري,1087723910,الصف الثالث المتوسط,3/أ,0559876543\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `نموذج_رفع_الطلاب_${currentSchool.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      // Process all valid rows and assign account codes
      const updated = rows.map((r) => {
        if (r.status === 'valid') {
          const randId = Math.floor(1000 + Math.random() * 9000);
          const randPass = Math.floor(100000 + Math.random() * 900000);
          return {
            ...r,
            generatedStudentId: `STU-1447-${randId}`,
            generatedPasscode: `PASS-${randPass}`
          };
        }
        return r;
      });

      const validCount = updated.filter((r) => r.generatedStudentId).length;
      setRows(updated);
      setImportCompleted(true);
      setGeneratedAccountsCount(validCount);
      onImportSuccess(validCount);
    }, 1500);
  };

  const handleFixRowId = (id: string, newNationalId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isValid = newNationalId.trim().length >= 10;
          return {
            ...r,
            nationalId: newNationalId,
            status: isValid ? 'valid' : 'missing_info'
          };
        }
        return r;
      })
    );
  };

  const validRowsCount = rows.filter((r) => r.status === 'valid').length;
  const invalidRowsCount = rows.filter((r) => r.status !== 'valid').length;

  const sectionsList = Array.from(new Set(rows.map((r) => r.section)));

  const filteredPrintRows = rows.filter(
    (r) => selectedSectionFilter === 'all' || r.section === selectedSectionFilter
  );

  return (
    <div className="space-y-6">
      {/* Excel Import Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 mb-3">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>نظام الاستيراد الجماعي الذكي (Bulk Student Excel Import)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            إضافة الطلاب وتوليد الحسابات بالجملة عبر ملفات Excel / CSV
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            ارفع كشف الطلاب المعتمد لمدرستك، وسيقوم النظام بالتعرف الذكي على الأعمدة، مطابقة الهويات الوطنية، وتوليد أرقام الدخول مع إمكانية طباعة كشوفات الفصل فوراً.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تحميل نموذج Excel المعتمد</span>
          </button>

          <label className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition">
            <Upload className="w-4 h-4" />
            <span>رفع ملف Excel أو CSV</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleSimulateFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Smart Column Recognition mapping bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              مطابقة أعمدة الملف المرفوع (Smart Column Mapper)
            </h3>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
            تعرف آلي تلقائي 100%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">حقل الاسم الكامل:</label>
            <select
              value={columnMapping.fullName}
              onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 outline-none"
            >
              <option value="الاسم الكامل">الاسم الكامل (عمود أ)</option>
              <option value="اسم الطالب">اسم الطالب</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">حقل رقم الهوية/السجل:</label>
            <select
              value={columnMapping.nationalId}
              onChange={(e) => setColumnMapping({ ...columnMapping, nationalId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 outline-none"
            >
              <option value="رقم السجل المدني / الهوية">رقم السجل المدني (عمود ب)</option>
              <option value="الهوية الوطنية">الهوية الوطنية</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">حقل الصف الدراسي:</label>
            <select
              value={columnMapping.grade}
              onChange={(e) => setColumnMapping({ ...columnMapping, grade: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 outline-none"
            >
              <option value="الصف الدراسي">الصف الدراسي (عمود ج)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">حقل الشعبة/الفصل:</label>
            <select
              value={columnMapping.section}
              onChange={(e) => setColumnMapping({ ...columnMapping, section: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 outline-none"
            >
              <option value="الشعبة / الفصل">الشعبة / الفصل (عمود د)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">حقل هاتف ولي الأمر:</label>
            <select
              value={columnMapping.parentPhone}
              onChange={(e) => setColumnMapping({ ...columnMapping, parentPhone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 outline-none"
            >
              <option value="رقم تواصل ولي الأمر">رقم ولي الأمر (عمود هـ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Inspection & Validation Data Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                معاينة واستحداث بيانات كشوفات الطلاب ({rows.length} طالب)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                جاهز للاستيراد: <strong className="text-emerald-600">{validRowsCount}</strong> • يتطلب تصحيحاً: <strong className="text-amber-600">{invalidRowsCount}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {importCompleted && (
              <button
                onClick={() => setShowPrintModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة كشوفات الفصل وبطاقات الدخول</span>
              </button>
            )}

            <button
              onClick={handleProcessImport}
              disabled={isProcessing || validRowsCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'جاري المعالجة وتوليد الحسابات...' : 'تأكيد واستيراد الطلاب بالجملة'}</span>
            </button>
          </div>
        </div>

        {importCompleted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                تم بنجاح استيراد وتوليد حسابات <strong>{generatedAccountsCount}</strong> طالب جديدة وإضافتهم لصفوف مدرسة <strong>{currentSchool.name}</strong>!
              </span>
            </div>
            <button
              onClick={() => setShowPrintModal(true)}
              className="underline hover:text-emerald-950 font-black"
            >
              معاينة كشوفات الطباعة الآن
            </button>
          </div>
        )}

        {/* Rows Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                <th className="p-3">اسم الطالب الكامل</th>
                <th className="p-3">رقم السجل/الهوية الوطنية</th>
                <th className="p-3">الصف</th>
                <th className="p-3">الفصل</th>
                <th className="p-3">هاتف ولي الأمر</th>
                <th className="p-3">حالة التدقيق</th>
                <th className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span>رمز الدخول المولد</span>
                    <button
                      type="button"
                      onClick={() => setShowPasscodes(!showPasscodes)}
                      className="text-indigo-600 hover:text-indigo-800 transition p-0.5"
                      title={showPasscodes ? 'إخفاء رمز الدخول الحساس' : 'إظهار رمز الدخول'}
                    >
                      {showPasscodes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{row.fullName}</td>

                  <td className="p-3 font-mono">
                    <input
                      type="text"
                      value={row.nationalId}
                      onChange={(e) => handleFixRowId(row.id, e.target.value)}
                      className={`bg-transparent border rounded p-1 text-xs font-mono font-bold w-32 ${
                        row.status === 'duplicate_id'
                          ? 'border-amber-400 bg-amber-50 text-amber-900'
                          : row.status === 'missing_info'
                          ? 'border-rose-400 bg-rose-50 text-rose-900'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    />
                  </td>

                  <td className="p-3 font-bold text-slate-700">{row.grade}</td>
                  <td className="p-3 font-bold text-slate-700">{row.section}</td>
                  <td className="p-3 font-mono text-slate-600">{row.parentPhone}</td>

                  <td className="p-3">
                    {row.status === 'valid' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>بيانات سليمة</span>
                      </span>
                    )}

                    {row.status === 'duplicate_id' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>تكرار هويّة</span>
                      </span>
                    )}

                    {row.status === 'missing_info' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>بيان مفقود</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-mono font-bold">
                    {row.generatedStudentId ? (
                      <div className="flex flex-col text-[10px]">
                        <span className="text-emerald-700">{row.generatedStudentId}</span>
                        <span className="text-slate-500">{showPasscodes ? row.generatedPasscode : '••••••••'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px]">قيد المعالجة...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT CLASS ROSTERS MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    كشوفات توزيع الطلاب وحسابات الدخول المطبوعة
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentSchool.name} • العام الدراسي 1447هـ - 2026م
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الآن</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter by Section */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">تصفية حسب الشعبة/الفصل:</span>
              <button
                onClick={() => setSelectedSectionFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold border transition ${
                  selectedSectionFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                كافة الفصول
              </button>
              {sectionsList.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSectionFilter(sec)}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    selectedSectionFilter === sec
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  فصل {sec}
                </button>
              ))}
            </div>

            {/* Printable Document Roster Sheet */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 font-sans text-right">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3 text-slate-800">
                <div>
                  <div className="font-black text-sm">{currentSchool.name}</div>
                  <div className="text-xs text-slate-600">المملكة العربية السعودية - وزارة التعليم</div>
                </div>
                <div className="text-left text-xs font-bold text-indigo-900">
                  كشف تسليم بيانات الدخول للطلاب
                </div>
              </div>

              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-300">
                    <th className="p-2 border border-slate-300">#</th>
                    <th className="p-2 border border-slate-300">اسم الطالب</th>
                    <th className="p-2 border border-slate-300">الصف والفصل</th>
                    <th className="p-2 border border-slate-300">معرف الطالب (ID)</th>
                    <th className="p-2 border border-slate-300">كود الدخول المؤقت</th>
                    <th className="p-2 border border-slate-300 text-center">توقيع الاستلام</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrintRows.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-200 bg-white">
                      <td className="p-2 border border-slate-300 font-bold">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{r.fullName}</td>
                      <td className="p-2 border border-slate-300">{r.grade} - ({r.section})</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-indigo-700">
                        {r.generatedStudentId || 'STU-1447-9001'}
                      </td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-700">
                        {r.generatedPasscode || 'PASS-882310'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-slate-300">
                        ............
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
