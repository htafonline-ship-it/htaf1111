import React, { useState } from 'react';
import { SchoolTenant, SchoolServiceItem } from '../types';
import {
  getSchoolServices,
  toggleSchoolService,
  addCustomSchoolService,
  removeSchoolService,
  DEFAULT_PLATFORM_SERVICES
} from '../data/schoolServicesData';
import {
  Sparkles,
  Bot,
  MessageSquare,
  QrCode,
  FileCheck2,
  ShieldAlert,
  Users,
  Award,
  Laptop,
  Clock,
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Power,
  Layers,
  Check,
  Zap,
  Info,
  SlidersHorizontal,
  Building2,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface SchoolServicesManagerProps {
  school: SchoolTenant;
  onSchoolUpdated: (updatedSchool: SchoolTenant) => void;
}

export const SchoolServicesManager: React.FC<SchoolServicesManagerProps> = ({
  school,
  onSchoolUpdated
}) => {
  const [services, setServices] = useState<SchoolServiceItem[]>(() => getSchoolServices(school));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Custom Service Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<SchoolServiceItem['category']>('academic');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePlan, setNewServicePlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleToggle = (serviceId: string, currentStatus: boolean) => {
    const updatedSchool = toggleSchoolService(school, serviceId, !currentStatus);
    onSchoolUpdated(updatedSchool);
    setServices(getSchoolServices(updatedSchool));

    const target = services.find(s => s.id === serviceId);
    if (!currentStatus) {
      showToast(`تمت إضافة وتفعيل خدمة "${target?.name || ''}" بنجاح للمدرسة!`);
    } else {
      showToast(`تم إلغاء وتعطيل خدمة "${target?.name || ''}".`);
    }
  };

  const handleRemoveCustom = (serviceId: string) => {
    const target = services.find(s => s.id === serviceId);
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الخدمة المخصصة "${target?.name}" نهائياً من المدرسة؟`)) {
      return;
    }
    const updatedSchool = removeSchoolService(school, serviceId);
    onSchoolUpdated(updatedSchool);
    setServices(getSchoolServices(updatedSchool));
    showToast(`تم حذف الخدمة المخصصة "${target?.name || ''}" نهائياً.`);
  };

  const handleCreateCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceDescription.trim()) {
      alert('يرجى ملء اسم الخدمة ووصفها بشكل كامل.');
      return;
    }

    const { updatedSchool, newServiceItem } = addCustomSchoolService(school, {
      name: newServiceName.trim(),
      category: newServiceCategory,
      description: newServiceDescription.trim(),
      planLevel: newServicePlan,
      isEnabled: true,
      priceLabel: 'خدمة مخصصة للمدرسة'
    });

    onSchoolUpdated(updatedSchool);
    setServices(getSchoolServices(updatedSchool));
    setShowAddModal(false);
    setNewServiceName('');
    setNewServiceDescription('');
    showToast(`تمت إضافة الخدمة المخصصة الجديدة "${newServiceItem.name}" وتفعيلها بنجاح!`);
  };

  // Stats
  const activeCount = services.filter(s => s.isEnabled).length;
  const totalCount = services.length;
  const coveragePercent = Math.round((activeCount / (totalCount || 1)) * 100);

  // Filtered list
  const filteredServices = services.filter(s => {
    const matchCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchQuery =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai':
        return <Bot className="w-5 h-5 text-purple-400" />;
      case 'communication':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'security':
        return <QrCode className="w-5 h-5 text-cyan-400" />;
      case 'counseling':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'administrative':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'academic':
      default:
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ai':
        return 'الذكاء الاصطناعي';
      case 'communication':
        return 'التواصل والرسائل';
      case 'security':
        return 'الأمان والهوية الرقمية';
      case 'counseling':
        return 'التوجيه والإرشاد';
      case 'administrative':
        return 'الإدارة والمواظبة';
      case 'academic':
      default:
        return 'أكاديمي وتعليمي';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-300 hover:text-white text-xs underline"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b1739] border border-blue-900/50 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-blue-300/70 font-bold">الخدمات المفعلة بالمدرسة</p>
              <h4 className="text-2xl font-black text-emerald-400 mt-1">
                {activeCount} <span className="text-xs font-bold text-slate-400">/ {totalCount} خدمة</span>
              </h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-blue-950 rounded-full h-1.5 mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        <div className="bg-[#0b1739] border border-blue-900/50 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-blue-300/70 font-bold">نسبة تغطية الخدمات للكيان</p>
            <h4 className="text-2xl font-black text-cyan-400 mt-1">{coveragePercent}%</h4>
            <p className="text-[10px] text-emerald-400 font-bold mt-1">جاهزية تشغيلية ممتازة</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0b1739] border border-blue-900/50 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-blue-300/70 font-bold">إمكانية إضافة خدمات جديدة</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خدمة جديدة</span>
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-[#080f24] border border-blue-900/40 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الوصف عن أي خدمة..."
            className="w-full bg-[#0b1633] border border-blue-900/50 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-blue-300/40 font-bold outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'كافة الخدمات' },
            { id: 'ai', label: 'الذكاء الاصطناعي' },
            { id: 'academic', label: 'أكاديمية' },
            { id: 'communication', label: 'التواصل' },
            { id: 'administrative', label: 'الإدارة' },
            { id: 'counseling', label: 'التوجيه' },
            { id: 'security', label: 'الأمان والـ QR' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-[#0b1633] text-slate-400 border-blue-900/30 hover:text-white hover:bg-blue-900/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isCustom = !DEFAULT_PLATFORM_SERVICES.some(def => def.id === service.id);

          return (
            <div
              key={service.id}
              className={`rounded-2xl p-5 border transition-all relative ${
                service.isEnabled
                  ? 'bg-[#0b1739] border-blue-800/60 shadow-md shadow-blue-950/40'
                  : 'bg-[#070e22]/70 border-slate-800/60 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    service.isEnabled
                      ? 'bg-blue-950/80 border-blue-700/60'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    {getCategoryIcon(service.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-white">{service.name}</h4>
                      {isCustom && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40">
                          خدمة مخصصة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] bg-blue-900/40 text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-800/40">
                        {getCategoryLabel(service.category)}
                      </span>
                      {service.planLevel && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                          باقة: {service.planLevel.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                  service.isEnabled
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {service.isEnabled ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>مفعلة</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>معطلة</span>
                    </>
                  )}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-blue-200/70 leading-relaxed mt-3 border-t border-blue-900/30 pt-3">
                {service.description}
              </p>

              {/* Footer Controls */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-blue-900/30">
                <span className="text-[11px] font-bold text-slate-400">
                  {service.priceLabel || 'مشمول في اشتراك المنصة'}
                </span>

                <div className="flex items-center gap-2">
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustom(service.id)}
                      className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 p-2 rounded-xl transition"
                      title="حذف الخدمة المخصصة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggle(service.id, service.isEnabled)}
                    className={`text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      service.isEnabled
                        ? 'bg-rose-600/80 hover:bg-rose-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{service.isEnabled ? 'إلغاء الخدمة' : 'إضافة وتفعيل الخدمة'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 bg-[#080f24] rounded-2xl border border-blue-900/40 p-6 space-y-3">
          <Info className="w-10 h-10 text-blue-400 mx-auto" />
          <h4 className="text-white font-bold text-sm">لا توجد خدمات مطابقة لخيارات البحث</h4>
          <p className="text-xs text-blue-300/60">جرّب تغيير فئة التصفية أو عبارة البحث في الأعلى.</p>
        </div>
      )}

      {/* ADD CUSTOM SERVICE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-blue-900/70 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">إضافة خدمة جديدة للمدرسة</h3>
                  <p className="text-[11px] text-blue-300/70">تخصيص وإطلاق ميزة فرعية خاصة بطلاب ومعلمي المدرسة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم الخدمة أو الميزة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="مثال: مختبر الروبوتات والذكاء الاصطناعي"
                  className="w-full bg-[#070e22] border border-blue-900/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تصنيف الخدمة</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full bg-[#070e22] border border-blue-900/50 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="academic">أكاديمي وتعليمي</option>
                    <option value="ai">ذكاء اصطناعي</option>
                    <option value="communication">تواصل ورسائل</option>
                    <option value="administrative">إداري ومواظبة</option>
                    <option value="counseling">توجيه وإرشاد</option>
                    <option value="security">أمان وهوية رقمية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مستوى الباقة</label>
                  <select
                    value={newServicePlan}
                    onChange={(e) => setNewServicePlan(e.target.value as any)}
                    className="w-full bg-[#070e22] border border-blue-900/50 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="basic">أساسي (Basic)</option>
                    <option value="pro">متقدم (Pro)</option>
                    <option value="enterprise">مؤسسي (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  وصف الخدمة ونطاق عملها <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="اكتب شرحاً مختصراً عما تقدمه هذه الخدمة للطلاب وأولياء الأمور..."
                  className="w-full bg-[#070e22] border border-blue-900/50 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-cyan-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-blue-900/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وإضافة الخدمة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
