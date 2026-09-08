import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Users,
  Eye,
  Calendar,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Heart
} from 'lucide-react';
import { AchievementRecord, AuthUser } from '../../types';
import { ACHIEVEMENT_CATEGORIES } from '../../lib/achievementsService';

interface Props {
  achievement: AchievementRecord;
  currentUser?: AuthUser | null;
  onViewDetails: (achievement: AchievementRecord) => void;
  onViewCertificate?: (achievement: AchievementRecord) => void;
  onCongratulate?: (achievement: AchievementRecord) => void;
}

export const AchievementCard: React.FC<Props> = ({
  achievement,
  currentUser,
  onViewDetails,
  onViewCertificate,
  onCongratulate
}) => {
  const categoryMeta = ACHIEVEMENT_CATEGORIES.find((c) => c.key === achievement.category);

  // Status Badge styling & label
  const getStatusBadge = () => {
    switch (achievement.approvalStatus) {
      case 'approved_school':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>معتمد من المدرسة</span>
          </span>
        );
      case 'approved_teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span>معتمد من المعلم</span>
          </span>
        );
      case 'pending_teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>بانتظار اعتماد المعلم</span>
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            <span>يحتاج مراجعة وتعديل</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>مرفوض</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-700/60 text-slate-300 border border-slate-600/40">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>مسودة خاصة</span>
          </span>
        );
    }
  };

  const hasCertificate = !!(achievement.certificateId || achievement.certificate);
  const mediaCount = achievement.media?.length || 0;
  const participantsCount = achievement.participants?.length || 0;
  const isParent = currentUser?.role === 'parent';

  return (
    <div className="group relative bg-[#0c142b] hover:bg-[#111c3b] border border-blue-900/40 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg hover:shadow-cyan-500/10">
      {/* Cover Media Header */}
      <div className="relative h-44 w-full bg-slate-950 overflow-hidden shrink-0">
        {achievement.mainImageUrl ? (
          <img
            src={achievement.mainImageUrl}
            alt={achievement.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0c1938] via-[#0d214d] to-[#071129] flex flex-col items-center justify-center p-4 text-center">
            <Award className="w-12 h-12 text-cyan-400/40 group-hover:text-cyan-400/80 transition-colors" />
            <span className="text-[11px] text-slate-400 font-bold mt-2">
              {categoryMeta?.label || 'إنجاز علمي'}
            </span>
          </div>
        )}

        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c142b] via-transparent to-black/50" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          {/* Category Badge */}
          <span
            className={`text-[11px] font-black px-2.5 py-1 rounded-full border backdrop-blur-md shadow-xs ${
              categoryMeta?.badgeColor || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {categoryMeta?.label || achievement.customCategory || 'إنجاز'}
          </span>

          {/* Media Count Badge if multiple */}
          {mediaCount > 1 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-xs">
              <ImageIcon className="w-3 h-3" />
              <span>+{mediaCount}</span>
            </span>
          )}
        </div>

        {/* Status Badge at bottom of image */}
        <div className="absolute bottom-2.5 right-3 z-10">
          {getStatusBadge()}
        </div>

        {/* Talent or Excellence Nomination Pill */}
        {achievement.nominationType && achievement.nominationType !== 'none' && (
          <div className="absolute bottom-2.5 left-3 z-10">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md">
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>{achievement.nominationType === 'excellence' ? 'مرشح للتميز' : 'مرشح للموهبة'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title */}
          <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1 text-right">
            {achievement.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed text-right">
            {achievement.description}
          </p>

          {/* Metadata chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            {achievement.subject && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-900/50 text-blue-300">
                <BookOpen className="w-3 h-3" />
                <span>{achievement.subject}</span>
              </span>
            )}

            {achievement.className && (
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                {achievement.grade ? `${achievement.grade} - ` : ''}
                {achievement.className}
              </span>
            )}

            {achievement.achievementDate && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{achievement.achievementDate}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Details & Author Info */}
        <div className="pt-3 border-t border-blue-900/30 flex items-center justify-between gap-2">
          {/* Owner / Participant Info */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 overflow-hidden">
            {participantsCount > 0 ? (
              <div className="flex items-center gap-1 text-purple-300 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>فريق ({participantsCount + 1} طلاب)</span>
              </div>
            ) : (
              <div className="truncate font-semibold text-slate-300">
                {achievement.studentName ? (
                  <span>الطالب: <strong className="text-cyan-300">{achievement.studentName}</strong></span>
                ) : achievement.teacherName ? (
                  <span>المعلم: <strong className="text-emerald-300">{achievement.teacherName}</strong></span>
                ) : (
                  <span>مدرسي</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Parent Congratulate Button */}
            {isParent && onCongratulate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCongratulate(achievement);
                }}
                title="تهنئة الطالب"
                className="p-1.5 rounded-lg bg-pink-500/15 text-pink-400 hover:bg-pink-500 hover:text-white border border-pink-500/30 transition"
              >
                <Heart className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Certificate View Button */}
            {hasCertificate && onViewCertificate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewCertificate(achievement);
                }}
                title="عرض الشهادة المعتمدة"
                className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 transition"
              >
                <Award className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Primary View Details Button */}
            <button
              onClick={() => onViewDetails(achievement)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 font-bold text-xs transition"
            >
              <Eye className="w-3 h-3" />
              <span>عرض</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
