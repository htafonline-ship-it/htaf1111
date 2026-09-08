import React, { useState, useEffect, useMemo } from 'react';
import { AuthUser, SchoolTenant, UserRole, CustomFieldDefinition, CustomFieldCategory } from '../types';
import { fetchUserProfile, updateUserProfile, DbProfile } from '../lib/supabase';
import {
  is2FAEnabledForUser,
  setUser2FAPreference,
  isAdminRole,
  getSecurityLogs,
  SecurityEventLog,
  initializeTOTPSetup,
  completeTOTPEnrollment,
  getUserMFARecord,
  getUserMFAStatus,
  TOTPSetupData,
  UserMFARecord
} from '../lib/twoFactorService';
import {
  getUserCustomFields,
  saveUserCustomFields,
  getUserCustomValues,
  saveUserCustomValues,
  addCustomField,
  removeCustomField,
  PRESET_AVATARS,
  CATEGORY_LABELS,
  DEFAULT_PRESET_FIELDS
} from '../lib/dynamicProfileService';
import { AddCustomFieldModal } from './AddCustomFieldModal';
import { DynamicFieldInput } from './DynamicFieldInput';
import {
  User,
  Mail,
  School,
  Shield,
  ShieldCheck,
  Phone,
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  BadgeCheck,
  Building2,
  GraduationCap,
  Sparkles,
  KeyRound,
  FileText,
  Lock,
  History,
  Plus,
  Layers,
  Image as ImageIcon,
  IdCard,
  Printer,
  Copy,
  ExternalLink,
  Trash2,
  RefreshCw,
  QrCode,
  Zap,
  Info,
  Smartphone,
  Key,
  Download,
  Check,
  X,
  ArrowRight,
  MailCheck,
  Send
} from 'lucide-react';
import { sendEmailSecretCode, verifyEmailSecretCode } from '../lib/firebase';

interface UserProfileViewProps {
  currentUser: AuthUser | null;
  currentSchool: SchoolTenant | null;
  onProfileUpdated?: (updatedUser: AuthUser) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  currentSchool,
  onProfileUpdated,
  onLogout,
  onOpenLoginModal
}) => {
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'dynamic' | 'academic' | 'security' | 'card'>('basic');

  // 2FA Management State
  const isEnforcedAdmin = isAdminRole(currentUser?.role);
  const [mfaRecord, setMfaRecord] = useState<UserMFARecord | null>(() => {
    if (!currentUser) return null;
    return getUserMFARecord(currentUser);
  });
  const [is2FAActive, setIs2FAActive] = useState<boolean>(() => {
    if (!currentUser) return false;
    return is2FAEnabledForUser(currentUser);
  });
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>(() => getSecurityLogs());
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);

  // 2FA Setup Wizard State
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'recovery_codes'>('qr');
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null);
  const [setupOtpInput, setSetupOtpInput] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isVerifyingSetup, setIsVerifyingSetup] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecoveryAll, setCopiedRecoveryAll] = useState(false);
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[]>([]);

  // Email Authentication Testing State
  const [testEmailOtpStatus, setTestEmailOtpStatus] = useState<'idle' | 'sending' | 'sent' | 'verified' | 'error'>('idle');
  const [testEmailOtpCode, setTestEmailOtpCode] = useState<string>('');
  const [testEmailInputCode, setTestEmailInputCode] = useState<string>('');
  const [testEmailOtpMsg, setTestEmailOtpMsg] = useState<string>('');
  const [testEmailCountdown, setTestEmailCountdown] = useState<number>(0);

  useEffect(() => {
    if (testEmailCountdown <= 0) return;
    const timer = setInterval(() => setTestEmailCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [testEmailCountdown]);

  const handleSendTestEmailOtp = async () => {
    const targetEmail = currentUser?.email || (currentUser?.username?.includes('@') ? currentUser.username : '');
    if (!targetEmail) {
      setTestEmailOtpStatus('error');
      setTestEmailOtpMsg('لا يوجد بريد إلكتروني مسجل في هذا الحساب.');
      return;
    }

    setTestEmailOtpStatus('sending');
    setTestEmailOtpMsg('');
    try {
      const res = await sendEmailSecretCode(targetEmail, 'test');
      setTestEmailOtpCode(res.code);
      setTestEmailOtpStatus('sent');
      setTestEmailOtpMsg(res.message || 'تم إرسال رمز المصادقة بنجاح.');
      setTestEmailCountdown(60);
    } catch (err: any) {
      setTestEmailOtpStatus('error');
      setTestEmailOtpMsg(err?.message || 'تعذر إرسال رمز المصادقة.');
    }
  };

  const handleVerifyTestEmailOtp = async () => {
    const targetEmail = currentUser?.email || (currentUser?.username?.includes('@') ? currentUser.username : '');
    if (!targetEmail || !testEmailInputCode.trim()) return;

    try {
      await verifyEmailSecretCode(targetEmail, testEmailInputCode.trim());
      setTestEmailOtpStatus('verified');
      setTestEmailOtpMsg('تمت مصادقة الرمز بنجاح! خدمة إرسال المصادقة بالبريد الإلكتروني تعمل بكفاءة تامة.');
    } catch (err: any) {
      setTestEmailOtpStatus('error');
      setTestEmailOtpMsg(err?.message || 'رمز المصادقة غير صحيح أو انتهت صلاحيته.');
    }
  };

  const handleStart2FASetup = async () => {
    if (!currentUser) return;
    setSetupError(null);
    setSetupOtpInput('');
    setSetupStep('qr');
    const data = await initializeTOTPSetup(currentUser);
    setSetupData(data);
    setShow2FASetupModal(true);
  };

  const handleVerifyAndCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !setupData) return;
    if (setupOtpInput.trim().length !== 6) {
      setSetupError('يرجى إدخال رمز التحقق المكون من 6 أرقام من تطبيق المصادقة.');
      return;
    }

    setIsVerifyingSetup(true);
    setSetupError(null);

    const result = await completeTOTPEnrollment(
      currentUser,
      setupData.secret,
      setupOtpInput.trim(),
      setupData.recoveryCodes
    );

    setIsVerifyingSetup(false);

    if (result.success) {
      setGeneratedRecoveryCodes(setupData.recoveryCodes);
      setSetupStep('recovery_codes');
      setIs2FAActive(true);
      setMfaRecord(getUserMFARecord(currentUser));
      setSecurityLogs(getSecurityLogs());
      setSuccessMsg('تم التحقق بنجاح! تم تفعيل المصادقة الثنائية.');
    } else {
      setSetupError(result.error || 'رمز التحقق غير مطابق.');
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (generatedRecoveryCodes.length === 0) return;
    const text = `منصة حقائق العلوم - رموز استرداد المصادقة الثنائية (2FA)\nالحساب: ${currentUser?.email || currentUser?.username}\nالتاريخ: ${new Date().toLocaleString('ar-SA')}\n\nتنبيه: كل رمز صالح للاستخدام مرة واحدة فقط للطوارئ.\n\n` +
      generatedRecoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `htaf-2fa-recovery-codes-${currentUser?.username || 'user'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintRecoveryCodes = () => {
    window.print();
  };

  const handleCopyAllRecoveryCodes = () => {
    if (generatedRecoveryCodes.length === 0) return;
    navigator.clipboard.writeText(generatedRecoveryCodes.join('\n'));
    setCopiedRecoveryAll(true);
    setTimeout(() => setCopiedRecoveryAll(false), 2500);
  };

  const handleDisable2FA = () => {
    if (!currentUser) return;
    if (isEnforcedAdmin) {
      setErrorMsg('المصادقة الثنائية إلزامية لحسابات الإدارة ولا يمكن تعطيلها.');
      return;
    }
    setUser2FAPreference(currentUser.id || currentUser.email || '', false);
    setIs2FAActive(false);
    setMfaRecord(getUserMFARecord(currentUser));
    setSecurityLogs(getSecurityLogs());
    setSuccessMsg('تم تعطيل المصادقة الثنائية لحسابك.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Core Form Fields
  const [fullName, setFullName] = useState<string>(currentUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser?.phoneNumber || '');
  const [bio, setBio] = useState<string>(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser?.avatarUrl || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Extended Profile Fields
  const [nationalId, setNationalId] = useState<string>(currentUser?.nationalId || '');
  const [specialization, setSpecialization] = useState<string>(currentUser?.specialization || '');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [smsNotifications, setSmsNotifications] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  // Dynamic Custom Fields & Values State
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Initialize data for currentUser
  useEffect(() => {
    if (currentUser?.id) {
      const userKey = currentUser.id;
      const loadedFields = getUserCustomFields(userKey, currentUser.role);
      const loadedValues = getUserCustomValues(userKey);
      setCustomFields(loadedFields);
      setCustomValues(loadedValues);
      setFullName(currentUser.fullName || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setNationalId(currentUser.nationalId || loadedValues['national_id'] || '');
      setSpecialization(currentUser.specialization || loadedValues['academic_specialization'] || '');
      setEmergencyContact(loadedValues['emergency_contact'] || '');
      setSmsNotifications(loadedValues['sms_notifications'] !== false);
      setEmailNotifications(loadedValues['email_notifications'] !== false);
    }
  }, [currentUser?.id]);

  const loadProfile = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchUserProfile(currentUser.id);
      if (data) {
        setProfile(data);
        setFullName(data.full_name || currentUser.fullName || '');
        setAvatarUrl(data.avatar_url || currentUser.avatarUrl || '');
      }
    } catch (err: any) {
      console.warn('Error loading user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  const handleToggle2FA = () => {
    if (!currentUser) return;
    if (isEnforcedAdmin) {
      setErrorMsg('المصادقة الثنائية (2FA) مفروضة بشكل إجباري لجميع الحسابات الإدارية لضمان أمان النظام.');
      return;
    }
    const nextState = !is2FAActive;
    setIs2FAActive(nextState);
    const userKey = currentUser.id || currentUser.email || currentUser.username || '';
    setUser2FAPreference(userKey, nextState);
    setSuccessMsg(nextState ? 'تم تفعيل المصادقة الثنائية (2FA) بنجاح لحسابك.' : 'تم تعطيل المصادقة الثنائية.');
    setSecurityLogs(getSecurityLogs());
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Custom Field Management
  const handleAddNewCustomField = (newField: Omit<CustomFieldDefinition, 'id'>) => {
    if (!currentUser?.id) return;
    const created = addCustomField(currentUser.id, newField);
    setCustomFields(prev => [...prev, created]);
    setSuccessMsg(`تمت إضافة خانة "${newField.label}" إلى ملفك بنجاح.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteCustomField = (fieldId: string) => {
    if (!currentUser?.id) return;
    const target = customFields.find(f => f.id === fieldId);
    const updated = removeCustomField(currentUser.id, fieldId);
    setCustomFields(updated);

    // Clean value
    if (target?.key) {
      const newVals = { ...customValues };
      delete newVals[target.key];
      setCustomValues(newVals);
      saveUserCustomValues(currentUser.id, newVals);
    }

    setSuccessMsg('تم حذف الخانة بنجاح.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleCustomValueChange = (key: string, val: any) => {
    const nextValues = {
      ...customValues,
      [key]: val
    };
    setCustomValues(nextValues);
    if (currentUser?.id) {
      saveUserCustomValues(currentUser.id, nextValues);
    }
  };

  const handleAddPresetDirectly = (preset: CustomFieldDefinition) => {
    if (!currentUser?.id) return;
    const exists = customFields.some(f => f.key === preset.key);
    if (exists) {
      setErrorMsg(`الخانة "${preset.label}" موجودة بالفعل في ملفك الشخصي.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    const created = addCustomField(currentUser.id, preset);
    setCustomFields(prev => [...prev, created]);
    setSuccessMsg(`تمت إضافة خانة "${preset.label}" بنجاح!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Save All Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال الاسم الكامل.');
      return;
    }

    if (!currentUser?.id) {
      setErrorMsg('لا يوجد حساب مستخدم نشط.');
      return;
    }

    // Password validation if entered
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setErrorMsg('يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('كلمة المرور وتأكيدها غير متطابقين.');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Prepare merged custom values
      const mergedCustomVals = {
        ...customValues,
        national_id: nationalId.trim(),
        academic_specialization: specialization.trim(),
        emergency_contact: emergencyContact.trim(),
        sms_notifications: smsNotifications,
        email_notifications: emailNotifications
      };
      setCustomValues(mergedCustomVals);

      // Save dynamic values & fields to local persistence
      saveUserCustomFields(currentUser.id, customFields);
      saveUserCustomValues(currentUser.id, mergedCustomVals);

      // 2. Save core profile to backend/Supabase if available
      const updatePayload: Partial<DbProfile> = {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        updated_at: new Date().toISOString()
      };

      try {
        const updated = await updateUserProfile(currentUser.id, updatePayload);
        if (updated) {
          setProfile(updated);
        }
      } catch (dbErr) {
        console.warn('Supabase profile update warning:', dbErr);
      }

      // 3. Update password in localStorage if provided
      if (newPassword.trim()) {
        try {
          const storedUsersRaw = localStorage.getItem('htaf_users');
          if (storedUsersRaw) {
            const usersList = JSON.parse(storedUsersRaw);
            const userIdx = usersList.findIndex((u: any) => u.id === currentUser.id || u.username === currentUser.username);
            if (userIdx >= 0) {
              usersList[userIdx].password = newPassword.trim();
              localStorage.setItem('htaf_users', JSON.stringify(usersList));
            }
          }
        } catch (pwErr) {
          console.warn('Local password update error:', pwErr);
        }
      }

      // 4. Update in parent state and localStorage
      const updatedAuthUser: AuthUser = {
        ...currentUser,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        nationalId: nationalId.trim() || undefined,
        specialization: specialization.trim() || undefined,
        bio: bio.trim() || undefined,
        customFields: customFields,
        customValues: mergedCustomVals
      };

      try {
        localStorage.setItem('htaf_current_user', JSON.stringify(updatedAuthUser));
      } catch (lsErr) {
        console.warn('Local storage error:', lsErr);
      }

      if (onProfileUpdated) {
        onProfileUpdated(updatedAuthUser);
      }

      const pwNotice = newPassword.trim() ? ' وتحديث كلمة المرور' : '';
      setSuccessMsg(`تم حفظ وتحديث بيانات الملف الشخصي${pwNotice} بنجاح!`);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setErrorMsg(err.message || 'فشل تحديث البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const roleDisplayNames: Record<string, { title: string; badgeColor: string }> = {
    student: { title: 'طالب معتمد', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    teacher: { title: 'معلم معتمد', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    parent: { title: 'ولي أمر', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    counselor: { title: 'موجه طلابي / إرشادي', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    principal: { title: 'مدير المدرسة', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    vice_principal: { title: 'وكيل المدرسة', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    school_admin: { title: 'مسؤول إدارة المدرسة', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    super_admin: { title: 'مدير المنصة الرئيسي (Super Admin)', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    platform_admin: { title: 'مدير المنصة (Platform Admin)', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
  };

  const currentRoleInfo = roleDisplayNames[currentUser?.role || 'student'] || {
    title: currentUser?.role || 'مستخدم',
    badgeColor: 'bg-slate-700 text-slate-200 border-slate-600'
  };

  // Filtered Custom Fields by category
  const filteredCustomFields = useMemo(() => {
    if (selectedCategoryFilter === 'all') return customFields;
    return customFields.filter(f => f.category === selectedCategoryFilter);
  }, [customFields, selectedCategoryFilter]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 dir-rtl">
        <div className="p-8 rounded-3xl bg-[#080f24] border border-blue-900/40 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-400/30">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">الملف الشخصي والحساب</h2>
          <p className="text-xs text-blue-200/70 leading-relaxed max-w-md mx-auto">
            يرجى تسجيل الدخول بحساب Google أو بيانات مدرستك لتتمكن من استعراض وتعديل ملفك الشخصي وإضافة الخانات الديناميكية وسجلاتك المعتمدة.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenLoginModal}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/25 transition"
            >
              تسجيل الدخول الآن
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16 dir-rtl">
      {/* Profile Header Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0b1b3d] via-[#091530] to-[#120e2e] border border-blue-900/50 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
            {/* Avatar Profile Box with Edit trigger */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-1 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full rounded-[22px] bg-[#080e22] overflow-hidden flex items-center justify-center text-3xl font-black text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    fullName.charAt(0) || 'ح'
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-2 -left-2 bg-blue-600 hover:bg-cyan-500 text-white p-2 rounded-xl shadow-lg border-2 border-[#080e22] transition"
                title="تغيير الصورة الرمزية"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-[#080e22]" title="حساب مصادق وموثق">
                <BadgeCheck className="w-4 h-4" />
              </div>
            </div>

            {/* User Info Details */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white">{fullName || 'المستخدم'}</h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${currentRoleInfo.badgeColor}`}>
                  {currentRoleInfo.title}
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  جلسة نظام نشطة
                </span>
              </div>

              <p className="text-xs text-blue-200/80 font-mono flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentUser.email || `${currentUser.username}@htaf.online`}</span>
              </p>

              {currentSchool && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-cyan-300 font-semibold pt-0.5">
                  <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{currentSchool.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-normal">{currentSchool.location}</span>
                </div>
              )}

              {/* Dynamic stats snippet */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="text-[11px] bg-blue-950/60 text-blue-300 px-3 py-1 rounded-xl border border-blue-800/50 font-bold">
                  {customFields.length} خانة مخصصة مفعلة
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[11px] bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-700 font-mono flex items-center gap-1 transition"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>{copiedId ? 'تم النسخ!' : 'نسخ المعرف'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddFieldModalOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خانة مخصصة</span>
            </button>
          </div>
        </div>

        {/* Predefined Avatar Picker Drawer */}
        {showAvatarPicker && (
          <div className="mt-6 pt-5 border-t border-blue-900/40 space-y-3 bg-[#070e22]/90 p-4 rounded-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>اختر صورة رمزية جاهزة أو أدخل رابط صورة مخصص:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                إغلاق
              </button>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(url);
                    setShowAvatarPicker(false);
                  }}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition hover:scale-110 ${
                    avatarUrl === url ? 'border-cyan-400 ring-2 ring-cyan-400' : 'border-blue-900/60'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="أو الصق رابط صورة مخصص: https://example.com/photo.jpg"
                className="flex-1 text-xs py-2 px-3 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none font-mono dir-ltr text-right"
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
              >
                تطبيق
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-reverse space-x-2 border-b border-blue-900/40 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('basic')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'basic'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>البيانات الأساسية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('dynamic')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'dynamic'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الخانات الديناميكية والمخصصة</span>
          <span className="bg-cyan-950 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-cyan-800/60">
            {customFields.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('academic')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'academic'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>السجل الأكاديمي والانتساب</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('card')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'card'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>البطاقة التعريفية الرقمية (ID Card)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'security'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>الأمان والمصادقة</span>
        </button>
      </div>

      {/* Messages Feedback */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BASIC PROFILE INFO */}
      {/* ========================================================================= */}
      {activeSubTab === 'basic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-2 bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">البيانات الشخصية والأساسية</h3>
                  <p className="text-[11px] text-blue-300/60 font-medium">البيانات التعريفية المعتمدة للمستخدم في المنصة</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  الاسم الكامل (كما يظهر في الشهادات واللوائح) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                    placeholder="الاسم الثلاثي أو الرباعي"
                  />
                  <User className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Bio / Summary */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">النبذة التعريفية (Bio)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="اكتب نبذة مختصرة عن اهتماماتك العلمية أو مسؤولياتك التعليمية..."
                  className="w-full text-xs py-2.5 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 resize-none leading-relaxed"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني الموثق</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || `${currentUser.username}@htaf.online`}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/30 bg-[#070d1e] text-slate-400 outline-none font-mono cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
                <p className="text-[10px] text-blue-300/50">البريد الإلكتروني مرتبط بالحساب ولا يمكن تعديله يدوياً.</p>
              </div>

              {/* National ID & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    رقم الهوية الوطنية / الإقامة
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="1xxxxxxxxx أو 2xxxxxxxxx"
                      className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono dir-ltr text-right"
                    />
                    <IdCard className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    التخصص / المرحلة أو الصف الدراسي
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="مثال: الصف الثالث الثانوي / معلم لغة عربية"
                      className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                    />
                    <GraduationCap className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Phone & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">رقم الجوال الأساسي للتواصل</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono dir-ltr text-right"
                    />
                    <Phone className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">رقم التواصل الاحتياطي للطوارئ</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="05xxxxxxxx (ولي الأمر / هاتف بديل)"
                      className="w-full text-xs py-3 px-4 rounded-xl border border-blue-900/50 bg-[#0b1633] text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono dir-ltr text-right"
                    />
                    <Smartphone className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Section: Change Password */}
              <div className="bg-[#0b1739] border border-blue-900/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white">تغيير كلمة المرور (اختياري)</h4>
                </div>
                <p className="text-[11px] text-slate-300">اترك الحقول فارغة إذا كنت لا ترغب في تعديل كلمة المرور الحالية.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 أحرف أو أرقام على الأقل"
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور للتأكيد"
                      className="w-full text-xs py-2.5 px-3 rounded-xl border border-blue-900/50 bg-[#070e22] text-white outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-[#0b1739] border border-blue-900/60 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white">تفضيلات الإشعارات والتنبيهات المدرسية</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-blue-800"
                    />
                    <span>استقبال رسائل SMS عند الغياب والتأخر والتعاميم</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-blue-800"
                    />
                    <span>استقبال تقارير الأداء الأسبوعية عبر البريد الإلكتروني</span>
                  </label>
                </div>
              </div>

              {/* Role & School (Readonly Info) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#0b1633] rounded-xl border border-blue-900/40">
                  <p className="text-[10px] text-blue-300/70 font-bold">الدور والصلاحيات</p>
                  <p className="text-xs font-black text-white mt-1">{currentRoleInfo.title}</p>
                </div>

                <div className="p-3 bg-[#0b1633] rounded-xl border border-blue-900/40">
                  <p className="text-[10px] text-blue-300/70 font-bold">المدرسة المرتبطة</p>
                  <p className="text-xs font-black text-white mt-1 truncate">{currentSchool?.name || 'غير مرتبط بمدرسة'}</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs py-3 px-6 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري حفظ التعديلات...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>حفظ كافة التعديلات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-blue-900/40 pb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black text-white">مميزات الملف الشخصي الديناميكي</h4>
              </div>
              <p className="text-xs text-blue-200/70 leading-relaxed">
                يمكنك تخصيص ملفك الشخصي بالكامل بإضافة خانات مخصصة لمعدلك الأكاديمي، مهاراتك، روابط ملف الإنجاز، وأرقام التواصل الإضافية.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('dynamic')}
                className="w-full text-center bg-blue-950/80 hover:bg-blue-900/60 border border-blue-800 text-cyan-300 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>إدارة وتعبئة الخانات المخصصة ({customFields.length})</span>
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#0a1533] to-[#070e22] rounded-3xl border border-blue-900/40 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black text-white">البطاقة الرقمية للطباعة</h4>
              </div>
              <p className="text-[11px] text-blue-200/70 leading-relaxed">
                استعرض بطاقتك التعريفية الرقمية وطباعتها أو تصديرها كوثيقة معتمدة تحتوي على رمز التحقق وبياناتك الكاملة.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('card')}
                className="text-xs text-amber-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>معاينة البطاقة التعريفية ←</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DYNAMIC CUSTOM FIELDS BUILDER */}
      {/* ========================================================================= */}
      {activeSubTab === 'dynamic' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action & Filter Bar */}
          <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>الخانات المخصصة والديناميكية للملف الشخصي</span>
                </h3>
                <p className="text-xs text-blue-300/70">
                  إمكانية إضافة أي نوع من الحقول (نصوص، نسب، روابط، مهارات، أرقام) وتعبئتها ومزامنتها فورياً.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFieldModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة خانة جديدة</span>
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="pt-3 border-t border-blue-900/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">تصفية حسب التصنيف:</span>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition shrink-0 ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-[#0b1633] text-slate-300 hover:bg-blue-900/40 border border-blue-900/40'
                }`}
              >
                الكل ({customFields.length})
              </button>

              {(Object.keys(CATEGORY_LABELS) as CustomFieldCategory[]).map((cat) => {
                const count = customFields.filter(f => f.category === cat).length;
                if (count === 0 && selectedCategoryFilter !== cat) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`text-xs px-3 py-1 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                      selectedCategoryFilter === cat
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-[#0b1633] text-slate-300 hover:bg-blue-900/40 border border-blue-900/40'
                    }`}
                  >
                    <span>{CATEGORY_LABELS[cat].label}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Preset Quick-Add Ribbon */}
          <div className="bg-gradient-to-r from-blue-950/60 via-[#0a1533] to-purple-950/60 rounded-2xl border border-blue-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>إضافة خانات نموذجية سريعة بنقرة واحدة:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PRESET_FIELDS.map((preset) => {
                const isExisting = customFields.some(f => f.key === preset.key);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isExisting}
                    onClick={() => handleAddPresetDirectly(preset)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 ${
                      isExisting
                        ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-[#0c183a] hover:bg-blue-900/60 border-blue-800/60 text-blue-200 hover:text-white shadow-xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{preset.label.split('/')[0]}</span>
                    {isExisting && <span className="text-[10px] text-emerald-400">✓ مضافة</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Fields Input Grid */}
          <div className="space-y-4">
            {filteredCustomFields.length === 0 ? (
              <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20">
                  <Layers className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-white">لا توجد خانات مخصصة في هذا التصنيف</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  يمكنك إضافة خانات جديدة مثل المعدل الأكاديمي، المهارات والاهتمامات، رقم هاتف بديل، أو رابط ملف الإنجاز.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddFieldModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md"
                >
                  + إضافة خانة جديدة الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomFields.map((field) => (
                  <DynamicFieldInput
                    key={field.id}
                    field={field}
                    value={customValues[field.key]}
                    onChange={(newVal) => handleCustomValueChange(field.key, newVal)}
                    onDeleteField={handleDeleteCustomField}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Save Action for Dynamic Fields */}
          {filteredCustomFields.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs py-3 px-8 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ كافة قيم الخانات المخصصة</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACADEMIC RECORD & ROLES */}
      {/* ========================================================================= */}
      {activeSubTab === 'academic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-blue-900/40 pb-3">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black text-white">الانتساب المدرسي والبيانات التعليمية</h3>
                  <p className="text-[11px] text-blue-300/60 font-medium">البيانات الأكاديمية الرسمية المرتبطة بكيان المدرسة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 space-y-1">
                  <span className="text-[10px] text-blue-300/70 font-bold block">المدرسة المعتمدة:</span>
                  <span className="text-sm font-black text-white block">{currentSchool?.name || 'غير مسجل بمدرسة'}</span>
                  <span className="text-[11px] text-slate-400">{currentSchool?.location || 'المملكة العربية السعودية'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 space-y-1">
                  <span className="text-[10px] text-blue-300/70 font-bold block">الرتبة والدور بالمنظومة:</span>
                  <span className="text-sm font-black text-cyan-300 block">{currentRoleInfo.title}</span>
                  <span className="text-[11px] text-emerald-400 font-bold">✓ صلاحيات كاملة ونشطة</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 space-y-1">
                  <span className="text-[10px] text-blue-300/70 font-bold block">المسار أو الصف الأكاديمي:</span>
                  <span className="text-xs font-bold text-white block">
                    {customValues['specialization'] || 'المسار التعليمي العام (معتمد)'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 space-y-1">
                  <span className="text-[10px] text-blue-300/70 font-bold block">المعدل / الإنجاز الأكاديمي:</span>
                  <span className="text-xs font-bold text-amber-300 block">
                    {customValues['gpa'] ? `${customValues['gpa']} %` : 'مكتمل وموثق في المنظومة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Values Summary Table */}
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>ملخص الخانات الإضافية المعبأة</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('dynamic')}
                  className="text-[11px] text-cyan-400 hover:underline font-bold"
                >
                  تعديل الخانات ←
                </button>
              </div>

              <div className="space-y-2">
                {customFields.map((f) => {
                  const val = customValues[f.key];
                  return (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-[#070e22] border border-blue-900/30 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-bold">{f.label}</span>
                      <span className="text-cyan-300 font-medium font-mono">
                        {Array.isArray(val) ? val.join('، ') : (val !== undefined && val !== null && val !== '' ? String(val) : '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-blue-900/40 pb-3">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white">بيانات الكيان المدرسي</h4>
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">اسم المدرسة:</span>
                  <span className="text-slate-100 font-bold">{currentSchool?.name || 'مدرسة هتاف العاصمي النموذجية'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">المنطقة والمدينة:</span>
                  <span className="text-slate-300">{currentSchool?.location || 'المملكة العربية السعودية'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">الرمز التعريفي للمدرسة:</span>
                  <span className="text-cyan-300 font-mono font-bold">{currentSchool?.slug || 'school-main'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIGITAL ID CARD PREVIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'card' && (
        <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
          {/* Card Controls */}
          <div className="flex items-center justify-between bg-[#080f24] p-4 rounded-2xl border border-blue-900/40">
            <div className="flex items-center gap-2">
              <IdCard className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-xs font-black text-white">البطاقة التعريفية الرقمية للمستخدم</h4>
                <p className="text-[10px] text-blue-300/60">وثيقة إلكترونية موحدة للمنظومة التعليمية</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / حفظ PDF</span>
            </button>
          </div>

          {/* The Visual Digital ID Card */}
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1c44] via-[#091533] to-[#140f35] border-2 border-cyan-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden text-white space-y-6">
            {/* Holographic Watermark effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: School Logo & Title */}
            <div className="flex items-center justify-between border-b border-blue-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
                  🎓
                </div>
                <div>
                  <h3 className="font-black text-sm text-cyan-300">منصة هتاف العاصمي التعليمية الذكية</h3>
                  <p className="text-[11px] text-slate-300">{currentSchool?.name || 'مدرسة معتمدة بالمنظومة'}</p>
                </div>
              </div>
              <div className="text-left">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  Verified ID
                </span>
              </div>
            </div>

            {/* Card Content Grid */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar on Card */}
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-1 shadow-lg shrink-0">
                <div className="w-full h-full rounded-[14px] bg-[#070e22] overflow-hidden flex items-center justify-center text-3xl font-black">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    fullName.charAt(0) || 'ح'
                  )}
                </div>
              </div>

              {/* Data list */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs w-full">
                <div>
                  <span className="text-[10px] text-cyan-300/70 block font-bold">الاسم الكامل:</span>
                  <span className="font-black text-white text-sm">{fullName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-cyan-300/70 block font-bold">الصفة / الدور:</span>
                  <span className="font-bold text-amber-300">{currentRoleInfo.title}</span>
                </div>

                <div>
                  <span className="text-[10px] text-cyan-300/70 block font-bold">البريد الإلكتروني:</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate block">{currentUser.email || `${currentUser.username}@htaf.online`}</span>
                </div>

                <div>
                  <span className="text-[10px] text-cyan-300/70 block font-bold">رقم التواصل:</span>
                  <span className="font-mono text-slate-300">{phoneNumber || customValues['backup_phone'] || '—'}</span>
                </div>

                {customValues['specialization'] && (
                  <div>
                    <span className="text-[10px] text-cyan-300/70 block font-bold">المسار الأكاديمي:</span>
                    <span className="text-slate-200 font-bold">{customValues['specialization']}</span>
                  </div>
                )}

                {customValues['gpa'] && (
                  <div>
                    <span className="text-[10px] text-cyan-300/70 block font-bold">المعدل التراكمي:</span>
                    <span className="text-emerald-400 font-bold font-mono">{customValues['gpa']} %</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills & Badges Chip preview on card */}
            {Array.isArray(customValues['skills']) && customValues['skills'].length > 0 && (
              <div className="pt-2 border-t border-blue-900/40 space-y-1.5">
                <span className="text-[10px] text-cyan-300/80 font-bold block">المهارات والاهتمامات:</span>
                <div className="flex flex-wrap gap-1.5">
                  {customValues['skills'].map((s: string, idx: number) => (
                    <span key={idx} className="bg-blue-950 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Card Footer: Barcode & Unified UUID */}
            <div className="pt-4 border-t border-blue-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-cyan-400 shrink-0" />
                <div>
                  <span className="block text-slate-300 font-bold">المعرف الرقمي الموحد:</span>
                  <span className="text-cyan-400">{currentUser.id}</span>
                </div>
              </div>

              <div className="text-left">
                <span className="block">تاريخ التوثيق: {new Date().toLocaleDateString('ar-SA')}</span>
                <span className="text-emerald-400 font-bold">Htaf Digital Identity System</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SECURITY & 2FA */}
      {/* ========================================================================= */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Two-Factor Authentication Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">المصادقة الثنائية والتحقق بخطوتين (2FA / TOTP)</h4>
                    <p className="text-[11px] text-slate-400">حماية حسابك وسجلاتك المدرسية باستخدام تطبيقات المصادقة القياسية ورموز الاسترداد</p>
                  </div>
                </div>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  is2FAActive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                    : isEnforcedAdmin
                    ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${is2FAActive ? 'bg-emerald-400 animate-pulse' : isEnforcedAdmin ? 'bg-amber-400' : 'bg-slate-500'}`} />
                  <span>{is2FAActive ? 'مفعلة ونشطة 🔐' : isEnforcedAdmin ? 'مطلوبة للدور الإداري' : 'غير مفعلة'}</span>
                </span>
              </div>

              {/* Status Info Box */}
              <div className="space-y-4 text-xs">
                {isEnforcedAdmin && (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-[11px] text-amber-200 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block text-amber-300">سياسة الأمان الإلزامية للمناصب الإدارية:</span>
                      <p className="leading-relaxed text-slate-300">
                        بموجب المعايير الأمنية للمنظومة، تخضع الحسابات الإدارية (Super Admin، مدير المدرسة، الوكلاء) لإلزامية التحقق بخطوتين عبر تطبيقات المصادقة لمنع أي وصول غير مصرح به.
                      </p>
                    </div>
                  </div>
                )}

                {/* Factors summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span>تطبيق المصادقة (TOTP Authenticator)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Google Authenticator / Microsoft Authenticator / Authy.
                    </p>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md inline-block border border-emerald-800/40">
                      RFC 6238 Standard (30s)
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>رموز الاسترداد للطوارئ (Recovery Codes)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      رموز مشفرة لمرة واحدة للاستخدام عند فقدان الهاتف أو التطبيق.
                    </p>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md inline-block border border-amber-800/40">
                      {mfaRecord?.hashedRecoveryCodes ? `المتبقي: ${mfaRecord.hashedRecoveryCodes.length} رموز` : '8 رموز جاهزة للتوليد'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStart2FASetup}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{is2FAActive ? 'إعادة مسح رمز الاستجابة السريعة (QR) وتوليد الرموز' : 'تفعيل وإعداد المصادقة الثنائية (TOTP)'}</span>
                  </button>

                  {!isEnforcedAdmin && is2FAActive && (
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>تعطيل المصادقة الثنائية</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Email Authentication & OTP Delivery Card */}
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <MailCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">المصادقة عبر البريد الإلكتروني (Email OTP)</h4>
                    <p className="text-[11px] text-slate-400">إرسال رمز سري مؤقت إلى البريد المسجل لتسجيل الدخول والتحقق الفوري بدون كلمات مرور</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-3 py-1 rounded-full border bg-emerald-950 text-emerald-300 border-emerald-700/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>خدمة الإرسال مفعلة ومتاحة</span>
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#0b1633] border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">البريد الإلكتروني المعتمد للمصادقة:</span>
                    <span className="text-sm font-mono font-black text-cyan-300 dir-ltr text-right inline-block">
                      {currentUser?.email || (currentUser?.username?.includes('@') ? currentUser.username : 'غير مسجل')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestEmailOtp}
                    disabled={testEmailOtpStatus === 'sending' || testEmailCountdown > 0}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition shrink-0"
                  >
                    {testEmailOtpStatus === 'sending' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{testEmailCountdown > 0 ? `إعادة الإرسال (${testEmailCountdown}s)` : 'إرسال رمز مصادقة تجريبي الآن'}</span>
                      </>
                    )}
                  </button>
                </div>

                {testEmailOtpStatus === 'sent' && (
                  <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-800/80 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم إرسال رمز المصادقة بنجاح إلى البريد!</span>
                      </span>
                      {testEmailOtpCode && (
                        <span className="text-[11px] text-cyan-300 bg-[#080f24] px-2.5 py-1 rounded-lg border border-blue-900 font-mono">
                          رمز المعاينة السريعة: <strong>{testEmailOtpCode}</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={testEmailInputCode}
                        onChange={(e) => setTestEmailInputCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="أدخل الرمز المكون من 6 أرقام"
                        className="flex-1 bg-[#080f24] border border-blue-900/60 rounded-xl px-3 py-2 text-white font-mono text-center text-sm outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyTestEmailOtp}
                        disabled={testEmailInputCode.trim().length < 6}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition"
                      >
                        التحقق من الرمز
                      </button>
                    </div>
                  </div>
                )}

                {testEmailOtpStatus === 'verified' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{testEmailOtpMsg || 'تم التحقق بنجاح! خدمة إرسال المصادقة بالبريد تعمل وتستقبل الرموز بصورة ممتازة.'}</span>
                  </div>
                )}

                {testEmailOtpStatus === 'error' && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-700/60 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>{testEmailOtpMsg || 'حدث خطأ أثناء فحص رمز المصادقة.'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Audit Log */}
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white">سجل تدقيق أمان الحساب (Security Audit Log)</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSecurityLogs(getSecurityLogs())}
                  className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                  title="تحديث السجل"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تحديث</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-[#050b1a] rounded-2xl border border-blue-900/40 text-xs">
                {securityLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-4 text-xs font-sans">لا توجد سجلات أمان مسجلة بعد</p>
                ) : (
                  securityLogs.slice(0, 15).map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-[#08132e] border border-blue-900/40 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-cyan-300 font-mono">
                          {log.action === 'mfa_enrolled' ? '✅ تفعيل 2FA' :
                           log.action === 'mfa_verify_success' ? '🔓 نجاح التحقق' :
                           log.action === 'mfa_recovery_used' ? '🔑 استخدام رمز استرداد' :
                           log.action === 'mfa_verify_failed' ? '⚠️ فشل تحقق' :
                           log.action === 'mfa_disabled' ? '❌ تعطيل 2FA' :
                           log.action === 'mfa_enforced' ? '🛡️ فرض 2FA' : log.action}
                        </span>
                        <span className="font-mono">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                      </div>
                      <p className="text-slate-200 text-xs">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#080f24] rounded-3xl border border-blue-900/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-blue-900/40 pb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white">معلومات الجلسة والتوثيق</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">معرف المستخدم الموحد:</span>
                  <span className="font-mono text-[11px] text-cyan-300 break-all select-all">{currentUser.id}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">حالة الحساب في النظام:</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    حساب نشط ومفعل
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">طريقة تسجيل الدخول:</span>
                  <span className="text-slate-200 font-bold block mt-0.5">
                    {currentUser.loginMethod === 'google' ? 'Google OAuth 2.0 (Verified)' : 'اسم المستخدم وكلمة المرور'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">البريد الإلكتروني الموثق:</span>
                  <span className="font-mono text-slate-200 text-xs block mt-0.5">{currentUser.email || `${currentUser.username}@htaf.online`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL WIZARD */}
      {show2FASetupModal && setupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl">
          <div className="bg-[#080f24] border border-blue-800/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShow2FASetupModal(false)}
              className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-blue-900/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">إعداد المصادقة الثنائية (TOTP)</h3>
                <p className="text-xs text-slate-400">
                  {setupStep === 'qr' ? 'الخطوة 1: ربط تطبيق المصادقة وتأكيد الرمز' : 'الخطوة 2: حفظ رموز الاسترداد للطوارئ'}
                </p>
              </div>
            </div>

            {/* STEP 1: SCAN QR CODE & ENTER 6-DIGIT CODE */}
            {setupStep === 'qr' && (
              <form onSubmit={handleVerifyAndCompleteSetup} className="space-y-4">
                <div className="p-4 bg-[#0b1633] rounded-2xl border border-blue-900/40 text-xs text-slate-300 space-y-2">
                  <span className="font-bold text-cyan-300 block">تعليمات الربط:</span>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>افتح تطبيق المصادقة (Google Authenticator أو Microsoft Authenticator).</li>
                    <li>اختر "إضافة حساب" ثم امسح رمز الاستجابة السريعة (QR Code) أدناه.</li>
                    <li>أدخل رمز التحقق المكون من 6 أرقام لتأكيد التفعيل.</li>
                  </ol>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200">
                  {setupData.qrCodeDataUrl ? (
                    <img
                      src={setupData.qrCodeDataUrl}
                      alt="TOTP QR Code"
                      className="w-48 h-48 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-500 font-mono text-xs">
                      جاري توليد الرمز...
                    </div>
                  )}
                  <span className="text-[10px] text-slate-700 font-bold mt-2">امسح الرمز عبر تطبيق المصادقة</span>
                </div>

                {/* Secret Key for manual entry */}
                <div className="bg-[#050b1a] p-3 rounded-xl border border-blue-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">أو أدخل المفتاح السري يدوياً:</span>
                    <span className="font-mono font-black text-cyan-300 text-xs tracking-wider select-all">
                      {setupData.formattedSecret}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-blue-900/50 hover:bg-blue-800 text-cyan-300 text-xs font-bold flex items-center gap-1 transition"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecret ? 'تم النسخ' : 'نسخ المفتاح'}</span>
                  </button>
                </div>

                {/* Verification Code Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-200">
                    أدخل رمز التحقق (6 أرقام) من التطبيق لتأكيد التفعيل:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="000000"
                    value={setupOtpInput}
                    onChange={(e) => setSetupOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-xl font-mono font-black tracking-widest py-3 px-4 rounded-xl border border-cyan-500/50 bg-[#0b1633] text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                  />
                </div>

                {setupError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{setupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingSetup || setupOtpInput.length < 6}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition"
                >
                  {isVerifyingSetup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد وتفعيل المصادقة الثنائية</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: DISPLAY RECOVERY CODES */}
            {setupStep === 'recovery_codes' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Success Warning Banner */}
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-2xl p-4 space-y-1.5 text-xs text-amber-200">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>تنبيه أمني بالغ الأهمية:</span>
                  </div>
                  <p className="leading-relaxed text-slate-200 text-[11px]">
                    احتفظ بهذه الرموز في مكان آمن. لن يتم عرضها مرة أخرى. كل رمز صالح للاستخدام لمرة واحدة فقط لتسجيل الدخول في حال فقدت الوصول لهاتفك.
                  </p>
                </div>

                {/* Grid of Recovery Codes */}
                <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-[#050b1a] border border-blue-900/50">
                  {generatedRecoveryCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0b1633] border border-blue-900/40 text-center font-mono font-bold text-xs text-cyan-300 tracking-wider"
                    >
                      <span className="text-[10px] text-slate-500 ml-1.5">{idx + 1}.</span>
                      <span>{code}</span>
                    </div>
                  ))}
                </div>

                {/* Actions: Copy / Download / Print */}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={handleCopyAllRecoveryCodes}
                    className="p-2.5 rounded-xl bg-blue-900/50 hover:bg-blue-800 text-cyan-300 border border-blue-800 flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedRecoveryAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRecoveryAll ? 'تم النسخ' : 'نسخ الكل'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadRecoveryCodes}
                    className="p-2.5 rounded-xl bg-blue-900/50 hover:bg-blue-800 text-cyan-300 border border-blue-800 flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintRecoveryCodes}
                    className="p-2.5 rounded-xl bg-blue-900/50 hover:bg-blue-800 text-cyan-300 border border-blue-800 flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </button>
                </div>

                {/* Final Complete Button */}
                <button
                  type="button"
                  onClick={() => setShow2FASetupModal(false)}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ الرموز بنجاح - إغلاق</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for adding new custom field */}
      <AddCustomFieldModal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        onAddField={handleAddNewCustomField}
        existingKeys={customFields.map(f => f.key)}
      />
    </div>
  );
};
