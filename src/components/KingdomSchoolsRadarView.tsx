import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SchoolTenant,
  SchoolRadarNode,
  SchoolLinkConnection,
  SchoolBroadcastMessage,
  AuthUser
} from '../types';
import {
  INITIAL_KINGDOM_RADAR_NODES,
  SAUDI_RADAR_SECTORS,
  INITIAL_RADAR_BROADCASTS,
  SaudiRadarSector
} from '../data/kingdomRadarData';
import {
  Radar,
  Radio,
  Building2,
  MapPin,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Link as LinkIcon,
  Unlink,
  Send,
  Plus,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  ChevronRight,
  ChevronLeft,
  Users,
  BookOpen,
  MessageSquare,
  Award,
  Download,
  Copy,
  Check,
  Eye,
  AlertCircle,
  ExternalLink,
  Volume2,
  VolumeX,
  Target,
  Compass,
  ArrowUpRight,
  QrCode
} from 'lucide-react';

interface KingdomSchoolsRadarViewProps {
  currentSchool?: SchoolTenant | null;
  currentUser?: AuthUser | null;
  allTenantSchools?: SchoolTenant[];
  onOpenManualAddSchool?: () => void;
  onOpenEditSchool?: (school: SchoolTenant) => void;
  onRefreshSchools?: () => Promise<void> | void;
  isRefreshingSchools?: boolean;
  onOpenSchoolBarcode?: (school: SchoolTenant) => void;
}

export const KingdomSchoolsRadarView: React.FC<KingdomSchoolsRadarViewProps> = ({
  currentSchool,
  currentUser,
  allTenantSchools = [],
  onOpenManualAddSchool,
  onOpenEditSchool,
  onRefreshSchools,
  isRefreshingSchools = false,
  onOpenSchoolBarcode
}) => {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'radar_hud' | 'linked_schools' | 'broadcasts' | 'directory'>('radar_hud');

  // Radar Nodes state (merging static nodes + dynamic user tenant schools)
  const [radarNodes, setRadarNodes] = useState<SchoolRadarNode[]>(() => {
    // Generate combined nodes
    const dynamicNodes: SchoolRadarNode[] = allTenantSchools.map((sch, idx) => {
      // distribute nicely across angles
      const angle = (idx * 57 + 35) % 360;
      const radius = 25 + ((idx * 23) % 55);
      return {
        id: sch.id,
        name: sch.name,
        nameEn: sch.nameEn,
        region: sch.regionName || 'منطقة الرياض',
        city: sch.cityName || 'الرياض',
        district: sch.district || 'المركز',
        stage: (sch.stage as any) || 'متوسط',
        educationType: (sch.educationType as any) || 'حكومي',
        gender: sch.gender || 'boys',
        moeCode: sch.moeCode || `MOE-${String(sch.id || '1001').slice(-6)}`,
        principalName: sch.principalName || 'مدير المدرسة',
        officialEmail: sch.officialEmail,
        phone: sch.phone,
        latitude: sch.latitude || 24.7136,
        longitude: sch.longitude || 46.6753,
        radarAngle: angle,
        radarRadius: radius,
        signalStrength: 97,
        pingLatencyMs: 14,
        linkStatus: 'linked',
        linkedSince: '2026-01-01',
        totalStudents: sch.totalStudentsCount || 650,
        totalTeachers: sch.totalTeachersCount || 42,
        activeSharedRoomsCount: 4,
        sharedResourcesCount: 25,
        motto: sch.motto,
        logoText: sch.logoText,
        badge: sch.badge,
        isFlagship: true
      };
    });

    // Deduplicate by ID
    const existingIds = new Set(dynamicNodes.map(n => n.id));
    const staticFiltered = INITIAL_KINGDOM_RADAR_NODES.filter(n => !existingIds.has(n.id));
    return [...dynamicNodes, ...staticFiltered];
  });

  // Broadcasts Feed
  const [broadcasts, setBroadcasts] = useState<SchoolBroadcastMessage[]>(INITIAL_RADAR_BROADCASTS);
  
  // Selected Node for Inspection HUD
  const [selectedNode, setSelectedNode] = useState<SchoolRadarNode | null>(radarNodes[0] || null);

  // Filters
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLinkStatus, setSelectedLinkStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Radar Animation States
  const [isSweeping, setIsSweeping] = useState(true);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastContent, setNewBroadcastContent] = useState('');
  const [newBroadcastUrgency, setNewBroadcastUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');

  const animationFrameRef = useRef<number | null>(null);

  // Show Temporary Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Play audio ping synth if enabled
  const playRadarPing = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  // Radar Sweep Animation Loop
  useEffect(() => {
    let lastTime = performance.now();
    const animateSweep = (currentTime: number) => {
      const delta = currentTime - lastTime;
      if (delta >= 25 && isSweeping) {
        setSweepAngle((prev) => (prev + 1.2) % 360);
        lastTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animateSweep);
    };

    animationFrameRef.current = requestAnimationFrame(animateSweep);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isSweeping]);

  // Handle Manual Sweep Scan Trigger
  const handleTriggerFullScan = () => {
    setIsScanningActive(true);
    playRadarPing();
    triggerToast('تم تشغيل المسح الراداري الشامل لربط وتحديث إشارات المدارس بالمملكة');
    setTimeout(() => {
      setIsScanningActive(false);
      triggerToast('اكتمل المسح: تم تثبيت اتصال كافة المدارس النشطة بنجاح');
    }, 2000);
  };

  // Toggle Linking with a School
  const handleToggleLinkSchool = (nodeId: string) => {
    setRadarNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const nextStatus = node.linkStatus === 'linked' ? 'available' : 'linked';
        const updated = {
          ...node,
          linkStatus: nextStatus as any,
          linkedSince: nextStatus === 'linked' ? '2026-08-17 (الآن)' : undefined
        };
        if (selectedNode?.id === nodeId) {
          setSelectedNode(updated);
        }
        triggerToast(
          nextStatus === 'linked'
            ? `تم إنشاء وتفعيل قناة الربط التشاركي مع (${node.name})`
            : `تم تعليق قناة الربط مع (${node.name})`
        );
        return updated;
      }
      return node;
    }));
  };

  // Handle Send New Broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle.trim() || !newBroadcastContent.trim()) return;

    const newMsg: SchoolBroadcastMessage = {
      id: `bc-${Date.now()}`,
      senderSchoolId: currentSchool?.id || 'main-school',
      senderSchoolName: currentSchool?.name || 'المدرسة المتصلة بالرادار',
      senderName: currentUser?.fullName || currentSchool?.principalName || 'إدارة المدرسة',
      title: newBroadcastTitle.trim(),
      content: newBroadcastContent.trim(),
      urgency: newBroadcastUrgency,
      targetRegions: ['جميع المناطق المربوطة بالرادار'],
      sentAt: 'الآن (مباشر)',
      receivedCount: radarNodes.filter(n => n.linkStatus === 'linked').length
    };

    setBroadcasts([newMsg, ...broadcasts]);
    setNewBroadcastTitle('');
    setNewBroadcastContent('');
    setShowBroadcastModal(false);
    triggerToast('تم بث البرقية الموحدة عبر رادار المدارس لجميع النطاقات بنجاح!');
  };

  // Filtered Nodes Calculation
  const filteredNodes = useMemo(() => {
    return radarNodes.filter(node => {
      // Sector filter
      if (selectedSector !== 'all') {
        const sectorObj = SAUDI_RADAR_SECTORS.find(s => s.id === selectedSector);
        if (sectorObj) {
          const inRange =
            sectorObj.angleRange[0] < sectorObj.angleRange[1]
              ? node.radarAngle >= sectorObj.angleRange[0] && node.radarAngle <= sectorObj.angleRange[1]
              : node.radarAngle >= sectorObj.angleRange[0] || node.radarAngle <= sectorObj.angleRange[1];
          if (!inRange) return false;
        }
      }

      // Region filter
      if (selectedRegion !== 'all' && node.region !== selectedRegion) return false;

      // Stage filter
      if (selectedStage !== 'all' && node.stage !== selectedStage) return false;

      // Education Type filter
      if (selectedType !== 'all' && node.educationType !== selectedType) return false;

      // Link status filter
      if (selectedLinkStatus !== 'all' && node.linkStatus !== selectedLinkStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = node.name.toLowerCase().includes(q);
        const matchCity = node.city.toLowerCase().includes(q);
        const matchCode = node.moeCode.toLowerCase().includes(q);
        const matchPrincipal = (node.principalName || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchCode && !matchPrincipal) return false;
      }

      return true;
    });
  }, [radarNodes, selectedSector, selectedRegion, selectedStage, selectedType, selectedLinkStatus, searchQuery]);

  // Key Summary Stats
  const linkedCount = radarNodes.filter(n => n.linkStatus === 'linked').length;
  const availableCount = radarNodes.filter(n => n.linkStatus === 'available').length;
  const totalStudentsCovered = radarNodes.reduce((acc, n) => acc + (n.totalStudents || 0), 0);
  const totalSharedRooms = radarNodes.reduce((acc, n) => acc + (n.activeSharedRoomsCount || 0), 0);

  // Helper to convert polar coords to SVG XY percentage
  const getCoordinates = (angleDeg: number, radiusPercent: number) => {
    // 0 deg is TOP (North), 90 deg is RIGHT (East)
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const r = radiusPercent * 0.44; // scale so 100% radius fits inside 50% circle
    const x = 50 + r * Math.cos(angleRad);
    const y = 50 + r * Math.sin(angleRad);
    return { x, y };
  };

  return (
    <div className="space-y-6 dir-rtl text-slate-100 max-w-7xl mx-auto pb-12">
      
      {/* 1. Futuristic Header & HUD Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#060e22] via-[#091535] to-[#040918] border border-cyan-500/40 p-6 shadow-2xl shadow-cyan-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/30">
                <Radar className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-white tracking-tight">رادار ربط مدارس المملكة</h1>
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/50 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>مباشر 360° LIVE</span>
                  </span>
                  <span className="bg-blue-950 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-800/60">
                    شبكة التوأمة الوطنية
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  نظام راداري رقمي لرصد وربط وتوأمة المدارس بجميع مناطق المملكة العربية السعودية (مشاركة الاختبارات، البث الموحد، والمجتمعات التشاركية).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'كتم صوت نبضات الرادار' : 'تفعيل صوت نبضات الرادار'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleTriggerFullScan}
              disabled={isScanningActive}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isScanningActive ? 'animate-spin' : ''}`} />
              <span>{isScanningActive ? 'جاري المسح الراداري...' : 'مسح راداري شامل'}</span>
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>إرسال برقية / بث موحد</span>
            </button>

            {onOpenManualAddSchool && (
              <button
                onClick={onOpenManualAddSchool}
                className="bg-[#0b1b3d] hover:bg-[#102450] text-cyan-300 text-xs font-black px-3.5 py-2.5 rounded-xl border border-cyan-500/50 shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>إضافة مدرسة للرادار</span>
              </button>
            )}
          </div>
        </div>

        {/* Live HUD Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-blue-900/40">
          <div className="bg-[#050c1f]/80 p-3 rounded-2xl border border-blue-900/50">
            <div className="text-[10px] text-blue-300 font-bold flex items-center gap-1.5 mb-1">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>إجمالي المدارس بالرادار</span>
            </div>
            <div className="text-xl font-black text-white">{radarNodes.length} <span className="text-xs font-normal text-slate-400">مدرسة</span></div>
          </div>

          <div className="bg-[#050c1f]/80 p-3 rounded-2xl border border-emerald-900/40">
            <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1.5 mb-1">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>المدارس المربوطة بنجاح</span>
            </div>
            <div className="text-xl font-black text-emerald-400">{linkedCount} <span className="text-xs font-normal text-emerald-300/70">مدرسة متصلة</span></div>
          </div>

          <div className="bg-[#050c1f]/80 p-3 rounded-2xl border border-blue-900/50">
            <div className="text-[10px] text-blue-300 font-bold flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>الطلاب في نطاق الشبكة</span>
            </div>
            <div className="text-xl font-black text-cyan-300">{totalStudentsCovered.toLocaleString()} <span className="text-xs font-normal text-slate-400">طالب</span></div>
          </div>

          <div className="bg-[#050c1f]/80 p-3 rounded-2xl border border-purple-900/40">
            <div className="text-[10px] text-purple-300 font-bold flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>القنوات والمجتمعات المشتركة</span>
            </div>
            <div className="text-xl font-black text-purple-300">{totalSharedRooms} <span className="text-xs font-normal text-purple-400/70">قناة نشطة</span></div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#050c1f]/80 p-3 rounded-2xl border border-cyan-900/40">
            <div className="text-[10px] text-cyan-300 font-bold flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>سرعة الاستجابة والتغطية</span>
            </div>
            <div className="text-xl font-black text-emerald-400">14 ms <span className="text-xs font-bold text-cyan-300/80">(98.4%)</span></div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-blue-900/50 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('radar_hud')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'radar_hud'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>شاشة الرادار التفاعلية (360° Radar HUD)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('linked_schools')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'linked_schools'
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-600/30 text-emerald-300 border border-emerald-400/50 shadow-md shadow-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <LinkIcon className="w-4 h-4 text-emerald-400" />
          <span>المدارس المربوطة والتوأمة ({linkedCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('broadcasts')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'broadcasts'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/30 text-purple-300 border border-purple-400/50 shadow-md shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Send className="w-4 h-4 text-purple-400" />
          <span>قناة البرقيات والبث الموحد ({broadcasts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'directory'
              ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/30 text-blue-300 border border-blue-400/50 shadow-md shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>دليل مناطق ومدارس المملكة ({filteredNodes.length})</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-950/95 border border-cyan-500/70 text-cyan-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            ✓
          </div>
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: INTERACTIVE RADAR HUD SCREEN                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'radar_hud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Radar Screen Viewport (7 Cols on desktop) */}
          <div className="lg:col-span-8 bg-[#040816] rounded-3xl border border-cyan-500/40 p-4 sm:p-6 shadow-2xl relative flex flex-col items-center justify-center min-h-[580px] overflow-hidden select-none">
            
            {/* Sector Controls Bar at Top of Radar */}
            <div className="w-full flex items-center justify-between gap-2 mb-4 z-20 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-cyan-400 font-black">القطاع:</span>
                <button
                  onClick={() => setSelectedSector('all')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    selectedSector === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  كافة القطاعات
                </button>
                {SAUDI_RADAR_SECTORS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSector(s.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                      selectedSector === s.id
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {s.name.split(' ')[0]} {s.name.split(' ')[1]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSweeping(!isSweeping)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                    isSweeping
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Radar className={`w-3 h-3 ${isSweeping ? 'animate-spin' : ''}`} />
                  <span>{isSweeping ? 'المسح: نشط' : 'المسح: متوقف'}</span>
                </button>
              </div>
            </div>

            {/* Radar Circular Stage Container */}
            <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
              
              {/* Outer Glowing Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.15)] pointer-events-none" />
              
              {/* Concentric Distance Rings */}
              <div className="absolute inset-[15%] rounded-full border border-cyan-500/25 pointer-events-none" />
              <div className="absolute inset-[30%] rounded-full border border-cyan-500/20 pointer-events-none" />
              <div className="absolute inset-[45%] rounded-full border border-cyan-500/15 pointer-events-none" />
              <div className="absolute inset-[60%] rounded-full border border-cyan-500/10 pointer-events-none" />

              {/* Crosshairs & Cardinal Degree Axis Lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-cyan-500/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-full w-px bg-cyan-500/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rotate-45 pointer-events-none">
                <div className="w-full h-px bg-cyan-500/10" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center -rotate-45 pointer-events-none">
                <div className="w-full h-px bg-cyan-500/10" />
              </div>

              {/* Cardinal Labels (N, S, E, W) */}
              <div className="absolute top-1 text-[10px] font-black text-cyan-400 font-mono">000° (شمال)</div>
              <div className="absolute bottom-1 text-[10px] font-black text-cyan-400/70 font-mono">180° (جنوب)</div>
              <div className="absolute right-1 text-[10px] font-black text-cyan-400/70 font-mono">090° (شرق)</div>
              <div className="absolute left-1 text-[10px] font-black text-cyan-400/70 font-mono">270° (غرب)</div>

              {/* Distance Ring Markers */}
              <div className="absolute top-[17%] right-[52%] text-[9px] font-mono text-cyan-400/50 pointer-events-none">500 KM</div>
              <div className="absolute top-[32%] right-[52%] text-[9px] font-mono text-cyan-400/50 pointer-events-none">300 KM</div>
              <div className="absolute top-[47%] right-[52%] text-[9px] font-mono text-cyan-400/50 pointer-events-none">100 KM</div>

              {/* Sweeping Radar Beam (Rotating) */}
              {isSweeping && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none transition-transform"
                  style={{
                    transform: `rotate(${sweepAngle}deg)`
                  }}
                >
                  <div
                    className="w-1/2 h-1/2 absolute top-0 left-1/2 origin-bottom-left"
                    style={{
                      background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.45) 0deg, rgba(16, 185, 129, 0.15) 30deg, transparent 65deg)',
                      borderRight: '2px solid rgba(6, 182, 212, 0.9)'
                    }}
                  />
                </div>
              )}

              {/* Center Radar Base Station (School Node) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-400/50 animate-pulse border-2 border-white">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-cyan-300 mt-1 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap">
                  {currentSchool?.name?.slice(0, 14) || 'المركز الرئيسي'}
                </span>
              </div>

              {/* Radar Ping Nodes (Filtered Schools) */}
              {filteredNodes.map((node) => {
                const { x, y } = getCoordinates(node.radarAngle, node.radarRadius);
                const isSelected = selectedNode?.id === node.id;
                const isLinked = node.linkStatus === 'linked';

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNode(node);
                      playRadarPing();
                    }}
                    style={{
                      top: `${y}%`,
                      left: `${x}%`
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  >
                    {/* Pulsing Outer Ping Ring */}
                    <div
                      className={`absolute -inset-2 rounded-full animate-ping opacity-60 ${
                        isLinked ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />

                    {/* Central Node Dot */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all transform group-hover:scale-125 ${
                        isSelected
                          ? 'bg-cyan-300 border-white ring-4 ring-cyan-400/60 scale-125'
                          : isLinked
                          ? 'bg-emerald-500 border-emerald-200'
                          : 'bg-amber-500 border-amber-200'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>

                    {/* Node Tooltip Label */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-40">
                      <div className="bg-slate-950/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-cyan-400/60 shadow-xl whitespace-nowrap flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isLinked ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span>{node.name}</span>
                        <span className="text-cyan-300 text-[9px]">({node.city})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar Bottom Legend */}
            <div className="w-full flex items-center justify-between gap-4 mt-4 pt-3 border-t border-blue-900/40 text-[11px] text-slate-400 z-20 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                  <span>مدرسة مربوطة بالرادار</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" />
                  <span>مدرسة متاحة للربط</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-xs" />
                  <span>موقع مدرستك (المركز)</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-cyan-300">
                إحداثيات المركز: 24.7136° N, 46.6753° E
              </div>
            </div>
          </div>

          {/* Selected School Signal HUD & Inspector Panel (4 Cols on desktop) */}
          <div className="lg:col-span-4 space-y-4">
            {selectedNode ? (
              <div className="bg-[#060c1d] rounded-3xl border border-cyan-500/40 p-5 space-y-5 shadow-2xl">
                
                {/* Header with Signal Strength */}
                <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">بطاقة إشارة المدرسة</span>
                      <h3 className="text-sm font-black text-white truncate max-w-[200px]">{selectedNode.name}</h3>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    selectedNode.linkStatus === 'linked'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-950 text-amber-300 border-amber-500/50'
                  }`}>
                    {selectedNode.linkStatus === 'linked' ? 'مربوطة بالرادار' : 'متاحة للربط'}
                  </span>
                </div>

                {/* Quick Info Grid */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center bg-[#091535] p-2.5 rounded-xl border border-blue-900/40">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>الموقع والمنطقة:</span>
                    </span>
                    <strong className="text-white">{selectedNode.city} - {selectedNode.region}</strong>
                  </div>

                  <div className="flex justify-between items-center bg-[#091535] p-2.5 rounded-xl border border-blue-900/40">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>النوع والمرحلة:</span>
                    </span>
                    <strong className="text-emerald-300">{selectedNode.educationType} ({selectedNode.stage})</strong>
                  </div>

                  <div className="flex justify-between items-center bg-[#091535] p-2.5 rounded-xl border border-blue-900/40">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>الكود الوزاري (MOE):</span>
                    </span>
                    <span className="font-mono text-amber-300 font-black">{selectedNode.moeCode}</span>
                  </div>

                  {selectedNode.principalName && (
                    <div className="flex justify-between items-center bg-[#091535] p-2.5 rounded-xl border border-blue-900/40">
                      <span className="text-slate-400 font-bold">مدير / مديرة المدرسة:</span>
                      <strong className="text-slate-200">{selectedNode.principalName}</strong>
                    </div>
                  )}

                  {/* Telemetry Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-[#0a1b3f] p-2.5 rounded-xl border border-cyan-800/40 text-center">
                      <div className="text-[10px] text-cyan-300 font-bold">جودة الإشارة</div>
                      <div className="text-base font-black text-cyan-400 mt-0.5">{selectedNode.signalStrength}%</div>
                    </div>
                    <div className="bg-[#0a1b3f] p-2.5 rounded-xl border border-cyan-800/40 text-center">
                      <div className="text-[10px] text-cyan-300 font-bold">زمن الاستجابة</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">{selectedNode.pingLatencyMs} ms</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-blue-900/40">
                  <button
                    onClick={() => handleToggleLinkSchool(selectedNode.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition ${
                      selectedNode.linkStatus === 'linked'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-700/20'
                    }`}
                  >
                    {selectedNode.linkStatus === 'linked' ? (
                      <>
                        <Unlink className="w-4 h-4" />
                        <span>إلغاء أو تعليق قناة الربط التشاركي</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        <span>إنشاء وتفعيل الربط التبادلي مع المدرسة</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setNewBroadcastTitle(`تواصل تشاركي مع (${selectedNode.name})`);
                      setShowBroadcastModal(true);
                    }}
                    className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-cyan-300 text-xs font-bold rounded-xl border border-blue-800/60 flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال رسالة مباشرة للمدرسة</span>
                  </button>

                  {onOpenSchoolBarcode && (
                    <button
                      onClick={() => {
                        const matchedTenant = allTenantSchools.find(s => s.id === selectedNode.id) || {
                          id: selectedNode.id,
                          name: selectedNode.name,
                          nameEn: selectedNode.name,
                          slug: selectedNode.id,
                          logoText: selectedNode.name.slice(0, 2),
                          badge: selectedNode.stage || 'مدرسة معتمدة',
                          primaryColor: '#00d2ff',
                          accentColor: '#9333ea',
                          motto: 'المنصة التعليمية الذكية',
                          location: `${selectedNode.city} - ${selectedNode.region}`,
                          stage: selectedNode.stage as any,
                          moeCode: selectedNode.moeCode,
                          principalName: selectedNode.principalName,
                          circulars: []
                        };
                        onOpenSchoolBarcode(matchedTenant);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-cyan-950 to-purple-950 hover:from-cyan-900 hover:to-purple-900 text-cyan-300 hover:text-white text-xs font-black rounded-xl border border-cyan-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>باركود المدرسة الذكي الرسمي</span>
                    </button>
                  )}

                  {onOpenEditSchool && (
                    <button
                      onClick={() => {
                        const matchedTenant = allTenantSchools.find(s => s.id === selectedNode.id);
                        if (matchedTenant) {
                          onOpenEditSchool(matchedTenant);
                        } else {
                          triggerToast('المدرسة مسجلة عبر شبكة الرادار الوطنية');
                        }
                      }}
                      className="w-full py-1.5 text-slate-400 hover:text-slate-200 text-[11px] font-bold underline text-center block"
                    >
                      تعديل أو تحديث بيانات المدرسة
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#060c1d] rounded-3xl border border-blue-900/40 p-8 text-center text-slate-400 space-y-3">
                <Radar className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                <p className="text-xs font-bold">انقر على أي نقطة مدرسة في شاشة الرادار لعرض بطاقة الإشارة والربط الفوري.</p>
              </div>
            )}

            {/* Quick Sector Summary Card */}
            <div className="bg-[#060c1d] rounded-3xl border border-blue-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Globe className="w-4 h-4" />
                  <span>تغطية قطاعات المملكة</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">100% نشط</span>
              </div>
              <div className="space-y-2 text-[11px]">
                {SAUDI_RADAR_SECTORS.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-[#08132e] px-2.5 py-1.5 rounded-lg border border-blue-900/30">
                    <span className="text-slate-300 truncate max-w-[170px]">{s.name}</span>
                    <span className="font-mono text-cyan-400 font-bold">{s.coverageRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: LINKED SCHOOLS & TWINNING MATRIX                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'linked_schools' && (
        <div className="bg-[#060c1d] rounded-3xl border border-blue-900/40 p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-900/50 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-emerald-400" />
                <span>مصفوفة التوأمة والمدارس المربوطة ({linkedCount} مدرسة)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                المدارس التي تم تفعيل قنوات الربط التشاركي معها لتبادل بنوك الأسئلة، الاختبارات الموحدة، والصفوف الافتراضية المشتركة.
              </p>
            </div>

            <button
              onClick={() => setActiveSubTab('radar_hud')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Radar className="w-4 h-4" />
              <span>ربط مدرسة جديدة عبر الرادار</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radarNodes.filter(n => n.linkStatus === 'linked').map((sch) => (
              <div
                key={sch.id}
                className="bg-[#091535] rounded-2xl border border-emerald-500/30 p-4 space-y-4 hover:border-emerald-400 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/40 mb-1 inline-block">
                      متصلة بالرادار
                    </span>
                    <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition">{sch.name}</h4>
                    <p className="text-[11px] text-slate-400">{sch.city} - {sch.region}</p>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">
                    {sch.logoText || (sch.name ? sch.name.slice(0, 2) : 'مد')}
                  </div>
                </div>

                {/* Capabilities Badges */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div className="bg-[#050c1f] p-2 rounded-xl border border-blue-900/40 flex items-center justify-between">
                    <span className="text-slate-400">غرف مشتركة:</span>
                    <strong className="text-cyan-300 font-bold">{sch.activeSharedRoomsCount} غرف</strong>
                  </div>
                  <div className="bg-[#050c1f] p-2 rounded-xl border border-blue-900/40 flex items-center justify-between">
                    <span className="text-slate-400">مصادر متبادلة:</span>
                    <strong className="text-purple-300 font-bold">{sch.sharedResourcesCount} ملف</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    كود: {sch.moeCode}
                  </span>

                  <button
                    onClick={() => handleToggleLinkSchool(sch.id)}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-200 underline"
                  >
                    تعليق الربط
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: KINGDOM BROADCASTS & MEMOS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'broadcasts' && (
        <div className="bg-[#060c1d] rounded-3xl border border-blue-900/40 p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-900/50 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                <span>قناة البرقيات والبث الموحد للمدارس المربوطة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                بث فوري للتعاميم والمسابقات وورش العمل الموحدة بين جميع المدارس المعتمدة في الرادار.
              </p>
            </div>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>إرسال برقية جديدة</span>
            </button>
          </div>

          <div className="space-y-4">
            {broadcasts.map((bc) => (
              <div
                key={bc.id}
                className="bg-[#091535] rounded-2xl border border-purple-900/40 p-5 space-y-3 hover:border-purple-500/50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{bc.title}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          bc.urgency === 'urgent'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                            : bc.urgency === 'high'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/50'
                            : 'bg-blue-950 text-cyan-300 border border-blue-600/50'
                        }`}>
                          {bc.urgency === 'urgent' ? 'عاجل جداً' : bc.urgency === 'high' ? 'أهمية قصوى' : 'إشعار عام'}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-300 font-bold mt-0.5">
                        صادر من: {bc.senderSchoolName} ({bc.senderName})
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold">{bc.sentAt}</span>
                </div>

                <p className="text-xs text-slate-300 bg-[#050c1f] p-3 rounded-xl border border-blue-900/40 leading-relaxed">
                  {bc.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">النطاق المستهدف:</span>
                    {bc.targetRegions.map((reg, idx) => (
                      <span key={idx} className="bg-slate-900 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-800">
                        {reg}
                      </span>
                    ))}
                  </div>

                  <span className="text-emerald-400 font-bold">
                    تم الاستلام لدى: {bc.receivedCount} مدرسة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: REGIONAL DIRECTORY & FILTER                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'directory' && (
        <div className="bg-[#060c1d] rounded-3xl border border-blue-900/40 p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-blue-900/50 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>دليل مدارس المملكة المسجلة بالرادار ({filteredNodes.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تصفية والبحث في قائمة المدارس وتصدير بيانات التوأمة.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم المدرسة، المدينة..."
                  className="w-full bg-[#091535] border border-blue-800/60 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {onOpenManualAddSchool && (
                <button
                  onClick={onOpenManualAddSchool}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">المنطقة</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-[#091535] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none"
              >
                <option value="all">جميع المناطق</option>
                <option value="منطقة الرياض">منطقة الرياض</option>
                <option value="منطقة مكة المكرمة">منطقة مكة المكرمة</option>
                <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                <option value="منطقة المدينة المنورة">منطقة المدينة المنورة</option>
                <option value="منطقة القصيم">منطقة القصيم</option>
                <option value="منطقة عسير">منطقة عسير</option>
                <option value="منطقة تبوك">منطقة تبوك</option>
                <option value="منطقة حائل">منطقة حائل</option>
                <option value="منطقة جازان">منطقة جازان</option>
                <option value="منطقة نجران">منطقة نجران</option>
                <option value="منطقة الباحة">منطقة الباحة</option>
                <option value="منطقة الجوف">منطقة الجوف</option>
                <option value="منطقة الحدود الشمالية">منطقة الحدود الشمالية</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">المرحلة</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full bg-[#091535] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none"
              >
                <option value="all">كافة المراحل</option>
                <option value="ابتدائي">ابتدائي</option>
                <option value="متوسط">متوسط</option>
                <option value="ثانوي">ثانوي</option>
                <option value="مجمع تعليمي">مجمع تعليمي</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">نوع التعليم</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#091535] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none"
              >
                <option value="all">كافة الأنواع</option>
                <option value="حكومي">حكومي</option>
                <option value="أهلي">أهلي</option>
                <option value="عالمي">عالمي</option>
                <option value="تحفيظ قرآن">تحفيظ قرآن</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">حالة الربط</label>
              <select
                value={selectedLinkStatus}
                onChange={(e) => setSelectedLinkStatus(e.target.value)}
                className="w-full bg-[#091535] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none"
              >
                <option value="all">الكل</option>
                <option value="linked">المربوطة فقط</option>
                <option value="available">المتاحة للربط</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto rounded-2xl border border-blue-900/40">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#091535] text-cyan-300 font-black border-b border-blue-900/60">
                <tr>
                  <th className="p-3">اسم المدرسة</th>
                  <th className="p-3">المدينة والمنطقة</th>
                  <th className="p-3">النوع والمرحلة</th>
                  <th className="p-3">الكود الوزاري</th>
                  <th className="p-3">الاستجابة / الإشارة</th>
                  <th className="p-3">حالة الربط</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30 font-bold">
                {filteredNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-[#091535]/50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {node.logoText || (node.name ? node.name.slice(0, 2) : 'مد')}
                        </div>
                        <div>
                          <p className="text-white font-black">{node.name}</p>
                          {node.principalName && (
                            <p className="text-[10px] text-slate-400">{node.principalName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {node.city} - <span className="text-[11px] text-slate-400">{node.region}</span>
                    </td>
                    <td className="p-3 text-emerald-300">
                      {node.educationType} ({node.stage})
                    </td>
                    <td className="p-3 font-mono text-amber-300">
                      {node.moeCode}
                    </td>
                    <td className="p-3 text-cyan-400">
                      {node.signalStrength}% ({node.pingLatencyMs}ms)
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        node.linkStatus === 'linked'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                          : 'bg-amber-950 text-amber-300 border-amber-500/50'
                      }`}>
                        {node.linkStatus === 'linked' ? 'مربوطة' : 'متاحة'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleLinkSchool(node.id)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-lg transition ${
                          node.linkStatus === 'linked'
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        }`}
                      >
                        {node.linkStatus === 'linked' ? 'إلغاء الربط' : 'ربط الآن'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Modal Form */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#091228] border border-purple-500/60 rounded-3xl max-w-lg w-full p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">إصدار برقية / بث موحد عبر الرادار</h3>
                  <p className="text-[11px] text-purple-300/70">يتم إرسالها فوراً لكافة المدارس المربوطة بالرادار</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان البرقية / البث</label>
                <input
                  type="text"
                  required
                  value={newBroadcastTitle}
                  onChange={(e) => setNewBroadcastTitle(e.target.value)}
                  placeholder="مثال: دعوة للمشاركة في مسابقة الرياضيات المشتركة"
                  className="w-full bg-[#060c1d] border border-blue-800/60 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">درجة الأهمية</label>
                <select
                  value={newBroadcastUrgency}
                  onChange={(e: any) => setNewBroadcastUrgency(e.target.value)}
                  className="w-full bg-[#060c1d] border border-blue-800/60 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="normal">إشعار عام (عادي)</option>
                  <option value="high">أهمية قصوى (هام)</option>
                  <option value="urgent">عاجل وفوري</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نص ومحتوى البرقية</label>
                <textarea
                  required
                  rows={4}
                  value={newBroadcastContent}
                  onChange={(e) => setNewBroadcastContent(e.target.value)}
                  placeholder="اكتب التفاصيل والمواعيد ورابط الانضمام للغرفة التشاركية..."
                  className="w-full bg-[#060c1d] border border-blue-800/60 rounded-xl p-3 text-white font-bold outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-5 py-2 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال البث الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
