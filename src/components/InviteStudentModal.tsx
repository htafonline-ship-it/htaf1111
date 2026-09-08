import React, { useState } from 'react';
import { addSupabaseStudent, bulkImportSupabaseStudents, DbStudent } from '../lib/supabase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UserPlus,
  FileSpreadsheet,
  Copy,
  Check,
  X,
  Upload,
  AlertCircle,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  Table
} from 'lucide-react';

interface InviteStudentModalProps {
  isOpen: boolean;
  schoolId: string;
  teacherId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteStudentModal: React.FC<InviteStudentModalProps> = ({
  isOpen,
  schoolId,
  teacherId,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Student Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gradeName, setGradeName] = useState('الصف الثالث المتوسط');
  const [classroomName, setClassroomName] = useState('3/أ');
  const [studentNumber, setStudentNumber] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [subjectName, setSubjectName] = useState('العلوم');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Bulk Import State
  const [bulkRows, setBulkRows] = useState<
    Array<{
      fullName: string;
      email: string;
      gradeName: string;
      classroomName: string;
      studentNumber?: string;
      parentPhone?: string;
      parentEmail?: string;
    }>
  >([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessCount, setBulkSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setGeneratedInviteLink(null);

    try {
      const { invite } = await addSupabaseStudent({
        school_id: schoolId,
        full_name: fullName.trim(),
        email: email.trim(),
        grade_name: gradeName,
        classroom_name: classroomName,
        student_number: studentNumber.trim(),
        parent_phone: parentPhone.trim(),
        parent_email: parentEmail.trim(),
        teacher_id: teacherId || '',
        subject_name: subjectName,
        notes: notes.trim(),
      });

      const inviteUrl = `${window.location.origin}/invite/student/${invite.code}`;
      setGeneratedInviteLink(inviteUrl);
      onSuccess();
    } catch (err: any) {
      console.error('Error adding student:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء إضافة الطالب في Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parseRawRows(results.data);
        },
        error: (err) => setBulkError('فشل قراءة ملف CSV: ' + err.message),
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          parseRawRows(data);
        } catch (err: any) {
          setBulkError('فشل قراءة ملف Excel: ' + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setBulkError('صيغة الملف غير مدعومة. يرجى اختيار ملف Excel (.xlsx) أو CSV (.csv).');
    }
  };

  const parseRawRows = (rows: any[]) => {
    const parsed = rows.map((r) => ({
      fullName: r['اسم الطالب'] || r['الاسم'] || r['Name'] || r['fullName'] || '',
      email: r['البريد الإلكتروني'] || r['البريد'] || r['Email'] || r['email'] || '',
      gradeName: r['الصف'] || r['Grade'] || 'الصف الثالث المتوسط',
      classroomName: r['الفصل'] || r['Section'] || '3/أ',
      studentNumber: r['الرقم الطلابي'] || r['الهوية'] || r['studentNumber'] || '',
      parentPhone: r['جوال ولي الأمر'] || r['parentPhone'] || '',
      parentEmail: r['بريد ولي الأمر'] || r['parentEmail'] || '',
    })).filter((item) => item.fullName.trim() !== '' && item.email.trim() !== '');

    if (parsed.length === 0) {
      setBulkError('لم يتم العثور على أعمدة صحيحة (اسم الطالب والبريد الإلكتروني) في الملف.');
    } else {
      setBulkRows(parsed);
    }
  };

  const handleBulkConfirm = async () => {
    if (bulkRows.length === 0) return;
    setBulkLoading(true);
    setBulkError(null);

    try {
      const res = await bulkImportSupabaseStudents(bulkRows, schoolId, teacherId);
      setBulkSuccessCount(res.insertedStudents?.length || bulkRows.length);
      setBulkRows([]);
      onSuccess();
    } catch (err: any) {
      setBulkError(err.message || 'حدث خطأ أثناء رفع بيانات الطلاب لـ Supabase.');
    } finally {
      setBulkLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">إضافة ودعوة طالب للمدرسة</h3>
              <p className="text-xs text-slate-400">إضافة فردية أو استيراد جماعي عبر ملف Excel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              activeTab === 'single'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>إضافة طالب فردي (دعوة خاصة)</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              activeTab === 'bulk'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>استيراد جماعي (Excel / CSV)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {generatedInviteLink ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="font-extrabold text-slate-900 text-base">
                    تم إنشاء سجل الطالب ورابط الدعوة بنجاح!
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                    عند تسجيل الطالب بحساب Google باستخدام البريد ({email})، سيتم ربطه تلقائياً بالمدرسة والفصل وتفعيل حسابه.
                  </p>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-300 flex items-center justify-between gap-2 max-w-lg mx-auto">
                    <span className="text-xs font-mono text-emerald-950 font-bold truncate dir-ltr">
                      {generatedInviteLink}
                    </span>
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedInviteLink(null);
                      setFullName('');
                      setEmail('');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 underline pt-2"
                  >
                    + إضافة طالب آخر
                  </button>
                </div>
              ) : (
                <>
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">
                        اسم الطالب الثلاثي <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="عبدالله فهد القحطاني"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">
                        بريد Google للطالب <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="student@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-mono dir-ltr text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">الصف الدراسي</label>
                      <input
                        type="text"
                        required
                        value={gradeName}
                        onChange={(e) => setGradeName(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">الفصل</label>
                      <input
                        type="text"
                        required
                        value={classroomName}
                        onChange={(e) => setClassroomName(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">الرقم الطلابي (اختياري)</label>
                      <input
                        type="text"
                        placeholder="1098827361"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">المادة المسندة</label>
                      <input
                        type="text"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">رقم جوال ولي الأمر (اختياري)</label>
                      <input
                        type="tel"
                        placeholder="0501234567"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-mono dir-ltr text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-800">بريد ولي الأمر (اختياري)</label>
                      <input
                        type="email"
                        placeholder="parent@gmail.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-mono dir-ltr text-left"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ وإنشاء رابط الدعوة...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>إضافة الطالب وإنشاء رابط دعوة حقيقي</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              {bulkSuccessCount !== null ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-slate-900 text-base">
                    تم استيراد وإنشاء {bulkSuccessCount} دعوة طالب بنجاح!
                  </h4>
                  <p className="text-xs text-slate-600">
                    يمكن للطلاب الآن الدخول بحسابات Google الخاصة بهم والالتحاق فوراً بالفصول.
                  </p>
                  <button
                    onClick={() => setBulkSuccessCount(null)}
                    className="text-xs font-bold bg-emerald-600 text-white px-5 py-2 rounded-xl"
                  >
                    استيراد ملف آخر
                  </button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 text-center space-y-3 bg-slate-50/50 transition relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        قم برفع ملف Excel (.xlsx) أو CSV لمجموعات الطلاب
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        الأعمدة المطلوبة: اسم الطالب، البريد الإلكتروني، الصف، الفصل، الرقم الطلابي
                      </p>
                    </div>
                  </div>

                  {bulkError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
                      {bulkError}
                    </div>
                  )}

                  {bulkRows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                          <Table className="w-4 h-4 text-emerald-600" />
                          <span>معاينة الطلاب المعرفين قبل الاعتماد ({bulkRows.length} طالب):</span>
                        </h5>
                      </div>

                      <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-100 font-extrabold text-slate-700 sticky top-0 border-b border-slate-200">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">اسم الطالب</th>
                              <th className="p-3">البريد الإلكتروني</th>
                              <th className="p-3">الصف والفصل</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bulkRows.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                                <td className="p-3 font-bold text-slate-900">{r.fullName}</td>
                                <td className="p-3 font-mono text-slate-600">{r.email}</td>
                                <td className="p-3 text-slate-600">{r.gradeName} - {r.classroomName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleBulkConfirm}
                        disabled={bulkLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                      >
                        {bulkLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري حفظ البيانات...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>اعتماد الاستيراد وإنشاء دعوات للجميع</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
