import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { AchievementRecord, AchievementCertificate } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  achievement: AchievementRecord;
  certificate?: AchievementCertificate;
  schoolName?: string;
}

export const AchievementCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  achievement,
  certificate,
  schoolName = 'منصة حقائق العلوم'
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const certNumber = certificate?.certificateNumber || achievement.certificate?.certificateNumber || `CERT-${new Date().getFullYear()}-001`;
  const recipient = certificate?.recipientName || achievement.studentName || achievement.teacherName || 'المتميز';
  const school = certificate?.schoolName || achievement.schoolId || schoolName;
  const issueDate = certificate?.issueDate || achievement.approvedAt?.split('T')[0] || new Date().toISOString().split('T')[0];
  const approverName = certificate?.approverName || achievement.approvedByName || 'مدير المدرسة / المشرف';
  const approverRole = certificate?.approverRole || achievement.approvedByRole || 'الاعتماد الأكاديمي';
  const qrData = certificate?.qrCodeData || achievement.certificate?.qrCodeData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-amber-400 font-black">
            <Award className="w-5 h-5 text-amber-400" />
            <span>الشهادة الرقمية المعتمدة للإنجاز</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="print-certificate-button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:from-amber-400 hover:to-yellow-400 transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              id="close-certificate-modal-button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div ref={printRef} className="p-6 sm:p-10 bg-[#090e1d] text-slate-100 select-none print:p-0 print:bg-white print:text-black">
          {/* Outer Luxury Border */}
          <div className="relative p-6 sm:p-10 rounded-2xl border-4 border-double border-amber-500/60 bg-radial from-slate-900/90 via-slate-950 to-[#070b16] print:border-amber-700 print:bg-white">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />

            {/* Header: Kingdom & School Branding */}
            <div className="flex items-start justify-between border-b border-amber-500/20 pb-6 mb-6 text-right">
              <div>
                <div className="text-xs text-amber-300 font-bold">المملكة العربية السعودية</div>
                <div className="text-xs text-slate-400 font-semibold print:text-slate-700">وزارة التعليم</div>
                <div className="text-xs font-black text-white mt-1 print:text-black">{school}</div>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-600/30 border-2 border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Award className="w-7 h-7 text-amber-400" />
                </div>
                <div className="text-[10px] text-amber-300/80 mt-1 font-bold">ملف الإنجاز الرقمي</div>
              </div>

              <div className="text-left text-xs font-mono text-slate-400 print:text-slate-700">
                <div>الرقم المرجعي:</div>
                <div className="font-bold text-amber-400 print:text-amber-800">{certNumber}</div>
                <div className="mt-1 text-[11px]">{issueDate}</div>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center my-6">
              <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wide print:text-amber-800">
                شهـادة اعتمـاد إنجـاز
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium print:text-slate-800">
                تُمنح هذه الشهادة المعتمدة تقديراً للجهود الاستثنائية والتميز النوعي في
              </p>
            </div>

            {/* Recipient Highlight */}
            <div className="text-center my-6 py-4 px-6 rounded-xl bg-amber-500/10 border border-amber-500/30 print:border-amber-600 print:bg-amber-50">
              <span className="text-xs text-amber-300 font-bold block mb-1">اسم المكرّم:</span>
              <div className="text-xl sm:text-2xl font-black text-white print:text-black tracking-wide">
                {recipient}
              </div>
              <div className="text-xs text-slate-400 mt-1 print:text-slate-700">
                {achievement.grade && <span>الصف: {achievement.grade} - </span>}
                {achievement.className && <span>الفصل: {achievement.className} - </span>}
                {achievement.subject && <span>مادة: {achievement.subject}</span>}
              </div>
            </div>

            {/* Achievement Detail Description */}
            <div className="text-center my-6 space-y-2">
              <div className="text-sm sm:text-base font-bold text-cyan-300 print:text-cyan-900">
                « {achievement.title} »
              </div>
              <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed print:text-slate-800">
                {achievement.description}
              </p>
              {achievement.prizeAward && (
                <div className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs font-black text-yellow-300 print:text-yellow-800">
                  🏆 الجائزة / التكريم: {achievement.prizeAward}
                </div>
              )}
            </div>

            {/* Signatures & Real Verification QR Code */}
            <div className="mt-8 pt-6 border-t border-amber-500/20 flex items-end justify-between gap-4">
              {/* Approver 1 */}
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 print:text-slate-700">{approverRole}</div>
                <div className="text-sm font-black text-white mt-1 print:text-black">{approverName}</div>
                <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-bold print:text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>معتمد رقمياً بالنظام</span>
                </div>
              </div>

              {/* Functional Real QR Code for Instant Verification */}
              <div className="text-center flex flex-col items-center">
                {qrData ? (
                  <div className="p-2 bg-white rounded-xl shadow-lg border border-amber-400/40">
                    <img
                      src={qrData}
                      alt="QR Code"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                    رمز التحقق
                  </div>
                )}
                <span className="text-[10px] text-amber-300/80 font-bold mt-1.5 block print:text-slate-700">
                  امسح للتحقق الفوري
                </span>
              </div>

              {/* School Official Seal */}
              <div className="text-left">
                <div className="text-xs font-bold text-slate-400 print:text-slate-700">إدارة المدرسة</div>
                <div className="text-sm font-black text-white mt-1 print:text-black">الختم المعتمد</div>
                <div className="mt-2 text-[10px] text-amber-400 font-bold flex items-center gap-1 print:text-amber-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>حقائق العلوم الرسمية</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Link Notice */}
        <div className="px-6 py-3 bg-slate-950 text-center text-xs text-slate-400 border-t border-slate-800 print:hidden flex items-center justify-center gap-2">
          <span>الشهادة موثقة برقم تسلسلي يمكن التحقق منه مباشرة عبر رمز الاستجابة السريعة (QR)</span>
        </div>
      </div>
    </div>
  );
};
