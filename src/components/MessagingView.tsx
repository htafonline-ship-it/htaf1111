import React, { useState, useEffect, useRef } from 'react';
import {
  SupportTicket,
  StudyGroup,
  StudyGroupMessage,
  UserRole,
  StudentProfile,
  ModerationAuditLogItem,
  CurriculumBook,
  HomeworkCitation,
  SchoolConversation,
  DirectMessage,
  AuthUser,
  School as SchoolType,
  UserProfile,
  SchoolCircular,
  SchoolAnnouncement,
  CircularReadConfirmation
} from '../types';
import { AddHomeworkModal } from './AddHomeworkModal';
import {
  fetchSchoolTickets,
  createSupportTicket,
  addTicketReply,
  updateTicketStatus,
  fetchSchoolConversations,
  createConversation,
  fetchDirectMessages,
  sendDirectMessage,
  fetchSchoolStudyRooms,
  createStudyRoom,
  fetchStudyRoomMembers,
  inviteUserToStudyRoom,
  removeUserFromStudyRoom,
  fetchStudyRoomMessages,
  sendStudyRoomMessage,
  deleteStudyRoomMessage,
  fetchModerationAuditLogs,
  createModerationAuditLog,
  uploadMessageAttachment,
  markConversationAsRead,
  verifyUserMessagingEligibility,
  lookupInvitationCode,
  redeemInvitationAndLinkUser,
  submitNewSchoolRegistrationRequest,
  MessagingEligibilityResult,
  InvitationLookupResult,
  MESSAGING_ACCESS_DENIED_MESSAGE,
  fetchUserAllowedContacts,
  SchoolAllowedContacts,
  createOrGetDirectConversation,
  fetchSchoolCirculars,
  createSchoolCircular,
  acknowledgeCircular,
  fetchCircularConfirmations,
  fetchSchoolAnnouncements,
  createSchoolAnnouncement
} from '../lib/messagingService';
import { supabase, isSupabaseConfigured, fetchSchoolProfiles } from '../lib/supabase';
import {
  MessageSquare,
  Users,
  PlusCircle,
  Send,
  Trash2,
  ShieldAlert,
  Paperclip,
  CheckCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  Search,
  Lock,
  MessageCircle,
  Copy,
  Check,
  Filter,
  User,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Building,
  Building2,
  Upload,
  RefreshCw,
  Eye,
  Bell,
  Radio,
  CheckCheck,
  X,
  KeyRound,
  LogIn,
  Info,
  ChevronLeft
} from 'lucide-react';

interface MessagingViewProps {
  currentRole: UserRole;
  currentUser?: AuthUser | null;
  currentSchool?: SchoolType | null;
  studentProfile?: StudentProfile;
  tickets?: SupportTicket[];
  studyGroups?: StudyGroup[];
  groupMessages?: StudyGroupMessage[];
  centralBooks?: CurriculumBook[];
  onAddTicket?: (ticket: SupportTicket) => void;
  onAddTicketMessage?: (ticketId: string, text: string, senderRole: UserRole, senderName: string) => void;
  onSendGroupMessage?: (groupId: string, text: string, problemCitation?: any, homeworkCitation?: HomeworkCitation) => void;
  onDeleteGroupMessage?: (messageId: string, deletedBy: string) => void;
  onAddAuditLog?: (log: ModerationAuditLogItem) => void;
  onOpenLoginModal?: () => void;
  onSchoolJoined?: () => void;
}

// Banned words filter list for real-time AI moderation guard
const BANNED_KEYWORDS = ['سباب', 'شتيمة', 'احتيال', 'سرقة', 'غش', 'تنمر', 'مخالف', 'شتيمة2', 'بذيء'];

export const MessagingView: React.FC<MessagingViewProps> = ({
  currentRole,
  currentUser,
  currentSchool,
  studentProfile: initialStudentProfile,
  tickets: propTickets = [],
  studyGroups: propStudyGroups = [],
  groupMessages: propGroupMessages = [],
  centralBooks,
  onAddTicket,
  onAddTicketMessage,
  onSendGroupMessage,
  onDeleteGroupMessage,
  onAddAuditLog,
  onOpenLoginModal,
  onSchoolJoined
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'circulars' | 'announcements' | 'tickets' | 'groups'>('direct');

  // School ID for multi-tenant isolation
  const activeSchoolId = currentSchool?.id || currentUser?.schoolId || '';
  const effectiveUserName = currentUser?.fullName || initialStudentProfile?.name || 'مستخدم المنصة';
  const effectiveUserId = currentUser?.id || 'usr-default';

  // -------------------------------------------------------------
  // 0. ACCESS CONTROL & ELIGIBILITY STATE
  // -------------------------------------------------------------
  const [eligibility, setEligibility] = useState<MessagingEligibilityResult>({
    isEligible: false,
    message: 'جاري التحقق من صلاحية الوصول لنظام التواصل...',
    accountStatus: 'unregistered'
  });
  const [isVerifyingEligibility, setIsVerifyingEligibility] = useState(true);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateActionTab, setGateActionTab] = useState<'options' | 'login' | 'invitation' | 'register_school'>('options');
  const [gateInviteCode, setGateInviteCode] = useState('');
  const [gateInviteLookup, setGateInviteLookup] = useState<InvitationLookupResult | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [gateFeedback, setGateFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // New School Registration Form
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolStage, setNewSchoolStage] = useState('المرحلة المتوسطة');
  const [newSchoolRegion, setNewSchoolRegion] = useState('منطقة الرياض');
  const [newSchoolCity, setNewSchoolCity] = useState('الرياض');
  const [newSchoolApplicantName, setNewSchoolApplicantName] = useState(currentUser?.fullName || effectiveUserName);
  const [newSchoolApplicantEmail, setNewSchoolApplicantEmail] = useState(currentUser?.email || '');
  const [newSchoolApplicantPhone, setNewSchoolApplicantPhone] = useState('');
  const [newSchoolNotes, setNewSchoolNotes] = useState('');
  const [isSubmittingNewSchool, setIsSubmittingNewSchool] = useState(false);

  // -------------------------------------------------------------
  // 0.1 RELATIONAL SCHOOL ENTITIES & ALLOWED CONTACTS STATE
  // -------------------------------------------------------------
  const [allowedContacts, setAllowedContacts] = useState<SchoolAllowedContacts>({
    myTeachers: [],
    schoolAdmin: [],
    myClasses: [],
    classStudents: [],
    classParents: [],
    myChildren: [],
    allSchoolTeachers: [],
    allSchoolStudents: []
  });
  const [activeDirectSubView, setActiveDirectSubView] = useState<'conversations' | 'my_teachers' | 'my_classes' | 'school_admin' | 'my_children'>('conversations');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isStartingDirectChat, setIsStartingDirectChat] = useState(false);

  // -------------------------------------------------------------
  // 0.2 SCHOOL CIRCULARS & READ CONFIRMATION STATE
  // -------------------------------------------------------------
  const [circularsList, setCircularsList] = useState<SchoolCircular[]>([]);
  const [selectedCircular, setSelectedCircular] = useState<SchoolCircular | null>(null);
  const [showNewCircularModal, setShowNewCircularModal] = useState(false);
  const [newCircTitle, setNewCircTitle] = useState('');
  const [newCircNumber, setNewCircNumber] = useState('');
  const [newCircContent, setNewCircContent] = useState('');
  const [newCircCategory, setNewCircCategory] = useState<'إداري' | 'اختبارات' | 'إرشاد طلابي'>('إداري');
  const [newCircPriority, setNewCircPriority] = useState<'عاجل' | 'هام' | 'عادي'>('عادي');
  const [newCircAudience, setNewCircAudience] = useState<'all_school' | 'teachers' | 'students' | 'parents' | 'specific_grade'>('all_school');
  const [newCircGrade, setNewCircGrade] = useState('');
  const [newCircClass, setNewCircClass] = useState('');
  const [newCircRequiresAck, setNewCircRequiresAck] = useState(true);
  const [newCircAttachment, setNewCircAttachment] = useState<{ file: File; name: string } | null>(null);
  const [isCreatingCircular, setIsCreatingCircular] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [circularConfirmations, setCircularConfirmations] = useState<CircularReadConfirmation[]>([]);

  // -------------------------------------------------------------
  // 0.3 SCHOOL ANNOUNCEMENTS STATE
  // -------------------------------------------------------------
  const [announcementsList, setAnnouncementsList] = useState<SchoolAnnouncement[]>([]);
  const [showNewAnnouncementModal, setShowNewAnnouncementModal] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnAudience, setNewAnnAudience] = useState<'all_school' | 'teachers' | 'students' | 'parents' | 'class'>('all_school');
  const [newAnnGrade, setNewAnnGrade] = useState('');
  const [newAnnClass, setNewAnnClass] = useState('');
  const [newAnnIsUrgent, setNewAnnIsUrgent] = useState(false);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);

  // Check Eligibility on Mount or User Change
  const runEligibilityCheck = async () => {
    setIsVerifyingEligibility(true);
    try {
      const res = await verifyUserMessagingEligibility(currentUser, activeSchoolId);
      setEligibility(res);
    } catch {
      setEligibility({
        isEligible: false,
        message: 'تعذر التحقق من الصلاحيات. يرجى تسجيل الدخول مجدداً.',
        accountStatus: 'unregistered'
      });
    } finally {
      setIsVerifyingEligibility(false);
    }
  };

  useEffect(() => {
    runEligibilityCheck();
  }, [currentUser, activeSchoolId]);

  // Gate check guard before any interactive action
  const checkEligibilityOrOpenGate = (): boolean => {
    if (!eligibility.isEligible) {
      setGateFeedback(null);
      if (!currentUser || currentUser.role === 'student' && !currentUser.schoolId) {
        setGateActionTab('options');
      }
      setShowGateModal(true);
      return false;
    }
    return true;
  };

  // Invitation Code Lookup Handler
  const handleLookupInviteCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gateInviteCode.trim()) return;
    setIsCheckingCode(true);
    setGateFeedback(null);
    try {
      const res = await lookupInvitationCode(gateInviteCode.trim());
      setGateInviteLookup(res);
      if (!res.isValid) {
        setGateFeedback({ type: 'error', text: res.error || 'رمز الدعوة غير صالح أو منتهي الصلاحية.' });
      }
    } catch (err: any) {
      setGateFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء فحص رمز الدعوة' });
    } finally {
      setIsCheckingCode(false);
    }
  };

  // Invitation Code Redeem & Link Handler
  const handleRedeemInviteCode = async () => {
    if (!gateInviteLookup?.isValid) return;
    
    // Construct user object if guest
    const userToLink: AuthUser = currentUser && currentUser.id && !currentUser.id.startsWith('usr-default')
      ? currentUser
      : {
          id: `usr-${Date.now()}`,
          username: effectiveUserName || 'مستخدم جديد',
          fullName: effectiveUserName || 'مستخدم جديد',
          role: gateInviteLookup.role || 'student',
          email: `${Date.now()}@student.platform.local`,
          schoolId: gateInviteLookup.schoolId || 'kharj-science-complex',
          createdAt: new Date().toISOString(),
        };

    setIsRedeemingCode(true);
    setGateFeedback(null);
    try {
      const linkRes = await redeemInvitationAndLinkUser(
        gateInviteCode.trim(),
        userToLink,
        gateInviteLookup
      );
      if (linkRes.success) {
        setGateFeedback({ type: 'success', text: linkRes.message });
        await runEligibilityCheck();
        if (onSchoolJoined) onSchoolJoined();
        setTimeout(() => {
          setShowGateModal(false);
          setGateActionTab('options');
          setGateInviteLookup(null);
          setGateInviteCode('');
        }, 1800);
      } else {
        setGateFeedback({ type: 'error', text: linkRes.message });
      }
    } catch (err: any) {
      setGateFeedback({ type: 'error', text: err.message || 'فشل الانضمام للمدرسة' });
    } finally {
      setIsRedeemingCode(false);
    }
  };

  // New School Registration Submit Handler
  const handleSubmitNewSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolApplicantName.trim()) {
      setGateFeedback({ type: 'error', text: 'يرجى إدخال اسم المدرسة واسم مقدم الطلب.' });
      return;
    }
    setIsSubmittingNewSchool(true);
    setGateFeedback(null);
    try {
      const res = await submitNewSchoolRegistrationRequest({
        schoolName: newSchoolName.trim(),
        stage: newSchoolStage,
        region: newSchoolRegion,
        city: newSchoolCity,
        applicantName: newSchoolApplicantName.trim(),
        applicantEmail: newSchoolApplicantEmail.trim() || (currentUser?.email || ''),
        applicantPhone: newSchoolApplicantPhone.trim(),
        notes: newSchoolNotes.trim()
      });
      if (res.success) {
        setGateFeedback({ type: 'success', text: res.message });
        await runEligibilityCheck();
      } else {
        setGateFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setGateFeedback({ type: 'error', text: err.message || 'فشل إرسال طلب تسجيل المدرسة.' });
    } finally {
      setIsSubmittingNewSchool(false);
    }
  };

  // -------------------------------------------------------------
  // 1. SUPPORT TICKETS STATE
  // -------------------------------------------------------------
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(propTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketAttachment, setTicketAttachment] = useState<{ file: File; name: string } | null>(null);
  const [isSubmittingTicketReply, setIsSubmittingTicketReply] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'جديد' | 'قيد المعالجة' | 'مكتمل'>('all');

  // New Ticket Modal State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicket['category']>('استفسار أكاديمي');
  const [newTicketPriority, setNewTicketPriority] = useState<SupportTicket['priority']>('متوسط');
  const [newTicketInitialMsg, setNewTicketInitialMsg] = useState('');
  const [newTicketAttachment, setNewTicketAttachment] = useState<{ file: File; name: string } | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // -------------------------------------------------------------
  // 2. PEER STUDY ROOMS STATE
  // -------------------------------------------------------------
  const defaultStudyGroups: StudyGroup[] = [
    {
      id: 'group-1',
      name: 'غرفة مذاكرة العلوم - الثالث المتوسط',
      subject: 'العلوم العامة',
      grade: 'الصف الثالث المتوسط',
      membersCount: 28,
      icon: '🔬',
      description: 'مناقشة دروس الجدول الدوري، التفاعلات الكيميائية، وأسئلة الاختبارات الشهرية.'
    },
    {
      id: 'group-2',
      name: 'نادي الرياضيات والمسائل المتقدمة',
      subject: 'الرياضيات',
      grade: 'الصف الثالث المتوسط',
      membersCount: 34,
      icon: '📐',
      description: 'حل الواجبات والتمارين الرياضية الصعبة وتبادل خطوات الحل النموذجي.'
    },
    {
      id: 'group-3',
      name: 'ملتقى الكيمياء والأحياء العملي',
      subject: 'الأحياء والكيمياء',
      grade: 'الصف الثاني المتوسط',
      membersCount: 19,
      icon: '🧬',
      description: 'مناقشة التجارب المعملية والمجسمات ثلاثية الأبعاد التفاعلية.'
    }
  ];

  const [studyRooms, setStudyRooms] = useState<StudyGroup[]>(
    propStudyGroups.length > 0 ? propStudyGroups : defaultStudyGroups
  );
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup>(
    studyRooms[0] || defaultStudyGroups[0]
  );
  const [studyRoomMessages, setStudyRoomMessages] = useState<StudyGroupMessage[]>(propGroupMessages);
  const [groupMsgText, setGroupMsgText] = useState('');
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [studyAttachment, setStudyAttachment] = useState<{ file: File; name: string } | null>(null);

  // Study Room Membership & Invitation State
  const [roomMembers, setRoomMembers] = useState<Array<{
    roomId: string;
    userId: string;
    fullName: string;
    username: string;
    role: string;
    memberRole: 'owner' | 'supervisor' | 'member';
    joinedAt: string;
    isMuted: boolean;
  }>>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [availableSchoolUsers, setAvailableSchoolUsers] = useState<UserProfile[]>([]);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRoleInRoom, setInviteRoleInRoom] = useState<'member' | 'supervisor'>('member');
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // New Room Creation State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('العلوم العامة');
  const [newRoomGrade, setNewRoomGrade] = useState('الصف الثالث المتوسط');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomIcon, setNewRoomIcon] = useState('🔬');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // -------------------------------------------------------------
  // 3. DIRECT & ROLE-BASED CONVERSATIONS STATE
  // -------------------------------------------------------------
  const [conversations, setConversations] = useState<SchoolConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SchoolConversation | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directMsgText, setDirectMsgText] = useState('');
  const [directAttachment, setDirectAttachment] = useState<{ file: File; name: string } | null>(null);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvRole, setNewConvRole] = useState<UserRole>('teacher');
  const [newConvTitle, setNewConvTitle] = useState('');
  const [newConvTargetName, setNewConvTargetName] = useState('أ. عبد العزيز الشمري (معلم العلوم)');
  const [newConvInitialMsg, setNewConvInitialMsg] = useState('');
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  // -------------------------------------------------------------
  // 4. SYSTEM STATE & REALTIME NOTIFICATIONS
  // -------------------------------------------------------------
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Incoming realtime toast notification
  const [incomingToast, setIncomingToast] = useState<{
    id: string;
    senderName: string;
    senderRole?: string;
    text: string;
    channelTitle: string;
    type: 'direct' | 'ticket' | 'room';
    targetId: string;
  } | null>(null);

  // Idempotency tracking to prevent duplicate notifications & alerts
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

  // Mutable refs to prevent stale closure in Realtime event handlers
  const selectedConversationRef = useRef<SchoolConversation | null>(selectedConversation);
  const selectedTicketRef = useRef<SupportTicket | null>(selectedTicket);
  const selectedGroupRef = useRef<StudyGroup | null>(selectedGroup);
  const activeTabRef = useRef<'direct' | 'circulars' | 'announcements' | 'tickets' | 'groups'>(activeTab);
  const effectiveUserIdRef = useRef<string>(effectiveUserId);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    effectiveUserIdRef.current = effectiveUserId;
  }, [effectiveUserId]);

  // Gentle audio chime for incoming messages
  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback permission / safe fallback
    }
  };

  // Auto-dismiss incoming toast after 5.5 seconds
  useEffect(() => {
    if (incomingToast) {
      const timer = setTimeout(() => {
        setIncomingToast(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [incomingToast]);

  const ticketFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const studyFileInputRef = useRef<HTMLInputElement>(null);
  const circularFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // DATA LOADING & REALTIME SUBSCRIPTIONS
  // -------------------------------------------------------------
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Tickets
      const dbTickets = await fetchSchoolTickets(activeSchoolId, effectiveUserId, currentRole);
      if (dbTickets.length > 0) {
        setTicketsList(dbTickets);
        if (!selectedTicket || !dbTickets.some(t => t.id === selectedTicket.id)) {
          setSelectedTicket(dbTickets[0]);
        }
        dbTickets.forEach(t => t.messages.forEach(m => notifiedMessageIdsRef.current.add(m.id)));
      } else if (propTickets.length > 0) {
        setTicketsList(propTickets);
        if (!selectedTicket) setSelectedTicket(propTickets[0]);
      }

      // 2. Study Rooms
      const dbRooms = await fetchSchoolStudyRooms(activeSchoolId);
      if (dbRooms.length > 0) {
        setStudyRooms(dbRooms);
        setSelectedGroup(prev => dbRooms.find(r => r.id === prev.id) || dbRooms[0]);
      }

      // 3. Conversations
      const dbConvs = await fetchSchoolConversations(activeSchoolId, effectiveUserId);
      if (dbConvs.length > 0) {
        setConversations(dbConvs);
        if (!selectedConversation || !dbConvs.some(c => c.id === selectedConversation.id)) {
          setSelectedConversation(dbConvs[0]);
          markConversationAsRead(dbConvs[0].id, effectiveUserId, activeSchoolId);
        }
      }

      // 4. Allowed Contacts based on real database relationships
      const contacts = await fetchUserAllowedContacts(activeSchoolId, {
        id: effectiveUserId,
        role: currentRole,
        gradeName: initialStudentProfile?.grade || 'الصف الثالث المتوسط',
        classroomName: '3/1'
      });
      setAllowedContacts(contacts);

      // 5. School Circulars
      const circs = await fetchSchoolCirculars(activeSchoolId, { id: effectiveUserId, role: currentRole });
      setCircularsList(circs);
      if (circs.length > 0 && !selectedCircular) {
        setSelectedCircular(circs[0]);
      }

      // 6. School Announcements
      const anns = await fetchSchoolAnnouncements(activeSchoolId, { id: effectiveUserId, role: currentRole });
      setAnnouncementsList(anns);
    } catch (err) {
      console.warn('Error loading messaging data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeSchoolId, effectiveUserId, currentRole]);

  // Select a conversation and update last_read_at in database & state
  const handleSelectConversation = (conv: SchoolConversation) => {
    setSelectedConversation(conv);
    markConversationAsRead(conv.id, effectiveUserId, activeSchoolId);
    setConversations(prev => prev.map(c => {
      if (c.id === conv.id) {
        const nowIso = new Date().toISOString();
        return {
          ...c,
          members: (c.members || []).map(m => m.userId === effectiveUserId ? { ...m, lastReadAt: nowIso } : m)
        };
      }
      return c;
    }));
  };

  // Helper to check if a conversation has unread messages for current user
  const isConvUnread = (conv: SchoolConversation) => {
    if (selectedConversation?.id === conv.id && activeTab === 'direct') return false;
    const myMember = conv.members?.find(m => m.userId === effectiveUserId);
    if (!myMember) {
      return !!conv.lastMessage && conv.createdBy !== effectiveUserId;
    }
    if (!myMember.lastReadAt) {
      return !!conv.lastMessage && conv.createdBy !== effectiveUserId;
    }
    const myReadTime = new Date(myMember.lastReadAt).getTime();
    const convUpdatedTime = conv.updatedAt ? new Date(conv.updatedAt).getTime() : 0;
    return convUpdatedTime > (myReadTime + 1000);
  };

  // Load direct messages when selected conversation changes & mark as read
  useEffect(() => {
    if (selectedConversation) {
      fetchDirectMessages(selectedConversation.id).then(msgs => {
        if (msgs && msgs.length > 0) {
          setDirectMessages(msgs);
          msgs.forEach(m => notifiedMessageIdsRef.current.add(m.id));
        } else {
          // Default initial greeting if newly created
          setDirectMessages([
            {
              id: `init-${selectedConversation.id}`,
              conversationId: selectedConversation.id,
              senderId: selectedConversation.createdBy,
              senderName: selectedConversation.createdByName || 'المشرف',
              senderRole: selectedConversation.createdByRole || 'teacher',
              text: selectedConversation.lastMessage || 'مرحباً بكم في هذه القناة الرسمية للتواصل المدرسي.',
              timestamp: 'الآن'
            }
          ]);
        }
      });

      // Update last_read_at in Supabase when opening conversation
      markConversationAsRead(selectedConversation.id, effectiveUserId, activeSchoolId);
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConversation.id) {
          const nowIso = new Date().toISOString();
          return {
            ...c,
            members: (c.members || []).map(m => m.userId === effectiveUserId ? { ...m, lastReadAt: nowIso } : m)
          };
        }
        return c;
      }));
    }
  }, [selectedConversation?.id, effectiveUserId, activeSchoolId]);

  // Load study room messages and members when selected room changes
  useEffect(() => {
    if (selectedGroup) {
      fetchStudyRoomMessages(selectedGroup.id).then(msgs => {
        if (msgs && msgs.length > 0) {
          setStudyRoomMessages(msgs);
          msgs.forEach(m => notifiedMessageIdsRef.current.add(m.id));
        } else {
          const matchedPropMsgs = propGroupMessages.filter(m => m.groupId === selectedGroup.id);
          if (matchedPropMsgs.length > 0) {
            setStudyRoomMessages(matchedPropMsgs);
          }
        }
      });

      // Fetch real members of the study room
      setIsLoadingMembers(true);
      fetchStudyRoomMembers(selectedGroup.id).then(members => {
        setRoomMembers(members);
        if (members.length > 0) {
          setSelectedGroup(prev => ({ ...prev, membersCount: members.length }));
        }
        setIsLoadingMembers(false);
      });
    }
  }, [selectedGroup?.id, propGroupMessages]);

  // Load available school profiles for member invitations
  useEffect(() => {
    if (activeSchoolId) {
      fetchSchoolProfiles(activeSchoolId).then(profs => {
        setAvailableSchoolUsers(profs);
      });
    }
  }, [activeSchoolId]);

  // Supabase Realtime: 1. Main channel for conversations & ticket metadata updates
  useEffect(() => {
    if (!isSupabaseConfigured || !activeSchoolId) return;

    const channel = supabase
      .channel(`school_meta_${activeSchoolId}`)
      // 1. Listen to Conversations list updates (new chats, last message updates)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `school_id=eq.${activeSchoolId}` },
        (payload) => {
          const updatedConv = payload.new as any;
          if (!updatedConv || !updatedConv.id) return;

          if (payload.eventType === 'INSERT') {
            setConversations(prev => {
              if (prev.some(c => c.id === updatedConv.id)) return prev;
              return [
                {
                  id: updatedConv.id,
                  schoolId: updatedConv.school_id,
                  conversationType: updatedConv.conversation_type,
                  title: updatedConv.title,
                  createdBy: updatedConv.created_by,
                  createdByName: updatedConv.created_by_name,
                  createdByRole: updatedConv.created_by_role,
                  createdAt: updatedConv.created_at,
                  updatedAt: updatedConv.updated_at,
                  lastMessage: updatedConv.last_message,
                  lastMessageTime: 'الآن',
                  members: []
                },
                ...prev
              ];
            });
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => prev.map(c => {
              if (c.id === updatedConv.id) {
                return {
                  ...c,
                  title: updatedConv.title || c.title,
                  lastMessage: updatedConv.last_message || c.lastMessage,
                  lastMessageTime: 'الآن',
                  updatedAt: updatedConv.updated_at || new Date().toISOString()
                };
              }
              return c;
            }));
          }
        }
      )
      // 2. Listen to Support Tickets updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets', filter: `school_id=eq.${activeSchoolId}` },
        () => {
          fetchSchoolTickets(activeSchoolId, effectiveUserIdRef.current, currentRole).then(data => {
            if (data.length > 0) setTicketsList(data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSchoolId]);

  // Supabase Realtime: 2. Specific per-conversation channel (Strict Conversation Isolation)
  useEffect(() => {
    if (!isSupabaseConfigured || !selectedConversation?.id) return;

    const convId = selectedConversation.id;
    const channel = supabase
      .channel(`conv_stream_${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const newDm = payload.new as any;
          if (!newDm || !newDm.id) return;

          // Deduplication: prevent duplicate processing
          if (notifiedMessageIdsRef.current.has(newDm.id)) return;
          notifiedMessageIdsRef.current.add(newDm.id);

          const currentUserId = effectiveUserIdRef.current;

          // Append message immediately
          setDirectMessages(prev => {
            if (prev.some(m => m.id === newDm.id)) return prev;
            return [
              ...prev,
              {
                id: newDm.id,
                conversationId: newDm.conversation_id,
                senderId: newDm.sender_id,
                senderName: newDm.sender_name,
                senderRole: newDm.sender_role,
                senderAvatar: newDm.sender_avatar,
                text: newDm.text,
                timestamp: 'الآن',
                attachmentUrl: newDm.attachment_url,
                attachmentName: newDm.attachment_name,
                problemCitation: newDm.problem_citation,
                homeworkCitation: newDm.homework_citation
              }
            ];
          });

          // Mark conversation as read in DB and local state
          markConversationAsRead(convId, currentUserId, activeSchoolId);
          setConversations(prev => prev.map(c => {
            if (c.id === convId) {
              const nowIso = new Date().toISOString();
              return {
                ...c,
                lastMessage: newDm.text.substring(0, 80),
                lastMessageTime: 'الآن',
                updatedAt: nowIso,
                members: (c.members || []).map(m => m.userId === currentUserId ? { ...m, lastReadAt: nowIso } : m)
              };
            }
            return c;
          }));

          // Sound effect if from the other party
          if (newDm.sender_id !== currentUserId) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, activeSchoolId]);

  // Supabase Realtime: 3. Specific per-study-room channel (Room Isolation)
  useEffect(() => {
    if (!isSupabaseConfigured || !selectedGroup?.id) return;

    const roomId = selectedGroup.id;
    const channel = supabase
      .channel(`room_stream_${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSrm = payload.new as any;
            if (!newSrm || !newSrm.id) return;
            if (notifiedMessageIdsRef.current.has(newSrm.id)) return;
            notifiedMessageIdsRef.current.add(newSrm.id);

            const currentUserId = effectiveUserIdRef.current;

            setStudyRoomMessages(prev => {
              if (prev.some(m => m.id === newSrm.id)) return prev;
              return [
                ...prev,
                {
                  id: newSrm.id,
                  groupId: newSrm.room_id,
                  schoolId: newSrm.school_id,
                  senderId: newSrm.sender_id,
                  senderName: newSrm.sender_name,
                  senderRole: newSrm.sender_role,
                  senderAvatar: newSrm.sender_avatar || '🧑‍🎓',
                  text: newSrm.text,
                  timestamp: 'الآن',
                  isDeleted: newSrm.is_deleted,
                  deletedBy: newSrm.deleted_by,
                  isFlagged: newSrm.is_flagged,
                  problemCitation: newSrm.problem_citation,
                  homeworkCitation: newSrm.homework_citation,
                  attachmentUrl: newSrm.attachment_url,
                  attachmentName: newSrm.attachment_name
                }
              ];
            });

            if (newSrm.sender_id !== currentUserId) {
              playNotificationSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedSrm = payload.new as any;
            if (updatedSrm && updatedSrm.is_deleted) {
              setStudyRoomMessages(prev => prev.map(m => {
                if (m.id === updatedSrm.id) {
                  return { ...m, isDeleted: true, deletedBy: updatedSrm.deleted_by || 'المشرف' };
                }
                return m;
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroup?.id]);

  // Supabase Realtime: 4. Specific per-ticket channel (Ticket Isolation)
  useEffect(() => {
    if (!isSupabaseConfigured || !selectedTicket?.id) return;

    const ticketId = selectedTicket.id;
    const channel = supabase
      .channel(`ticket_stream_${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.id) return;
          if (notifiedMessageIdsRef.current.has(newMsg.id)) return;
          notifiedMessageIdsRef.current.add(newMsg.id);

          const currentUserId = effectiveUserIdRef.current;

          setSelectedTicket(prev => {
            if (!prev || prev.id !== ticketId) return prev;
            if (prev.messages.some(m => m.id === newMsg.id)) return prev;
            return {
              ...prev,
              lastUpdated: 'الآن',
              messages: [
                ...prev.messages,
                {
                  id: newMsg.id,
                  ticketId: newMsg.ticket_id,
                  senderId: newMsg.sender_id,
                  senderRole: newMsg.sender_role,
                  senderName: newMsg.sender_name,
                  senderAvatar: newMsg.sender_avatar,
                  text: newMsg.text,
                  timestamp: 'الآن',
                  attachmentName: newMsg.attachment_name,
                  attachmentUrl: newMsg.attachment_url
                }
              ]
            };
          });

          if (newMsg.sender_id !== currentUserId) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  // -------------------------------------------------------------
  // HANDLERS: SUPPORT TICKETS
  // -------------------------------------------------------------
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) {
      setShowNewTicketModal(false);
      return;
    }
    if (!newTicketSubject.trim() || !newTicketInitialMsg.trim()) return;

    setIsCreatingTicket(true);
    let uploadedAttUrl: string | undefined;
    let uploadedAttName: string | undefined;

    if (newTicketAttachment) {
      const uploadRes = await uploadMessageAttachment(newTicketAttachment.file, activeSchoolId);
      if (uploadRes) {
        uploadedAttUrl = uploadRes.url;
        uploadedAttName = uploadRes.name;
      }
    }

    const created = await createSupportTicket({
      schoolId: activeSchoolId,
      userId: effectiveUserId,
      studentName: effectiveUserName,
      grade: initialStudentProfile?.grade || 'الصف الثالث المتوسط',
      category: newTicketCategory,
      subject: newTicketSubject,
      priority: newTicketPriority,
      initialMessage: newTicketInitialMsg,
      senderRole: currentRole,
      attachmentName: uploadedAttName,
      attachmentUrl: uploadedAttUrl
    });

    setIsCreatingTicket(false);

    if (created) {
      setTicketsList(prev => [created, ...prev]);
      setSelectedTicket(created);
      if (onAddTicket) onAddTicket(created);
    }

    setShowNewTicketModal(false);
    setNewTicketSubject('');
    setNewTicketInitialMsg('');
    setNewTicketAttachment(null);
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) return;
    if (!selectedTicket || (!ticketReplyText.trim() && !ticketAttachment)) return;

    setIsSubmittingTicketReply(true);
    let uploadedAttUrl: string | undefined;
    let uploadedAttName: string | undefined;

    if (ticketAttachment) {
      const uploadRes = await uploadMessageAttachment(ticketAttachment.file, activeSchoolId);
      if (uploadRes) {
        uploadedAttUrl = uploadRes.url;
        uploadedAttName = uploadRes.name;
      }
    }

    const senderDisplayName =
      currentRole === 'student'
        ? effectiveUserName
        : currentRole === 'admin' || currentRole === 'school_admin' || currentRole === 'principal'
        ? `إدارة المدرسة - ${effectiveUserName}`
        : currentRole === 'counselor'
        ? `الموجه الطلابي - ${effectiveUserName}`
        : currentRole === 'parent'
        ? `ولي الأمر - ${effectiveUserName}`
        : `المعلم - ${effectiveUserName}`;

    const newReply = await addTicketReply({
      ticketId: selectedTicket.id,
      schoolId: activeSchoolId,
      senderId: effectiveUserId,
      senderName: senderDisplayName,
      senderRole: currentRole,
      text: ticketReplyText,
      attachmentName: uploadedAttName,
      attachmentUrl: uploadedAttUrl
    });

    setIsSubmittingTicketReply(false);

    if (newReply) {
      const updatedTicket: SupportTicket = {
        ...selectedTicket,
        lastUpdated: 'الآن',
        status: currentRole !== 'student' ? 'قيد المعالجة' : selectedTicket.status,
        messages: [...selectedTicket.messages, newReply]
      };

      setSelectedTicket(updatedTicket);
      setTicketsList(prev => prev.map(t => (t.id === selectedTicket.id ? updatedTicket : t)));

      if (onAddTicketMessage) {
        onAddTicketMessage(selectedTicket.id, ticketReplyText, currentRole, senderDisplayName);
      }
    }

    setTicketReplyText('');
    setTicketAttachment(null);
  };

  const handleTicketStatusChange = async (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;
    if (!checkEligibilityOrOpenGate()) return;
    await updateTicketStatus(selectedTicket.id, newStatus);
    const updated = { ...selectedTicket, status: newStatus, lastUpdated: 'الآن' };
    setSelectedTicket(updated);
    setTicketsList(prev => prev.map(t => (t.id === selectedTicket.id ? updated : t)));
  };

  // -------------------------------------------------------------
  // HANDLERS: DIRECT CONVERSATIONS
  // -------------------------------------------------------------
  const handleCreateConversationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) {
      setShowNewConvModal(false);
      return;
    }
    if (!newConvTitle.trim()) return;

    setIsCreatingConv(true);

    const conv = await createConversation({
      schoolId: activeSchoolId,
      conversationType: newConvRole === 'counselor' ? 'counseling' : newConvRole === 'parent' ? 'parent_teacher' : 'direct',
      title: newConvTitle,
      createdBy: effectiveUserId,
      createdByName: effectiveUserName,
      createdByRole: currentRole,
      members: [
        {
          userId: effectiveUserId,
          userName: effectiveUserName,
          userRole: currentRole
        },
        {
          userId: `usr-${newConvRole}-target`,
          userName: newConvTargetName,
          userRole: newConvRole
        }
      ],
      initialMessage: newConvInitialMsg || 'السلام عليكم ورحمة الله وبركاته، تم فتح قناة التواصل الرسمية.'
    });

    setIsCreatingConv(false);

    if (conv) {
      setConversations(prev => [conv, ...prev]);
      setSelectedConversation(conv);
      setShowNewConvModal(false);
      setNewConvTitle('');
      setNewConvInitialMsg('');
    }
  };

  const handleSendDirectMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) return;
    if (!selectedConversation || (!directMsgText.trim() && !directAttachment)) return;

    // AI Moderation check
    const containsBanned = BANNED_KEYWORDS.some(w => directMsgText.includes(w));
    if (containsBanned) {
      setModerationWarning('عفواً، تم رصد محتوى غير لائق بقواعد الأمان المدرسي. تم حظر الإرسال.');
      await createModerationAuditLog({
        schoolId: activeSchoolId,
        actorName: effectiveUserName,
        actorRole: currentRole,
        action: 'تنبيه فلترة آلية',
        targetUser: selectedConversation.title,
        details: `محاولة إرسال محتوى مخالف في محادثة ${selectedConversation.title}: "${directMsgText.substring(0, 30)}..."`,
        severity: 'عالي'
      });
      return;
    }

    setModerationWarning(null);
    let attUrl: string | undefined;
    let attName: string | undefined;

    if (directAttachment) {
      const up = await uploadMessageAttachment(directAttachment.file, activeSchoolId);
      if (up) {
        attUrl = up.url;
        attName = up.name;
      }
    }

    const sent = await sendDirectMessage({
      conversationId: selectedConversation.id,
      schoolId: activeSchoolId,
      senderId: effectiveUserId,
      senderName: effectiveUserName,
      senderRole: currentRole,
      text: directMsgText,
      attachmentUrl: attUrl,
      attachmentName: attName
    });

    if (sent) {
      setDirectMessages(prev => [...prev, sent]);
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: directMsgText, lastMessageTime: 'الآن', updatedAt: new Date().toISOString() }
            : c
        )
      );
    }

    setDirectMsgText('');
    setDirectAttachment(null);
  };

  // -------------------------------------------------------------
  // HANDLERS: DIRECT CHAT WITH REAL CONTACTS
  // -------------------------------------------------------------
  const handleStartDirectChatWithUser = async (target: {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
    title?: string;
  }) => {
    if (!checkEligibilityOrOpenGate()) return;
    setIsStartingDirectChat(true);
    try {
      const conv = await createOrGetDirectConversation({
        schoolId: activeSchoolId,
        currentUser: { id: effectiveUserId, name: effectiveUserName, role: currentRole },
        targetUser: { id: target.id, name: target.name, role: target.role, avatar: target.avatar },
        title: `محادثة مع ${target.name} (${target.title || (target.role === 'teacher' ? 'معلم' : target.role === 'parent' ? 'ولي أمر' : target.role === 'student' ? 'طالب' : 'إدارة')})`,
        initialMessage: 'مرحباً، أود التواصل معك بخصوص الشأن المدرسي والتعليمي.'
      });
      if (conv) {
        setConversations(prev => {
          const exists = prev.some(c => c.id === conv.id);
          return exists ? prev : [conv, ...prev];
        });
        setSelectedConversation(conv);
        setActiveTab('direct');
        setActiveDirectSubView('conversations');
      }
    } catch (err) {
      console.warn('Error starting direct conversation:', err);
    } finally {
      setIsStartingDirectChat(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: SCHOOL CIRCULARS & CONFIRMATION
  // -------------------------------------------------------------
  const handleCreateCircularSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) return;
    if (!newCircTitle.trim() || !newCircContent.trim()) return;

    setIsCreatingCircular(true);
    let attUrl: string | undefined;
    let attName: string | undefined;

    if (newCircAttachment) {
      const up = await uploadMessageAttachment(newCircAttachment.file, activeSchoolId);
      if (up) {
        attUrl = up.url;
        attName = up.name;
      }
    }

    const created = await createSchoolCircular({
      schoolId: activeSchoolId,
      title: newCircTitle.trim(),
      circularNumber: newCircNumber.trim() || undefined,
      content: newCircContent.trim(),
      circularType: newCircCategory,
      targetAudience: newCircAudience,
      targetGrade: newCircGrade || undefined,
      targetClass: newCircClass || undefined,
      priority: newCircPriority,
      requiresReadConfirmation: newCircRequiresAck,
      attachmentName: attName,
      attachmentUrl: attUrl,
      creator: { id: effectiveUserId, name: effectiveUserName, role: currentRole }
    });

    setIsCreatingCircular(false);

    if (created) {
      setCircularsList(prev => [created, ...prev]);
      setSelectedCircular(created);
      setShowNewCircularModal(false);
      setNewCircTitle('');
      setNewCircContent('');
      setNewCircNumber('');
      setNewCircAttachment(null);
    }
  };

  const handleAcknowledgeCircularSubmit = async (circularId: string) => {
    if (!checkEligibilityOrOpenGate()) return;
    setIsAcknowledging(true);
    const ok = await acknowledgeCircular(circularId, {
      id: effectiveUserId,
      name: effectiveUserName,
      role: currentRole,
      schoolId: activeSchoolId
    });
    setIsAcknowledging(false);
    if (ok) {
      setCircularsList(prev => prev.map(c => {
        if (c.id === circularId) {
          return {
            ...c,
            isAcknowledgedByMe: true,
            acknowledgedAt: new Date().toISOString(),
            stats: c.stats ? { ...c.stats, confirmedCount: (c.stats.confirmedCount || 0) + 1 } : undefined
          };
        }
        return c;
      }));
      if (selectedCircular?.id === circularId) {
        setSelectedCircular(prev => prev ? {
          ...prev,
          isAcknowledgedByMe: true,
          acknowledgedAt: new Date().toISOString(),
          stats: prev.stats ? { ...prev.stats, confirmedCount: (prev.stats.confirmedCount || 0) + 1 } : undefined
        } : null);
      }
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: SCHOOL ANNOUNCEMENTS
  // -------------------------------------------------------------
  const handleCreateAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) return;
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    setIsCreatingAnnouncement(true);
    const created = await createSchoolAnnouncement({
      schoolId: activeSchoolId,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      targetAudience: newAnnAudience,
      gradeName: newAnnGrade || undefined,
      classroomName: newAnnClass || undefined,
      creator: { id: effectiveUserId, name: effectiveUserName, role: currentRole },
      isUrgent: newAnnIsUrgent
    });

    setIsCreatingAnnouncement(false);
    if (created) {
      setAnnouncementsList(prev => [created, ...prev]);
      setShowNewAnnouncementModal(false);
      setNewAnnTitle('');
      setNewAnnContent('');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: STUDY ROOMS & AI CONTENT GUARD
  // -------------------------------------------------------------
  const handleSendGroupMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEligibilityOrOpenGate()) return;
    if (!groupMsgText.trim() && !studyAttachment) return;

    // AI Content Moderation Guard
    const containsBanned = BANNED_KEYWORDS.some(word => groupMsgText.includes(word));

    if (containsBanned) {
      setModerationWarning('عفواً، تم رصد محتوى غير لائق أو مخالف بقواعد الأمان الرقمي المدرسي. تم حظر النشر وإشعار المشرف.');

      const auditLogItem: ModerationAuditLogItem = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        actorName: 'نظام الفلترة الآلي (AI Content Guard)',
        actorRole: 'school_admin',
        action: 'تنبيه فلترة آلية',
        targetUser: effectiveUserName,
        details: `محاولة نشر محتوى مخالف في ${selectedGroup.name}: "${groupMsgText.substring(0, 30)}..."`,
        severity: 'عالي'
      };

      await createModerationAuditLog({
        schoolId: activeSchoolId,
        actorName: auditLogItem.actorName,
        actorRole: 'school_admin',
        action: auditLogItem.action,
        targetUser: auditLogItem.targetUser,
        details: auditLogItem.details,
        severity: auditLogItem.severity
      });

      if (onAddAuditLog) onAddAuditLog(auditLogItem);
      return;
    }

    setModerationWarning(null);

    let attUrl: string | undefined;
    let attName: string | undefined;
    if (studyAttachment) {
      const up = await uploadMessageAttachment(studyAttachment.file, activeSchoolId);
      if (up) {
        attUrl = up.url;
        attName = up.name;
      }
    }

    const sent = await sendStudyRoomMessage({
      roomId: selectedGroup.id,
      schoolId: activeSchoolId,
      senderId: effectiveUserId,
      senderName: currentRole === 'student' ? effectiveUserName : `المعلم ${effectiveUserName}`,
      senderRole: currentRole,
      senderAvatar: currentRole === 'student' ? '🧑‍🎓' : '👨‍🏫',
      text: groupMsgText,
      attachmentUrl: attUrl,
      attachmentName: attName
    });

    if (sent) {
      setStudyRoomMessages(prev => [...prev, sent]);
      if (onSendGroupMessage) {
        onSendGroupMessage(selectedGroup.id, groupMsgText);
      }
    }

    setGroupMsgText('');
    setStudyAttachment(null);
  };

  const handleHomeworkSubmit = async (citation: HomeworkCitation) => {
    if (!checkEligibilityOrOpenGate()) {
      setShowHomeworkModal(false);
      return;
    }
    const sent = await sendStudyRoomMessage({
      roomId: selectedGroup.id,
      schoolId: activeSchoolId,
      senderId: effectiveUserId,
      senderName: currentRole === 'student' ? effectiveUserName : `المعلم ${effectiveUserName}`,
      senderRole: currentRole,
      senderAvatar: currentRole === 'student' ? '🧑‍🎓' : '👨‍🏫',
      text: `📌 واجب دراسي جديد: ${citation.title}`,
      homeworkCitation: citation
    });

    if (sent) {
      setStudyRoomMessages(prev => [...prev, sent]);
    }
    setShowHomeworkModal(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!checkEligibilityOrOpenGate()) return;
    const actor = currentRole === 'admin' || currentRole === 'principal' ? 'المشرف الإداري' : effectiveUserName;
    await deleteStudyRoomMessage(messageId, actor, activeSchoolId);

    setStudyRoomMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, isDeleted: true, deletedBy: actor } : m))
    );

    if (onDeleteGroupMessage) {
      onDeleteGroupMessage(messageId, actor);
    }
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsCreatingRoom(true);
    const created = await createStudyRoom({
      schoolId: activeSchoolId,
      name: newRoomName.trim(),
      subject: newRoomSubject,
      grade: newRoomGrade,
      icon: newRoomIcon || '🔬',
      description: newRoomDescription.trim() || 'غرفة مذاكرة ونقاش علمي تفاعلي',
      createdBy: effectiveUserId
    });

    setIsCreatingRoom(false);
    if (created) {
      setStudyRooms(prev => [created, ...prev]);
      setSelectedGroup(created);
      setShowCreateRoomModal(false);
      setNewRoomName('');
      setNewRoomDescription('');
      fetchStudyRoomMembers(created.id).then(m => setRoomMembers(m));
    }
  };

  const handleInviteMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim() || !selectedGroup) return;

    setIsInvitingUser(true);
    setInviteFeedback(null);

    const success = await inviteUserToStudyRoom(
      selectedGroup.id,
      inviteUserId.trim(),
      inviteRoleInRoom
    );

    setIsInvitingUser(false);
    if (success) {
      setInviteFeedback('تمت إضافة العضو إلى الغرفة الدراسية بنجاح');
      setInviteUserId('');
      const updatedMembers = await fetchStudyRoomMembers(selectedGroup.id);
      setRoomMembers(updatedMembers);
      setSelectedGroup(prev => ({ ...prev, membersCount: updatedMembers.length }));
      setStudyRooms(prev => prev.map(r => r.id === selectedGroup.id ? { ...r, membersCount: updatedMembers.length } : r));
    } else {
      setInviteFeedback('تعذر إضافة العضو، يرجى التحقق من المستخدم');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    const ok = await removeUserFromStudyRoom(selectedGroup.id, userId);
    if (ok) {
      setRoomMembers(prev => prev.filter(m => m.userId !== userId));
      setSelectedGroup(prev => ({ ...prev, membersCount: Math.max(1, (prev.membersCount || 1) - 1) }));
      setStudyRooms(prev => prev.map(r => r.id === selectedGroup.id ? { ...r, membersCount: Math.max(1, (r.membersCount || 1) - 1) } : r));
    }
  };

  // Filtered tickets
  const filteredTickets = ticketsList.filter(t => {
    const matchesFilter = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
    const matchesSearch =
      ticketSearchQuery === '' ||
      t.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      t.studentName.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(ticketSearchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner - Spacious & Full-Width */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-blue-500/30 shadow-xl shadow-blue-500/10 space-y-5 relative overflow-hidden">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/20 shadow-inner">
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>نظام التواصل والتفاعل المدرسي</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Action Buttons: Refresh Data */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              title="تحديث البيانات"
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition flex items-center justify-center shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Title & Description */}
        <div className="relative z-10 space-y-2 max-w-4xl">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            التواصل المدرسي، التذاكر، وغرف المذاكرة
          </h2>

          <p className="text-blue-100 text-xs sm:text-sm lg:text-base leading-relaxed max-w-3xl">
            منظومة متكاملة للتواصل الرسمي بين الطالب، ولي الأمر، المعلم، والإدارة المدرسية، مع تذاكر استفسارات رسمية وغرف مذاكرة جماعية مخصصة للمدرسة.
          </p>
        </div>

        {/* User & School Metadata Chips */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 pt-2 text-xs text-blue-100">
          <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shadow-sm">
            المدرسة: <strong className="text-white">{currentSchool?.name || 'مدرسة هتاف النموذجية'}</strong>
          </span>
          <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shadow-sm">
            الحساب: <strong className="text-white">{effectiveUserName}</strong> ({currentRole === 'student' ? 'طالب' : currentRole === 'teacher' ? 'معلم' : currentRole === 'counselor' ? 'مرشد طلابي' : currentRole === 'parent' ? 'ولي أمر' : 'إدارة'})
          </span>
        </div>
      </div>

      {/* Main Tab Navigation Bar - Full Width & Extended */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('direct')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'direct'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
            }`}
          >
            <MessageCircle className={`w-4 h-4 shrink-0 ${activeTab === 'direct' ? 'text-white' : 'text-indigo-600'}`} />
            <span className="truncate">المحادثات والتواصل</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'direct' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {conversations.length}
            </span>
            {conversations.some(c => isConvUnread(c)) && (
              <span className="flex h-2.5 w-2.5 absolute top-2 left-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('circulars')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'circulars'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-amber-600'
            }`}
          >
            <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'circulars' ? 'text-white' : 'text-amber-600'}`} />
            <span className="truncate">التعاميم والاطلاع</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'circulars' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {circularsList.length}
            </span>
            {circularsList.some(c => c.requiresReadConfirmation && !c.isAcknowledgedByMe) && (
              <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                تأكيد مطلوب
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
            }`}
          >
            <Bell className={`w-4 h-4 shrink-0 ${activeTab === 'announcements' ? 'text-white' : 'text-blue-600'}`} />
            <span className="truncate">الإعلانات المدرسية</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'announcements' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {announcementsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-sky-700 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-700'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'tickets' ? 'text-white' : 'text-sky-600'}`} />
            <span className="truncate">التذاكر الرسمية</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {ticketsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 col-span-2 sm:col-span-1 ${
              activeTab === 'groups'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${activeTab === 'groups' ? 'text-white' : 'text-emerald-600'}`} />
            <span className="truncate">غرف المذاكرة</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'groups' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {studyRooms.length}
            </span>
          </button>
        </div>
      </div>

      {/* Access Restriction Banner if not eligible or pending */}
      {!eligibility.isEligible && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border-2 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md transition ${
            eligibility.accountStatus === 'pending' || eligibility.accountStatus === 'pending_review'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-950'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                eligibility.accountStatus === 'pending' || eligibility.accountStatus === 'pending_review'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base">
                  {eligibility.accountStatus === 'pending' || eligibility.accountStatus === 'pending_review'
                    ? 'الحساب قيد الاعتماد من إدارة المدرسة (Pending Approval)'
                    : 'يجب تسجيل الدخول أو الانضمام إلى مدرسة قبل استخدام التواصل المدرسي'}
                </h4>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    eligibility.accountStatus === 'pending' || eligibility.accountStatus === 'pending_review'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {eligibility.accountStatus === 'pending' ? 'قيد المراجعة' : 'وصول مقيّد'}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed max-w-3xl">
                {eligibility.message ||
                  'التواصل المدرسي، التذاكر الإدارية، وغرف المذاكرة مخصصة للطلاب والمعلمين المعتمدين في مدارسهم.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            {onOpenLoginModal && (!currentUser || currentUser.role === 'student' && !currentUser.schoolId) && (
              <button
                onClick={() => {
                  setGateActionTab('login');
                  setShowGateModal(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}

            <button
              onClick={() => {
                setGateActionTab('invitation');
                setShowGateModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>لدي رمز دعوة</span>
            </button>

            <button
              onClick={() => {
                setGateActionTab('register_school');
                setShowGateModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>تسجيل مدرسة جديدة</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB A: SUPPORT TICKETS & ADMINISTRATIVE INQUIRIES                         */}
      {/* ========================================================================= */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Tickets List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>تذاكر الاستفسار والتواصل ({filteredTickets.length})</span>
              </h3>

              <button
                onClick={() => {
                  if (checkEligibilityOrOpenGate()) {
                    setShowNewTicketModal(true);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition shadow-blue-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تكت جديد</span>
              </button>
            </div>

            {/* Search & Status Filter */}
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={ticketSearchQuery}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                  placeholder="بحث برقم التكت أو العنوان..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold">
                <span className="text-slate-400 text-[10px] me-1">الحالة:</span>
                {(['all', 'جديد', 'قيد المعالجة', 'مكتمل'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketStatusFilter(st)}
                    className={`px-2 py-1 rounded-lg transition ${
                      ticketStatusFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'الكل' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200 text-xs">
                  لا توجد تذاكر مطابقة لخيارات البحث الحالية.
                </div>
              ) : (
                filteredTickets.map((tkt) => {
                  const isSelected = selectedTicket?.id === tkt.id;

                  return (
                    <div
                      key={tkt.id}
                      onClick={() => setSelectedTicket(tkt)}
                      className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 relative ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-800 shadow-xl'
                          : 'bg-white text-slate-900 border-slate-200/80 hover:border-blue-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tkt.status === 'مكتمل'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tkt.status === 'قيد المعالجة'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {tkt.status}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                          {tkt.ticketNumber || tkt.id}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs leading-snug line-clamp-1">{tkt.subject}</h4>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/10">
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>{tkt.category}</span>
                        <span className={isSelected ? 'text-amber-300 font-bold' : 'text-blue-600 font-bold'}>
                          {tkt.studentName}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Ticket Chat & Actions */}
          <div className="lg:col-span-8">
            {selectedTicket ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/50 border border-slate-200/80 space-y-6 flex flex-col min-h-[560px]">
                {/* Ticket Header */}
                <div className="border-b border-slate-100 pb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                        {selectedTicket.category}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        الأولوية: <strong>{selectedTicket.priority}</strong>
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          selectedTicket.status === 'مكتمل'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedTicket.status === 'قيد المعالجة'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Changing controls for staff */}
                      {['admin', 'platform_admin', 'school_admin', 'principal', 'counselor'].includes(currentRole) && (
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleTicketStatusChange(e.target.value as any)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 font-bold outline-none"
                        >
                          <option value="جديد">حالة: جديد</option>
                          <option value="قيد المعالجة">حالة: قيد المعالجة</option>
                          <option value="مكتمل">حالة: مكتمل</option>
                          <option value="مغلق">حالة: مغلق</option>
                        </select>
                      )}

                      <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {selectedTicket.ticketNumber || selectedTicket.id}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">{selectedTicket.subject}</h3>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
                    <span>مرسل التكت: <strong>{selectedTicket.studentName}</strong> ({selectedTicket.grade})</span>
                    <span>تاريخ الإنشاء: {selectedTicket.createdAt}</span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-2">
                  {selectedTicket.messages.map((msg) => {
                    const isFromMe = msg.senderRole === currentRole;

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl max-w-xl space-y-1.5 ${
                          isFromMe
                            ? 'ms-auto bg-blue-600 text-white rounded-bl-none shadow-sm'
                            : 'me-auto bg-slate-100 text-slate-800 rounded-br-none border border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-90 font-bold">
                          <span>{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {/* Attachment Display */}
                        {msg.attachmentName && (
                          <div className="mt-2 bg-black/10 backdrop-blur-sm p-2.5 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate font-bold text-[11px]">{msg.attachmentName}</span>
                            </div>
                            {msg.attachmentUrl && (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-[10px] shrink-0 font-extrabold ms-2 hover:text-amber-300"
                              >
                                معاينة / تحميل
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendTicketReply} className="pt-4 border-t border-slate-100 space-y-2">
                  {ticketAttachment && (
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl text-xs flex items-center justify-between text-blue-900">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold truncate max-w-xs">{ticketAttachment.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTicketAttachment(null)}
                        className="text-rose-500 font-bold text-xs hover:text-rose-700"
                      >
                        ✕ إزالة
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="file"
                      ref={replyFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setTicketAttachment({ file: e.target.files[0], name: e.target.files[0].name });
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => replyFileInputRef.current?.click()}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition shrink-0"
                      title="إرفاق مستند أو صورة"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      placeholder="اكتب ردك أو استفسارك هنا..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingTicketReply}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmittingTicketReply ? 'جاري الإرسال...' : 'إرسال الرد'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-16 text-center text-slate-400 border border-slate-200 flex flex-col items-center justify-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-bold">اختر تكت استفسار لمشاهدة التفاصيل والردود المتبادلة</p>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  فتح استفسار جديد
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: DIRECT & ROLE-BASED CHANNELS (STUDENT, PARENT, TEACHER, COUNSELOR) */}
      {/* ========================================================================= */}
      {activeTab === 'direct' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Conversations & School Directory */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <span>المحادثات والتواصل المدرسي</span>
              </h3>

              <button
                onClick={() => {
                  if (checkEligibilityOrOpenGate()) {
                    setShowNewConvModal(true);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>محادثة جديدة</span>
              </button>
            </div>

            {/* Role-Specific Sub-Navigation Pills */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-[11px] font-bold overflow-x-auto">
              <button
                onClick={() => setActiveDirectSubView('conversations')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  activeDirectSubView === 'conversations'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المحادثات ({conversations.length})
              </button>

              {(currentRole === 'student' || currentRole === 'counselor' || currentRole === 'admin' || currentRole === 'principal') && (
                <button
                  onClick={() => setActiveDirectSubView('my_teachers')}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                    activeDirectSubView === 'my_teachers'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {currentRole === 'student' ? `معلموني (${allowedContacts.myTeachers.length})` : `معلمو المدرسة (${allowedContacts.myTeachers.length || allowedContacts.allSchoolTeachers.length})`}
                </button>
              )}

              {(currentRole === 'teacher' || currentRole === 'counselor' || currentRole === 'admin' || currentRole === 'principal') && (
                <button
                  onClick={() => setActiveDirectSubView('my_classes')}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                    activeDirectSubView === 'my_classes'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {currentRole === 'teacher' ? 'فصولي وطلابي' : 'الطلاب والفصول'}
                </button>
              )}

              {currentRole === 'parent' && (
                <button
                  onClick={() => setActiveDirectSubView('my_children')}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                    activeDirectSubView === 'my_children'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أبنائي ومعلموهم ({allowedContacts.myChildren.length})
                </button>
              )}

              <button
                onClick={() => setActiveDirectSubView('school_admin')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  activeDirectSubView === 'school_admin'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الإدارة والتوجيه ({allowedContacts.schoolAdmin.length})
              </button>
            </div>

            {/* 1. Subview: Active Conversations */}
            {activeDirectSubView === 'conversations' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {conversations.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                    <MessageCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold">لا توجد محادثات مباشرة جارية حالياً</p>
                    <p className="text-[11px] text-slate-500">اختر من قائمة معلميك أو إدارة المدرسة لبدء محادثة رسمية موثقة</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConversation?.id === conv.id;

                    const getRoleBadge = (type: string) => {
                      switch (type) {
                        case 'counseling':
                          return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">إرشاد طلابي</span>;
                        case 'parent_teacher':
                          return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ولي أمر ومعلم</span>;
                        case 'administrative':
                          return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">شؤون الطلاب</span>;
                        default:
                          return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">مباشر</span>;
                      }
                    };

                    const unread = isConvUnread(conv);

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 relative ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-800 shadow-xl'
                            : unread
                            ? 'bg-indigo-50/70 text-slate-900 border-indigo-200 hover:border-indigo-400 shadow-sm ring-1 ring-indigo-300/40'
                            : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {getRoleBadge(conv.conversationType)}
                            {unread && !isSelected && (
                              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                <span>جديد</span>
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                            {conv.lastMessageTime || 'الآن'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs leading-snug line-clamp-1">{conv.title}</h4>

                        <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-slate-300' : unread ? 'text-indigo-950 font-bold' : 'text-slate-500'}`}>
                          {conv.lastMessage || 'لا توجد رسائل سابقة'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/10">
                          <span className={isSelected ? 'text-indigo-300' : 'text-indigo-600'}>
                            {conv.createdByName || 'المشرف'}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                              <CheckCheck className="w-3 h-3" />
                              <span>مقروءة</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. Subview: My Teachers (معلموني الفعليين) */}
            {activeDirectSubView === 'my_teachers' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl text-[11px] text-indigo-900 font-medium leading-relaxed">
                  قائمة المعلمين المعتمدين لموادك الدراسية في هذه المدرسة. يمكنك بدء محادثة استفسار مباشرة مع أي معلم:
                </div>
                {allowedContacts.myTeachers.map((teacher) => (
                  <div
                    key={teacher.userId}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                        {teacher.fullName ? teacher.fullName.slice(0, 2) : 'مع'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{teacher.fullName}</h4>
                        <p className="text-[11px] text-indigo-600 font-bold">{teacher.subject || 'معلم مادة'}</p>
                        {teacher.className && <span className="text-[10px] text-slate-400">{teacher.className}</span>}
                      </div>
                    </div>

                    <button
                      disabled={isStartingDirectChat}
                      onClick={() => handleStartDirectChatWithUser({ id: teacher.userId, name: teacher.fullName, role: 'teacher', title: teacher.subject })}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>بدء محادثة مع المعلم</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Subview: My Classes & Students (فصولي وطلابي للمعلم) */}
            {activeDirectSubView === 'my_classes' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {/* Class Filter Selector */}
                {allowedContacts.myClasses.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSelectedClassFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        selectedClassFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      جميع الفصول
                    </button>
                    {allowedContacts.myClasses.map((cls) => (
                      <button
                        key={cls.classId}
                        onClick={() => setSelectedClassFilter(cls.classId)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                          selectedClassFilter === cls.classId
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cls.className} ({cls.studentCount})
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {allowedContacts.classStudents
                    .filter((st) => selectedClassFilter === 'all' || st.classId === selectedClassFilter)
                    .map((student) => (
                      <div
                        key={student.userId}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900">{student.fullName}</h4>
                            <p className="text-[10px] text-slate-500">{student.gradeName} - {student.className}</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            طالب منتظم
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={isStartingDirectChat}
                            onClick={() => handleStartDirectChatWithUser({ id: student.userId, name: student.fullName, role: 'student', title: `${student.gradeName} - ${student.className}` })}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-1.5 rounded-xl border border-indigo-200 transition text-center"
                          >
                            محادثة الطالب
                          </button>
                          {student.parentId && (
                            <button
                              disabled={isStartingDirectChat}
                              onClick={() => handleStartDirectChatWithUser({ id: student.parentId!, name: student.parentName || 'ولي الأمر', role: 'parent', title: `ولي أمر ${student.fullName}` })}
                              className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold py-1.5 rounded-xl border border-amber-200 transition text-center"
                            >
                              محادثة ولي الأمر
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4. Subview: My Children (أبنائي لولي الأمر) */}
            {activeDirectSubView === 'my_children' && (
              <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                {allowedContacts.myChildren.map((child) => (
                  <div key={child.studentId} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                        {child.studentName ? child.studentName.slice(0, 2) : 'طا'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{child.studentName}</h4>
                        <p className="text-[10px] text-slate-500">{child.gradeName} - {child.className}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-extrabold text-slate-700">معلمو الطالب المعتمدين:</p>
                      {child.teachers.map((tch) => (
                        <div key={tch.teacherId} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{tch.teacherName}</span>
                            <span className="text-[10px] text-indigo-600 block">{tch.subject}</span>
                          </div>
                          <button
                            disabled={isStartingDirectChat}
                            onClick={() => handleStartDirectChatWithUser({ id: tch.teacherId, name: tch.teacherName, role: 'teacher', title: tch.subject })}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition"
                          >
                            مراسلة المعلم
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Subview: School Admin (إدارة المدرسة والموجه) */}
            {activeDirectSubView === 'school_admin' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {allowedContacts.schoolAdmin.map((adm) => (
                  <div
                    key={adm.userId}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                        {adm.fullName ? adm.fullName.slice(0, 2) : 'إد'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{adm.fullName}</h4>
                        <p className="text-[11px] text-blue-700 font-bold">{adm.roleTitle}</p>
                      </div>
                    </div>

                    <button
                      disabled={isStartingDirectChat}
                      onClick={() => handleStartDirectChatWithUser({ id: adm.userId, name: adm.fullName, role: adm.role, title: adm.roleTitle })}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>بدء محادثة رسمية</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Direct Messages Feed */}
          <div className="lg:col-span-8">
            {selectedConversation ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/50 border border-slate-200/80 space-y-6 flex flex-col min-h-[560px]">
                {/* Conversation Header */}
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h3 className="text-base font-black text-slate-900">{selectedConversation.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      القناة الرسمية للتواصل المعتمد بين منسوبي المدرسة
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>محادثة موثقة ومشفرة</span>
                  </div>
                </div>

                {/* Moderation Warning if triggered */}
                {moderationWarning && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{moderationWarning}</span>
                  </div>
                )}

                {/* Messages List */}
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-2">
                  {directMessages.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <MessageCircle className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold">المحادثة بدأت للتو. اكتب رسالتك الأولى أدناه</p>
                    </div>
                  ) : (
                    directMessages.map((msg) => {
                      const isFromMe = msg.senderId === effectiveUserId || msg.senderRole === currentRole;

                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl max-w-xl space-y-1.5 ${
                            isFromMe
                              ? 'ms-auto bg-indigo-600 text-white rounded-bl-none shadow-sm'
                              : 'me-auto bg-slate-100 text-slate-800 rounded-br-none border border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[10px] opacity-90 font-bold">
                            <span>{msg.senderName}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                          {/* Attachment Link */}
                          {msg.attachmentName && (
                            <div className="mt-2 bg-black/10 backdrop-blur-sm p-2 rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate font-bold text-[11px]">{msg.attachmentName}</span>
                              </div>
                              {msg.attachmentUrl && (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-[10px] shrink-0 font-extrabold ms-2 hover:text-amber-300"
                                >
                                  معاينة
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Direct Message Input */}
                <form onSubmit={handleSendDirectMessageSubmit} className="pt-4 border-t border-slate-100 space-y-2">
                  {directAttachment && (
                    <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-xl text-xs flex items-center justify-between text-indigo-900">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold truncate max-w-xs">{directAttachment.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDirectAttachment(null)}
                        className="text-rose-500 font-bold text-xs hover:text-rose-700"
                      >
                        ✕ إزالة
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="file"
                      ref={directFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDirectAttachment({ file: e.target.files[0], name: e.target.files[0].name });
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => directFileInputRef.current?.click()}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition shrink-0"
                      title="إرفاق ملف"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={directMsgText}
                      onChange={(e) => {
                        setDirectMsgText(e.target.value);
                        if (moderationWarning) setModerationWarning(null);
                      }}
                      placeholder="اكتب رسالتك المباشرة هنا..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-16 text-center text-slate-400 border border-slate-200 flex flex-col items-center justify-center space-y-3">
                <MessageCircle className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-bold">اختر محادثة من القائمة أو اختر معلماً من دليلك للتواصل المباشر</p>
                <button
                  onClick={() => {
                    if (checkEligibilityOrOpenGate()) {
                      setShowNewConvModal(true);
                    }
                  }}
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  بدء محادثة رسمية
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SCHOOL CIRCULARS & OFFICIAL ACKNOWLEDGMENT (التعاميم والاطلاع الرسمي) */}
      {/* ========================================================================= */}
      {activeTab === 'circulars' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Circulars List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>التعاميم المدرسية ({circularsList.length})</span>
              </h3>

              {(currentRole === 'teacher' || currentRole === 'counselor' || currentRole === 'admin' || currentRole === 'principal') && (
                <button
                  onClick={() => setShowNewCircularModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إصدار تعميم</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {circularsList.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">لا توجد تعاميم مدرسية حالياً</p>
                </div>
              ) : (
                circularsList.map((circ) => {
                  const isSelected = selectedCircular?.id === circ.id;

                  const getPriorityBadge = (priority: string) => {
                    switch (priority) {
                      case 'عاجل':
                        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">عاجل جداً</span>;
                      case 'هام':
                        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">هام</span>;
                      default:
                        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">عادي</span>;
                    }
                  };

                  return (
                    <div
                      key={circ.id}
                      onClick={() => setSelectedCircular(circ)}
                      className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 relative ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-800 shadow-xl'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(circ.priority)}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                            {circ.category}
                          </span>
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          {circ.createdAt ? new Date(circ.createdAt).toLocaleDateString('ar-SA') : 'اليوم'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs leading-snug line-clamp-1">{circ.title}</h4>

                      <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {circ.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/10">
                        <span className={isSelected ? 'text-amber-300' : 'text-amber-700 font-bold'}>
                          رقم: {circ.circularNumber || 'رسمي'}
                        </span>

                        {circ.requiresReadConfirmation && (
                          circ.isAcknowledgedByMe ? (
                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                              <CheckCheck className="w-3 h-3" />
                              <span>تم الاطلاع</span>
                            </span>
                          ) : (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                              مطلوب تأكيد الاطلاع
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Circular Detail */}
          <div className="lg:col-span-8">
            {selectedCircular ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm shadow-slate-200/50 border border-slate-200/80 space-y-6">
                {/* Official Circular Header */}
                <div className="border-b border-slate-100 pb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-black px-3 py-1 rounded-full border border-amber-200">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>تعميم إداري رسمي #{selectedCircular.circularNumber}</span>
                    </span>

                    <span className="text-xs text-slate-400 font-bold">
                      تاريخ الإصدار: {selectedCircular.createdAt ? new Date(selectedCircular.createdAt).toLocaleDateString('ar-SA') : 'اليوم'}
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 leading-snug">
                    {selectedCircular.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>الجهة المصدرة: <strong>{selectedCircular.createdByName || 'إدارة المدرسة'}</strong></span>
                    <span>الفئة المستهدفة: <strong>{selectedCircular.targetAudience === 'all_school' ? 'كافة منسوبي المدرسة' : selectedCircular.targetAudience === 'teachers' ? 'المعلمون' : selectedCircular.targetAudience === 'students' ? 'الطلاب' : 'أولياء الأمور'}</strong></span>
                  </div>
                </div>

                {/* Circular Body */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 text-slate-800 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                  {selectedCircular.content}
                </div>

                {/* Attachment if present */}
                {selectedCircular.attachmentUrl && (
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-950">{selectedCircular.attachmentName || 'مرفق التعميم الرسمي'}</span>
                    </div>
                    <a
                      href={selectedCircular.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                    >
                      تحميل المرفق
                    </a>
                  </div>
                )}

                {/* Read Confirmation Block */}
                {selectedCircular.requiresReadConfirmation && (
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    {selectedCircular.isAcknowledgedByMe ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
                        <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-black text-xs">تم تسجيل اطلاعك الرسمي على هذا التعميم</p>
                          <p className="text-[11px] text-emerald-700">تم توثيق إقرارك في السجل الإداري للمدرسة بنجاح</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>يتطلب هذا التعميم تأكيد الاطلاع الإلزامي والالتزام بما ورد فيه</span>
                        </div>
                        <button
                          disabled={isAcknowledging}
                          onClick={() => handleAcknowledgeCircularSubmit(selectedCircular.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>{isAcknowledging ? 'جاري تسجيل التأكيد...' : 'أقر بأني اطلعت على هذا التعميم وألتزم بمضمونه'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-16 text-center text-slate-400 border border-slate-200 flex flex-col items-center justify-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-bold">اختر تعميماً من القائمة للاطلاع على تفاصيله وتأكيد الاستلام</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SCHOOL ANNOUNCEMENTS (الإعلانات المدرسية العامة والفصلية)              */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span>لوحة الإعلانات المدرسية والفصلية</span>
              </h3>
              <p className="text-xs text-slate-500">أحدث التنبيهات والأخبار المعتمدة من إدارة المدرسة ومعلمي المواد</p>
            </div>

            {(currentRole === 'teacher' || currentRole === 'counselor' || currentRole === 'admin' || currentRole === 'principal') && (
              <button
                onClick={() => setShowNewAnnouncementModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>نشر إعلان جديد</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcementsList.length === 0 ? (
              <div className="col-span-full bg-slate-50 border border-slate-200 rounded-3xl p-16 text-center text-slate-400 space-y-3">
                <Bell className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold">لا توجد إعلانات مدرسية منشورة حالياً</p>
              </div>
            ) : (
              announcementsList.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm space-y-4 flex flex-col justify-between ${
                    ann.isUrgent ? 'border-rose-200 ring-1 ring-rose-300/50' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {ann.isUrgent ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                          <span>إعلان عاجل</span>
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          إعلان مدرسي
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('ar-SA') : 'اليوم'}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 leading-snug">{ann.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>الناشر: <strong>{ann.authorName || 'المشرف'}</strong></span>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                      {ann.targetAudience === 'all_school' ? 'الجميع' : ann.targetAudience === 'teachers' ? 'المعلمون' : ann.targetAudience === 'students' ? 'الطلاب' : 'الفصل'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB C: PEER STUDY ROOMS (غرف المذاكرة الجماعية)                             */}
      {/* ========================================================================= */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Study Groups List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>غرف المذاكرة الجماعية ({studyRooms.length})</span>
              </h3>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>غرفة جديدة</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {studyRooms.map((grp) => {
                const isSelected = selectedGroup.id === grp.id;

                return (
                  <div
                    key={grp.id}
                    onClick={() => setSelectedGroup(grp)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-800 shadow-xl'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 text-2xl flex items-center justify-center shrink-0">
                        {grp.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs">{grp.name}</h4>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {grp.grade}
                        </p>
                        <span className="text-[10px] font-bold text-indigo-400">
                          👥 {grp.membersCount} عضو نشط
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Study Room Chat Feed */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/50 border border-slate-200/80 space-y-6 flex flex-col min-h-[560px]">
              {/* Group Room Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedGroup.icon}</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedGroup.name}</h3>
                    <p className="text-xs text-slate-500">{selectedGroup.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>الأعضاء ({roomMembers.length || selectedGroup.membersCount})</span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>غرفة آمنة ومراقبة</span>
                  </div>
                </div>
              </div>

              {/* Warning Banner if blocked */}
              {moderationWarning && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{moderationWarning}</span>
                </div>
              )}

              {/* Messages List */}
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[380px] pr-2">
                {studyRoomMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition space-y-2 relative group ${
                      msg.isDeleted
                        ? 'bg-slate-100 text-slate-400 border-slate-200/60'
                        : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{msg.senderAvatar || '🧑‍🎓'}</span>
                        <span className="text-xs font-extrabold text-slate-900">{msg.senderName}</span>
                        {msg.senderRole === 'teacher' && (
                          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded">
                            معلم
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">{msg.timestamp}</span>

                        {/* Moderation Controls: Delete / Hide Message */}
                        {!msg.isDeleted && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="حذف الرسالة مع توثيق السجل الرقابي"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.isDeleted ? (
                      <p className="text-xs italic text-slate-400 font-semibold">
                        (تم حذف هذه الرسالة بواسطة {msg.deletedBy || 'المشرف الإداري'})
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {/* Problem Citation */}
                        {msg.problemCitation && (
                          <div className="bg-blue-50/80 border border-blue-200/80 p-3 rounded-xl space-y-1 mt-2">
                            <div className="text-[10px] font-bold text-blue-800 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>مسألة من كتاب: {msg.problemCitation.bookName} (ص {msg.problemCitation.page})</span>
                            </div>
                            <div className="text-xs font-bold text-slate-800">{msg.problemCitation.question}</div>
                            <div className="text-xs text-emerald-700 font-black">النتيجة: {msg.problemCitation.finalAnswer}</div>
                          </div>
                        )}

                        {/* Homework Citation Card */}
                        {msg.homeworkCitation && (
                          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl space-y-3 mt-2 border border-indigo-500/40 shadow-lg">
                            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-black text-amber-300">{msg.homeworkCitation.title}</span>
                              </div>
                              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                                {msg.homeworkCitation.sourceType === 'curriculum' ? '📚 من المقرر الوزاري' : '🌐 موضوع خارجي'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-200 space-y-1">
                              {msg.homeworkCitation.bookName && (
                                <p className="text-[11px] font-semibold text-slate-300">
                                  الكتاب: <span className="text-white">{msg.homeworkCitation.bookName}</span> | الدرس: <span className="text-emerald-300">{msg.homeworkCitation.lessonName}</span>
                                </p>
                              )}
                              <p className="text-xs text-slate-200">{msg.homeworkCitation.description}</p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pt-1">
                              <span className="text-amber-300">⭐ الدرجة: {msg.homeworkCitation.totalPoints} درجات</span>
                              <span className="text-slate-400">📅 التسليم: {msg.homeworkCitation.dueDate}</span>
                            </div>
                          </div>
                        )}

                        {/* Attachment */}
                        {msg.attachmentName && (
                          <div className="mt-2 bg-slate-200/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span className="truncate font-bold text-[11px] text-slate-800">{msg.attachmentName}</span>
                            </div>
                            {msg.attachmentUrl && (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-[10px] shrink-0 font-extrabold ms-2 text-indigo-600 hover:text-indigo-800"
                              >
                                تحميل
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendGroupMessageSubmit} className="pt-4 border-t border-slate-100 space-y-2">
                {studyAttachment && (
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs flex items-center justify-between text-emerald-900">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold truncate max-w-xs">{studyAttachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStudyAttachment(null)}
                      className="text-rose-500 font-bold text-xs hover:text-rose-700"
                    >
                      ✕ إزالة
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (checkEligibilityOrOpenGate()) {
                        setShowHomeworkModal(true);
                      }
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-3 rounded-2xl text-xs flex items-center gap-1.5 border border-indigo-200 transition shrink-0"
                    title="إضافة واجب دراسي (يدوي أو بالذكاء الاصطناعي)"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">إضافة واجب</span>
                  </button>

                  <input
                    type="file"
                    ref={studyFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setStudyAttachment({ file: e.target.files[0], name: e.target.files[0].name });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => studyFileInputRef.current?.click()}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition shrink-0"
                    title="مرفق"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={groupMsgText}
                    onChange={(e) => {
                      setGroupMsgText(e.target.value);
                      if (moderationWarning) setModerationWarning(null);
                    }}
                    placeholder="شارِك سؤالك، فكرتك، أو مناقشتك مع الزملاء..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>نشر</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: 1. NEW TICKET MODAL                                               */}
      {/* ========================================================================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>تقديم تكت استفسار جديد للإدارة المدرسية</span>
              </h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تصنيف الاستفسار:</label>
                <select
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs"
                >
                  <option value="استفسار أكاديمي">استفسار أكاديمي</option>
                  <option value="طلب مستندات رسمية">طلب مستندات رسمية (إثبات طالب/شهادة)</option>
                  <option value="إرشاد نفسي وتربوي">إرشاد نفسي وتربوي</option>
                  <option value="شكوى/اقتراح">شكوى أو اقتراح تحسين</option>
                  <option value="الدعم الفني والمنصة">الدعم الفني والمنصة</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مستوى الأولوية:</label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs"
                >
                  <option value="عادي">عادي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="عاجل">عاجل</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الاستفسار:</label>
                <input
                  type="text"
                  required
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="مثال: طلب مشهد إثبات طالب أو استفسار عن درجات الرياضيات..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل الاستفسار والطلب:</label>
                <textarea
                  required
                  rows={4}
                  value={newTicketInitialMsg}
                  onChange={(e) => setNewTicketInitialMsg(e.target.value)}
                  placeholder="اكتب التوضيح كاملاً ليقوم الموظف المختص بالرد عليك مباشرة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Attachment in Ticket */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">إرفاق مستند أو صورة (اختياري):</label>
                <input
                  type="file"
                  ref={ticketFileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewTicketAttachment({ file: e.target.files[0], name: e.target.files[0].name });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => ticketFileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-300 rounded-xl p-3 text-slate-500 hover:border-blue-400 hover:bg-blue-50 transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{newTicketAttachment ? newTicketAttachment.name : 'اختر ملف للإرفاق'}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTicket}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  {isCreatingTicket ? 'جاري الإنشاء...' : 'إرسال التكت الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: 2. NEW DIRECT CONVERSATION MODAL                                  */}
      {/* ========================================================================= */}
      {showNewConvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <span>بدء محادثة تواصل مدرسي جديدة</span>
              </h3>
              <button
                onClick={() => setShowNewConvModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConversationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الجهة أو الطرف المستلم:</label>
                <select
                  value={newConvRole}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setNewConvRole(role);
                    if (role === 'teacher') setNewConvTargetName('معلم المادة');
                    else if (role === 'counselor') setNewConvTargetName('الموجه الطلابي');
                    else if (role === 'parent') setNewConvTargetName('ولي أمر الطالب');
                    else if (role === 'principal') setNewConvTargetName('مدير المدرسة');
                    else setNewConvTargetName('إدارة المدرسة');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs"
                >
                  <option value="teacher">معلم المادة (Teacher)</option>
                  <option value="counselor">المرشد / الموجه الطلابي (Counselor)</option>
                  <option value="parent">ولي الأمر (Parent)</option>
                  <option value="principal">مدير المدرسة (Principal)</option>
                  <option value="school_admin">شؤون الطلاب وإدارة المدرسة (Administration)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان القناة / الموضوع:</label>
                <input
                  type="text"
                  required
                  value={newConvTitle}
                  onChange={(e) => setNewConvTitle(e.target.value)}
                  placeholder="مثال: متابعة المستوى التحصيلي لمادة العلوم..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رسالة البداية والتحية:</label>
                <textarea
                  rows={3}
                  value={newConvInitialMsg}
                  onChange={(e) => setNewConvInitialMsg(e.target.value)}
                  placeholder="اكتب رسالتك الافتتاحية للمحادثة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewConvModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingConv}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-500/20"
                >
                  {isCreatingConv ? 'جاري الفتح...' : 'بدء المحادثة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: 3. STUDY ROOM MEMBERS & INVITATION MODAL                           */}
      {/* ========================================================================= */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedGroup.icon}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">أعضاء {selectedGroup.name}</h3>
                  <p className="text-xs text-slate-500">إدارة الطلاب والمشرفين المنضمين للغرفة</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setInviteFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteMemberSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>دعوة أو إضافة عضو جديد للغرفة:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <select
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="">-- اختر مستخدم من المدرسة --</option>
                    {availableSchoolUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} (@{u.username}) - {u.role === 'student' ? 'طالب' : u.role === 'teacher' ? 'معلم' : u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={inviteRoleInRoom}
                    onChange={(e) => setInviteRoleInRoom(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="member">طالب / عضو</option>
                    <option value="supervisor">مشرف الغرفة</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isInvitingUser || !inviteUserId}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    {isInvitingUser ? '...' : 'إضافة'}
                  </button>
                </div>
              </div>

              {inviteFeedback && (
                <p className="text-[11px] font-bold text-indigo-600">{inviteFeedback}</p>
              )}
            </form>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
              <h4 className="font-extrabold text-xs text-slate-700">الأعضاء الحاليين ({roomMembers.length}):</h4>

              {isLoadingMembers ? (
                <div className="text-center py-6 text-xs text-slate-400">جاري تحميل قائمة الأعضاء...</div>
              ) : roomMembers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">لا يوجد أعضاء مسجلين بعد.</div>
              ) : (
                roomMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {m.role === 'teacher' ? '👨‍🏫' : '🧑‍🎓'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{m.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{m.username}</span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-bold">
                          {m.memberRole === 'owner' ? '👑 منشئ الغرفة' : m.memberRole === 'supervisor' ? '⭐ مشرف' : 'عضو مشارك'}
                        </span>
                      </div>
                    </div>

                    {m.memberRole !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 text-xs font-bold transition"
                        title="إزالة العضو من الغرفة"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setInviteFeedback(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: 4. CREATE STUDY ROOM MODAL                                         */}
      {/* ========================================================================= */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>إنشاء غرفة مذاكرة جماعية جديدة</span>
              </h3>
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الغرفة الدراسية:</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="مثال: نادي علماء الفيزياء - الأول الثانوي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المادة الدراسية:</label>
                  <input
                    type="text"
                    required
                    value={newRoomSubject}
                    onChange={(e) => setNewRoomSubject(e.target.value)}
                    placeholder="مثال: العلوم / الفيزياء"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الصف الدراسي:</label>
                  <input
                    type="text"
                    required
                    value={newRoomGrade}
                    onChange={(e) => setNewRoomGrade(e.target.value)}
                    placeholder="مثال: الصف الثالث المتوسط"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">أيقونة الغرفة التعبيرية:</label>
                <div className="flex gap-2">
                  {['🔬', '⚡', '🧬', '🌌', '📐', '🧪', '🔭', '🤖'].map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setNewRoomIcon(ico)}
                      className={`text-xl p-2 rounded-xl border transition ${
                        newRoomIcon === ico
                          ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف الغرفة والهدف التعليمي:</label>
                <textarea
                  rows={3}
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="وصف مختصر لمجال المذاكرة والمناقشات المسموحة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-500/20"
                >
                  {isCreatingRoom ? 'جاري الإنشاء...' : 'إنشاء الغرفة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: 4. ACCESS CONTROL & SCHOOL LINKING GATE MODAL                      */}
      {/* ========================================================================= */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto flex flex-col relative">
            {/* Top Close Button */}
            <button
              onClick={() => {
                setShowGateModal(false);
                setGateFeedback(null);
              }}
              className="absolute top-6 left-6 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
                <Lock className="w-7 h-7 text-amber-400" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white">
                يجب تسجيل الدخول أو الانضمام إلى مدرسة قبل استخدام التواصل المدرسي
              </h3>

              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                نظام التواصل والتذاكر وغرف المذاكرة محمي ومخصص للمستخدمين المسجلين والمرتبطين بمدرسة معتمدة داخل المنصة.
              </p>

              {currentUser && (
                <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full text-[11px] text-slate-300 border border-slate-700">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>المستخدم الحالي: <strong>{currentUser.fullName || currentUser.email}</strong></span>
                  <span className="text-amber-400 font-bold">({eligibility.accountStatus === 'unlinked' ? 'غير مرتبط بمدرسة' : eligibility.accountStatus})</span>
                </div>
              )}
            </div>

            {/* Feedback Alert */}
            {gateFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
                  gateFeedback.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : gateFeedback.type === 'error'
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                }`}
              >
                {gateFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : gateFeedback.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <span className="leading-relaxed">{gateFeedback.text}</span>
              </div>
            )}

            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setGateActionTab('options');
                  setGateFeedback(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  gateActionTab === 'options'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الخيارات
              </button>

              <button
                type="button"
                onClick={() => {
                  setGateActionTab('login');
                  setGateFeedback(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  gateActionTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                onClick={() => {
                  setGateActionTab('invitation');
                  setGateFeedback(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  gateActionTab === 'invitation'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                رمز دعوة
              </button>

              <button
                type="button"
                onClick={() => {
                  setGateActionTab('register_school');
                  setGateFeedback(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  gateActionTab === 'register_school'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل مدرسة
              </button>
            </div>

            {/* Tab 1: Options Cards */}
            {gateActionTab === 'options' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {(!currentUser || (currentUser.role === 'student' && !currentUser.schoolId)) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLoginModal) {
                        setShowGateModal(false);
                        onOpenLoginModal();
                      } else {
                        setGateActionTab('login');
                      }
                    }}
                    className="p-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-right space-y-2 transition group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-sm text-white group-hover:text-blue-400 transition">
                      تسجيل الدخول
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      إذا كان لديك حساب مسبق في منصة حقائق العلوم، سجّل الدخول فوراً
                    </p>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setGateActionTab('invitation')}
                  className="p-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-right space-y-2 transition group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-white group-hover:text-amber-400 transition">
                    لدي رمز دعوة
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    استخدم كود الدعوة الممنوح لك من مدرستك أو معلمك للانضمام التلقائي
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setGateActionTab('register_school')}
                  className="p-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-right space-y-2 transition group sm:col-span-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-white group-hover:text-emerald-400 transition">
                    تسجيل مدرسة جديدة (طلب اعتماد)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    إرسال طلب تسجيل مدرستك ليتم اعتمادها من إدارة المنصة خلال ساعات
                  </p>
                </button>
              </div>
            )}

            {/* Tab 2: Login Quick Screen */}
            {gateActionTab === 'login' && (
              <div className="space-y-4 text-center py-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                  <LogIn className="w-6 h-6" />
                </div>
                <h4 className="font-black text-base text-white">تسجيل الدخول للمنصة</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  سجل دخولك بحساب الطالب أو المعلم أو ولي الأمر للوصول الكامل إلى نظام التذاكر وقنوات التواصل وغرف المذاكرة.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGateModal(false);
                      if (onOpenLoginModal) onOpenLoginModal();
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>فتح نافذة تسجيل الدخول</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Invitation Code Lookup & Redeem */}
            {gateActionTab === 'invitation' && (
              <div className="space-y-4">
                <form onSubmit={handleLookupInviteCode} className="space-y-3">
                  <label className="block font-bold text-xs text-slate-300">
                    أدخل رمز الدعوة المدرسي (Invitation Code):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={gateInviteCode}
                      onChange={(e) => {
                        setGateInviteCode(e.target.value.toUpperCase());
                        setGateInviteLookup(null);
                      }}
                      placeholder="مثال: HTAF-7K4P9Q أو ALN-SCI-101"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-center text-sm font-bold text-amber-300 outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingCode || !gateInviteCode.trim()}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shrink-0"
                    >
                      {isCheckingCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>فحص الرمز</span>
                    </button>
                  </div>
                </form>

                {/* Valid Code Result Preview */}
                {gateInviteLookup && gateInviteLookup.isValid && gateInviteLookup.invitation && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-black text-xs text-emerald-300">رمز دعوة معتمد وصالح</h4>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {gateInviteLookup.invitation.role === 'teacher' ? 'معلم' : gateInviteLookup.invitation.role === 'counselor' ? 'مرشد' : 'طالب'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">المدرسة:</span>
                        <strong className="text-white text-xs">{gateInviteLookup.invitation.school_name}</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">المرحلة / الصف:</span>
                        <strong className="text-emerald-300 text-xs">
                          {gateInviteLookup.invitation.grade || 'المرحلة العامة'}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRedeemInviteCode}
                      disabled={isRedeemingCode}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {isRedeemingCode ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري ربط الحساب بالمدرسة...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تأكيد الانضمام للمدرسة والربط الفوري</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Register New School Request */}
            {gateActionTab === 'register_school' && (
              <form onSubmit={handleSubmitNewSchool} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم المدرسة الرسمي *</label>
                    <input
                      type="text"
                      required
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      placeholder="مثال: مدرسة الأندلس المتوسطة"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">المرحلة التعليمية *</label>
                    <select
                      value={newSchoolStage}
                      onChange={(e) => setNewSchoolStage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none text-xs text-white"
                    >
                      <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                      <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                      <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                      <option value="مجمع تعليمي">مجمع تعليمي مشترك</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">المنطقة التعليمية</label>
                    <select
                      value={newSchoolRegion}
                      onChange={(e) => setNewSchoolRegion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none text-xs text-white"
                    >
                      <option value="منطقة الرياض">منطقة الرياض</option>
                      <option value="منطقة مكة المكرمة">منطقة مكة المكرمة</option>
                      <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                      <option value="منطقة المدينة المنورة">منطقة المدينة المنورة</option>
                      <option value="منطقة القصيم">منطقة القصيم</option>
                      <option value="منطقة عسير">منطقة عسير</option>
                      <option value="منطقة تبوك">منطقة تبوك</option>
                      <option value="منطقة حائل">منطقة حائل</option>
                      <option value="منطقة الحدود الشمالية">منطقة الحدود الشمالية</option>
                      <option value="منطقة جازان">منطقة جازان</option>
                      <option value="منطقة نجران">منطقة نجران</option>
                      <option value="منطقة الباحة">منطقة الباحة</option>
                      <option value="منطقة الجوف">منطقة الجوف</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">المدينة</label>
                    <input
                      type="text"
                      value={newSchoolCity}
                      onChange={(e) => setNewSchoolCity(e.target.value)}
                      placeholder="مثال: الرياض"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم مقدم الطلب *</label>
                    <input
                      type="text"
                      required
                      value={newSchoolApplicantName}
                      onChange={(e) => setNewSchoolApplicantName(e.target.value)}
                      placeholder="اسم المعلم أو المدير"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={newSchoolApplicantEmail}
                      onChange={(e) => setNewSchoolApplicantEmail(e.target.value)}
                      placeholder="email@school.sa"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">رقم الجوال للتواصل</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={newSchoolApplicantPhone}
                      onChange={(e) => setNewSchoolApplicantPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">ملاحظات إضافية (اختياري)</label>
                  <textarea
                    rows={2}
                    value={newSchoolNotes}
                    onChange={(e) => setNewSchoolNotes(e.target.value)}
                    placeholder="أي تفاصيل حول عدد الفصول أو الطلاب أو المقررات..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-white"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                  💡 سيتم تسجيل طلبك بحالة <strong>قيد المراجعة (Pending Review)</strong>، ومراجعته واعتماده من قبل الإدارة العامة للمنصة، وتفعيل لوحة التحكم الخاصة بالمدرسة.
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowGateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewSchool}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    {isSubmittingNewSchool ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>إرسال طلب تسجيل المدرسة</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      <AddHomeworkModal
        isOpen={showHomeworkModal}
        onClose={() => setShowHomeworkModal(false)}
        onSubmitHomework={handleHomeworkSubmit}
        centralBooks={centralBooks}
      />

      {/* Realtime Toast Notification Banner */}
      {incomingToast && (
        <div className="fixed bottom-6 start-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-slide-up flex items-start gap-3">
          <div className="p-2 bg-indigo-600/30 rounded-xl text-indigo-400 shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                {incomingToast.channelTitle}
              </span>
              <button
                onClick={() => setIncomingToast(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-100 truncate">
              {incomingToast.senderName}
            </p>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {incomingToast.text}
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  if (incomingToast.type === 'direct') {
                    setActiveTab('direct');
                    const conv = conversations.find(c => c.id === incomingToast.targetId);
                    if (conv) handleSelectConversation(conv);
                  } else if (incomingToast.type === 'ticket') {
                    setActiveTab('tickets');
                    const ticket = ticketsList.find(t => t.id === incomingToast.targetId);
                    if (ticket) setSelectedTicket(ticket);
                  } else if (incomingToast.type === 'room') {
                    setActiveTab('groups');
                    const group = studyRooms.find(r => r.id === incomingToast.targetId);
                    if (group) setSelectedGroup(group);
                  }
                  setIncomingToast(null);
                }}
                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
              >
                <span>عرض الرسالة الآن</span>
                <span>←</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
