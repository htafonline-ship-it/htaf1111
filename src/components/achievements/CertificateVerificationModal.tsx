import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Award,
  Calendar,
  Building,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { AchievementRecord } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  achievements?: AchievementRecord[];
}

export const CertificateVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialCode = '',
  achievements = []
}) => {
  const [certCode, setCertCode] = useState(initialCode);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    if (initialCode) {
      setCertCode(initialCode);
      verifyCode(initialCode);
    }
  }, [initialCode]);

  const verifyCode = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean) return;

    setIsLoading(true);
    setSearched(true);

    // 1. Try in-memory / passed achievements list
    const foundLocal = achievements.find(
      (a) =>
        a.certificate?.certificateNumber?.toUpperCase() === clean ||
        a.certificateId?.toUpperCase() === clean ||
        a.id.toUpperCase() === clean
    );

    if (foundLocal && foundLocal.certificate) {
      setResult({
        verified: true,
        certificate: foundLocal.certificate,
        achievement: foundLocal,
        recipientName: foundLocal.certificate.recipientName,
        achievementTitle: foundLocal.title,
        schoolName: foundLocal.certificate.schoolName,
        issueDate: foundLocal.certificate.issueDate,
        approverName: foundLocal.certificate.approverName,
        approverRole: foundLocal.certificate.approverRole,
      });
      setIsLoading(false);
      return;
    }

    // 2. Query backend verification endpoint
    try {
      const res = await fetch(`/api/achievements/verify/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setResult(data);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Ignore
    }

    setResult(null);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>التحقق من صحة شهادة الإنجاز الرقمية</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رقم الشهادة المرجعي أو كود التحقق (QR):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={certCode}
                onChange={(e) => setCertCode(e.target.value)}
                placeholder="مثال: CERT-2026-12345"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-hidden font-mono"
                onKeyDown={(e) => e.key === 'Enter' && verifyCode(certCode)}
              />
              <button
                onClick={() => verifyCode(certCode)}
                disabled={isLoading || !certCode.trim()}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                {isLoading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>تحقق</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          {searched && !isLoading && (
            <div className="mt-4">
              {result && result.verified ? (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-right space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>شهادة رسمية موثقة ومعتمدة بنجاح</span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-emerald-500/20 pt-2 text-slate-300">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">الرقم المرجعي:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {result.certificate?.certificateNumber || certCode}
                      </span>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">اسم المستفيد:</span>
                      <span className="font-bold text-white">{result.recipientName}</span>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">عنوان الإنجاز:</span>
                      <span className="font-bold text-cyan-300">{result.achievementTitle}</span>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">المدرسة المانحة:</span>
                      <span className="font-semibold text-slate-200">{result.schoolName}</span>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">المعتمد:</span>
                      <span className="font-semibold text-slate-200">
                        {result.approverName} ({result.approverRole})
                      </span>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">تاريخ الإصدار:</span>
                      <span className="font-semibold text-slate-200">{result.issueDate}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <div className="text-sm font-black text-rose-300">الشهادة غير مطابقة أو لم يتم العثور عليها</div>
                  <p className="text-xs text-slate-400">
                    تأكد من كتابة الرقم المرجعي للشهادة بشكل صحيح أو التأكد من إتمام اعتمادها ونشرها من قبل إدارة المدرسة.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
