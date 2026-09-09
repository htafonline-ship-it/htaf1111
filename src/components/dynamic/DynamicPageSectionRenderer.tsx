import React, { useState } from 'react';
import { DynamicPageBlock, CustomFieldItem, DynamicFormSubmission } from '../../types/dynamicPages';
import { UserRole, AuthUser } from '../../types';
import { saveDynamicFormSubmission } from '../../lib/dynamicPagesService';
import { ScrollFadeIn } from '../ScrollFadeIn';
import {
  Sparkles,
  Sliders,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  Activity,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  Trash2,
  Table as TableIcon,
  Tag,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bot,
  BookOpen,
  ScanLine,
  MessageSquare
} from 'lucide-react';

interface DynamicPageSectionRendererProps {
  pageId: string;
  position: 'top' | 'bottom' | 'banner';
  blocks: DynamicPageBlock[];
  currentUser: AuthUser | null;
  currentRole: UserRole;
  isAdmin: boolean;
  onOpenCustomizer: (targetBlockId?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DynamicPageSectionRenderer: React.FC<DynamicPageSectionRendererProps> = ({
  pageId,
  position,
  blocks,
  currentUser,
  currentRole,
  isAdmin,
  onOpenCustomizer,
  onNavigateTab
}) => {
  // Filter blocks for this position and role visibility
  const filteredBlocks = blocks.filter(b => {
    if (b.position !== position) return false;
    if (!b.isActive && !isAdmin) return false;
    if (b.visibleToRoles === 'all') return true;
    if (Array.isArray(b.visibleToRoles)) {
      return b.visibleToRoles.includes(currentRole) || isAdmin;
    }
    return true;
  });

  // State for dynamic forms
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [formSubmitted, setFormSubmitted] = useState<Record<string, boolean>>({});
  const [collapsedAccordions, setCollapsedAccordions] = useState<Record<string, boolean>>({});
  const [dismissedBanners, setDismissedBanners] = useState<Record<string, boolean>>({});

  const handleFormInputChange = (blockId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] || {}),
        [fieldId]: value
      }
    }));
  };

  const handleFormSubmit = (e: React.FormEvent, block: DynamicPageBlock) => {
    e.preventDefault();
    const currentBlockData = formData[block.id] || {};
    
    // Save submission
    saveDynamicFormSubmission({
      blockId: block.id,
      pageId: block.pageId,
      submittedBy: {
        id: currentUser?.id || 'anonymous',
        name: currentUser?.fullName || 'مستخدم المنصة',
        role: currentRole,
        email: currentUser?.email
      },
      data: currentBlockData
    });

    setFormSubmitted(prev => ({ ...prev, [block.id]: true }));
    setTimeout(() => {
      setFormSubmitted(prev => ({ ...prev, [block.id]: false }));
    }, 4000);
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'Clock': return <Clock className="w-4 h-4" />;
      case 'Award': return <Award className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Bot': return <Bot className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'ScanLine': return <ScanLine className="w-4 h-4" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getColorClasses = (scheme: string = 'cyan') => {
    switch (scheme) {
      case 'emerald':
        return {
          bg: 'bg-emerald-950/30 border-emerald-500/30',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          text: 'text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-950/30 border-indigo-500/30',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          text: 'text-indigo-400',
          button: 'bg-indigo-600 hover:bg-indigo-500 text-white'
        };
      case 'purple':
        return {
          bg: 'bg-purple-950/30 border-purple-500/30',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          text: 'text-purple-400',
          button: 'bg-purple-600 hover:bg-purple-500 text-white'
        };
      case 'amber':
        return {
          bg: 'bg-amber-950/30 border-amber-500/30',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          text: 'text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold'
        };
      case 'rose':
        return {
          bg: 'bg-rose-950/30 border-rose-500/30',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          text: 'text-rose-400',
          button: 'bg-rose-600 hover:bg-rose-500 text-white'
        };
      case 'blue':
        return {
          bg: 'bg-blue-950/30 border-blue-500/30',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          text: 'text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-500 text-white'
        };
      default: // cyan
        return {
          bg: 'bg-cyan-950/30 border-cyan-500/30',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          text: 'text-cyan-400',
          button: 'bg-cyan-600 hover:bg-cyan-500 text-white'
        };
    }
  };

  if (filteredBlocks.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4 my-4">
      {/* Dynamic Blocks List */}
      {filteredBlocks.map((block, index) => {
        if (dismissedBanners[block.id]) return null;
        const color = getColorClasses(block.colorScheme);

        return (
          <ScrollFadeIn
            key={block.id}
            delay={Math.min(index * 90, 450)}
            threshold={0.08}
            className="w-full"
          >
            <div
              id={block.id}
              className={`relative rounded-2xl border backdrop-blur-md p-4 sm:p-6 transition-all shadow-lg ${color.bg} ${!block.isActive ? 'opacity-60 border-dashed border-amber-500/50' : ''}`}
            >
            {/* Admin Block Header Controls */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${color.text}`} />
                    {block.title}
                  </h3>
                  {!block.isActive && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                      غير مفعّل للمستخدمين
                    </span>
                  )}
                  {block.visibleToRoles !== 'all' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                      مخصص لأدوار محددة
                    </span>
                  )}
                </div>
                {block.subtitle && (
                  <p className="text-xs text-slate-400 mt-1">{block.subtitle}</p>
                )}
              </div>

              {/* Admin Quick Action Button */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpenCustomizer(block.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition shadow-sm"
                    title="تعديل هذا القسم وإضافة خانات"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل الخانات</span>
                  </button>
                </div>
              )}
            </div>

            {/* BLOCK CONTENT ACCORDING TO TYPE */}

            {/* 1. Custom Fields Grid (KPIs / Custom data cards) */}
            {block.type === 'custom_fields_grid' && block.data.fields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {block.data.fields.map(field => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400">{field.label}</span>
                      <span className="text-cyan-400">{getIconComponent(field.iconName)}</span>
                    </div>
                    <div>
                      {field.type === 'badge' ? (
                        <span className={`inline-block px-2.5 py-1 text-xs font-black rounded-lg border ${color.badge}`}>
                          {String(field.value)}
                        </span>
                      ) : (
                        <span className="text-lg font-black text-slate-100 tracking-tight">
                          {String(field.value)}
                        </span>
                      )}
                    </div>
                    {field.helpText && (
                      <p className="text-[11px] text-slate-500 mt-2">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 2. Announcement Banner */}
            {block.type === 'announcement_banner' && (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 mt-0.5 shrink-0 ${color.text}`} />
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">
                    {block.data.bannerMessage}
                  </p>
                </div>
                {block.data.isDismissible && (
                  <button
                    onClick={() => setDismissedBanners(prev => ({ ...prev, [block.id]: true }))}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-800/60"
                  >
                    إغلاق
                  </button>
                )}
              </div>
            )}

            {/* 3. Quick Actions */}
            {block.type === 'quick_actions' && block.data.actions && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {block.data.actions.map(act => (
                  <button
                    key={act.id}
                    onClick={() => {
                      if (act.actionType === 'navigate_tab' && onNavigateTab) {
                        onNavigateTab(act.actionValue);
                      } else if (act.actionType === 'open_url') {
                        window.open(act.actionValue, '_blank');
                      } else if (act.actionType === 'show_alert') {
                        alert(act.actionValue);
                      }
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/50 text-xs sm:text-sm font-black text-slate-100 transition shadow-sm group"
                  >
                    {getIconComponent(act.iconName)}
                    <span className="truncate">{act.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-[-2px] transition" />
                  </button>
                ))}
              </div>
            )}

            {/* 4. Custom Form (Dynamic Fields Collection) */}
            {block.type === 'custom_form' && block.data.fields && (
              <form onSubmit={(e) => handleFormSubmit(e, block)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {block.data.fields.map(field => {
                    const val = formData[block.id]?.[field.id] ?? field.value ?? '';
                    return (
                      <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {field.label} {field.isRequired && <span className="text-rose-400">*</span>}
                        </label>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={val}
                            required={field.isRequired}
                            placeholder={field.placeholder || field.label}
                            onChange={(e) => handleFormInputChange(block.id, field.id, e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={val}
                            required={field.isRequired}
                            placeholder={field.placeholder}
                            onChange={(e) => handleFormInputChange(block.id, field.id, e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
                          />
                        )}

                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={val}
                            required={field.isRequired}
                            onChange={(e) => handleFormInputChange(block.id, field.id, e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={val}
                            required={field.isRequired}
                            onChange={(e) => handleFormInputChange(block.id, field.id, e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
                          >
                            <option value="">-- اختر --</option>
                            {(field.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            rows={3}
                            value={val}
                            required={field.isRequired}
                            placeholder={field.placeholder || 'اكتب هنا...'}
                            onChange={(e) => handleFormInputChange(block.id, field.id, e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition ${color.button}`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{block.data.submitButtonLabel || 'حفظ البيانات'}</span>
                  </button>

                  {formSubmitted[block.id] && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                      {block.data.successMessage || 'تم الحفظ بنجاح!'}
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* 5. Data Table */}
            {block.type === 'data_table' && block.data.columns && (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60">
                      {block.data.columns.map(col => (
                        <th key={col.key} className="py-2.5 px-3 text-xs font-black text-slate-300">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(block.data.rows || []).map((row, idx) => (
                      <tr key={row.id || idx} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition">
                        {block.data.columns!.map(col => (
                          <td key={col.key} className="py-2.5 px-3 text-xs text-slate-200">
                            {col.type === 'badge' ? (
                              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${color.badge}`}>
                                {row.values[col.key]}
                              </span>
                            ) : (
                              row.values[col.key]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Metric Progress */}
            {block.type === 'metric_progress' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">{block.data.metricLabel || 'مؤشر التقدم'}</span>
                  <span className="text-cyan-400">
                    {block.data.currentValue} / {block.data.targetValue} {block.data.unit || ''}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((block.data.currentValue || 0) / (block.data.targetValue || 100)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* 7. Collapsible Accordion */}
            {block.type === 'collapsible_accordion' && block.data.accordionItems && (
              <div className="space-y-2.5">
                {block.data.accordionItems.map(item => {
                  const isCollapsed = collapsedAccordions[`${block.id}-${item.id}`];
                  return (
                    <div
                      key={item.id}
                      className="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedAccordions(prev => ({
                            ...prev,
                            [`${block.id}-${item.id}`]: !prev[`${block.id}-${item.id}`]
                          }))
                        }
                        className="w-full p-3 text-right flex items-center justify-between gap-2 hover:bg-slate-900/60 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-100">{item.title}</span>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${color.badge}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                      </button>
                      {!isCollapsed && (
                        <div className="px-3 pb-3 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-900">
                          {item.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 8. Rich Content / Notes */}
            {block.type === 'rich_content' && (
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                {block.data.notes}
              </div>
            )}
            </div>
          </ScrollFadeIn>
        );
      })}

      {/* Admin Inline Add Block Trigger */}
      {isAdmin && (
        <button
          onClick={() => onOpenCustomizer()}
          className="w-full py-2.5 px-4 border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/30 text-cyan-300 hover:text-cyan-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition group shadow-sm"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition" />
          <span>إضافة خانة مخصصة أو قسم ديناميكي جديد في هذه الصفحة ({pageId})</span>
        </button>
      )}
    </div>
  );
};
