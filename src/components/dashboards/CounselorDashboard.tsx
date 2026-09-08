import React, { useState } from 'react';
import { CounselingReferral } from '../../types';
import {
  ShieldAlert,
  Lock,
  Plus,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react';

interface CounselorDashboardProps {
  referrals: CounselingReferral[];
  onAddNote: (referralId: string, noteText: string) => void;
}

export const CounselorDashboard: React.FC<CounselorDashboardProps> = ({
  referrals,
  onAddNote
}) => {
  const [selectedReferral, setSelectedReferral] = useState<CounselingReferral | null>(referrals[0] || null);
  const [noteText, setNoteText] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral || !noteText.trim()) return;

    onAddNote(selectedReferral.id, noteText.trim());
    setNoteText('');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 rounded-3xl border border-purple-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 font-black text-2xl flex items-center justify-center border border-purple-500/30 shadow-lg shrink-0">
            🩺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">لوحة الإرشاد الطلابي والسرية (Confidential Guidance)</h2>
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                سجلات مشفّرة ورسمية
              </span>
            </div>
            <p className="text-purple-200 text-xs mt-1">
              متابعة الحالات الطلابية المحالة من المعلمين وأولياء الأمور، كتابة سجلات المتابعة السريّة، ووضع الخطط العلاجية.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Referrals List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            الحالات الطلابية الواردة ({referrals.length})
          </h3>

          <div className="space-y-3">
            {referrals.map((ref) => {
              const isSelected = selectedReferral?.id === ref.id;

              return (
                <div
                  key={ref.id}
                  onClick={() => setSelectedReferral(ref)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-purple-950 text-white border-purple-800 shadow-xl'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{ref.studentName}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        ref.priority === 'عاجل'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {ref.priority}
                    </span>
                  </div>

                  <p className={`text-xs ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                    {ref.grade} • الفئة: {ref.category}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-2">تاريخ الإحالة: {ref.date}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Case Detail & Confidential Logs (7 cols) */}
        <div className="lg:col-span-7">
          {selectedReferral ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-purple-100 text-purple-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    حالة رقم #{selectedReferral.id}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{selectedReferral.studentName}</h3>
                  <p className="text-xs text-slate-500">{selectedReferral.grade}</p>
                </div>

                <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-xl">
                  {selectedReferral.status}
                </span>
              </div>

              {/* Reason */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-1">
                <div className="text-xs font-bold text-purple-900">نص الإحالة والسبب المذكور:</div>
                <p className="text-xs text-slate-800 leading-relaxed">{selectedReferral.reason}</p>
              </div>

              {/* Confidential Logs */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  سجل المتابعة السري (الموجه الطلابي):
                </h4>

                <div className="space-y-3">
                  {selectedReferral.confidentialNotes.map((note) => (
                    <div key={note.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 font-bold">
                        <span>{note.author}</span>
                        <span>{note.date}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="اكتب ملاحظة متابعة جديدة أو توجيه جديد لهذه الحالة..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />

                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>إضافة ملاحظة سريّة للسجل</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              اختر حالة طلابية لعرض التفاصيل وسجل الإرشاد
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
