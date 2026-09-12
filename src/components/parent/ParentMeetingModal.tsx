import React, { useState, useEffect } from 'react';
import { AuthUser, LinkedChild, ParentMeetingRequest, ParentMeetingType } from '../../types';
import {
  createParentMeetingRequest,
  fetchParentMeetingRequests
} from '../../lib/supabase';
import {
  Calendar,
  Clock,
  UserCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Video,
  Phone,
  Building2,
  MessageSquare
} from 'lucide-react';

interface ParentMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  child: LinkedChild;
}

export const ParentMeetingModal: React.FC<ParentMeetingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  child
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [targetRole, setTargetRole] = useState<'teacher' | 'counselor' | 'principal' | 'vice_principal'>('counselor');
  const [meetingType, setMeetingType] = useState<ParentMeetingType>('in_person');
  const [subject, setSubject] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('09:00 ص - 10:00 ص');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [history, setHistory] = useState<ParentMeetingRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      // set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPreferredDate(tomorrow.toISOString().split('T')[0]);
      loadHistory();
    }
  }, [isOpen, child.studentId]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const list = await fetchParentMeetingRequests(currentUser.id, child.schoolId);
      setHistory(list);
    } catch (err) {
      console.warn('Error loading parent meeting requests:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFeedback({ success: false, message: 'يرجى كتابة موضوع المقابلة أو الاستفسار' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await createParentMeetingRequest({
        schoolId: child.schoolId,
        parentUserId: currentUser.id,
        parentName: currentUser.fullName || currentUser.username || 'ولي الأمر',
        parentPhone: currentUser.phone || child.parentPhone || '',
        studentId: child.studentId,
        studentName: child.fullName,
        targetRole: targetRole,
        subject: subject.trim(),
        meetingType: meetingType,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        notes: notes.trim(),
      });

      setFeedback(res);
      if (res.success) {
        setSubject('');
        setNotes('');
        await loadHistory();
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err?.message || 'فشل إرسال الطلب' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-emerald-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">طلب لقاء أو استفسار مدرسي</h3>
              <p className="text-xs text-slate-300">
                الطالب/ة: {child.fullName} • {child.schoolName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'new'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            طلب جديد
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>الطلبات السابقة</span>
            {history.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Role */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">الجهة المطلوبة بالمدرسة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('counselor')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetRole === 'counselor'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    الموجه الطلابي
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('teacher')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetRole === 'teacher'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    معلم المادة
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('principal')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetRole === 'principal'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    مدير المدرسة
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('vice_principal')}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetRole === 'vice_principal'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    وكيل المدرسة
                  </button>
                </div>
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">طريقة اللقاء المفضلة:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingType('in_person')}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      meetingType === 'in_person'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>حضوري بالمدرسة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType('phone')}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      meetingType === 'phone'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>مكالمة هاتفية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType('online')}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      meetingType === 'online'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>لقاء مرئي</span>
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">موضوع اللقاء أو الاستفسار *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: متابعة المستوى التحصيلي لمادة الرياضيات"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">التاريخ المقترح:</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">الوقت المفضل:</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="08:00 ص - 09:00 ص">08:00 ص - 09:00 ص</option>
                    <option value="09:00 ص - 10:00 ص">09:00 ص - 10:00 ص</option>
                    <option value="10:30 ص - 11:30 ص">10:30 ص - 11:30 ص</option>
                    <option value="12:00 م - 01:00 م">12:00 م - 01:00 م</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تفاصيل أو ملاحظات إضافية:</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي استفسارات أو تفاصيل إضافية لتجهيزها من قبل إدارة المدرسة أو المعلم..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {feedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    feedback.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {feedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الطلب للمدرسة...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 rotate-180" />
                    <span>إرسال طلب الموعد للمدرسة</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جاري تحميل طلباتك السابقة...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  لا توجد طلبات مواعيد سابقة لهذا الابن.
                </div>
              ) : (
                history.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{req.subject}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          الجهة: {req.targetRole === 'counselor' ? 'الموجه الطلابي' : req.targetRole === 'principal' ? 'مدير المدرسة' : 'معلم المادة'} •{' '}
                          {req.meetingType === 'in_person' ? 'حضوري' : req.meetingType === 'phone' ? 'هاتفي' : 'مرئي'}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : req.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status === 'approved'
                          ? 'تم قبول الموعد'
                          : req.status === 'rejected'
                          ? 'تم الاعتذار'
                          : req.status === 'completed'
                          ? 'تم اللقاء'
                          : 'قيد الانتظار'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-4">
                      <span>التاريخ: {req.preferredDate}</span>
                      {req.preferredTime && <span>الوقت: {req.preferredTime}</span>}
                    </div>

                    {req.schoolResponse && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-emerald-800">رد إدارة المدرسة / المعلم:</span>
                        <p className="text-slate-700">{req.schoolResponse}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
