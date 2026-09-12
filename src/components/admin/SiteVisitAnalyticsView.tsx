import React, { useState, useEffect, useMemo } from 'react';
import {
  getVisitAnalyticsSummary,
  exportVisitLogsToCSV,
  recordPageVisit,
  VisitEvent
} from '../../lib/visitAnalyticsService';
import {
  Users,
  TrendingUp,
  LogIn,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Flame
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const SiteVisitAnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'login' | 'page_view'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [dataVersion, setDataVersion] = useState(0);

  // Fetch summary data
  const data = useMemo(() => {
    return getVisitAnalyticsSummary(timeRange);
  }, [timeRange, dataVersion]);

  const { summary, dailyTrends, hourlyDistribution, recentLogs } = data;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Trigger fresh tracking check
    recordPageVisit('/#platform-admin/analytics', 'super_admin', 'admin_1007363904', 'مدير المنصة الرئيسي');
    setTimeout(() => {
      setDataVersion(v => v + 1);
      setIsRefreshing(false);
    }, 450);
  };

  // Filtered live logs
  const filteredLogs = useMemo(() => {
    return recentLogs.filter(log => {
      const matchesSearch =
        !searchLogQuery.trim() ||
        (log.userName && log.userName.toLowerCase().includes(searchLogQuery.toLowerCase())) ||
        (log.schoolName && log.schoolName.toLowerCase().includes(searchLogQuery.toLowerCase())) ||
        log.region.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        log.path.toLowerCase().includes(searchLogQuery.toLowerCase());

      const matchesType = filterType === 'all' || log.type === filterType;
      const matchesRole = filterRole === 'all' || log.userRole === filterRole;

      return matchesSearch && matchesType && matchesRole;
    });
  }, [recentLogs, searchLogQuery, filterType, filterRole]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-indigo-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-black px-3.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>رصد مباشر للحركة والزيارات</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-black px-3.5 py-1 rounded-full border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                <span>خاص بالإدارة العليا (Super Admin)</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              إحصائيات الدخول والزيارات للموقع
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تحليل دقيق وتفصيلي لحركة الزوار، عمليات تسجيل الدخول المعتمدة، وساعات الذروة الدراسية والتوزيع الجغرافي لمدارس المملكة ومحافظة الخرج.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Timeframe Switcher */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-1 flex items-center shadow-lg">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  timeRange === 'today'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                اليوم
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  timeRange === '7days'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                آخر 7 أيام
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  timeRange === '30days'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                آخر 30 يوماً
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  timeRange === 'all'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 shadow-md active:scale-95"
              title="تحديث البيانات لحظياً"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={() => exportVisitLogsToCSV(recentLogs)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير السجلات (CSV)</span>
            </button>
          </div>
        </div>

        {/* Highlight Banner Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي الزيارات</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">{summary.totalVisits.toLocaleString('ar-SA')}</span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">+{summary.growthRatePercentage}%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">زيارات مجمعة</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">تسجيلات الدخول</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-indigo-300">{summary.totalLogins.toLocaleString('ar-SA')}</span>
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                {Math.round((summary.totalLogins / summary.totalVisits) * 100)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">جلسة موثقة</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">الزوار الفريدون</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-300">{summary.uniqueVisitors.toLocaleString('ar-SA')}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">أجهزة ومستخدمين مستقلين</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>متواجدون الآن</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{summary.activeOnlineNow}</span>
              <span className="text-[10px] font-bold text-slate-400">جلسة نشطة</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">لحظياً بالمنصة</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">متوسط مدة الجلسة</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-cyan-300">{summary.avgSessionDurationMinutes}</span>
              <span className="text-[11px] font-bold text-slate-300">دقيقة</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">ارتداد منخفض ({summary.bounceRatePercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-800 text-base">
                  حركة الزيارات اليومية وتسجيلات الدخول
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                مقارنة بين إجمالي المتصفحين والزيارات مقابل عمليات تسجيل الدخول المكتملة
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span>إجمالي الزيارات</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>تسجيلات الدخول</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="loginsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                    direction: 'rtl'
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} ${name === 'totalVisits' ? 'زيارة' : 'تسجيل دخول'}`,
                    name === 'totalVisits' ? 'الزيارات الكلية' : 'تسجيلات الدخول'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="totalVisits"
                  name="totalVisits"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#visitsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="totalLogins"
                  name="totalLogins"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#loginsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block">متوسط الزيارات اليومي</span>
              <span className="font-black text-slate-800 text-sm mt-0.5 block">
                {Math.round(summary.totalVisits / Math.max(dailyTrends.length, 1))} زيارة/يوم
              </span>
            </div>
            <div className="p-2 bg-indigo-50/60 rounded-xl">
              <span className="text-indigo-600 font-bold block">معدل التحول للدخول</span>
              <span className="font-black text-indigo-900 text-sm mt-0.5 block">
                {Math.round((summary.totalLogins / summary.totalVisits) * 100)}%
              </span>
            </div>
            <div className="p-2 bg-emerald-50/60 rounded-xl">
              <span className="text-emerald-700 font-bold block">يوم الذروة الأسبوعي</span>
              <span className="font-black text-emerald-900 text-sm mt-0.5 block">الأحد والإثنين</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Peak Traffic Distribution (1 Col) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-slate-800 text-base">ساعات الذروة اليومية</h3>
            </div>
            <span className="text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              مدار 24 ساعة
            </span>
          </div>
          <p className="text-xs text-slate-500">
            توزيع الكثافة وأوقات النشاط المدرسي والمنزلي للطلاب والمعلمين
          </p>

          <div className="h-56 sm:h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution.filter((_, i) => i % 2 === 0)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={9.5} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '14px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '11px',
                    direction: 'rtl'
                  }}
                  formatter={(value: any) => [`${value} زيارة`, 'حركة المرور']}
                />
                <Bar dataKey="visits" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>فترة الدوام الصباحي (8:00 ص - 12:00 م)</span>
              </span>
              <span className="font-black text-amber-800">42% من النشاط</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>فترة المذاكرة المسائية (4:00 م - 9:00 م)</span>
              </span>
              <span className="font-black text-indigo-800">46% من النشاط</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demographic & Technical Distribution Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Roles Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h4 className="font-black text-slate-800 text-sm">التوزيع حسب الفئات والأدوار</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400">100% إجمالي</span>
          </div>

          <div className="space-y-3 pt-1">
            {summary.roleBreakdown.map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{r.roleLabel}</span>
                  <div className="flex items-center gap-2 font-black">
                    <span className="text-slate-900">{r.count.toLocaleString('ar-SA')}</span>
                    <span className="text-slate-400 text-[11px]">({r.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      i === 0
                        ? 'bg-emerald-500'
                        : i === 1
                        ? 'bg-indigo-600'
                        : i === 2
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${r.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>طرق الدخول الأكثر تفضيلاً:</span>
            <span className="font-black text-emerald-700">حساب Google ({summary.googleLoginsPercentage}%)</span>
          </div>
        </div>

        {/* Devices & Browsers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <h4 className="font-black text-slate-800 text-sm">الأجهزة والمتصفحات المستخدمة</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400">توافق الأجهزة</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {summary.deviceBreakdown.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  {i === 0 ? (
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                  ) : i === 1 ? (
                    <Monitor className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Tablet className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-xs font-bold text-slate-700">{d.device}</span>
                </div>
                <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {d.percentage}%
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5">أبرز المتصفحات المعتمدة:</span>
            <div className="flex flex-wrap gap-1.5">
              {summary.browserBreakdown.map((b, i) => (
                <span key={i} className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                  {b.browser}: {b.percentage}%
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Distribution (Kharj & Kingdom) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h4 className="font-black text-slate-800 text-sm">التوزيع الجغرافي للزيارات</h4>
            </div>
            <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              مدارس المملكة
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {summary.topRegions.map((reg, i) => (
              <div key={i} className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{reg.region}</span>
                  </span>
                  <span className="font-black text-rose-700">{reg.percentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${reg.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            تشهد مدارس <span className="font-black text-slate-700">محافظة الخرج ومراكزها</span> النسبة الأعلى من تفاعل وتصفح المقررات التفاعلية والأنشطة الرقمية.
          </div>
        </div>
      </div>

      {/* Live Recent Visits & Logins Audit Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-slate-800 text-base">سجل الدخول والزيارات اللحظي المباشر</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              رصد حي لعمليات الدخول وتصفح المقررات الدراسية دون المساس بالخصوصية والبيانات الشخصية
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                placeholder="بحث بالمستخدم أو المدرسة أو المنطقة..."
                className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 font-bold text-slate-700 outline-none"
            >
              <option value="all">كافة العمليات</option>
              <option value="login">تسجيل دخول فقط</option>
              <option value="page_view">زيارات صفحات</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 font-bold text-slate-700 outline-none"
            >
              <option value="all">كافة الأدوار</option>
              <option value="student">الطلاب</option>
              <option value="teacher">المعلمين</option>
              <option value="parent">أولياء الأمور</option>
              <option value="school_admin">مدراء المدارس</option>
              <option value="super_admin">الإدارة العليا</option>
              <option value="guest">الزوار</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black">
              <tr>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">نوع الحدث</th>
                <th className="py-3 px-4">المستخدم / الزائر</th>
                <th className="py-3 px-4">الدور التعليمي</th>
                <th className="py-3 px-4">المدرسة والمنطقة</th>
                <th className="py-3 px-4">الجهاز والمتصفح</th>
                <th className="py-3 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد سجلات دخول مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logDate = new Date(log.timestamp);
                  const isLogin = log.type === 'login';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                        <div className="font-bold text-slate-800">
                          {logDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {logDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLogin ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-black text-[11px] px-2.5 py-1 rounded-lg border border-indigo-200">
                            <LogIn className="w-3 h-3 text-indigo-600" />
                            <span>تسجيل دخول ({log.loginMethod || 'حساب'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold text-[11px] px-2 py-0.5 rounded-lg">
                            <Globe className="w-3 h-3 text-slate-500" />
                            <span>تصفح صفحة</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                        {log.userName || (log.userRole === 'guest' ? 'زائر المنصة' : 'مستخدم')}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                            log.userRole === 'student'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.userRole === 'teacher'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : log.userRole === 'parent'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : log.userRole === 'school_admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : log.userRole === 'super_admin' || log.userRole === 'platform_admin'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.userRole === 'student'
                            ? 'طالب'
                            : log.userRole === 'teacher'
                            ? 'معلم'
                            : log.userRole === 'parent'
                            ? 'ولي أمر'
                            : log.userRole === 'school_admin'
                            ? 'مدير مدرسة'
                            : log.userRole === 'super_admin' || log.userRole === 'platform_admin'
                            ? 'مدير منصة'
                            : 'زائر'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-700">{log.schoolName || 'تصفح عام'}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{log.region}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="font-bold text-slate-700">{log.deviceType === 'mobile' ? 'هاتف ذكي' : log.deviceType === 'desktop' ? 'كمبيوتر' : 'جهاز لوحي'}</div>
                        <div className="text-[10px] text-slate-400">{log.browser} ({log.os})</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ناجح</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>يتم حفظ وتحديث السجلات محلياً ولحظياً وفق معايير الخصوصية المعتمدة للمنصة.</span>
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span>إجمالي السجلات المعروضة:</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-black text-indigo-700">
              {filteredLogs.length} سجل
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
