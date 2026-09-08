import React, { useState, useMemo } from 'react';
import { SchoolTenant } from '../types';
import { SchoolBarcodeCard, BarcodeTheme } from './SchoolBarcodeCard';
import {
  QrCode,
  X,
  Building2,
  Search,
  Sliders,
  Sparkles,
  Link,
  Layers,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  MapPin,
  GraduationCap
} from 'lucide-react';

interface SchoolBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: SchoolTenant[];
  currentSchool?: SchoolTenant | null;
  onSelectSchool?: (school: SchoolTenant) => void;
}

export const SchoolBarcodeModal: React.FC<SchoolBarcodeModalProps> = ({
  isOpen,
  onClose,
  schools,
  currentSchool,
  onSelectSchool
}) => {
  // Currently selected school in modal
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentSchool?.id || schools[0]?.id || 'school-1'
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Customization States
  const [theme, setTheme] = useState<BarcodeTheme>('neon');
  const [urlType, setUrlType] = useState<'portal' | 'main' | 'current' | 'custom'>('portal');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [customSubtitleInput, setCustomSubtitleInput] = useState('');
  const [customBadgeInput, setCustomBadgeInput] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Update selected school if currentSchool changes
  React.useEffect(() => {
    if (currentSchool?.id) {
      setSelectedSchoolId(currentSchool.id);
    }
  }, [currentSchool?.id]);

  // Find active school object
  const activeSchool = useMemo(() => {
    return schools.find((s) => s.id === selectedSchoolId) || currentSchool || schools[0] || {
      id: 'default-school',
      name: 'هتاف العاصمي',
      nameEn: 'Htaf Al-Asimi',
      slug: 'htaf',
      logoText: 'HTAF',
      badge: 'المنصة الذكية',
      primaryColor: '#00d2ff',
      accentColor: '#9333ea',
      motto: 'المنصة التعليمية الذكية',
      location: 'المملكة العربية السعودية',
      circulars: []
    };
  }, [schools, selectedSchoolId, currentSchool]);

  // Filtered Schools list
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.principalName && s.principalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.moeCode && s.moeCode.includes(searchQuery));
      const matchStage = stageFilter === 'all' || s.stage === stageFilter;
      return matchSearch && matchStage;
    });
  }, [schools, searchQuery, stageFilter]);

  if (!isOpen) return null;

  // Build target URL (defaults to official live domain https://htaf.online)
  const getComputedTargetUrl = () => {
    if (urlType === 'custom' && customUrlInput.trim()) {
      return customUrlInput.trim();
    }
    if (urlType === 'current') {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://htaf.online';
      return `${currentOrigin}/?school=${encodeURIComponent(activeSchool.slug || activeSchool.id)}`;
    }
    // Official live production domain
    const domain = 'https://htaf.online';
    if (urlType === 'main') {
      return `${domain}/`;
    }
    // Default: Dedicated School Portal on htaf.online
    return `${domain}/?school=${encodeURIComponent(activeSchool.slug || activeSchool.id)}`;
  };

  // Switch to next / prev school
  const currentIndex = schools.findIndex((s) => s.id === activeSchool.id);
  const handlePrevSchool = () => {
    if (currentIndex > 0) {
      const prev = schools[currentIndex - 1];
      setSelectedSchoolId(prev.id);
      if (onSelectSchool) onSelectSchool(prev);
    }
  };
  const handleNextSchool = () => {
    if (currentIndex < schools.length - 1) {
      const next = schools[currentIndex + 1];
      setSelectedSchoolId(next.id);
      if (onSelectSchool) onSelectSchool(next);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#09122a] border border-blue-900/60 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#060c20] via-[#09153a] to-[#060c20] p-4 sm:p-6 border-b border-blue-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#050b1d] rounded-[14px] flex items-center justify-center">
                <QrCode className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>الباركود الذكي المعتمد للمدارس</span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-cyan-400/40">
                    رمز QR عالي الدقة
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                باركود رسمي مستقل لكل مدرسة يحمل اسمها وهويتها ويربط الزائرين وأولياء الأمور ببوابتها الذكية مباشرة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                showCustomizer
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">خيارات التخصيص</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#070e24]">
          {/* Left / Center Column: The Barcode Card & Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#050b1d]/80 rounded-3xl p-4 sm:p-6 border border-blue-900/30">
            {/* Quick School Nav Bar */}
            <div className="w-full flex items-center justify-between gap-2 mb-4 px-2">
              <button
                onClick={handlePrevSchool}
                disabled={currentIndex <= 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-bold"
                title="المدرسة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابقة</span>
              </button>

              <div className="text-center truncate px-2">
                <span className="text-[11px] text-cyan-400 font-black block">المدرسة المعروضة حالياً</span>
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[260px] inline-block">
                  {activeSchool.name}
                </span>
              </div>

              <button
                onClick={handleNextSchool}
                disabled={currentIndex >= schools.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-bold"
                title="المدرسة التالية"
              >
                <span className="hidden sm:inline">التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* The Visual Barcode Card */}
            <SchoolBarcodeCard
              school={activeSchool}
              customTitle={customTitleInput.trim() || undefined}
              customSubtitle={customSubtitleInput.trim() || undefined}
              customBadge={customBadgeInput.trim() || undefined}
              customUrl={getComputedTargetUrl()}
              theme={theme}
            />
          </div>

          {/* Right Column: School Switcher & Advanced Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Customizer Drawer (If toggled) */}
            {showCustomizer && (
              <div className="bg-[#08122c] border border-purple-900/50 rounded-2xl p-4 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تخصيص المظهر والنصوص</span>
                  </span>
                  <button
                    onClick={() => {
                      setCustomTitleInput('');
                      setCustomSubtitleInput('');
                      setCustomBadgeInput('');
                      setCustomUrlInput('');
                      setTheme('neon');
                      setUrlType('portal');
                    }}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-medium"
                  >
                    استعادة الافتراضي
                  </button>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                    نمط وألوان الباركود:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme('neon')}
                      className={`p-2 rounded-xl text-xs font-black border flex items-center gap-2 transition ${
                        theme === 'neon'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600" />
                      <span>نيوني هتاف AI</span>
                    </button>

                    <button
                      onClick={() => setTheme('emerald')}
                      className={`p-2 rounded-xl text-xs font-black border flex items-center gap-2 transition ${
                        theme === 'emerald'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>زمردي ملكي</span>
                    </button>

                    <button
                      onClick={() => setTheme('royal')}
                      className={`p-2 rounded-xl text-xs font-black border flex items-center gap-2 transition ${
                        theme === 'royal'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-400 shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>كحلي أكاديمي</span>
                    </button>

                    <button
                      onClick={() => setTheme('gold')}
                      className={`p-2 rounded-xl text-xs font-black border flex items-center gap-2 transition ${
                        theme === 'gold'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-400 shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>ذهبي فاخر</span>
                    </button>
                  </div>
                </div>

                {/* Destination Link Option */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                    الوجهة عند مسح الباركود:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setUrlType('portal')}
                      className={`p-2 rounded-xl font-bold border transition text-right ${
                        urlType === 'portal'
                          ? 'bg-blue-900/60 text-cyan-300 border-cyan-400'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700'
                      }`}
                    >
                      بوابة المدرسة (htaf.online)
                    </button>
                    <button
                      onClick={() => setUrlType('main')}
                      className={`p-2 rounded-xl font-bold border transition text-right ${
                        urlType === 'main'
                          ? 'bg-blue-900/60 text-cyan-300 border-cyan-400'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700'
                      }`}
                    >
                      المنصة الرئيسية (htaf.online)
                    </button>
                    <button
                      onClick={() => setUrlType('current')}
                      className={`p-2 rounded-xl font-bold border transition text-right ${
                        urlType === 'current'
                          ? 'bg-blue-900/60 text-cyan-300 border-cyan-400'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700'
                      }`}
                    >
                      رابط المعاينة الحالي
                    </button>
                    <button
                      onClick={() => setUrlType('custom')}
                      className={`p-2 rounded-xl font-bold border transition text-right ${
                        urlType === 'custom'
                          ? 'bg-blue-900/60 text-cyan-300 border-cyan-400'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700'
                      }`}
                    >
                      رابط مخصص
                    </button>
                  </div>

                  {/* Encoded URL display */}
                  <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-cyan-400 dir-ltr text-left truncate">
                    {getComputedTargetUrl()}
                  </div>

                  {urlType === 'custom' && (
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://myschool.edu.sa"
                      className="mt-2 w-full bg-[#050b1d] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 dir-ltr text-left"
                    />
                  )}
                </div>

                {/* Text Overrides */}
                <div className="space-y-2 pt-1 border-t border-purple-900/40">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      تعديل اسم المدرسة في أعلى الباركود:
                    </label>
                    <input
                      type="text"
                      value={customTitleInput}
                      onChange={(e) => setCustomTitleInput(e.target.value)}
                      placeholder={activeSchool.name}
                      className="w-full bg-[#050b1d] border border-blue-900/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      الوصف الفرعي:
                    </label>
                    <input
                      type="text"
                      value={customSubtitleInput}
                      onChange={(e) => setCustomSubtitleInput(e.target.value)}
                      placeholder="المنصة التعليمية الذكية"
                      className="w-full bg-[#050b1d] border border-blue-900/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      شارة الزاوية العلوية:
                    </label>
                    <input
                      type="text"
                      value={customBadgeInput}
                      onChange={(e) => setCustomBadgeInput(e.target.value)}
                      placeholder="v3.0 AI أو المرحلة الدراسية"
                      className="w-full bg-[#050b1d] border border-blue-900/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* School Selector Panel */}
            <div className="bg-[#08122c] border border-blue-900/40 rounded-2xl p-4 flex flex-col flex-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>اختر المدرسة لتوليد باركودها ({schools.length})</span>
                </span>
                <span className="text-[10px] bg-blue-950 text-cyan-300 px-2 py-0.5 rounded font-bold border border-blue-800/40">
                  {filteredSchools.length} مدرسة مطابقة
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المدرسة، المدينة، أو الرمز..."
                  className="w-full bg-[#050b1d] border border-blue-900/60 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Stage Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 select-none">
                {['all', 'ابتدائي', 'متوسط', 'ثانوي', 'مجمع تعليمي'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStageFilter(st)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                      stageFilter === st
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60'
                        : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'جميع المراحل' : st}
                  </button>
                ))}
              </div>

              {/* Schools List */}
              <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
                {filteredSchools.map((sch) => {
                  const isSelected = sch.id === activeSchool.id;
                  return (
                    <div
                      key={sch.id}
                      onClick={() => {
                        setSelectedSchoolId(sch.id);
                        if (onSelectSchool) onSelectSchool(sch);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-950 border-cyan-400 shadow-md text-white'
                          : 'bg-[#060c22] border-blue-900/30 hover:border-blue-700/60 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {sch.logoText || 'م'}
                        </div>

                        <div className="truncate">
                          <p className="text-xs font-black truncate">{sch.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {sch.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{sch.location}</span>
                              </span>
                            )}
                            {sch.stage && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-cyan-500" />
                                <span>{sch.stage}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </div>
                  );
                })}

                {filteredSchools.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    لم يتم العثور على مدرسة تطابق البحث
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="p-4 bg-[#060c20] border-t border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>الباركود مزود بنظام تصحيح الخطأ العالي (Level H 30%) لضمان المسح الفوري والدقيق من أي هاتف.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
