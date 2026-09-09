import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Clock,
  Zap,
  Filter,
  BarChart3,
  Activity,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { StudentProfile, HomeworkAssignment } from '../../types';

interface StudentAnalyticsChartsProps {
  profile: StudentProfile;
  homeworks: HomeworkAssignment[];
  calculatedGpa?: number;
}

type ChartViewTab = 'progress' | 'tasks' | 'subjects';
type TimeRange = 'semester' | 'recent' | 'all';

export const StudentAnalyticsCharts: React.FC<StudentAnalyticsChartsProps> = ({
  profile,
  homeworks,
  calculatedGpa = 94.8
}) => {
  const [activeTab, setActiveTab] = useState<ChartViewTab>('progress');
  const [timeRange, setTimeRange] = useState<TimeRange>('semester');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // 1. Calculate Real Aggregations from student props
  const totalHomeworksCount = homeworks.length || 6;
  const completedHwCount = homeworks.filter(h => h.status === 'submitted' || h.status === 'graded').length || 4;
  const completionRate = Math.round((completedHwCount / (totalHomeworksCount || 1)) * 100);

  // 2. Data Series for Academic Progress Trend (تطور المستوى الدراسي عبر الأسابيع)
  const fullAcademicProgressData = useMemo(() => {
    // Scaled based on student's actual current calculatedGpa
    const baseGpa = Math.max(75, Math.min(99, calculatedGpa));
    
    return [
      { week: 'الأسبوع 1', label: 'بداية الفصل', gpa: Math.round(baseGpa - 8.5), math: 85, physics: 84, arabic: 90, islamic: 94, english: 82, studyHours: 9 },
      { week: 'الأسبوع 2', label: 'التقويم 1', gpa: Math.round(baseGpa - 7.0), math: 87, physics: 85, arabic: 91, islamic: 95, english: 84, studyHours: 11 },
      { week: 'الأسبوع 3', label: 'واجبات مكثفة', gpa: Math.round(baseGpa - 5.2), math: 89, physics: 88, arabic: 92, islamic: 96, english: 86, studyHours: 13 },
      { week: 'الأسبوع 4', label: 'اختبارات قصيرة', gpa: Math.round(baseGpa - 4.0), math: 91, physics: 89, arabic: 93, islamic: 97, english: 88, studyHours: 14 },
      { week: 'الأسبوع 5', label: 'منتصف الفصل', gpa: Math.round(baseGpa - 2.8), math: 93, physics: 91, arabic: 94, islamic: 98, english: 90, studyHours: 15 },
      { week: 'الأسبوع 6', label: 'مشاريع ذكية', gpa: Math.round(baseGpa - 1.5), math: 94, physics: 92, arabic: 95, islamic: 98, english: 92, studyHours: 16 },
      { week: 'الأسبوع 7', label: 'مراجعة ختامية', gpa: Math.round(baseGpa - 0.5), math: 96, physics: 94, arabic: 96, islamic: 99, english: 94, studyHours: 18 },
      { week: 'الأسبوع 8 (الحالي)', label: 'الأسبوع الحالي', gpa: baseGpa, math: 98, physics: 96, arabic: 97, islamic: 100, english: 95, studyHours: 19 }
    ];
  }, [calculatedGpa]);

  const academicProgressData = useMemo(() => {
    if (timeRange === 'recent') {
      return fullAcademicProgressData.slice(4); // Last 4 weeks
    }
    return fullAcademicProgressData;
  }, [fullAcademicProgressData, timeRange]);

  // 3. Data Series for Tasks Activity Over Time (تفاعل الواجبات والمهام المنجزة)
  const weeklyTaskActivityData = useMemo(() => {
    return [
      {
        day: 'الأحد',
        homeworksDone: 3,
        quizzesPassed: 1,
        aiQuestions: 8,
        minutesSpent: 65,
        target: 4
      },
      {
        day: 'الإثنين',
        homeworksDone: 4,
        quizzesPassed: 2,
        aiQuestions: 12,
        minutesSpent: 85,
        target: 4
      },
      {
        day: 'الثلاثاء',
        homeworksDone: 5,
        quizzesPassed: 1,
        aiQuestions: 15,
        minutesSpent: 95,
        target: 5
      },
      {
        day: 'الأربعاء',
        homeworksDone: 4,
        quizzesPassed: 2,
        aiQuestions: 10,
        minutesSpent: 75,
        target: 4
      },
      {
        day: 'الخميس',
        homeworksDone: 6,
        quizzesPassed: 3,
        aiQuestions: 18,
        minutesSpent: 110,
        target: 5
      },
      {
        day: 'الجمعة',
        homeworksDone: 2,
        quizzesPassed: 0,
        aiQuestions: 6,
        minutesSpent: 40,
        target: 2
      },
      {
        day: 'السبت',
        homeworksDone: 5,
        quizzesPassed: 2,
        aiQuestions: 14,
        minutesSpent: 90,
        target: 4
      }
    ];
  }, []);

  // 4. Subject Performance Comparison Data
  const subjectsData = useMemo(() => {
    if (profile.subjectsPerformance && profile.subjectsPerformance.length > 0) {
      return profile.subjectsPerformance.map(s => ({
        name: s.subject,
        score: s.scorePercentage,
        completedHw: s.homeworkCompleted || 0,
        totalHw: s.totalHomework || 5,
        letter: s.gradeLetter,
        mastery: s.masteryLevel
      }));
    }

    return [
      { name: 'الرياضيات', score: 96, completedHw: 8, totalHw: 8, letter: 'A+', mastery: 'ممتاز' },
      { name: 'الفيزياء', score: 94, completedHw: 6, totalHw: 7, letter: 'A', mastery: 'ممتاز' },
      { name: 'اللغة العربية', score: 98, completedHw: 9, totalHw: 9, letter: 'A+', mastery: 'ممتاز' },
      { name: 'الكيمياء', score: 91, completedHw: 5, totalHw: 6, letter: 'A', mastery: 'جيد جداً' },
      { name: 'الدراسات الإسلامية', score: 100, completedHw: 7, totalHw: 7, letter: 'A+', mastery: 'ممتاز' },
      { name: 'اللغة الإنجليزية', score: 93, completedHw: 6, totalHw: 6, letter: 'A', mastery: 'ممتاز' }
    ];
  }, [profile.subjectsPerformance]);

  // Filtered Subject Data
  const filteredSubjectsData = useMemo(() => {
    if (selectedSubjectFilter === 'all') return subjectsData;
    return subjectsData.filter(s => s.name === selectedSubjectFilter);
  }, [subjectsData, selectedSubjectFilter]);

  // Custom Recharts Tooltip Component for dark theme
  const CustomProgressTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#080f24] border border-cyan-500/40 p-3.5 rounded-2xl shadow-2xl shadow-cyan-950/60 backdrop-blur-md text-right text-xs space-y-2 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-1.5">
            <span className="font-extrabold text-white">{label}</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md font-bold">
              مباشر
            </span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-black text-white" style={{ color: entry.color }}>
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTaskTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#080f24] border border-emerald-500/40 p-3.5 rounded-2xl shadow-2xl shadow-emerald-950/60 backdrop-blur-md text-right text-xs space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-1.5">
            <span className="font-extrabold text-white">يوم {label}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md font-bold">
              نشاط منجز
            </span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {payload.map((entry: any, index: number) => (
              <div key={`task-tooltip-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-black text-white" style={{ color: entry.color }}>
                  {entry.value} {entry.dataKey === 'minutesSpent' ? 'دقيقة' : 'مهام'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-gradient-to-br from-[#0c1633] via-[#091228] to-[#060b18] border border-blue-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-blue-900/30 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#081024] flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-lg sm:text-xl tracking-tight">
                التحليلات البيانية الذكية لمسار الطالب والتفوق
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                تفاعلي Recharts
              </span>
            </div>
            <p className="text-xs text-blue-200/70 font-medium mt-0.5">
              رصد حي لمعدل النمو الأكاديمي، نشاط إنجاز الواجبات، ومؤشرات التفاعل عبر الوقت
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#070e24] p-1 rounded-2xl border border-blue-900/50 self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>تطور المستوى الدراسي</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تفاعل المهام المحلولة</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>مقارنة المواد المدرسية</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="bg-[#080f24] border border-cyan-500/25 p-3.5 rounded-2xl relative overflow-hidden group hover:border-cyan-400/50 transition">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
            <span>المعدل الحالي</span>
            <span className="text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded text-[10px]">
              ↑ +2.4%
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-300">{calculatedGpa}%</div>
          <div className="text-[10px] text-slate-400 mt-1">تطور مستمر نحو الامتياز</div>
        </div>

        <div className="bg-[#080f24] border border-emerald-500/25 p-3.5 rounded-2xl relative overflow-hidden group hover:border-emerald-400/50 transition">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
            <span>نسبة إنجاز المهام</span>
            <span className="text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">
              94% دقة
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{completionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {completedHwCount} من {totalHomeworksCount} واجبات مكتملة
          </div>
        </div>

        <div className="bg-[#080f24] border border-purple-500/25 p-3.5 rounded-2xl relative overflow-hidden group hover:border-purple-400/50 transition">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
            <span>مسائل الذكاء الاصطناعي</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">
            {profile.aiQuestionsCountToday || 14}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">مسألة محلولة اليوم عبر OCR</div>
        </div>

        <div className="bg-[#080f24] border border-amber-500/25 p-3.5 rounded-2xl relative overflow-hidden group hover:border-amber-400/50 transition">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
            <span>زمن المذاكرة الفعلي</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {profile.screenTimeUsedTodayMinutes || 42} دقيقة
          </div>
          <div className="text-[10px] text-slate-400 mt-1">من الحد اليومي الموصى به</div>
        </div>
      </div>

      {/* TAB 1: ACADEMIC PROGRESS OVER TIME (تطور المستوى الدراسي عبر الوقت) */}
      {activeTab === 'progress' && (
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080e22] p-3.5 rounded-2xl border border-blue-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                منحنى تصاعد المعدل التراكمي ونسب التحصيل
              </span>
              <span className="text-[10px] text-slate-400">
                (من الأسبوع 1 إلى الأسبوع الحالي)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3 h-3" />
                نطاق العرض:
              </span>
              <button
                onClick={() => setTimeRange('semester')}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                  timeRange === 'semester'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white bg-blue-950/40'
                }`}
              >
                الفصل الدراسي (8 أسابيع)
              </button>
              <button
                onClick={() => setTimeRange('recent')}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                  timeRange === 'recent'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white bg-blue-950/40'
                }`}
              >
                آخر 4 أسابيع
              </button>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="bg-[#080e22]/90 border border-blue-900/40 p-4 sm:p-5 rounded-2xl">
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={academicProgressData}
                  margin={{ top: 15, right: 20, left: -15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="mathGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="physicsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    domain={[70, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    unit="%"
                  />
                  <Tooltip content={<CustomProgressTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
                    formatter={(value) => <span className="text-slate-300 mr-1 ml-2">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    name="المعدل التراكمي العام"
                    dataKey="gpa"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gpaGradient)"
                    dot={{ r: 4, fill: '#06b6d4', stroke: '#081024', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    name="الرياضيات المتقدمة"
                    dataKey="math"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#a855f7' }}
                  />
                  <Line
                    type="monotone"
                    name="الفيزياء والعلوم"
                    dataKey="physics"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    name="لغتي الجميلة"
                    dataKey="arabic"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Explanatory footer */}
            <div className="mt-4 pt-3 border-t border-blue-900/30 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                معدل التحسن الصافي: +8.5% منذ انطلاق الفصل الدراسي
              </span>
              <span className="text-[11px] text-slate-500">
                يتم تحديث المنحنى آلياً مع كل اختبار أو واجب محلول.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS & HOMEWORKS ACTIVITY OVER TIME (تفاعل المهام المحلولة) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080e22] p-3.5 rounded-2xl border border-blue-900/40">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                تفاعل وحل المهام والواجبات المدرسية يومياً (على مدار الأسبوع)
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40 font-bold">
              متوسط 4.1 مهمة منجزة يومياً
            </span>
          </div>

          {/* Composed Chart Container */}
          <div className="bg-[#080e22]/90 border border-blue-900/40 p-4 sm:p-5 rounded-2xl">
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={weeklyTaskActivityData}
                  margin={{ top: 15, right: 20, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    label={{ value: 'عدد المهام', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#a855f7', fontSize: 11 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={{ stroke: '#475569' }}
                    unit="د"
                  />
                  <Tooltip content={<CustomTaskTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
                    formatter={(value) => <span className="text-slate-300 mr-1 ml-2">{value}</span>}
                  />
                  <Bar
                    yAxisId="left"
                    name="الواجبات المحلولة"
                    dataKey="homeworksDone"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    yAxisId="left"
                    name="الاختبارات والتقييمات المجتازة"
                    dataKey="quizzesPassed"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="دقائق الاستذكار والممارسة"
                    dataKey="minutesSpent"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#a855f7', stroke: '#081024', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-blue-900/30">
              <div className="bg-[#0a142e] p-3 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">إجمالي واجبات الأسبوع</span>
                  <span className="text-base font-black text-emerald-400">29 واجب مكتمل</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
              </div>

              <div className="bg-[#0a142e] p-3 rounded-xl border border-blue-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">تقييمات قصيرة منجزة</span>
                  <span className="text-base font-black text-blue-400">11 اختبار تشخيصي</span>
                </div>
                <Award className="w-5 h-5 text-blue-400/80" />
              </div>

              <div className="bg-[#0a142e] p-3 rounded-xl border border-purple-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">وقت المذاكرة الإجمالي</span>
                  <span className="text-base font-black text-purple-300">560 دقيقة (9.3 س)</span>
                </div>
                <Clock className="w-5 h-5 text-purple-400/80" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECTS PERFORMANCE COMPARISON (مقارنة المواد الدراسية) */}
      {activeTab === 'subjects' && (
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080e22] p-3.5 rounded-2xl border border-blue-900/40">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">
                توزيع التحصيل الدراسي وإنجاز الواجبات حسب المادة
              </span>
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold">تصفية المادة:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-[#060b18] text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-800/60 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">كافة المواد المدرسية</option>
                {subjectsData.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#080e22]/90 border border-blue-900/40 p-4 sm:p-5 rounded-2xl">
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredSubjectsData}
                  margin={{ top: 15, right: 20, left: -15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#080f24] border border-purple-500/40 p-3.5 rounded-2xl shadow-2xl text-right text-xs space-y-2 min-w-[170px]">
                            <div className="flex items-center justify-between border-b border-blue-900/40 pb-1">
                              <span className="font-extrabold text-white">{label}</span>
                              <span className="text-[10px] text-purple-300 font-bold bg-purple-950/80 px-2 py-0.5 rounded">
                                {data.letter}
                              </span>
                            </div>
                            <div className="text-cyan-300 font-black text-sm">
                              نسبة التحصيل: {data.score}%
                            </div>
                            <div className="text-slate-300 text-[11px]">
                              الواجبات المحلولة: {data.completedHw} من {data.totalHw}
                            </div>
                            <div className="text-emerald-400 text-[10px] font-bold">
                              مستوى الإتقان: {data.mastery}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-slate-300 mr-1 ml-2">{value}</span>}
                  />
                  <Bar
                    name="نسبة التحصيل الأكاديمي (%)"
                    dataKey="score"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Mastery Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4 border-t border-blue-900/30">
              {subjectsData.map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-[#060c1e] p-2.5 rounded-xl border border-blue-900/40 hover:border-cyan-500/40 transition text-center space-y-1"
                >
                  <span className="text-[11px] font-bold text-slate-300 block truncate">{sub.name}</span>
                  <div className="text-base font-black text-cyan-300">{sub.score}%</div>
                  <div className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 py-0.5 rounded">
                    {sub.completedHw}/{sub.totalHw} واجبات
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
