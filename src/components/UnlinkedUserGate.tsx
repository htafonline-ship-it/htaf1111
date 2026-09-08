import React, { useState } from 'react';
import { AuthUser } from '../types';
import { joinSupabaseSchoolByCode, createTeacherJoinRequest } from '../lib/supabase';
import {
  School,
  Building2,
  KeyRound,
  Send,
  HelpCircle,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  UserPlus
} from 'lucide-react';

interface UnlinkedUserGateProps {
  currentUser?: AuthUser | null;
  user?: AuthUser | null;
  schools?: any[];
  onCreateSchoolClick?: () => void;
  onOpenCreateSchool?: () => void;
  onSchoolJoinedSuccess?: () => void;
  onLinkedSuccess?: () => void;
  onLogout?: () => void;
}

export const UnlinkedUserGate: React.FC<UnlinkedUserGateProps> = ({
  currentUser: propCurrentUser,
  user: propUser,
  schools,
  onCreateSchoolClick,
  onOpenCreateSchool,
  onSchoolJoinedSuccess,
  onLinkedSuccess,
  onLogout,
}) => {
  const activeUser = propCurrentUser || propUser;
  const [activeTab, setActiveTab] = useState<'options' | 'join_code' | 'teacher_request'>('options');

  // Code Join State
  const [inviteCode, setInviteCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Teacher Request State
  const [schoolCodeOrId, setSchoolCodeOrId] = useState('');
  const [subject, setSubject] = useState('العلوم والرياضيات');
  const [stage, setStage] = useState('المرحلة المتوسطة');
  const [grades, setGrades] = useState('الصف الأول والثاني والثالث المتوسط');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const handleCreateSchool = () => {
    if (onCreateSchoolClick) onCreateSchoolClick();
    if (onOpenCreateSchool) onOpenCreateSchool();
  };

  const handleSuccess = () => {
    if (onSchoolJoinedSuccess) onSchoolJoinedSuccess();
    if (onLinkedSuccess) onLinkedSuccess();
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setCodeLoading(true);
    setCodeError(null);

    try {
      await joinSupabaseSchoolByCode(
        inviteCode.trim(),
        activeUser?.id || '',
        activeUser?.email || '',
        activeUser?.fullName || ''
      );
      handleSuccess();
    } catch (err: any) {
      setCodeError(err.message || 'فشل الانضمام. يرجى التأكد من صحة رمز الدعوة.');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleTeacherRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCodeOrId.trim()) return;

    setReqLoading(true);
    setReqError(null);

    try {
      await createTeacherJoinRequest({
        school_id: schoolCodeOrId.trim(),
        user_id: activeUser?.id || '',
        full_name: activeUser?.fullName || '',
        email: activeUser?.email || '',
        subject,
        stage,
        grades,
      });
      setReqSuccess(true);
    } catch (err: any) {
      setReqError(err.message || 'تعذر إرسال طلب الانضمام.');
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 dir-rtl flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
        
        {/* Top Header Identity */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
            🏫
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-3.5 py-1 rounded-full border border-emerald-500/30 inline-block">
            حساب معتمد وموثق ({activeUser?.email || ''})
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            لم يتم ربط حسابك بأي مدرسة حتى الآن.
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            أهلاً بك <strong className="text-slate-200">{activeUser?.fullName || 'المستخدم'}</strong>. للدخول إلى لوحة المدرس أو الطالب أو مدير المدرسة، يلزم الارتباط بكيان مدرسة مسجل في المنصة.
          </p>
        </div>

        {/* Action Tabs Navigation */}
        <div className="flex rounded-2xl bg-slate-800/80 p-1.5 border border-slate-700/80 gap-1 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'options' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            الخيارات المتاحة
          </button>
          <button
            onClick={() => setActiveTab('join_code')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'join_code' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            إدخال رمز دعوة
          </button>
          <button
            onClick={() => setActiveTab('teacher_request')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'teacher_request' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            طلب انضمام معلم
          </button>
        </div>

        {/* Content Views */}
        {activeTab === 'options' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleCreateSchool}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 p-5 rounded-2xl text-right space-y-2 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white group-hover:text-emerald-400 transition">
                إنشاء مدرسة جديدة
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                تأسيس سجل مدرسة حقيقي ببيانات رسمية وتفعيل لوحة مدير المدرسة فوراً
              </p>
            </button>

            <button
              onClick={() => setActiveTab('join_code')}
              className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 p-5 rounded-2xl text-right space-y-2 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                <KeyRound className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white group-hover:text-blue-400 transition">
                إدخال رمز دعوة / رابط دعوة
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                الانضمام لمدرستك عن طريق رمز الدعوة المرسل من المعلم أو المدرسة
              </p>
            </button>

            <button
              onClick={() => setActiveTab('teacher_request')}
              className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 p-5 rounded-2xl text-right space-y-2 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                <UserPlus className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white group-hover:text-purple-400 transition">
                تقديم طلب انضمام كمعلم
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                إرسال طلب رسمي لمدير المدرسة للموافقة وتعيينك كمعلم بالمدرسة
              </p>
            </button>

            <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl text-right space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center font-black">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white">التواصل مع إدارة المنصة</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                راسل إدارة الدعم لتوجيهك أو ربطك بمدرستك المعتمده
              </p>
            </div>
          </div>
        )}

        {activeTab === 'join_code' && (
          <form onSubmit={handleJoinByCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-200">
                أدخل رمز الدعوة أو رمز المدرسة
              </label>
              <input
                type="text"
                required
                placeholder="مثال: INV-ABC123 أو SCH-2026-RIYADH"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full text-xs py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-center uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {codeError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                {codeError}
              </div>
            )}

            <button
              type="submit"
              disabled={codeLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {codeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من رمز الدعوة...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>التحقق والانضمام الآن</span>
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'teacher_request' && (
          <form onSubmit={handleTeacherRequestSubmit} className="space-y-4">
            {reqSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-extrabold text-sm text-white">تم إرسال طلب الانضمام لمدير المدرسة بنجاح!</h4>
                <p className="text-xs text-slate-300">
                  سيصلك إشعار ويتم تفعيل حسابك كمعلم فور اعتماد مدير المدرسة للطلب.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-200">
                    رمز أو اسم المدرسة المطلوب الانضمام لها
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل رمز المدرسة أو معرف ID"
                    value={schoolCodeOrId}
                    onChange={(e) => setSchoolCodeOrId(e.target.value)}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-200">المادة الدراسية</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full text-xs py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-200">المرحلة الدراسية</label>
                    <input
                      type="text"
                      required
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full text-xs py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {reqError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                    {reqError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reqLoading}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  {reqLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الطلب...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال طلب الانضمام لمدير المدرسة</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        )}

        {/* Logout Bottom Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onLogout}
            className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>

      </div>
    </div>
  );
};
