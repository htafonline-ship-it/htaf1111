import React, { useState } from 'react';
import { StudentProfile, AuthUser, SchoolTenant } from '../../types';
import {
  Users,
  Award,
  Clock,
  Sliders,
  ShieldCheck,
  Send,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { AchievementsPortfolioView } from '../achievements/AchievementsPortfolioView';

interface ParentDashboardProps {
  profile: StudentProfile;
  onUpdateScreenTime: (newLimitMinutes: number) => void;
  currentUser?: AuthUser | null;
  currentSchool?: SchoolTenant | null;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  profile,
  onUpdateScreenTime,
  currentUser = null,
  currentSchool = null
}) => {
  const [screenLimit, setScreenLimit] = useState(profile.screenTimeDailyLimitMinutes);
  const [parentMessage, setParentMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScreenLimit(val);
    onUpdateScreenTime(val);
  };

  const handleSendParentMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentMessage.trim()) return;
    setMessageSent(true);
    setParentMessage('');
    setTimeout(() => setMessageSent(false), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
            👨‍👩‍👧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">لوحة متابعة ولي الأمر</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                متابعة الأبناء
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              متابعة الأداء الأكاديمي، نتائج الاختبارات، وإدارة وقت الاستخدام والذكاء الاصطناعي للأبناء.
            </p>
          </div>
        </div>

        {/* Selected Child Pill */}
        <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-xs text-slate-200 flex items-center gap-3">
          <span className="text-2xl">{profile.avatar}</span>
          <div>
            <div className="font-bold text-emerald-400">{profile.name}</div>
            <div className="text-[10px] text-slate-400">{profile.grade}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Performance & Screen Time (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Screen Time & AI Usage Manager */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                إدارة وقت الاستخدام والحد اليومي للذكاء الاصطناعي
              </h3>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
                تحكم آمن وذكائي
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Screen Limit Slider */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>الحد اليومي المسموح لاستخدام المنصة:</span>
                  <span className="text-emerald-700 font-extrabold text-sm">{screenLimit} دقيقة</span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="240"
                  step="15"
                  value={screenLimit}
                  onChange={handleSliderChange}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>30 دقيقة</span>
                  <span>120 دقيقة (موصى به)</span>
                  <span>240 دقيقة</span>
                </div>
              </div>

              {/* Usage Stat Pill */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="text-xs font-bold text-slate-300">الاستخدام الفعلي اليوم:</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">
                    {profile.screenTimeUsedTodayMinutes}
                  </span>
                  <span className="text-xs text-slate-400">من أصل {screenLimit} دقيقة</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (profile.screenTimeUsedTodayMinutes / screenLimit) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Scores Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              سجل التحصيل الأكاديمي والدرجات لكل مادة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.subjectsPerformance.map((sub, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{sub.subject}</span>
                    <span className="text-xs font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      {sub.scorePercentage}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>التقدير: {sub.gradeLetter}</span>
                    <span>المستوى: {sub.masteryLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Message Counselor / Teacher (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              التواصل المباشر مع المدرسة والإرشاد
            </h3>
            <p className="text-xs text-slate-500">
              يمكنك كتابة رسالة مباشرة لمربّي الصف أو الموجه الطلابي لمتابعة حالة ابنتك.
            </p>

            <form onSubmit={handleSendParentMsg} className="space-y-3">
              <textarea
                rows={4}
                value={parentMessage}
                onChange={(e) => setParentMessage(e.target.value)}
                placeholder="اكتب استفسارك أو ملاحظتك هنا..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>إرسال للإرشاد الطلابي</span>
              </button>

              {messageSent && (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl font-bold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم إرسال رسالتك بنجاح وسيتواصل معك الموجه الطلابي.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Parent View of Child Achievements */}
      <div className="pt-6 border-t border-slate-200">
        <AchievementsPortfolioView
          currentUser={
            currentUser || {
              id: 'parent_user',
              name: 'ولي أمر الطالب/ة ' + (profile.name || ''),
              role: 'parent',
              email: ''
            }
          }
          currentSchool={currentSchool}
          defaultTab="school"
        />
      </div>
    </div>
  );
};
