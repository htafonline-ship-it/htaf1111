import React, { useState, useEffect } from 'react';
import {
  DynamicPageBlock,
  DynamicBlockType,
  CustomFieldItem,
  DynamicTableColumn,
  DynamicTableRow,
  QuickActionButtonItem,
  AccordionItem,
  DynamicFormSubmission
} from '../../types/dynamicPages';
import { UserRole } from '../../types';
import {
  getAllDynamicBlocks,
  saveDynamicBlocks,
  upsertDynamicBlock,
  deleteDynamicBlock,
  toggleDynamicBlockActive,
  createQuickCustomBlock,
  getSubmissionsForBlock,
  resetDynamicBlocksToDefault
} from '../../lib/dynamicPagesService';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Layers,
  Table as TableIcon,
  FileText,
  AlertCircle,
  Activity,
  Award,
  Clock,
  ArrowRight,
  Download,
  Upload,
  RefreshCw,
  FolderDown,
  Palette,
  Users,
  Settings,
  HelpCircle,
  ListOrdered
} from 'lucide-react';

interface AdminPageCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageId: string;
  onBlocksUpdated: () => void;
}

export const AdminPageCustomizerModal: React.FC<AdminPageCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentPageId,
  onBlocksUpdated
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string>(currentPageId || 'dashboard');
  const [blocks, setBlocks] = useState<DynamicPageBlock[]>([]);
  const [editingBlock, setEditingBlock] = useState<DynamicPageBlock | null>(null);
  const [activeTab, setActiveTab] = useState<'blocks' | 'editor' | 'submissions' | 'presets'>('blocks');
  const [submissions, setSubmissions] = useState<DynamicFormSubmission[]>([]);
  const [selectedBlockForSubmissions, setSelectedBlockForSubmissions] = useState<string | null>(null);

  // Available platform pages for admin selection
  const pageOptions = [
    { id: 'dashboard', label: 'لوحة المتابعة الرئيسية' },
    { id: 'curriculum', label: 'مكتبة المناهج والكتب الوزارية' },
    { id: 'smart-teacher', label: 'المعلم الذكي التفاعلي' },
    { id: 'solver', label: 'حلال المسائل الذكي بالـ OCR' },
    { id: 'messaging', label: 'المحادثات والتواصل المدرسي' },
    { id: 'school-mgmt', label: 'إدارة المدرسة والإحصائيات' },
    { id: 'counseling', label: 'الإرشاد الطلابي والسرية' },
    { id: 'kharj-schools', label: 'دليل مدارس الخرج والدعوات' },
    { id: 'profile', label: 'الملف الشخصي والحساب' },
    { id: 'all', label: 'جميع الصفحات (عالمي)' }
  ];

  // Refresh blocks list from service
  const refreshBlocks = () => {
    const all = getAllDynamicBlocks();
    setBlocks(all);
    onBlocksUpdated();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedPageId(currentPageId || 'dashboard');
      refreshBlocks();
    }
  }, [isOpen, currentPageId]);

  if (!isOpen) return null;

  const pageBlocks = blocks
    .filter(b => b.pageId === selectedPageId || (selectedPageId !== 'all' && b.pageId === 'all'))
    .sort((a, b) => a.order - b.order);

  // Block creation helper
  const handleCreateNewBlock = (type: DynamicBlockType) => {
    const typeTitles: Record<DynamicBlockType, string> = {
      custom_fields_grid: 'خانات وبطاقات إحصائية مخصصة',
      custom_form: 'نموذج إدخال وخانات لجمع البيانات',
      announcement_banner: 'شريط إعلان وتنبيه عاجل',
      data_table: 'جدول بيانات مخصص',
      quick_actions: 'أزرار وإجراءات سريعة',
      metric_progress: 'مؤشر قياس ونسبة تقدم',
      collapsible_accordion: 'أسئلة وأقسام قابلة للطي',
      rich_content: 'بطاقة محتوى وملاحظات إدارية'
    };

    const newBlock = createQuickCustomBlock(selectedPageId, typeTitles[type] || 'قسم ديناميكي جديد', type, 'top');
    refreshBlocks();
    setEditingBlock(newBlock);
    setActiveTab('editor');
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    toggleDynamicBlockActive(id);
    refreshBlocks();
  };

  // Delete block
  const handleDeleteBlock = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم والخانات المخصصة فيه؟')) {
      deleteDynamicBlock(id);
      refreshBlocks();
      if (editingBlock?.id === id) {
        setEditingBlock(null);
        setActiveTab('blocks');
      }
    }
  };

  // Move block order up/down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pageBlocks.length) return;

    const currentB = pageBlocks[index];
    const targetB = pageBlocks[targetIdx];

    const tempOrder = currentB.order;
    currentB.order = targetB.order;
    targetB.order = tempOrder;

    const all = getAllDynamicBlocks();
    const updated = all.map(b => {
      if (b.id === currentB.id) return currentB;
      if (b.id === targetB.id) return targetB;
      return b;
    });

    saveDynamicBlocks(updated);
    refreshBlocks();
  };

  // Save changes to current editing block
  const handleSaveEditingBlock = () => {
    if (!editingBlock) return;
    upsertDynamicBlock(editingBlock);
    refreshBlocks();
    setActiveTab('blocks');
  };

  // Custom Field Add/Edit Helpers
  const handleAddFieldToEditingBlock = () => {
    if (!editingBlock) return;
    const newField: CustomFieldItem = {
      id: `fld-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label: 'خانة جديدة',
      value: '',
      type: 'text',
      isRequired: false,
      isEditableByUser: true
    };
    const fields = editingBlock.data.fields ? [...editingBlock.data.fields, newField] : [newField];
    setEditingBlock({
      ...editingBlock,
      data: {
        ...editingBlock.data,
        fields
      }
    });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<CustomFieldItem>) => {
    if (!editingBlock || !editingBlock.data.fields) return;
    const fields = editingBlock.data.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    setEditingBlock({
      ...editingBlock,
      data: {
        ...editingBlock.data,
        fields
      }
    });
  };

  const handleDeleteField = (fieldId: string) => {
    if (!editingBlock || !editingBlock.data.fields) return;
    const fields = editingBlock.data.fields.filter(f => f.id !== fieldId);
    setEditingBlock({
      ...editingBlock,
      data: {
        ...editingBlock.data,
        fields
      }
    });
  };

  // Data Table Column/Row Helpers
  const handleAddTableColumn = () => {
    if (!editingBlock) return;
    const colKey = `col_${Date.now()}`;
    const newCol: DynamicTableColumn = { key: colKey, label: 'عمود جديد', type: 'text' };
    const cols = editingBlock.data.columns ? [...editingBlock.data.columns, newCol] : [newCol];
    setEditingBlock({
      ...editingBlock,
      data: {
        ...editingBlock.data,
        columns: cols
      }
    });
  };

  const handleAddTableRow = () => {
    if (!editingBlock || !editingBlock.data.columns) return;
    const initialVals: Record<string, string> = {};
    editingBlock.data.columns.forEach(c => { initialVals[c.key] = 'قيمة'; });
    const newRow: DynamicTableRow = { id: `r-${Date.now()}`, values: initialVals };
    const rows = editingBlock.data.rows ? [...editingBlock.data.rows, newRow] : [newRow];
    setEditingBlock({
      ...editingBlock,
      data: {
        ...editingBlock.data,
        rows
      }
    });
  };

  // View Submissions for Block
  const handleViewSubmissions = (blockId: string) => {
    setSelectedBlockForSubmissions(blockId);
    const subs = getSubmissionsForBlock(blockId);
    setSubmissions(subs);
    setActiveTab('submissions');
  };

  // Export JSON configuration
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `htaf-dynamic-pages-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export submissions to CSV
  const handleExportSubmissionsCsv = () => {
    if (submissions.length === 0) return;
    const headers = ['تاريخ التقديم', 'المستخدم', 'الدور', 'البريد', ...Object.keys(submissions[0].data || {})];
    const rows = submissions.map(s => [
      new Date(s.submittedAt).toLocaleString('ar-SA'),
      s.submittedBy.name,
      s.submittedBy.role,
      s.submittedBy.email || '',
      ...Object.values(s.data || {}).map(v => `"${String(v).replace(/"/g, '""')}"`)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `submissions-${selectedBlockForSubmissions}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('هل تريد إعادة تعيين الأقسام الديناميكية إلى التشكيل المصنعي الافتراضي؟')) {
      resetDynamicBlocksToDefault();
      refreshBlocks();
      setEditingBlock(null);
      setActiveTab('blocks');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#0b1329] border border-blue-900/50 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-blue-900/40 bg-slate-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>محرر ديناميكية الصفحات وبناء الخانات للمسؤول</span>
                <span className="px-2 py-0.5 text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Admin Customizer v2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إضافة خانات، مؤشرات إحصائية، نماذج، جداول، وأقسام تفاعلية وتخصيصها لكل صفحة بالمنصة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page Selector & Sub-Navigation */}
        <div className="px-6 py-3 border-b border-blue-900/30 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Target Page Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">الصفحة المستهدفة:</span>
            <select
              value={selectedPageId}
              onChange={(e) => {
                setSelectedPageId(e.target.value);
                setEditingBlock(null);
                setActiveTab('blocks');
              }}
              className="bg-slate-900 border border-blue-800/60 rounded-xl px-3 py-1.5 text-xs font-black text-cyan-300 focus:outline-none focus:border-cyan-400 transition"
            >
              {pageOptions.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'blocks' ? 'bg-cyan-600 text-white' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الأقسام والخانات ({pageBlocks.length})</span>
            </button>

            {editingBlock && (
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'editor' ? 'bg-cyan-600 text-white' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>محرر: {editingBlock.title}</span>
              </button>
            )}

            {selectedBlockForSubmissions && (
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'submissions' ? 'bg-cyan-600 text-white' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>بيانات النماذج ({submissions.length})</span>
              </button>
            )}

            <button
              onClick={handleExportJson}
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="تصدير إعدادات الصفحات JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetToDefault}
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition"
              title="إعادة ضبط للمصنع"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: BLOCKS LIST & QUICK ADD BUTTONS */}
          {activeTab === 'blocks' && (
            <div className="space-y-6">
              {/* Quick Add Palette */}
              <div className="bg-slate-900/60 border border-blue-900/40 rounded-2xl p-4">
                <h3 className="text-xs font-black text-cyan-300 mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>إضافة قسم ديناميكي جديد لصفحة ({pageOptions.find(p => p.id === selectedPageId)?.label}):</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleCreateNewBlock('custom_fields_grid')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <Activity className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">بطاقات وخانات إحصائية</span>
                    <span className="text-[10px] text-slate-400 mt-1">مؤشرات KPI وخانات مخصصة</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('custom_form')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">نموذج إدخال واستبيان</span>
                    <span className="text-[10px] text-slate-400 mt-1">جمع بيانات وتخزين السجلات</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('announcement_banner')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <AlertCircle className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">شريط إعلان وتنبيه</span>
                    <span className="text-[10px] text-slate-400 mt-1">رسائل إدارية وتعليمات هامة</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('data_table')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <TableIcon className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">جدول بيانات مخصص</span>
                    <span className="text-[10px] text-slate-400 mt-1">قوائم وجداول ديناميكية</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('quick_actions')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">أزرار وإجراءات سريعة</span>
                    <span className="text-[10px] text-slate-400 mt-1">روابط واختصارات فورية</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('metric_progress')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <Award className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">شريط ومؤشر تقدم</span>
                    <span className="text-[10px] text-slate-400 mt-1">نسبة إنجاز الأهداف والمهام</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('collapsible_accordion')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">أقسام قابلة للطي (FAQ)</span>
                    <span className="text-[10px] text-slate-400 mt-1">أسئلة شائعة ودليل إرشادي</span>
                  </button>

                  <button
                    onClick={() => handleCreateNewBlock('rich_content')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-right transition flex flex-col justify-between group"
                  >
                    <FileText className="w-4 h-4 text-rose-400 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-slate-100">ملاحظات ونص مخصص</span>
                    <span className="text-[10px] text-slate-400 mt-1">توجيهات وفقرات نصية</span>
                  </button>
                </div>
              </div>

              {/* Existing Blocks List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-300 flex items-center justify-between">
                  <span>الأقسام الحالية في هذه الصفحة:</span>
                  <span className="text-slate-400">{pageBlocks.length} قسم نشط أو مخصص</span>
                </h3>

                {pageBlocks.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold">لا توجد أقسام ديناميكية مضافة لهذه الصفحة بعد</p>
                    <p className="text-[11px] text-slate-500 mt-1">اختر نوع القسم من الأعلى للبدء في بنائه وتخصيص خاناته</p>
                  </div>
                ) : (
                  pageBlocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${block.isActive ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-950/60 border-slate-900 opacity-60'}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Order controls */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === pageBlocks.length - 1}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-100">{block.title}</h4>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-cyan-300 rounded-md border border-slate-700">
                              {block.type}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-400 rounded-md">
                              موضع: {block.position === 'top' ? 'أعلى الصفحة' : 'أسفل الصفحة'}
                            </span>
                          </div>
                          {block.subtitle && (
                            <p className="text-xs text-slate-400 mt-0.5">{block.subtitle}</p>
                          )}
                          {block.type === 'custom_fields_grid' && block.data.fields && (
                            <p className="text-[11px] text-cyan-400/80 mt-1">
                              يحتوي على {block.data.fields.length} خانات مخصصة: {block.data.fields.map(f => f.label).join('، ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {block.type === 'custom_form' && (
                          <button
                            onClick={() => handleViewSubmissions(block.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>السجلات</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingBlock(block);
                            setActiveTab('editor');
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل الخانات</span>
                        </button>

                        <button
                          onClick={() => handleToggleActive(block.id)}
                          className={`p-2 rounded-xl border transition ${block.isActive ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-amber-950/40 text-amber-300 border-amber-500/30'}`}
                          title={block.isActive ? 'إخفاء القسم' : 'تفعيل القسم'}
                        >
                          {block.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition"
                          title="حذف هذا القسم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED BLOCK & FIELD EDITOR */}
          {activeTab === 'editor' && editingBlock && (
            <div className="space-y-6">
              {/* Basic Block Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-blue-900/40">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان القسم:</label>
                  <input
                    type="text"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الموضع في الصفحة:</label>
                  <select
                    value={editingBlock.position}
                    onChange={(e) => setEditingBlock({ ...editingBlock, position: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="top">أعلى الصفحة (Top)</option>
                    <option value="bottom">أسفل الصفحة (Bottom)</option>
                    <option value="banner">شريط إعلان علوي (Banner)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">الوصف الفرعي (اختياري):</label>
                  <input
                    type="text"
                    value={editingBlock.subtitle || ''}
                    onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                    placeholder="وصف توضيحي للقسم..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">النمط اللوني:</label>
                  <select
                    value={editingBlock.colorScheme}
                    onChange={(e) => setEditingBlock({ ...editingBlock, colorScheme: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="cyan">سماوي (Cyan)</option>
                    <option value="blue">أزرق (Blue)</option>
                    <option value="indigo">نيلي (Indigo)</option>
                    <option value="emerald">زمردي (Emerald)</option>
                    <option value="purple">بنفسجي (Purple)</option>
                    <option value="amber">كهرماني (Amber)</option>
                    <option value="rose">وردي (Rose)</option>
                  </select>
                </div>
              </div>

              {/* TYPE-SPECIFIC EDITOR */}

              {/* 1. CUSTOM FIELDS & STATS BUILDER */}
              {(editingBlock.type === 'custom_fields_grid' || editingBlock.type === 'custom_form') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>قائمة الخانات المخصصة ({editingBlock.data.fields?.length || 0}):</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddFieldToEditingBlock}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة خانة جديدة</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editingBlock.data.fields || []).map((field, fIdx) => (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                      >
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">اسم الخانة / التسمية:</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">نوع الخانة:</label>
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold"
                          >
                            <option value="text">نص (Text)</option>
                            <option value="number">رقم (Number)</option>
                            <option value="badge">شارة مميزة (Badge)</option>
                            <option value="date">تاريخ (Date)</option>
                            <option value="select">قائمة خيارات (Select)</option>
                            <option value="textarea">نص طويل (Textarea)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">القيمة الافتراضية / الحالية:</label>
                          <input
                            type="text"
                            value={String(field.value ?? '')}
                            onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 sm:pt-0">
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <input
                              type="checkbox"
                              checked={field.isRequired || false}
                              onChange={(e) => handleUpdateField(field.id, { isRequired: e.target.checked })}
                              className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                            />
                            <span>إلزامي</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition"
                            title="حذف هذه الخانة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. BANNER MESSAGE EDITOR */}
              {editingBlock.type === 'announcement_banner' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">نص الإعلان أو التنبيه:</label>
                  <textarea
                    rows={3}
                    value={editingBlock.data.bannerMessage || ''}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      data: { ...editingBlock.data, bannerMessage: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* 3. DATA TABLE BUILDER */}
              {editingBlock.type === 'data_table' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-cyan-300">أعمدة وصفوف الجدول:</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddTableColumn}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold"
                      >
                        + إضافة عمود
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTableRow}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
                      >
                        + إضافة صف
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950">
                          {(editingBlock.data.columns || []).map(col => (
                            <th key={col.key} className="p-2 text-xs text-slate-300 font-bold">
                              <input
                                type="text"
                                value={col.label}
                                onChange={(e) => {
                                  const cols = editingBlock.data.columns!.map(c => c.key === col.key ? { ...c, label: e.target.value } : c);
                                  setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, columns: cols } });
                                }}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-black w-full"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(editingBlock.data.rows || []).map((row, rIdx) => (
                          <tr key={row.id || rIdx} className="border-b border-slate-900">
                            {editingBlock.data.columns!.map(col => (
                              <td key={col.key} className="p-2">
                                <input
                                  type="text"
                                  value={row.values[col.key] ?? ''}
                                  onChange={(e) => {
                                    const rows = [...editingBlock.data.rows!];
                                    rows[rIdx].values[col.key] = e.target.value;
                                    setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, rows } });
                                  }}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 w-full"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. PROGRESS TRACKER BUILDER */}
              {editingBlock.type === 'metric_progress' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اسم المؤشر:</label>
                    <input
                      type="text"
                      value={editingBlock.data.metricLabel || ''}
                      onChange={(e) => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, metricLabel: e.target.value } })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">القيمة الحالية:</label>
                    <input
                      type="number"
                      value={editingBlock.data.currentValue || 0}
                      onChange={(e) => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, currentValue: Number(e.target.value) } })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">القيمة المستهدفة:</label>
                    <input
                      type="number"
                      value={editingBlock.data.targetValue || 100}
                      onChange={(e) => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, targetValue: Number(e.target.value) } })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons for Save */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('blocks')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إلغاء والعودة
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditingBlock}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg transition"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات على هذا القسم</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FORM SUBMISSIONS VIEWER */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>سجلات البيانات المستلمة عبر النموذج</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    إجمالي السجلات: {submissions.length} مدخلة من قبل المستخدمين
                  </p>
                </div>

                {submissions.length > 0 && (
                  <button
                    onClick={handleExportSubmissionsCsv}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير السجلات Excel / CSV</span>
                  </button>
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">لم يتم تسجيل أي بيانات عبر هذا النموذج بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80">
                        <th className="p-3 text-xs font-black text-slate-300">التاريخ</th>
                        <th className="p-3 text-xs font-black text-slate-300">المرسل</th>
                        <th className="p-3 text-xs font-black text-slate-300">الدور</th>
                        <th className="p-3 text-xs font-black text-slate-300">البيانات المدخلة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition">
                          <td className="p-3 text-xs text-slate-400">
                            {new Date(sub.submittedAt).toLocaleString('ar-SA')}
                          </td>
                          <td className="p-3 text-xs font-bold text-slate-200">
                            {sub.submittedBy.name}
                          </td>
                          <td className="p-3 text-xs text-cyan-300">
                            {sub.submittedBy.role}
                          </td>
                          <td className="p-3 text-xs text-slate-300">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(sub.data || {}).map(([k, v]) => (
                                <span key={k} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] border border-slate-700">
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
