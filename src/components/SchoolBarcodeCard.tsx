import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { SchoolTenant } from '../types';
import {
  Smartphone,
  GraduationCap,
  Brain,
  BarChart3,
  Users,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Sparkles
} from 'lucide-react';

export type BarcodeTheme = 'neon' | 'emerald' | 'royal' | 'gold';

export interface SchoolBarcodeCardProps {
  school: SchoolTenant;
  customTitle?: string;
  customSubtitle?: string;
  customBadge?: string;
  customUrl?: string;
  theme?: BarcodeTheme;
  compact?: boolean;
}

export const SchoolBarcodeCard: React.FC<SchoolBarcodeCardProps> = ({
  school,
  customTitle,
  customSubtitle,
  customBadge,
  customUrl,
  theme = 'neon',
  compact = false
}) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  // Derived Title & Subtitle
  const displayTitle = customTitle || school.name || 'هتاف العاصمي';
  const displaySubtitle = customSubtitle || 'المنصة التعليمية الذكية';
  const displayBadge = customBadge || (school.stage ? `المرحلة ${school.stage}` : 'v3.0 AI');
  
  // Build canonical destination URL for the school
  const targetUrl = customUrl || (
    school?.slug || school?.id
      ? `https://htaf.online/?school=${encodeURIComponent(school.slug || school.id)}`
      : 'https://htaf.online'
  );

  // Theme palettes
  const themeConfig = {
    neon: {
      gradientText: 'from-[#00d2ff] via-[#0084ff] to-[#a855f7]',
      neonBorder: 'border-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.35),0_0_70px_rgba(168,85,247,0.25)]',
      pillGradient: 'from-[#00c6ff] via-[#7928ca] to-[#b026ff]',
      badgeBg: 'bg-[#061027] text-[#00f0ff] border-cyan-400/50',
      logoBorder: 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
      qrFinderCyan: '#00d2ff',
      qrFinderPurple: '#9333ea',
      qrStartColor: '#00d2ff',
      qrMidColor: '#0084ff',
      qrEndColor: '#b026ff',
      accentIcons: 'text-purple-600'
    },
    emerald: {
      gradientText: 'from-emerald-500 via-teal-600 to-emerald-800',
      neonBorder: 'border-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.35),0_0_70px_rgba(5,150,105,0.25)]',
      pillGradient: 'from-emerald-500 via-teal-600 to-emerald-700',
      badgeBg: 'bg-[#06241a] text-[#34d399] border-emerald-400/50',
      logoBorder: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      qrFinderCyan: '#059669',
      qrFinderPurple: '#047857',
      qrStartColor: '#10b981',
      qrMidColor: '#059669',
      qrEndColor: '#047857',
      accentIcons: 'text-emerald-600'
    },
    royal: {
      gradientText: 'from-blue-500 via-indigo-600 to-blue-800',
      neonBorder: 'border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.35),0_0_70px_rgba(99,102,241,0.25)]',
      pillGradient: 'from-blue-600 via-indigo-600 to-blue-800',
      badgeBg: 'bg-[#0a1b3a] text-[#60a5fa] border-blue-400/50',
      logoBorder: 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      qrFinderCyan: '#2563eb',
      qrFinderPurple: '#4f46e5',
      qrStartColor: '#38bdf8',
      qrMidColor: '#2563eb',
      qrEndColor: '#4f46e5',
      accentIcons: 'text-blue-600'
    },
    gold: {
      gradientText: 'from-amber-500 via-yellow-600 to-amber-700',
      neonBorder: 'border-amber-400/60 shadow-[0_0_40px_rgba(245,158,11,0.35),0_0_70px_rgba(217,119,6,0.25)]',
      pillGradient: 'from-amber-500 via-yellow-600 to-amber-700',
      badgeBg: 'bg-[#291e05] text-[#fbbf24] border-amber-400/50',
      logoBorder: 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      qrFinderCyan: '#d97706',
      qrFinderPurple: '#b45309',
      qrStartColor: '#f59e0b',
      qrMidColor: '#d97706',
      qrEndColor: '#78350f',
      accentIcons: 'text-amber-600'
    }
  }[theme];

  // Draw customized, 100% instantly-scannable QR Canvas matching reference image
  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    try {
      // Standard QR error correction 'M' (15%)
      // Level 'M' produces crisp, large modules that scan instantly on all mobile phone cameras
      const qr = QRCode.create(targetUrl, { errorCorrectionLevel: 'M' });
      const modules = qr.modules;
      const moduleCount = modules.size;

      // Canvas dimensions (high-DPI crisp buffer)
      const canvasSize = 640;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear & fill pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Quiet zone / margin (standard 2.5 modules quiet zone for instant camera detection)
      const quietZone = 2.5;
      const totalUnits = moduleCount + quietZone * 2;
      const cellSize = canvasSize / totalUnits;
      const startOffset = quietZone * cellSize;

      // Horizontal linear gradient matching the user's reference image:
      // Left side: Cyan (#00d2ff)
      // Center: Royal Blue (#0084ff)
      // Right side: Purple/Violet (#9333ea / #a855f7)
      const grad = ctx.createLinearGradient(
        startOffset,
        0,
        canvasSize - startOffset,
        0
      );
      grad.addColorStop(0, themeConfig.qrStartColor);
      grad.addColorStop(0.5, themeConfig.qrMidColor);
      grad.addColorStop(1, themeConfig.qrEndColor);

      ctx.fillStyle = grad;

      // Draw all QR modules without skipping or occluding any area
      // Math.round ensures crisp pixel alignment and zero subpixel gaps between cells
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (modules.get(row, col)) {
            const x = Math.round(startOffset + col * cellSize);
            const y = Math.round(startOffset + row * cellSize);
            const w = Math.round(startOffset + (col + 1) * cellSize) - x;
            const h = Math.round(startOffset + (row + 1) * cellSize) - y;
            ctx.fillRect(x, y, w, h);
          }
        }
      }
    } catch (err) {
      console.error('Failed to render stylized QR canvas:', err);
    }
  }, [targetUrl, theme, school, themeConfig]);

  // Helper function to draw 5-point star
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // High-Resolution 4K PNG Card Exporter
  const handleDownloadCardPng = async () => {
    setIsGeneratingPng(true);
    try {
      // Create high-res export canvas (1400 x 1400)
      const exportCanvas = document.createElement('canvas');
      const w = 1400;
      const h = 1400;
      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // 1. Fill Outer Background with transparent or subtle aura
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // 2. Draw Outer Rounded Card (inset 40px)
      const pad = 40;
      const cardW = w - pad * 2;
      const cardH = h - pad * 2;
      const cardRadius = 70;

      // Subtle ambient gradient on card
      const cardGrad = ctx.createLinearGradient(pad, pad, w - pad, h - pad);
      cardGrad.addColorStop(0, '#ffffff');
      cardGrad.addColorStop(0.5, '#fcfeff');
      cardGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = cardGrad;
      ctx.beginPath();
      ctx.roundRect(pad, pad, cardW, cardH, cardRadius);
      ctx.fill();

      // Glowing Neon Border
      ctx.strokeStyle = themeConfig.qrFinderCyan;
      ctx.lineWidth = 10;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.45)';
      ctx.shadowBlur = 40;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // 3. Top Section
      // A. Top-Left Badge: v3.0 AI
      const badgeX = pad + 60;
      const badgeY = pad + 60;
      const badgeW = 200;
      const badgeH = 56;
      ctx.fillStyle = '#061027';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 28);
      ctx.fill();
      ctx.strokeStyle = themeConfig.qrFinderCyan;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = themeConfig.qrFinderCyan;
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayBadge, badgeX + badgeW / 2, badgeY + badgeH / 2);

      // B. Top-Right Emblem Badge Tile
      const tileW = 140;
      const tileH = 140;
      const tileX = w - pad - 60 - tileW;
      const tileY = pad + 50;

      ctx.fillStyle = '#060d24';
      ctx.beginPath();
      ctx.roundRect(tileX, tileY, tileW, tileH, 32);
      ctx.fill();

      ctx.strokeStyle = themeConfig.qrFinderPurple;
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inside Top-Right Emblem: Star + Student + Text
      const tileCx = tileX + tileW / 2;
      drawStar(ctx, tileCx, tileY + 35, 5, 14, 7);

      const topEmblemGrad = ctx.createLinearGradient(tileX, tileY, tileX + tileW, tileY + tileH);
      topEmblemGrad.addColorStop(0, '#00d2ff');
      topEmblemGrad.addColorStop(1, '#d946ef');
      ctx.fillStyle = topEmblemGrad;

      // Head
      ctx.beginPath();
      ctx.arc(tileCx, tileY + 62, 10, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = topEmblemGrad;
      ctx.lineCap = 'round';
      ctx.moveTo(tileCx - 32, tileY + 70);
      ctx.quadraticCurveTo(tileCx, tileY + 90, tileCx + 32, tileY + 70);
      ctx.stroke();

      // Text under top-right tile
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('هتاف العاصمي', tileCx, tileY + 112);
      ctx.font = '900 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('HTAF', tileCx, tileY + 128);

      // C. Header Titles (Right of badge, Left of tile)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // Title Gradient Text
      const titleGrad = ctx.createLinearGradient(pad + 260, pad + 85, tileX - 20, pad + 85);
      titleGrad.addColorStop(0, themeConfig.qrStartColor);
      titleGrad.addColorStop(0.5, themeConfig.qrMidColor);
      titleGrad.addColorStop(1, themeConfig.qrEndColor);

      ctx.fillStyle = titleGrad;
      ctx.font = '900 52px system-ui, -apple-system, sans-serif';
      ctx.fillText(displayTitle, w / 2 - 20, pad + 105);

      // Subtitle
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(displaySubtitle, w / 2 - 20, pad + 155);

      // 4. Center QR Code (Draw from the active qrCanvas)
      const qrCanvas = qrCanvasRef.current;
      if (qrCanvas) {
        const qrSize = 750;
        const qrX = (w - qrSize) / 2;
        const qrY = pad + 215;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      }

      // 5. Action Pill Button: "امسح الرمز لزيارة المنصة"
      const pillW = 680;
      const pillH = 76;
      const pillX = (w - pillW) / 2;
      const pillY = pad + 995;

      const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
      pillGrad.addColorStop(0, themeConfig.qrStartColor);
      pillGrad.addColorStop(0.5, '#7928ca');
      pillGrad.addColorStop(1, themeConfig.qrEndColor);

      ctx.fillStyle = pillGrad;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 38);
      ctx.fill();

      ctx.shadowColor = 'rgba(121, 40, 202, 0.4)';
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Smartphone icon outline
      const phoneX = pillX + 60;
      const phoneY = pillY + 22;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(phoneX, phoneY, 22, 34, 4);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(phoneX + 11, phoneY + 28, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Button Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('امسح الرمز لزيارة المنصة', pillX + pillW / 2 + 15, pillY + pillH / 2);

      // 6. Bottom 4 Feature Items with Vertical Dividers
      const bottomY = pad + 1140;
      const items = ['بيئة تعليمية متكاملة', 'متابعة شاملة', 'ذكاء اصطناعي', 'مدارس ذكية'];
      const sectionW = (cardW - 120) / 4;

      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';

      items.forEach((item, idx) => {
        const itemCx = pad + 60 + sectionW * idx + sectionW / 2;
        ctx.fillText(item, itemCx, bottomY + 20);

        // Vertical divider
        if (idx < 3) {
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pad + 60 + sectionW * (idx + 1), bottomY - 15);
          ctx.lineTo(pad + 60 + sectionW * (idx + 1), bottomY + 28);
          ctx.stroke();
        }
      });

      // 7. Footer: — htaf.online —
      const footerY = pad + 1250;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;

      // Left rule
      ctx.beginPath();
      ctx.moveTo(pad + 180, footerY);
      ctx.lineTo(pad + 480, footerY);
      ctx.stroke();

      // Center text
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('htaf.online', w / 2, footerY);

      // Right rule
      ctx.beginPath();
      ctx.moveTo(w - pad - 480, footerY);
      ctx.lineTo(w - pad - 180, footerY);
      ctx.stroke();

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        const cleanName = (school.name || 'مدرسة').replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '_');
        link.download = `باركود_${cleanName}_هتاف_الذكي.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to export card PNG:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Print Card
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Printable / Viewable Card Container - Matching Reference Image */}
      <div
        id="school-barcode-printable-card"
        className={`bg-white rounded-[32px] sm:rounded-[36px] border-2 transition-all p-5 sm:p-7 relative overflow-hidden flex flex-col items-center text-center ${
          themeConfig.neonBorder
        } ${compact ? 'max-w-[420px]' : 'max-w-[500px] sm:max-w-[540px]'} w-full`}
        style={{
          boxShadow: '0 0 45px rgba(6, 182, 212, 0.35), 0 0 75px rgba(168, 85, 247, 0.25)'
        }}
      >
        {/* Subtle Ambient Light Reflections */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between gap-3 mb-4 z-10">
          {/* Top-Left Badge: v3.0 AI or Stage */}
          <div className="flex items-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border shadow-xs tracking-wide ${themeConfig.badgeBg}`}
            >
              {displayBadge}
            </span>
          </div>

          {/* Center Titles (School Name On Top) */}
          <div className="flex-1 px-2 text-center">
            <h2
              className={`text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight leading-tight bg-gradient-to-r ${themeConfig.gradientText} bg-clip-text text-transparent`}
            >
              {displayTitle}
            </h2>
            <p className="text-slate-900 font-extrabold text-xs sm:text-sm mt-0.5 tracking-wide">
              {displaySubtitle}
            </p>
          </div>

          {/* Top-Right Glossy Dark Logo Emblem Tile */}
          <div
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-[#0a1128] to-[#040817] border flex flex-col items-center justify-center p-1 relative shrink-0 shadow-lg ${themeConfig.logoBorder}`}
          >
            {/* Top Star */}
            <div className="w-3.5 h-3.5 text-amber-400 mb-0.5">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            </div>

            {/* Emblem Student / Wings */}
            <div className="w-6 h-4 relative flex items-center justify-center">
              <svg viewBox="0 0 40 24" className="w-full h-full">
                <circle cx="20" cy="5" r="4" fill="url(#gradHead)" />
                <path
                  d="M6 14 Q20 22 34 14"
                  fill="none"
                  stroke="url(#gradWings)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 20 Q20 16 30 20"
                  fill="none"
                  stroke="url(#gradWings)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradHead" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                  <linearGradient id="gradWings" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Logo Text */}
            <div className="text-[7.5px] font-black text-cyan-300 leading-none mt-0.5">
              {school.logoText || 'HTAF'}
            </div>
          </div>
        </div>

        {/* Center QR Code Canvas */}
        <div className="relative my-2 p-2 bg-white rounded-2xl flex items-center justify-center shadow-inner z-10">
          <canvas
            ref={qrCanvasRef}
            className="w-64 h-64 sm:w-76 sm:h-76 object-contain rounded-xl"
            title={`امسح الباركود لزيارة ${displayTitle}`}
          />
        </div>

        {/* Action Button Pill: "امسح الرمز لزيارة المنصة" */}
        <div className="w-full px-2 sm:px-4 mt-3 mb-4 z-10">
          <div
            className={`w-full py-2.5 sm:py-3 px-4 rounded-full bg-gradient-to-r ${themeConfig.pillGradient} text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-purple-600/30 tracking-wide`}
          >
            <Smartphone className="w-5 h-5 text-white animate-pulse" />
            <span>امسح الرمز لزيارة المنصة</span>
          </div>
        </div>

        {/* Bottom Feature Tags (4 items with dividers) */}
        <div className="w-full grid grid-cols-4 items-center justify-center text-center py-2 px-1 border-t border-purple-100/80 z-10 text-[10.5px] sm:text-xs font-bold text-slate-800">
          <div className="flex flex-col items-center gap-1">
            <GraduationCap className={`w-4 h-4 ${themeConfig.accentIcons}`} />
            <span>مدارس ذكية</span>
          </div>

          <div className="flex flex-col items-center gap-1 border-r border-purple-200">
            <Brain className={`w-4 h-4 ${themeConfig.accentIcons}`} />
            <span>ذكاء اصطناعي</span>
          </div>

          <div className="flex flex-col items-center gap-1 border-r border-purple-200">
            <BarChart3 className={`w-4 h-4 ${themeConfig.accentIcons}`} />
            <span>متابعة شاملة</span>
          </div>

          <div className="flex flex-col items-center gap-1 border-r border-purple-200">
            <Users className={`w-4 h-4 ${themeConfig.accentIcons}`} />
            <span>بيئة تعليمية متكاملة</span>
          </div>
        </div>

        {/* Footer Link: — htaf.online — */}
        <div className="w-full flex items-center justify-center gap-3 pt-3 mt-1 text-slate-700 font-black text-xs sm:text-sm tracking-widest z-10">
          <div className="h-[1.5px] bg-slate-300 w-12 sm:w-16" />
          <span className="font-mono text-slate-900">htaf.online</span>
          <div className="h-[1.5px] bg-slate-300 w-12 sm:w-16" />
        </div>
      </div>

      {/* Control Actions Bar (Below Card) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 max-w-[540px] w-full">
        {/* Download PNG Button */}
        <button
          onClick={handleDownloadCardPng}
          disabled={isGeneratingPng}
          className="flex-1 min-w-[150px] bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isGeneratingPng ? 'جاري التحميل...' : 'تحميل صورة PNG فائقة الدقة'}</span>
        </button>

        {/* Print Button */}
        <button
          onClick={handlePrintCard}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          title="طباعة كرت الباركود المكتبي والمدرسي"
        >
          <Printer className="w-4 h-4 text-cyan-400" />
          <span>طباعة A4</span>
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          title="نسخ الرابط المباشر للمدرسة"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
          <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
        </button>

        {/* Open Direct Test Link */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          title="فتح الرابط في نافذة جديدة"
        >
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span>فتح</span>
        </a>

        {/* WhatsApp Share Button */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `🏫 باركود وبوابة ${displayTitle} الرسمية المعتمدة على منصة هتاف العاصمي:\n\n🔗 ${targetUrl}\n\nامسح الرمز أو افتح الرابط للدخول المباشر للبوابة.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          title="مشاركة عبر واتساب"
        >
          <Share2 className="w-4 h-4" />
          <span>واتساب</span>
        </a>
      </div>

      {/* URL Inspection Tag */}
      <div className="mt-3 text-[11px] text-slate-400 font-mono flex items-center gap-1 max-w-[500px] truncate">
        <span className="text-slate-500 font-sans">الرابط المشفر:</span>
        <span className="text-cyan-400 truncate dir-ltr">{targetUrl}</span>
      </div>
    </div>
  );
};
