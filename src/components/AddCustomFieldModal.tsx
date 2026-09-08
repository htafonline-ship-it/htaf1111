import React, { useState } from 'react';
import { CustomFieldDefinition, CustomFieldType, CustomFieldCategory } from '../types';
import { FIELD_TYPE_LABELS, CATEGORY_LABELS, DEFAULT_PRESET_FIELDS } from '../lib/dynamicProfileService';
import {
  Plus,
  X,
  Sparkles,
  Type,
  AlignLeft,
  Hash,
  ListFilter,
  Calendar,
  Link,
  Phone,
  Mail,
  Tags,
  ToggleLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';

interface AddCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  existingKeys: string[];
}

export const AddCustomFieldModal: React.FC<AddCustomFieldModalProps> = ({
  isOpen,
  onClose,
  onAddField,
  existingKeys
}) => {
  const [label, setLabel] = useState<string>('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [category, setCategory] = useState<CustomFieldCategory>('custom');
  const [placeholder, setPlaceholder] = useState<string>('');
  const [helperText, setHelperText] = useState<string>('');
  const [optionsText, setOptionsText] = useState<string>('');
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const typeIcons: Record<CustomFieldType, React.ReactNode> = {
    text: <Type className="w-4 h-4 text-cyan-400" />,
    textarea: <AlignLeft className="w-4 h-4 text-indigo-400" />,
    number: <Hash className="w-4 h-4 text-amber-400" />,
    select: <ListFilter className="w-4 h-4 text-emerald-400" />,
    date: <Calendar className="w-4 h-4 text-rose-400" />,
    url: <Link className="w-4 h-4 text-blue-400" />,
    phone: <Phone className="w-4 h-4 text-emerald-400" />,
    email: <Mail className="w-4 h-4 text-cyan-400" />,
    tags: <Tags className="w-4 h-4 text-purple-400" />,
    boolean: <ToggleLeft className="w-4 h-4 text-amber-400" />
  };

  const handleApplyPreset = (preset: CustomFieldDefinition) => {
    setLabel(preset.label);
    setFieldType(preset.type);
    setCategory(preset.category);
    setPlaceholder(preset.placeholder || '');
    setHelperText(preset.helperText || '');
    if (preset.options && preset.options.length > 0) {
      setOptionsText(preset.options.join('\n'));
    } else {
      setOptionsText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('يرجى كتابة اسم أو عنوان الخانة الجديدة.');
      return;
    }

    // Generate a unique key
    const cleanKey = label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '') || `field_${Date.now()}`;

    let parsedOptions: string[] | undefined = undefined;
    if (fieldType === 'select' || fieldType === 'tags') {
      parsedOptions = optionsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    }

    onAddField({
      key: cleanKey,
      label: label.trim(),
      type: fieldType,
      category,
      placeholder: placeholder.trim() || undefined,
      helperText: helperText.trim() || undefined,
      options: parsedOptions,
      required: isRequired
    });

    // Reset and close
    setLabel('');
    setFieldType('text');
    setCategory('custom');
    setPlaceholder('');
    setHelperText('');
    setOptionsText('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn dir-rtl">
      <div className="bg-[#09132c] border border-blue-900/60 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-blue-900/40 bg-gradient-to-r from-[#0d1c44] to-[#0a1533] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>إضافة خانة مخصصة جديدة للملف الشخصي</span>
                <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                  Dynamic Field
                </span>
              </h3>
              <p className="text-xs text-blue-200/70">
                توسيع بيانات ملفك بإضافة حقول مخصصة تفاعلية تدعم شتى أنواع البيانات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Preset Templates */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>قوالب جاهزة سريعة للإضافة بنقرة واحدة:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PRESET_FIELDS.slice(0, 5).map((preset) => {
                const isAlready = existingKeys.includes(preset.key);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] px-3 py-1.5 rounded-xl border border-blue-900/60 bg-[#0c183a] hover:bg-blue-900/40 text-blue-200 hover:text-white font-bold transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-cyan-400" />
                    <span>{preset.label.split('/')[0]}</span>
                    {isAlready && (
                      <span className="text-[9px] text-emerald-400 font-normal">(موجود)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="add-field-form">
            {/* Field Label */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                اسم / عنوان الخانة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: المعدل التراكمي، اللغات المتقنة، رابط الشهادة"
                className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
              />
            </div>

            {/* Field Type Selection Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                نوع البيانات في هذه الخانة <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(FIELD_TYPE_LABELS) as CustomFieldType[]).map((typeKey) => {
                  const isSelected = fieldType === typeKey;
                  const info = FIELD_TYPE_LABELS[typeKey];
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setFieldType(typeKey)}
                      className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between space-y-1 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400 shadow-md shadow-cyan-500/10'
                          : 'border-blue-900/40 bg-[#0b1633] hover:border-blue-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {typeIcons[typeKey]}
                          <span className={`text-xs font-black ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                            {info.name}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options Input for Select or Tags */}
            {(fieldType === 'select' || fieldType === 'tags') && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-blue-950/30 border border-blue-900/50">
                <label className="block text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span>الخيارات المتاحة (اكتب كل خيار في سطر منفصل)</span>
                  <span className="text-[10px] text-slate-400">سطر جديد = خيار جديد</span>
                </label>
                <textarea
                  rows={3}
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder={'خيار 1\nخيار 2\nخيار 3'}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-blue-900/60 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
            )}

            {/* Category & Placeholder Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">تصنيف الخانة</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CustomFieldCategory)}
                  className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                >
                  {(Object.keys(CATEGORY_LABELS) as CustomFieldCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placeholder text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">النص التلميحي (Placeholder)</label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="مثال: أدخل القيمة هنا..."
                  className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Helper Text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">ملاحظة توضيحية أسفل الحقل (اختياري)</label>
              <input
                type="text"
                value={helperText}
                onChange={(e) => setHelperText(e.target.value)}
                placeholder="تظهر بخط صغير لمساعدة المستخدم أثناء التعبئة"
                className="w-full text-xs py-2.5 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-[#070e22] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة الخانة للملف الشخصي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
