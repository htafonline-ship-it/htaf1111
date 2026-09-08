import React, { useState } from 'react';
import { CustomFieldDefinition } from '../types';
import {
  Type,
  AlignLeft,
  Hash,
  ListFilter,
  Calendar,
  Link as LinkIcon,
  Phone,
  Mail,
  Tags,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Trash2,
  Plus,
  X,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  Target,
  MapPin,
  HelpCircle
} from 'lucide-react';

interface DynamicFieldInputProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (val: any) => void;
  onDeleteField?: (fieldId: string) => void;
  isEditableLayout?: boolean;
}

export const DynamicFieldInput: React.FC<DynamicFieldInputProps> = ({
  field,
  value,
  onChange,
  onDeleteField,
  isEditableLayout = true
}) => {
  const [tagInput, setTagInput] = useState<string>('');

  const getFieldIcon = () => {
    switch (field.iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Award':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'Target':
        return <Target className="w-4 h-4 text-rose-400" />;
      case 'MapPin':
        return <MapPin className="w-4 h-4 text-emerald-400" />;
      default:
        switch (field.type) {
          case 'textarea':
            return <AlignLeft className="w-4 h-4 text-indigo-400" />;
          case 'number':
            return <Hash className="w-4 h-4 text-amber-400" />;
          case 'select':
            return <ListFilter className="w-4 h-4 text-emerald-400" />;
          case 'date':
            return <Calendar className="w-4 h-4 text-rose-400" />;
          case 'url':
            return <LinkIcon className="w-4 h-4 text-blue-400" />;
          case 'phone':
            return <Phone className="w-4 h-4 text-emerald-400" />;
          case 'email':
            return <Mail className="w-4 h-4 text-cyan-400" />;
          case 'tags':
            return <Tags className="w-4 h-4 text-purple-400" />;
          case 'boolean':
            return <ToggleLeft className="w-4 h-4 text-amber-400" />;
          default:
            return <Type className="w-4 h-4 text-cyan-400" />;
        }
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean) return;
    const currentTags: string[] = Array.isArray(value) ? value : [];
    if (!currentTags.includes(clean)) {
      onChange([...currentTags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const currentTags: string[] = Array.isArray(value) ? value : [];
    onChange(currentTags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="group relative bg-[#0a1430] hover:bg-[#0c183a] border border-blue-900/40 hover:border-blue-700/60 p-4 rounded-2xl transition space-y-2">
      {/* Field Label Header & Action Buttons */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-black text-slate-200">
          {getFieldIcon()}
          <span>{field.label}</span>
          {field.required && <span className="text-rose-400">*</span>}
        </label>

        {isEditableLayout && onDeleteField && (
          <button
            type="button"
            onClick={() => onDeleteField(field.id)}
            title="حذف هذه الخانة"
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Input Control by Type */}
      <div className="relative">
        {field.type === 'text' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'أدخل النص هنا...'}
            className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            rows={3}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'أدخل الوصف أو التفاصيل...'}
            className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-medium resize-none leading-relaxed"
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            step="any"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={field.placeholder || '0.00'}
            className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold font-mono dir-ltr text-right"
          />
        )}

        {field.type === 'select' && (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
          >
            <option value="">{field.placeholder || '— اختر من القائمة —'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
          />
        )}

        {field.type === 'phone' && (
          <div className="relative">
            <input
              type="tel"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || '05xxxxxxxx'}
              className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono dir-ltr text-right"
            />
            <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>
        )}

        {field.type === 'email' && (
          <div className="relative">
            <input
              type="email"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'user@example.com'}
              className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono dir-ltr text-right"
            />
            <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>
        )}

        {field.type === 'url' && (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'https://...'}
              className="flex-1 text-xs py-2.5 px-3.5 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono dir-ltr text-right"
            />
            {value && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 rounded-xl text-cyan-300 hover:text-white transition shrink-0"
                title="فتح الرابط"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {field.type === 'boolean' && (
          <div className="flex items-center justify-between py-1 px-2">
            <span className="text-xs text-slate-300 font-medium">
              {value ? 'مفعل / نعم ✓' : 'معطل / لا ✗'}
            </span>
            <button
              type="button"
              onClick={() => onChange(!value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
        )}

        {field.type === 'tags' && (
          <div className="space-y-2">
            {/* Added Tags Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#070e22] rounded-xl border border-blue-900/50">
              {Array.isArray(value) && value.length > 0 ? (
                value.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-950 to-purple-950 text-cyan-300 border border-cyan-800/60 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-400 hover:text-rose-400 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500 italic p-1">لا توجد وسوم مضافة بعد</span>
              )}
            </div>

            {/* Input to add tag */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="اكتب عنصراً واضغط Enter أو زر الإضافة..."
                className="flex-1 text-xs py-2 px-3 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="bg-blue-600/40 hover:bg-blue-600 text-cyan-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-blue-500/40 transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>

            {/* Quick suggested options chips */}
            {field.options && field.options.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400">مقترحات:</span>
                {field.options.map((opt) => {
                  const isAdded = Array.isArray(value) && value.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddTag(opt)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                        isAdded
                          ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-blue-950/60 text-blue-300 border-blue-800/60 hover:bg-blue-900 hover:text-white'
                      }`}
                    >
                      + {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      {field.helperText && (
        <p className="text-[10px] text-blue-300/50 leading-normal">{field.helperText}</p>
      )}
    </div>
  );
};
