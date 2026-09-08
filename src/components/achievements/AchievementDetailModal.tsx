import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Building,
  User,
  Users,
  ExternalLink,
  Video,
  FileText,
  Sparkles,
  Share2,
  Printer,
  Heart,
  MessageSquare,
  ShieldCheck,
  Star,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  AchievementRecord,
  AuthUser,
  AchievementBadge
} from '../../types';
import {
  approveByTeacher,
  requestRevisionByTeacher,
  approveBySchool,
  rejectAchievement,
  nominateStudent,
  generateCertificateForAchievement,
  awardBadgeToStudent,
  addAchievementComment,
  BADGE_DEFINITIONS
} from '../../lib/achievementsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  achievement: AchievementRecord;
  currentUser: AuthUser;
  schoolName?: string;
  onUpdate: (updated: AchievementRecord) => void;
  onOpenCertificate: (achievement: AchievementRecord) => void;
  onEdit?: (achievement: AchievementRecord) => void;
}

export const AchievementDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  achievement,
  currentUser,
  schoolName = 'منصة حقائق العلوم',
  onUpdate,
  onOpenCertificate,
  onEdit
}) => {
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Review & revision action state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Nomination action state
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [nominationType, setNominationType] = useState<'excellence' | 'talent'>('excellence');
  const [nominationNotes, setNominationNotes] = useState('');

  // Badge award state
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedBadgeKey, setSelectedBadgeKey] = useState<AchievementBadge['badgeKey']>('creative');
  const [badgeReason, setBadgeReason] = useState('');

  // Congratulate state (Parent)
  const [isCongratulateModalOpen, setIsCongratulateModalOpen] = useState(false);
  const [congratulateMessage, setCongratulateMessage] = useState('فخور بك وبتفوقك يا بني، وإلى مزيد من التميز والنجاح!');

  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen) return null;

  const isTeacher = currentUser.role === 'teacher';
  const isSchoolAdmin = currentUser.role === 'principal' || currentUser.role === 'school_admin' || currentUser.role === 'vice_principal';
  const isCounselor = currentUser.role === 'counselor';
  const isParent = currentUser.role === 'parent';
  const isOwner = achievement.creatorId === currentUser.id || achievement.studentId === currentUser.id;

  const media = achievement.media || [];
  const currentMediaItem = media[activeMediaIdx] || (achievement.mainImageUrl ? { fileUrl: achievement.mainImageUrl, fileType: 'image' } : null);

  // Teacher Approval Action
  const handleTeacherApprove = async () => {
    setIsActionLoading(true);
    try {
      const updated = await approveByTeacher(achievement.id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      });
      if (updated) onUpdate(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Teacher Request Revision Action
  const handleTeacherRequestRevision = async () => {
    if (!revisionNotes.trim()) return;
    setIsActionLoading(true);
    try {
      const updated = await requestRevisionByTeacher(
        achievement.id,
        { id: currentUser.id, name: currentUser.name },
        revisionNotes.trim()
      );
      if (updated) onUpdate(updated);
      setIsRevisionModalOpen(false);
      setRevisionNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // School Admin Approval Action
  const handleSchoolApprove = async () => {
    setIsActionLoading(true);
    try {
      const updated = await approveBySchool(achievement.id, {
        id: currentUser.id,
        name: currentUser.name,
        role: 'مدير المدرسة'
      }, true);
      if (updated) onUpdate(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Issue Certificate Action
  const handleGenerateCert = async () => {
    setIsActionLoading(true);
    try {
      const cert = await generateCertificateForAchievement(
        achievement,
        { name: currentUser.name, role: isSchoolAdmin ? 'مدير المدرسة' : 'المشرف الأكاديمي' },
        schoolName
      );
      const updated = {
        ...achievement,
        certificateId: cert.id,
        certificate: cert
      };
      onUpdate(updated);
      onOpenCertificate(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Nominate Student Action
  const handleNominate = async () => {
    setIsActionLoading(true);
    try {
      const updated = await nominateStudent(
        achievement.id,
        nominationType,
        nominationNotes,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );
      if (updated) onUpdate(updated);
      setIsNominateModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Award Badge Action
  const handleAwardBadge = async () => {
    setIsActionLoading(true);
    try {
      const badge = await awardBadgeToStudent(
        { id: achievement.studentId || currentUser.id, name: achievement.studentName || 'الطالب' },
        selectedBadgeKey,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        badgeReason,
        achievement.id
      );
      const badges = achievement.badges || [];
      const updated = { ...achievement, badges: [...badges, badge] };
      onUpdate(updated);
      setIsBadgeModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Parent Congratulate Action
  const handleCongratulate = async () => {
    if (!congratulateMessage.trim()) return;
    setIsActionLoading(true);
    try {
      const comment = await addAchievementComment(
        achievement.id,
        { id: currentUser.id, name: currentUser.name, role: 'ولي الأمر' },
        congratulateMessage.trim(),
        'congratulation'
      );
      if (comment) {
        const comments = achievement.comments || [];
        onUpdate({ ...achievement, comments: [...comments, comment] });
      }
      setIsCongratulateModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#090f24] border border-blue-900/50 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#060b1b] border-b border-blue-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
              {achievement.category}
            </span>
            <div className="text-xs text-slate-400 font-semibold">
              {achievement.academicYear} • {achievement.term}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {achievement.certificate && (
              <button
                onClick={() => onOpenCertificate(achievement)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md hover:bg-amber-400 transition"
              >
                <Award className="w-3.5 h-3.5" />
                <span>عرض الشهادة الرقمية</span>
              </button>
            )}

            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(achievement)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
              >
                تعديل
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-right">
          {/* Main Visual Showcase (Image / Media Viewer) */}
          {currentMediaItem && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-blue-900/40 group">
              {currentMediaItem.fileType === 'image' ? (
                <div className="relative max-h-[380px] w-full flex items-center justify-center bg-black/40">
                  <img
                    src={currentMediaItem.fileUrl}
                    alt={achievement.title}
                    className="max-h-[380px] w-auto object-contain cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                  />
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-3 left-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/90 transition backdrop-blur-xs flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>تكبير الصورة</span>
                  </button>
                </div>
              ) : currentMediaItem.fileType === 'pdf' ? (
                <div className="p-8 text-center bg-slate-950">
                  <FileText className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white mb-2">مستند مرفق (PDF)</div>
                  <a
                    href={currentMediaItem.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح المستند في نافذة جديدة</span>
                  </a>
                </div>
              ) : null}

              {/* Media Thumbnails Carousel if multiple */}
              {media.length > 1 && (
                <div className="p-3 bg-black/70 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {media.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => setActiveMediaIdx(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                        activeMediaIdx === idx ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {item.fileType === 'image' ? (
                        <img src={item.fileUrl} alt="Thumb" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-cyan-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title & Core Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{achievement.title}</h1>

              {/* Status Badge */}
              <div>
                {achievement.approvalStatus === 'approved_school' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>معتمد من المدرسة ونُشر رسمياً</span>
                  </span>
                )}
                {achievement.approvalStatus === 'approved_teacher' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>معتمد من معلم المادة</span>
                  </span>
                )}
                {achievement.approvalStatus === 'pending_teacher' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>بانتظار مراجعة واعتماد المعلم</span>
                  </span>
                )}
                {achievement.approvalStatus === 'needs_revision' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>يحتاج تعديل وإعادة إرسال</span>
                  </span>
                )}
                {achievement.approvalStatus === 'draft' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-700 text-slate-300 border border-slate-600">
                    <FileText className="w-4 h-4" />
                    <span>مسودة خاصة</span>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed bg-[#0c142d] p-4 rounded-xl border border-blue-900/30 whitespace-pre-line">
              {achievement.description}
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-[#070d1f] border border-blue-900/30">
                <span className="text-[11px] text-slate-400 block mb-1">المادة الدراسية:</span>
                <span className="font-bold text-white">{achievement.subject || 'عام'}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#070d1f] border border-blue-900/30">
                <span className="text-[11px] text-slate-400 block mb-1">الصف والفصل:</span>
                <span className="font-bold text-white">
                  {achievement.grade} {achievement.className ? `(${achievement.className})` : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070d1f] border border-blue-900/30">
                <span className="text-[11px] text-slate-400 block mb-1">تاريخ الإنجاز:</span>
                <span className="font-bold text-white">{achievement.achievementDate}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#070d1f] border border-blue-900/30">
                <span className="text-[11px] text-slate-400 block mb-1">نطاق المنافسة:</span>
                <span className="font-bold text-cyan-300">{achievement.achievementLevel}</span>
              </div>
            </div>

            {/* Outcome & Prize */}
            {(achievement.outcomeResult || achievement.prizeAward) && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                {achievement.outcomeResult && (
                  <div>
                    <span className="text-amber-400 font-bold">النتيجة المحققة: </span>
                    <span className="text-white font-black">{achievement.outcomeResult}</span>
                  </div>
                )}
                {achievement.prizeAward && (
                  <div>
                    <span className="text-amber-400 font-bold">🏆 التكريم / الجائزة: </span>
                    <span className="text-yellow-300 font-black">{achievement.prizeAward}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Participants Section */}
          {achievement.participants && achievement.participants.length > 0 && (
            <div className="p-4 rounded-xl bg-[#0c142d] border border-purple-900/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-purple-300">
                <Users className="w-4 h-4 text-purple-400" />
                <span>فريق العمل والطلاب المشاركون ({achievement.participants.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievement.participants.map((p) => (
                  <div
                    key={p.id}
                    className="px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-800/40 text-xs text-purple-200 flex items-center gap-1.5 font-bold"
                  >
                    <span>{p.studentName}</span>
                    {p.roleInProject && (
                      <span className="text-[10px] text-purple-400">({p.roleInProject})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links & Video Section */}
          {(achievement.videoUrl || (achievement.externalLinks && achievement.externalLinks.length > 0)) && (
            <div className="p-4 rounded-xl bg-[#0c142d] border border-blue-900/30 space-y-2 text-xs">
              <div className="font-black text-slate-200">الروابط ومقاطع الفيديو:</div>
              {achievement.videoUrl && (
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-400" />
                  <a
                    href={achievement.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    مشاهدة فيديو المشروع
                  </a>
                </div>
              )}
              {achievement.externalLinks?.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-300 hover:underline"
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Badges Section */}
          {achievement.badges && achievement.badges.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                <Star className="w-4 h-4 text-amber-400" />
                <span>الشارات الممنوحة لهذا الإنجاز ({achievement.badges.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievement.badges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/50 text-xs font-black text-amber-200"
                  >
                    <span className="text-base">{b.badgeIcon}</span>
                    <span>{b.badgeTitle}</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">
                      (من {b.awardedByName})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Congratulations Section */}
          {achievement.comments && achievement.comments.length > 0 && (
            <div className="p-4 rounded-xl bg-[#0c142d] border border-blue-900/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-black text-slate-200">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>سجل الملاحظات والتهاني ({achievement.comments.length}):</span>
              </div>
              <div className="space-y-2">
                {achievement.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`p-3 rounded-xl text-xs ${
                      comm.commentType === 'congratulation'
                        ? 'bg-pink-500/15 border border-pink-500/30 text-pink-200'
                        : comm.commentType === 'revision_note'
                        ? 'bg-orange-500/15 border border-orange-500/30 text-orange-200'
                        : 'bg-[#070d1e] border border-blue-900/30 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{comm.authorName} ({comm.authorRole})</span>
                      <span className="text-[10px] opacity-70">
                        {comm.createdAt.split('T')[0]}
                      </span>
                    </div>
                    <p className="leading-relaxed">{comm.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar for Roles */}
          <div className="p-4 rounded-2xl bg-[#070d1f] border border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-400">الإجراءات المتاحة لحسابك:</div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Teacher Actions */}
              {isTeacher && achievement.approvalStatus === 'pending_teacher' && (
                <>
                  <button
                    disabled={isActionLoading}
                    onClick={handleTeacherApprove}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد الإنجاز</span>
                  </button>

                  <button
                    onClick={() => setIsRevisionModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/40 text-orange-300 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>طلب تعديل</span>
                  </button>
                </>
              )}

              {/* Teacher / School Admin: Nominate for Talent / Excellence */}
              {(isTeacher || isSchoolAdmin || isCounselor) && (
                <button
                  onClick={() => setIsNominateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/40 text-amber-300 font-black text-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ترشيح للتميز / الموهبة</span>
                </button>
              )}

              {/* Teacher: Award Badge */}
              {isTeacher && (
                <button
                  onClick={() => setIsBadgeModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 font-black text-xs transition flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 text-purple-400" />
                  <span>منح شارة تكريم</span>
                </button>
              )}

              {/* School Admin: Approve for School Publish & Issue Certificate */}
              {isSchoolAdmin && (
                <>
                  {!achievement.approvedForSchoolPublish && (
                    <button
                      disabled={isActionLoading}
                      onClick={handleSchoolApprove}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>اعتماد للنشر المدرسي</span>
                    </button>
                  )}

                  {!achievement.certificate && (
                    <button
                      disabled={isActionLoading}
                      onClick={handleGenerateCert}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-md hover:from-amber-400 hover:to-yellow-400 transition flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" />
                      <span>إصدار شهادة معتمدة مع QR</span>
                    </button>
                  )}
                </>
              )}

              {/* Parent: Congratulate */}
              {isParent && (
                <button
                  onClick={() => setIsCongratulateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Heart className="w-4 h-4" />
                  <span>تهنئة الطالب</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Request Revision */}
        {isRevisionModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md bg-slate-900 border border-orange-500/40 rounded-2xl p-6 space-y-4 text-right">
              <h3 className="text-sm font-black text-orange-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>طلب تعديل وملاحظات للمعلم</span>
              </h3>
              <p className="text-xs text-slate-300">
                حدد للطالب المطلوب تعديله ليتم إشعاره وتحديث الإنجاز:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['أضف صورة واضحة للمشروع', 'أرفق شهادة التكريم', 'عدّل وصف الإنجاز', 'حدد أعضاء الفريق'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setRevisionNotes((prev) => (prev ? `${prev} - ${q}` : q))}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md"
                  >
                    + {q}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="اكتب التوجيهات والملاحظات المطلوبة هنا..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleTeacherRequestRevision}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black shadow"
                >
                  إرسال طلب التعديل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Nominate */}
        {isNominateModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 text-right">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>ترشيح الطالب في سجل التميز والموهبة</span>
              </h3>
              <p className="text-xs text-slate-300">
                يُرفع هذا الترشيح مباشرة إلى المرشد الطلابي وإدارة المدرسة للاعتماد الرسمي:
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNominationType('excellence')}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs ${
                    nominationType === 'excellence'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  ترشيح للتميز الأكاديمي
                </button>
                <button
                  type="button"
                  onClick={() => setNominationType('talent')}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs ${
                    nominationType === 'talent'
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  ترشيح للموهبة والابتكار
                </button>
              </div>
              <textarea
                rows={3}
                value={nominationNotes}
                onChange={(e) => setNominationNotes(e.target.value)}
                placeholder="مبررات الترشيح والأدلة والشواهد الداعمة..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsNominateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleNominate}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow"
                >
                  تأكيد الترشيح
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Award Badge */}
        {isBadgeModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-2xl p-6 space-y-4 text-right">
              <h3 className="text-sm font-black text-purple-400 flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span>منح شارة تكريم للطالب</span>
              </h3>
              <p className="text-xs text-slate-300">اختر الشارة التقديرية المناسبة لطبيعة الإنجاز:</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {BADGE_DEFINITIONS.map((badge) => {
                  const isSelected = selectedBadgeKey === badge.key;
                  return (
                    <button
                      key={badge.key}
                      type="button"
                      onClick={() => setSelectedBadgeKey(badge.key)}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span className="text-xs font-bold">{badge.title}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={badgeReason}
                onChange={(e) => setBadgeReason(e.target.value)}
                placeholder="سبب منح الشارة (اختياري)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAwardBadge}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow"
                >
                  منح الشارة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Parent Congratulate */}
        {isCongratulateModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md bg-slate-900 border border-pink-500/40 rounded-2xl p-6 space-y-4 text-right">
              <h3 className="text-sm font-black text-pink-400 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span>تهنئة وتشجيع الطالب</span>
              </h3>
              <p className="text-xs text-slate-300">
                اكتب رسالة تشجيعية خاصة ستظهر مباشرة في ملف إنجاز ابنك/ابنتك:
              </p>
              <textarea
                rows={3}
                value={congratulateMessage}
                onChange={(e) => setCongratulateMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-hidden leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCongratulateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCongratulate}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black shadow"
                >
                  إرسال التهنئة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Lightbox */}
        {isLightboxOpen && currentMediaItem && (
          <div
            className="fixed inset-0 z-70 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white bg-white/10 rounded-full hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentMediaItem.fileUrl}
              alt="Fullscreen"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};
