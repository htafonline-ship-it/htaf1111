import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  CurriculumBook,
  SmartPageSummary,
  SmartPageExerciseItem,
  SmartPageQuiz,
  SmartPageQuizQuestion,
  SmartPageFlashcard,
  SmartPageVocabulary,
  BookPageAnalysisResult
} from '../types';
import { getAuthenticSaudiBookPage } from '../data/saudiCurriculumPagesEngine';
import {
  getCachedPageText,
  savePageTextToCacheAndDb,
  searchBookText,
  callSmartPageTool,
  getPdfProxyUrl,
  SearchPageResult
} from '../lib/bookReaderService';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Lightbulb,
  GraduationCap,
  RotateCcw,
  Loader2,
  X,
  Send,
  Zap,
  Target,
  Award,
  Layers,
  Search,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  BookMarked,
  SlidersHorizontal,
  Compass,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
  Eye,
  ScanText,
  Volume2
} from 'lucide-react';

// Configure PDF.js Worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export type SmartToolType =
  | 'summarize'
  | 'explain'
  | 'key-ideas'
  | 'extract-questions'
  | 'quiz'
  | 'solve-exercises'
  | 'vocabulary'
  | 'flashcards'
  | 'simplify'
  | 'ask';

interface SmartBookReaderProps {
  book: CurriculumBook;
  initialPage?: number;
  initialTool?: SmartToolType;
  onClose: () => void;
  onOpenTeacherWithTopic?: (subject: string, grade: string) => void;
  onOpenSolverWithQuestion?: (question: string, subject: string, grade: string) => void;
}

interface CurriculumPageVisualProps {
  pageData: BookPageAnalysisResult;
  book: CurriculumBook;
  currentPage: number;
  scale: number;
  fitMode: 'custom' | 'width' | 'page';
}

const CurriculumPageVisual: React.FC<CurriculumPageVisualProps> = ({
  pageData,
  book,
  currentPage,
  scale,
  fitMode
}) => {
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const anyData = pageData as any;
  const unitLabel = pageData.unitName || anyData.unitTitle || `الوحدة التعليمية (${book.subject})`;
  const keyConcepts = pageData.keyConceptsAndLaws || anyData.keyIdeas || [];
  const textContent = pageData.pageTextContent || anyData.textContent || '';
  const termItems: Array<{ term: string; definition: string }> = anyData.terms || [];
  const exerciseItems: any[] = pageData.solvedExercises || anyData.exercises || [];

  return (
    <div
      className="bg-white text-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 transition-all duration-300 select-text relative flex flex-col"
      style={{
        width: fitMode === 'width' ? '100%' : `${Math.min(1000, Math.max(540, 780 * scale))}px`,
        maxWidth: fitMode === 'width' ? '980px' : undefined,
        minHeight: '1050px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", sans-serif'
      }}
    >
      {/* Official Saudi Ministry Top Header Stripe */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white px-6 py-4 shadow-sm border-b-2 border-amber-400">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-200 font-bold tracking-wider">
                المملكة العربية السعودية • وزارة التعليم
              </div>
              <div className="text-xs font-black tracking-wide text-white">
                الإدارة العامة للمناهج والبرامج التعليمية
              </div>
            </div>
          </div>

          <div className="text-center hidden sm:block">
            <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-extrabold border border-white/20 text-emerald-100">
              {book.subject} — {book.grade}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-left">
              <span className="text-[10px] text-emerald-200 block font-bold">طبعة معتمدة 1448هـ</span>
              <span className="text-xs font-black text-amber-300">النسخة الرقمية الرسمية</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              {currentPage}
            </div>
          </div>
        </div>
      </div>

      {/* Page Body Content */}
      <div className="p-6 sm:p-10 space-y-6 flex-1 bg-gradient-to-b from-white via-slate-50/40 to-white">
        {/* Unit & Lesson Badges Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5 mb-3">
            <span className="bg-emerald-700 text-white text-[11px] font-black px-3 py-1 rounded-lg">
              {unitLabel}
            </span>
            <span className="text-xs font-bold text-emerald-800">
              {book.term || 'الفصل الدراسي الثاني'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {pageData.lessonTitle || book.title}
          </h2>

          {pageData.pageHeading && (
            <p className="text-xs sm:text-sm font-bold text-emerald-900/90 mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pageData.pageHeading}</span>
            </p>
          )}
        </div>

        {/* Lesson Core Idea / Objectives Callout Box */}
        {keyConcepts.length > 0 && (
          <div className="bg-amber-50/60 border-r-4 border-amber-500 border-y border-l border-amber-200/70 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>فكرة الدرس والأهداف التعليمية:</span>
            </div>
            <ul className="space-y-1.5 pr-5 list-disc text-xs text-slate-700 leading-relaxed font-medium">
              {keyConcepts.map((idea: string, idx: number) => (
                <li key={idx}>{idea}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Lesson Content Text */}
        <div className="space-y-4 text-slate-800 leading-relaxed text-sm sm:text-base font-normal">
          {(textContent || '')
            .split('\n\n')
            .filter((p) => p.trim().length > 0)
            .map((para, idx) => {
              const isRule = para.includes('قاعدة') || para.includes('قانون') || para.includes('تعريف');
              const isExample = para.includes('مثال') || para.includes('تطبيق');

              if (isRule) {
                return (
                  <div
                    key={idx}
                    className="bg-teal-50 border border-teal-300/80 p-4 rounded-xl text-teal-950 text-xs sm:text-sm font-bold shadow-xs my-3 space-y-1"
                  >
                    <div className="text-[11px] font-black text-teal-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-teal-600" />
                      <span>قاعدة منهجية معتمدة:</span>
                    </div>
                    <p className="leading-relaxed">{para}</p>
                  </div>
                );
              }

              if (isExample) {
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 text-xs sm:text-sm font-medium my-3 space-y-1"
                  >
                    <div className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-slate-500" />
                      <span>مثال توضيحي محلول:</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line">{para}</p>
                  </div>
                );
              }

              return (
                <p key={idx} className="text-justify leading-relaxed whitespace-pre-line">
                  {para}
                </p>
              );
            })}
        </div>

        {/* Vocabulary / Terms pill tags */}
        {termItems.length > 0 && (
          <div className="bg-rose-50/50 border border-rose-200/70 p-4 rounded-xl space-y-2">
            <span className="text-[11px] font-black text-rose-900 block">
              المفردات والمصطلحات الأساسية في الصفحة:
            </span>
            <div className="flex flex-wrap gap-2">
              {termItems.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-rose-200 px-3 py-1.5 rounded-lg text-xs shadow-xs"
                >
                  <strong className="text-rose-900 ml-1.5 font-bold">{t.term}:</strong>
                  <span className="text-slate-600">{t.definition}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Exercises Section (تدرب وحل المسائل) */}
        {exerciseItems.length > 0 && (
          <div className="border-t-2 border-dashed border-slate-200 pt-6 mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  تدرب وحل المسائل (صفحة {currentPage})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {exerciseItems.length} تدريبات
              </span>
            </div>

            <div className="space-y-3">
              {exerciseItems.map((ex, idx) => {
                const exId = ex.id || String(idx + 1);
                const isRevealed = revealedSolutions[exId];

                return (
                  <div
                    key={idx}
                    className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-2 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                        <span className="text-teal-700 font-black ml-1.5">({idx + 1})</span>
                        {ex.question}
                      </p>

                      <button
                        onClick={() => toggleSolution(exId)}
                        className="shrink-0 bg-white hover:bg-slate-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-2xs transition"
                      >
                        {isRevealed ? 'إخفاء الحل' : 'كشف الحل'}
                      </button>
                    </div>

                    {isRevealed && (
                      <div className="bg-teal-900/5 border border-teal-200 p-3 rounded-lg text-xs space-y-2 text-slate-800 mt-2">
                        {ex.steps && ex.steps.length > 0 && (
                          <div>
                            <span className="font-bold text-teal-900 block text-[11px] mb-1">
                              خطوات الحل النموذجية:
                            </span>
                            <ol className="list-decimal pr-4 space-y-1 text-slate-700">
                              {ex.steps.map((st: string, sIdx: number) => (
                                <li key={sIdx}>{st}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {ex.finalAnswer && (
                          <div className="bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-md font-black text-xs inline-block">
                            الناتج النهائي: {ex.finalAnswer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Official Saudi Ministry Footer */}
      <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-slate-500 text-[11px] flex items-center justify-between shrink-0">
        <span className="font-bold">المملكة العربية السعودية • وزارة التعليم • جميع الحقوق محفوظة</span>
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-black text-slate-700 text-xs">
          <span>صفحة</span>
          <span className="text-emerald-700 font-bold">{currentPage}</span>
        </div>
      </div>
    </div>
  );
};

export const SmartBookReader: React.FC<SmartBookReaderProps> = ({
  book,
  initialPage = 1,
  initialTool = 'summarize',
  onClose,
  onOpenTeacherWithTopic,
  onOpenSolverWithQuestion
}) => {
  // Page & Viewport States
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const [pageInput, setPageInput] = useState<string>(String(initialPage || 1));
  const [numPages, setNumPages] = useState<number>(book.totalPages || 120);
  const [scale, setScale] = useState<number>(1.2);
  const [fitMode, setFitMode] = useState<'custom' | 'width' | 'page'>('width');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Visual Mode vs PDF Mode (PDF.js vs Authentic Saudi Curriculum Page)
  const [displayMode, setDisplayMode] = useState<'pdf' | 'curriculum-preview'>('curriculum-preview');

  // PDF Loading & Rendering States
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(true);
  const [isPageRendering, setIsPageRendering] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [usedProxy, setUsedProxy] = useState<boolean>(false);

  // Page Text & Extraction
  const [pageText, setPageText] = useState<string>('');
  const [isOcrExtracting, setIsOcrExtracting] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Authentic Saudi Curriculum Page Data for Current Page
  const authenticPage = useMemo(() => {
    return getAuthenticSaudiBookPage(book.title, book.subject, book.grade, currentPage);
  }, [book.title, book.subject, book.grade, currentPage]);

  // Synchronize Page Text whenever page changes
  useEffect(() => {
    if (!pageText || pageText.trim().length === 0) {
      const anyAuth = authenticPage as any;
      const defaultText = authenticPage.pageTextContent || anyAuth.textContent || '';
      setPageText(defaultText);
      savePageTextToCacheAndDb(book.id, currentPage, defaultText);
    }
  }, [currentPage, authenticPage, book.id, pageText]);

  // Active Tool & Tool States
  const [activeTool, setActiveTool] = useState<SmartToolType>(initialTool);
  const [toolLoading, setToolLoading] = useState<boolean>(false);
  const [toolError, setToolError] = useState<string | null>(null);

  // Tool Data Containers
  const [summaryData, setSummaryData] = useState<SmartPageSummary | null>(null);
  const [explainData, setExplainData] = useState<any | null>(null);
  const [keyIdeasData, setKeyIdeasData] = useState<any | null>(null);
  const [questionsData, setQuestionsData] = useState<SmartPageQuiz | null>(null);
  const [exercisesData, setExercisesData] = useState<SmartPageExerciseItem[]>([]);
  const [vocabData, setVocabData] = useState<SmartPageVocabulary[]>([]);
  const [flashcardsData, setFlashcardsData] = useState<SmartPageFlashcard[]>([]);
  const [simplifyData, setSimplifyData] = useState<any | null>(null);

  // Interactive Quiz Execution State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Exercise Interaction States (expanded details, hints, explanation)
  const [exerciseVisibility, setExerciseVisibility] = useState<
    Record<string, { showSolution?: boolean; showHint?: boolean; showExplain?: boolean; showSimilar?: boolean }>
  >({});

  // Flashcard Current Index
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);

  // Ask Teacher About Page State
  const [askQuestionInput, setAskQuestionInput] = useState<string>('');
  const [askHistory, setAskHistory] = useState<Array<{ q: string; a: string; quote?: string }>>([]);

  // Search Inside Book
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchPageResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // DOM Refs
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // 1. Load PDF Document (with CORS retry through proxy)
  const loadPdfDocument = useCallback(
    async (tryProxy = false) => {
      const originalUrl = book.book_pdf_url || book.source_url;
      if (!originalUrl) {
        setPdfLoadError('لم يتم العثور على رابط مباشر لملف الكتاب (PDF)');
        setIsPdfLoading(false);
        setDisplayMode('curriculum-preview');
        return;
      }

      setIsPdfLoading(true);
      setPdfLoadError(null);

      const targetUrl = tryProxy ? getPdfProxyUrl(originalUrl) : originalUrl;
      setUsedProxy(tryProxy);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: targetUrl,
          withCredentials: false
        });

        const loadedDoc = await loadingTask.promise;
        setPdfDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setIsPdfLoading(false);
        setDisplayMode('pdf');
      } catch (err: any) {
        console.warn(`[SmartBookReader] PDF load error on ${targetUrl}:`, err);
        // If direct fetch failed and we haven't tried the CORS proxy yet, retry with proxy
        if (!tryProxy && originalUrl.startsWith('http')) {
          console.info('[SmartBookReader] Retrying via /api/book-proxy...');
          return loadPdfDocument(true);
        }

        setPdfLoadError(
          'تعذر تحميل صفحة الكتاب بصيغة PDF المباشرة من المصدر الخارجي. تم تفعيل معاينة صفحة المنهج التفاعلية المعتمدة تلقائياً.'
        );
        setIsPdfLoading(false);
        setDisplayMode('curriculum-preview');
      }
    },
    [book.book_pdf_url, book.source_url]
  );

  useEffect(() => {
    loadPdfDocument(false);
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [loadPdfDocument]);

  // 2. Render Current Page onto Canvas & Extract Text
  const renderCurrentPage = useCallback(
    async (doc: any, pageNum: number) => {
      if (!doc || !canvasRef.current) return;

      setIsPageRendering(true);

      // Cancel previous render task if still in progress
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }

      try {
        const page = await doc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Viewport & Scale calculation
        const initialViewport = page.getViewport({ scale: 1 });
        let targetScale = scale;

        if (fitMode === 'width' && readerContainerRef.current) {
          const containerWidth = readerContainerRef.current.clientWidth - 48; // padding
          targetScale = Math.max(0.6, containerWidth / initialViewport.width);
        } else if (fitMode === 'page' && readerContainerRef.current) {
          const containerHeight = readerContainerRef.current.clientHeight - 80;
          targetScale = Math.max(0.5, containerHeight / initialViewport.height);
        }

        const viewport = page.getViewport({ scale: targetScale });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: ctx,
          transform,
          viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        // 3. Extract text content from PDF.js
        const cachedText = await getCachedPageText(book.id, pageNum);
        if (cachedText && cachedText.trim().length > 20) {
          setPageText(cachedText);
        } else {
          const textContent = await page.getTextContent();
          const rawText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ')
            .trim();

          if (rawText.length > 25) {
            setPageText(rawText);
            savePageTextToCacheAndDb(book.id, pageNum, rawText);
          } else {
            // Text layer is empty or scanned page; attempt OCR snapshot via canvas
            extractTextViaOcr(canvas, pageNum);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('[SmartBookReader] Page render error:', err);
        }
      } finally {
        setIsPageRendering(false);
      }
    },
    [book.id, fitMode, scale]
  );

  // Vision OCR Fallback if page text is empty
  const extractTextViaOcr = async (canvas: HTMLCanvasElement, pageNum: number) => {
    setIsOcrExtracting(true);
    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      const res = await callSmartPageTool<{ text: string }>({
        toolType: 'ocr',
        bookId: book.id,
        bookTitle: book.title,
        subject: book.subject,
        grade: book.grade,
        pageNumber: pageNum,
        pageText: '',
        imageBase64: base64
      });

      if (res && res.text) {
        setPageText(res.text);
        savePageTextToCacheAndDb(book.id, pageNum, res.text);
      }
    } catch (e) {
      console.warn('[SmartBookReader] OCR Extraction notice:', e);
    } finally {
      setIsOcrExtracting(false);
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderCurrentPage(pdfDoc, currentPage);
    }
    setPageInput(String(currentPage));
  }, [pdfDoc, currentPage, renderCurrentPage]);

  // Execute Active Smart Tool whenever tool or page changes
  const executeCurrentTool = useCallback(
    async (toolToRun: SmartToolType, forceRefresh = false) => {
      setToolLoading(true);
      setToolError(null);

      const authenticData = getAuthenticSaudiBookPage(book.title, book.subject, book.grade, currentPage);
      const anyAuth = authenticData as any;
      const text =
        pageText ||
        (await getCachedPageText(book.id, currentPage)) ||
        authenticData.pageTextContent ||
        anyAuth.textContent ||
        `صفحة ${currentPage} من كتاب ${book.title}`;

      try {
        if (toolToRun === 'summarize') {
          try {
            const res = await callSmartPageTool<SmartPageSummary>({
              toolType: 'summarize',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setSummaryData(res);
          } catch {
            const summaryStr = authenticData.pageSummary || anyAuth.summary || '';
            const keyPointsList = authenticData.keyConceptsAndLaws || anyAuth.keyIdeas || [];
            setSummaryData({
              summary: summaryStr,
              keyPoints: keyPointsList,
              coreConcepts: keyPointsList.slice(0, 3)
            });
          }
        } else if (toolToRun === 'explain') {
          try {
            const res = await callSmartPageTool<any>({
              toolType: 'explain',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setExplainData(res);
          } catch {
            setExplainData({
              title: authenticData.lessonTitle,
              explanation: authenticData.pageSummary || anyAuth.summary || '',
              simpleAnalogy: 'شرح مبسط يربط مفاهيم الدرس بتطبيقات واضحة وسهلة الفهم للطالب.',
              realWorldExample: 'تطبيق عملي نراه في حياتنا اليومية يعزز فهم المفهوم العلمي.',
              keyRules: authenticData.keyConceptsAndLaws || anyAuth.keyIdeas || []
            });
          }
        } else if (toolToRun === 'key-ideas') {
          try {
            const res = await callSmartPageTool<any>({
              toolType: 'key-ideas',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setKeyIdeasData(res);
          } catch {
            const keyIdeasArr = authenticData.keyConceptsAndLaws || anyAuth.keyIdeas || [];
            setKeyIdeasData({
              mainIdea: authenticData.pageHeading,
              keyIdeas: keyIdeasArr.map((ki: string) => ({
                idea: ki,
                explanation: 'مفهوم أساسي محدد في منهج وزارة التعليم'
              }))
            });
          }
        } else if (toolToRun === 'extract-questions') {
          try {
            const res = await callSmartPageTool<SmartPageQuiz>({
              toolType: 'extract-questions',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setQuestionsData(res);
          } catch {
            const rawQuiz = authenticData.practiceQuiz?.questions || anyAuth.quizQuestions || [];
            const qList = rawQuiz.map((q: any, idx: number) => ({
              id: `q_${currentPage}_${idx + 1}`,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || 'الإجابة المعتمدة وفق شروحات المقرر'
            }));
            setQuestionsData({
              title: `أسئلة صفحة ${currentPage}: ${authenticData.lessonTitle}`,
              questions: qList
            });
          }
        } else if (toolToRun === 'quiz') {
          setQuizAnswers({});
          setQuizSubmitted(false);
          try {
            const res = await callSmartPageTool<SmartPageQuiz>({
              toolType: 'quiz',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setQuestionsData(res);
          } catch {
            const rawQuiz = authenticData.practiceQuiz?.questions || anyAuth.quizQuestions || [];
            const qList = rawQuiz.map((q: any, idx: number) => ({
              id: `q_${currentPage}_${idx + 1}`,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || 'الإجابة المعتمدة وفق شروحات المقرر'
            }));
            setQuestionsData({
              title: `اختبار صفحة ${currentPage}: ${authenticData.lessonTitle}`,
              questions: qList
            });
          }
        } else if (toolToRun === 'solve-exercises') {
          setExerciseVisibility({});
          try {
            const res = await callSmartPageTool<{ exercises: SmartPageExerciseItem[] }>({
              toolType: 'solve-exercises',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setExercisesData(res.exercises || []);
          } catch {
            const rawEx = authenticData.solvedExercises || anyAuth.exercises || [];
            const exList = rawEx.map((ex: any, idx: number) => ({
              id: `ex_${currentPage}_${idx + 1}`,
              question: ex.question,
              steps: ex.steps || ['تحديد المعطيات والمطلوب بدقة', 'تطبيق القاعدة المنهجية المعتمدة', 'إتمام الحساب والوصول للناتج'],
              finalAnswer: ex.finalAnswer || 'الحل النموذجي المعتمد',
              hint: 'راجع القوانين الموضحة في مستهل الصفحة.',
              explain: 'خطوات الحل مبنية على معايير المنهج المعتمد.',
              similarQuestion: 'مسألة تدريبية مشابهة لتعزيز الإتقان.'
            }));
            setExercisesData(exList);
          }
        } else if (toolToRun === 'vocabulary') {
          try {
            const res = await callSmartPageTool<{ terms: SmartPageVocabulary[] }>({
              toolType: 'vocabulary',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setVocabData(res.terms || []);
          } catch {
            const rawTerms = anyAuth.terms || [];
            const terms = rawTerms.map((t: any) => ({
              term: t.term,
              definition: t.definition,
              context: t.context || authenticData.lessonTitle
            }));
            setVocabData(terms);
          }
        } else if (toolToRun === 'flashcards') {
          setFlashcardIndex(0);
          setIsFlashcardFlipped(false);
          try {
            const res = await callSmartPageTool<{ flashcards: SmartPageFlashcard[] }>({
              toolType: 'flashcards',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setFlashcardsData(res.flashcards || []);
          } catch {
            const rawCards = anyAuth.flashcards || [];
            const cards = rawCards.map((fc: any, idx: number) => ({
              id: `fc_${currentPage}_${idx + 1}`,
              front: fc.front,
              back: fc.back,
              category: fc.category || authenticData.unitName || anyAuth.unitTitle
            }));
            setFlashcardsData(cards);
          }
        } else if (toolToRun === 'simplify') {
          try {
            const res = await callSmartPageTool<any>({
              toolType: 'simplify',
              bookId: book.id,
              bookTitle: book.title,
              subject: book.subject,
              grade: book.grade,
              pageNumber: currentPage,
              pageText: text,
              forceRefresh
            });
            setSimplifyData(res);
          } catch {
            setSimplifyData({
              simplifiedExplanation: authenticData.pageSummary || anyAuth.summary || '',
              takeaways: authenticData.keyConceptsAndLaws || anyAuth.keyIdeas || []
            });
          }
        }
      } catch (err: any) {
        setToolError(err.message || 'فشلت معالجة الأداة الذكية');
      } finally {
        setToolLoading(false);
      }
    },
    [book.id, book.title, book.subject, book.grade, currentPage, pageText]
  );

  useEffect(() => {
    executeCurrentTool(activeTool);
  }, [activeTool, currentPage, executeCurrentTool]);

  // Handle Ask Teacher submission
  const handleAskQuestion = async () => {
    if (!askQuestionInput.trim()) return;
    const q = askQuestionInput.trim();
    setAskQuestionInput('');
    setToolLoading(true);

    try {
      const text = pageText || (await getCachedPageText(book.id, currentPage)) || '';
      const res = await callSmartPageTool<{ answer: string; quoteFromPage?: string }>({
        toolType: 'ask',
        bookId: book.id,
        bookTitle: book.title,
        subject: book.subject,
        grade: book.grade,
        pageNumber: currentPage,
        pageText: text,
        question: q
      });

      setAskHistory((prev) => [
        ...prev,
        { q, a: res.answer, quote: res.quoteFromPage }
      ]);
    } catch (err: any) {
      setAskHistory((prev) => [
        ...prev,
        { q, a: 'عذراً، حدث خطأ أثناء الإجابة. يرجى إعادة المحاولة.' }
      ]);
    } finally {
      setToolLoading(false);
    }
  };

  // Handle Search in Book
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowSearchDropdown(true);
    try {
      const res = await searchBookText(book.id, searchQuery, numPages);
      setSearchResults(res);
    } finally {
      setIsSearching(false);
    }
  };

  // Navigation handlers
  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setCurrentPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Quiz evaluation helper
  const calculateQuizScore = () => {
    if (!questionsData || !questionsData.questions) return { score: 0, total: 0, percentage: 0 };
    let correctCount = 0;
    questionsData.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const total = questionsData.questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return { score: correctCount, total, percentage };
  };

  return (
    <div
      ref={readerContainerRef}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden text-slate-100 font-sans"
      dir="rtl"
    >
      {/* 1. TOP GLOBAL TOOLBAR */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Book Information */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-sm sm:text-base text-white truncate flex items-center gap-2">
              <span>{book.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                {book.subject} • {book.grade}
              </span>
            </h2>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
              <span>طبعة المنهج المعتمد</span>
              <span>•</span>
              <span>{numPages} صفحة</span>
              {usedProxy && (
                <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800">
                  اتصال آمن ممرر
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Global Search inside Book */}
        <div className="relative hidden md:block w-72">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في نصوص الكتاب..."
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl pr-9 pl-4 py-2 focus:outline-none focus:border-emerald-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </form>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 max-h-72 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-300">نتائج البحث ({searchResults.length})</span>
                <button
                  onClick={() => setShowSearchDropdown(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isSearching ? (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>جاري البحث في صفحات الكتاب...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  لم يتم العثور على نتائج مطابقة في الصفحات المستخرجة.
                </p>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(res.pageNumber);
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-right p-2 rounded-xl bg-slate-800/60 hover:bg-emerald-950/40 hover:border-emerald-600/40 border border-transparent transition text-xs space-y-1 block"
                  >
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                      <span>صفحة {res.pageNumber}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">{res.snippet}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {book.source_url && (
            <a
              href={book.source_url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition hidden sm:flex"
              title="فتح المصدر الرسمي"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold px-3"
            title="إغلاق العارض"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">إغلاق</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN SPLIT BODY (CANVAS STAGE + FIXED SMART TOOL PANEL) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* RIGHT/CENTER: ACTUAL BOOK PAGE VIEWER */}
        <section className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative border-b lg:border-b-0 lg:border-l border-slate-800">
          {/* Reader Viewport Controls Bar */}
          <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between gap-2 shrink-0 text-xs">
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <form onSubmit={handlePageJump} className="flex items-center gap-1">
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-12 text-center bg-slate-800 border border-slate-700 rounded-lg py-1 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400">/ {numPages}</span>
              </form>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher: Authentic Curriculum Page vs PDF.js */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setDisplayMode('curriculum-preview')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
                  displayMode === 'curriculum-preview'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="عرض صفحة المنهج بتنسيق وطباعة وزارة التعليم المعتمدة"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>صفحة المنهج</span>
              </button>

              {pdfDoc ? (
                <button
                  onClick={() => setDisplayMode('pdf')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
                    displayMode === 'pdf'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="عرض ملف PDF الرقمي عبر PDF.js"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>عارض PDF</span>
                </button>
              ) : (
                <button
                  onClick={() => loadPdfDocument(!usedProxy)}
                  disabled={isPdfLoading}
                  className="px-2 py-1 rounded-lg font-bold text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 flex items-center gap-1 transition"
                  title="إعادة محاولة جلب ملف PDF الأصلي"
                >
                  <RefreshCw className={`w-3 h-3 ${isPdfLoading ? 'animate-spin text-emerald-400' : ''}`} />
                  <span className="hidden sm:inline">جلب PDF</span>
                </button>
              )}
            </div>

            {/* Zoom & Fit Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFitMode('custom');
                  setScale((s) => Math.max(0.6, s - 0.2));
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-[11px] text-slate-300 font-bold min-w-10 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={() => {
                  setFitMode('custom');
                  setScale((s) => Math.min(2.5, s + 0.2));
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

              <button
                onClick={() => setFitMode('width')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition hidden sm:inline-block ${
                  fitMode === 'width' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ملاءمة العرض
              </button>

              <button
                onClick={() => setFitMode('page')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition hidden sm:inline-block ${
                  fitMode === 'page' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ملاءمة الصفحة
              </button>
            </div>
          </div>

          {/* Canvas & Authentic Visual Render Surface Container */}
          <div className="flex-1 overflow-auto flex flex-col items-center justify-start p-4 sm:p-6 bg-slate-950/60 relative">
            {/* Always keep canvas mounted (hidden or visible) so PDF.js and OCR never crash */}
            <div className={displayMode === 'pdf' && pdfDoc ? 'block' : 'hidden'}>
              <div className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-800 bg-white">
                {isPageRendering && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                )}
                <canvas ref={canvasRef} className="block max-w-none" />
              </div>
            </div>

            {/* Authentic Saudi Curriculum Page Render (Method B & Fallback) */}
            {(displayMode === 'curriculum-preview' || !pdfDoc) && (
              <div className="w-full flex flex-col items-center">
                {/* Visual mode info and status pill */}
                <div className="mb-3.5 max-w-2xl w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-[11px] text-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>
                      معاينة تفاعلية معتمدة: <strong>طبعة 1448هـ الرسمية</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pdfDoc ? (
                      <button
                        onClick={() => setDisplayMode('pdf')}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline transition text-[10px]"
                      >
                        التبديل إلى عارض PDF
                      </button>
                    ) : book.source_url ? (
                      <a
                        href={book.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] transition"
                        title="فتح رابط الكتاب في موقع عين الوطنية"
                      >
                        <span>المصدر الوزاري</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <CurriculumPageVisual
                  pageData={authenticPage}
                  book={book}
                  currentPage={currentPage}
                  scale={scale}
                  fitMode={fitMode}
                />
              </div>
            )}
          </div>

          {/* Page Text Extracted Bar */}
          <div className="h-9 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <ScanText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {isOcrExtracting
                  ? 'جاري استخراج نصوص الصفحة بالرؤية البصرية (OCR)...'
                  : pageText
                  ? `تم استخراج نصوص الصفحة ${currentPage} (${pageText.length} حرف)`
                  : 'النص المنهجي قيد التحضير'}
              </span>
            </div>

            {pageText && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pageText);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition font-bold shrink-0"
              >
                {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            )}
          </div>
        </section>

        {/* LEFT/SIDE: FIXED SMART TOOL PANEL */}
        <aside className="w-full lg:w-[460px] xl:w-[500px] bg-slate-900 flex flex-col shrink-0 overflow-hidden border-t lg:border-t-0 border-slate-800">
          {/* Smart Tool Horizontal Bar Selector */}
          <div className="bg-slate-950/80 border-b border-slate-800 p-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            {[
              { id: 'summarize', label: 'تلخيص الصفحة', icon: FileText, color: 'text-amber-400' },
              { id: 'explain', label: 'اشرح الصفحة', icon: GraduationCap, color: 'text-emerald-400' },
              { id: 'key-ideas', label: 'أهم الأفكار', icon: Lightbulb, color: 'text-yellow-400' },
              { id: 'extract-questions', label: 'استخراج أسئلة', icon: HelpCircle, color: 'text-blue-400' },
              { id: 'quiz', label: 'اختبر نفسك', icon: Target, color: 'text-purple-400' },
              { id: 'solve-exercises', label: 'حل التمارين', icon: Zap, color: 'text-teal-400' },
              { id: 'vocabulary', label: 'المصطلحات', icon: BookMarked, color: 'text-rose-400' },
              { id: 'flashcards', label: 'بطاقات مراجعة', icon: Layers, color: 'text-cyan-400' },
              { id: 'simplify', label: 'تبسيط الشرح', icon: Compass, color: 'text-orange-400' },
              { id: 'ask', label: 'اسأل عن الصفحة', icon: MessageSquare, color: 'text-pink-400' }
            ].map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as SmartToolType)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tool.color}`} />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tool Dynamic Stage Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Tool Refresh Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">
                  أدوات الصفحة الذكية ({currentPage})
                </h3>
              </div>

              <button
                onClick={() => executeCurrentTool(activeTool, true)}
                disabled={toolLoading}
                className="text-xs text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 font-bold disabled:opacity-50"
                title="إعادة تحليل الصفحة بالذكاء الاصطناعي"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${toolLoading ? 'animate-spin' : ''}`} />
                <span>إعادة تحليل</span>
              </button>
            </div>

            {toolLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-bold">
                  جاري تحليل نص الصفحة ({currentPage}) وتجهيز المخرجات المنهجية...
                </p>
                <p className="text-[11px] text-slate-500">
                  معالجة الذكاء الاصطناعي وفق معايير وزارة التعليم السعودية
                </p>
              </div>
            ) : toolError ? (
              <div className="bg-rose-950/30 border border-rose-800/50 p-4 rounded-2xl text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-300 font-bold">{toolError}</p>
                <button
                  onClick={() => executeCurrentTool(activeTool, true)}
                  className="text-xs bg-rose-900/60 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <>
                {/* TOOL 1: SUMMARIZE (Requirement 4) */}
                {activeTool === 'summarize' && summaryData && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <FileText className="w-4 h-4" />
                        <span>العنوان الرئيسي:</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white">
                        {summaryData.title}
                      </h4>
                    </div>

                    {/* Key Points */}
                    <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                      <h5 className="font-extrabold text-xs text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>أهم النقاط المنهجية:</span>
                      </h5>
                      <ul className="space-y-2">
                        {summaryData.keyPoints?.map((pt, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Concepts & Laws */}
                    {summaryData.concepts && summaryData.concepts.length > 0 && (
                      <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <h5 className="font-extrabold text-xs text-slate-300 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>المفاهيم والقوانين:</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {summaryData.concepts.map((c, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-800 border border-slate-700 text-amber-300 px-2.5 py-1 rounded-lg font-bold"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Laws if available */}
                    {summaryData.laws && summaryData.laws.length > 0 && (
                      <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 space-y-1.5">
                        <span className="text-[11px] font-bold text-amber-400 block">القوانين والقواعد:</span>
                        {summaryData.laws.map((l, i) => (
                          <p key={i} className="text-xs font-mono text-amber-200">{l}</p>
                        ))}
                      </div>
                    )}

                    {/* Conclusion */}
                    <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 block">الخلاصة المركزة:</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{summaryData.conclusion}</p>
                    </div>
                  </div>
                )}

                {/* TOOL 2: EXPLAIN (Requirement 7) */}
                {activeTool === 'explain' && explainData && (
                  <div className="space-y-4">
                    <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          <span>شرح مخصص للصف ({book.grade})</span>
                        </span>
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded">
                          تربوي مبسط
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-white">{explainData.title}</h4>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line text-justify">
                        {explainData.explanation}
                      </p>
                    </div>

                    {explainData.practicalExample && (
                      <div className="bg-blue-950/20 border border-blue-800/40 rounded-2xl p-4 space-y-1.5">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          <span>مثال من الحياة اليومية:</span>
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">{explainData.practicalExample}</p>
                      </div>
                    )}

                    {explainData.teacherAdvice && (
                      <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 space-y-1.5">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>نصيحة المعلم للاستيعاب:</span>
                        </span>
                        <p className="text-xs text-amber-200 leading-relaxed">{explainData.teacherAdvice}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 3: KEY IDEAS (Requirement 3) */}
                {activeTool === 'key-ideas' && keyIdeasData && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                        <Lightbulb className="w-4 h-4" />
                        <span>الفكرة المركزية:</span>
                      </span>
                      <p className="text-sm font-extrabold text-white leading-relaxed">
                        {keyIdeasData.mainIdea}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">الأفكار الفرعية:</span>
                      {keyIdeasData.subIdeas?.map((idea: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-start gap-2 text-xs text-slate-200"
                        >
                          <span className="w-5 h-5 rounded-lg bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{idea}</span>
                        </div>
                      ))}
                    </div>

                    {keyIdeasData.learningOutcomes && (
                      <div className="bg-emerald-950/20 border border-emerald-800/30 p-4 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 block">مخرجات التعلم المستهدفة:</span>
                        <ul className="space-y-1.5">
                          {keyIdeasData.learningOutcomes.map((out: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{out}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 4: EXTRACT QUESTIONS (Requirement 5) */}
                {activeTool === 'extract-questions' && questionsData && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 p-3.5 rounded-2xl">
                      <div>
                        <h4 className="font-extrabold text-xs text-white">
                          تم استخراج ({questionsData.questions?.length || 0}) أسئلة من الصفحة
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          اختيار من متعدد، صح وخطأ، أكمل الفراغ، ومسائل
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTool('quiz')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>ابدأ الاختبار الآن</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {questionsData.questions?.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-blue-400">سؤال {idx + 1}</span>
                            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {q.type === 'mcq'
                                ? 'اختيار من متعدد'
                                : q.type === 'true_false'
                                ? 'صح وخطأ'
                                : q.type === 'fill_blank'
                                ? 'أكمل الفراغ'
                                : q.type === 'problem'
                                ? 'مسألة تطبيقية'
                                : 'سؤال قصير'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white leading-relaxed">{q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {q.options?.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`text-[11px] p-2 rounded-lg border ${
                                  oIdx === q.correctAnswer
                                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg leading-relaxed">
                            <span className="font-bold text-slate-300">التعليل: </span>
                            {q.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TOOL 5: INTERACTIVE QUIZ (Requirement 6) */}
                {activeTool === 'quiz' && questionsData && (
                  <div className="space-y-4">
                    <div className="bg-purple-950/30 border border-purple-800/50 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-white">{questionsData.quizTitle}</h4>
                        <p className="text-[11px] text-purple-300 mt-0.5">
                          اختبار تفاعلي لقياس استيعابك الفوري لمحتوى الصفحة
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-purple-900/60 text-purple-200 px-2.5 py-1 rounded-xl">
                        {questionsData.questions?.length || 0} أسئلة
                      </span>
                    </div>

                    {/* Quiz Questions List */}
                    <div className="space-y-4">
                      {questionsData.questions?.map((q, idx) => {
                        const selectedOption = quizAnswers[q.id];
                        const isAnswered = selectedOption !== undefined;
                        const isCorrect = selectedOption === q.correctAnswer;

                        return (
                          <div
                            key={q.id || idx}
                            className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-300">السؤال {idx + 1}</span>
                              {quizSubmitted && (
                                <span
                                  className={`font-bold flex items-center gap-1 ${
                                    isCorrect ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>صحيح</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>خطأ</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-white leading-relaxed">{q.question}</p>

                            <div className="space-y-1.5">
                              {q.options?.map((opt, oIdx) => {
                                const isOptionSelected = selectedOption === oIdx;
                                let btnClasses =
                                  'w-full text-right p-2.5 rounded-xl text-xs transition border flex items-center justify-between ';

                                if (quizSubmitted) {
                                  if (oIdx === q.correctAnswer) {
                                    btnClasses += 'bg-emerald-900/40 border-emerald-600 text-emerald-200 font-bold';
                                  } else if (isOptionSelected) {
                                    btnClasses += 'bg-rose-900/40 border-rose-600 text-rose-200';
                                  } else {
                                    btnClasses += 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60';
                                  }
                                } else {
                                  if (isOptionSelected) {
                                    btnClasses += 'bg-purple-900/40 border-purple-500 text-purple-200 font-bold';
                                  } else {
                                    btnClasses += 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800';
                                  }
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                                    className={btnClasses}
                                  >
                                    <span>{opt}</span>
                                    {quizSubmitted && oIdx === q.correctAnswer && (
                                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Explanation visible when submitted or answered */}
                            {quizSubmitted && (
                              <div className="bg-slate-900/80 p-3 rounded-xl text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                                <span className="font-bold text-emerald-400">شرح الإجابة والتعليل: </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Quiz Submission & Results Card */}
                    {!quizSubmitted ? (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(quizAnswers).length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition"
                      >
                        <Award className="w-4 h-4" />
                        <span>تسليم الإجابات وعرض النتيجة والتقييم</span>
                      </button>
                    ) : (
                      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">نتيجتك النهائية في الاختبار:</span>
                          <h3 className="text-2xl font-black text-white mt-1">
                            {calculateQuizScore().score} من {calculateQuizScore().total} ({calculateQuizScore().percentage}%)
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-right text-xs">
                          <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-emerald-400 block text-[11px]">نقاط القوة:</span>
                            <p className="text-slate-300 text-[11px]">
                              استيعاب المفاهيم الأساسية الواردة في الصفحة بشكل ممتاز.
                            </p>
                          </div>
                          <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-amber-400 block text-[11px]">ما يحتاج مراجعة:</span>
                            <p className="text-slate-300 text-[11px]">
                              إعادة مراجعة القواعد والمسائل الدقيقة وتطبيق خطوات الحل.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة الاختبار</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 6: SOLVE EXERCISES (Requirement 8) */}
                {activeTool === 'solve-exercises' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-teal-950/30 border border-teal-800/40 p-3.5 rounded-2xl">
                      <div>
                        <h4 className="font-extrabold text-xs text-white">
                          تمارين وتدريبات الصفحة ({exercisesData.length})
                        </h4>
                        <p className="text-[10px] text-teal-300">
                          حلول مفصلة، تلميحات ذكية، تعليل، وأسئلة تدريبية مشابهة
                        </p>
                      </div>
                    </div>

                    {exercisesData.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        لا توجد تمارين مستخرجة في هذه الصفحة حالياً.
                      </p>
                    ) : (
                      exercisesData.map((ex, idx) => {
                        const state = exerciseVisibility[ex.id] || {};
                        return (
                          <div
                            key={ex.id || idx}
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-black text-teal-400">{ex.exerciseNumber || `سؤال ${idx + 1}`}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                تدريب معتمد
                              </span>
                            </div>

                            <p className="text-xs font-bold text-white leading-relaxed">{ex.question}</p>

                            {/* 4 Action Buttons: حل، تلميح، اشرح لي، سؤال مشابه */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                              <button
                                onClick={() =>
                                  setExerciseVisibility((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...prev[ex.id], showSolution: !prev[ex.id]?.showSolution }
                                  }))
                                }
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 ${
                                  state.showSolution
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>حل المسألة</span>
                              </button>

                              <button
                                onClick={() =>
                                  setExerciseVisibility((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...prev[ex.id], showHint: !prev[ex.id]?.showHint }
                                  }))
                                }
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 ${
                                  state.showHint
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <Lightbulb className="w-3 h-3" />
                                <span>تلميح</span>
                              </button>

                              <button
                                onClick={() =>
                                  setExerciseVisibility((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...prev[ex.id], showExplain: !prev[ex.id]?.showExplain }
                                  }))
                                }
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 ${
                                  state.showExplain
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <GraduationCap className="w-3 h-3" />
                                <span>اشرح لي</span>
                              </button>

                              <button
                                onClick={() =>
                                  setExerciseVisibility((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...prev[ex.id], showSimilar: !prev[ex.id]?.showSimilar }
                                  }))
                                }
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 ${
                                  state.showSimilar
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>سؤال مشابه</span>
                              </button>
                            </div>

                            {/* Solution Box */}
                            {state.showSolution && (
                              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-emerald-400 block text-[11px]">الحل النموذجي:</span>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-line">{ex.solution}</p>
                              </div>
                            )}

                            {/* Hint Box */}
                            {state.showHint && (
                              <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-amber-400 block text-[11px]">تلميح للتفكير:</span>
                                <p className="text-amber-200 leading-relaxed">{ex.hint}</p>
                              </div>
                            )}

                            {/* Explain Box */}
                            {state.showExplain && (
                              <div className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-blue-400 block text-[11px]">التعليل والقاعدة:</span>
                                <p className="text-blue-200 leading-relaxed">{ex.explanation}</p>
                              </div>
                            )}

                            {/* Similar Question Box */}
                            {state.showSimilar && (
                              <div className="bg-purple-950/30 border border-purple-800/40 p-3 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-purple-400 block text-[11px]">سؤال تدريبي مماثل:</span>
                                <p className="text-purple-200 leading-relaxed">{ex.similarQuestion}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TOOL 7: VOCABULARY (Requirement 3) */}
                {activeTool === 'vocabulary' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      المصطلحات والمفاهيم الواردة بالصفحة ({vocabData.length}):
                    </span>
                    {vocabData.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-1.5"
                      >
                        <h4 className="text-xs font-black text-rose-400">{item.term}</h4>
                        <p className="text-xs text-slate-200 leading-relaxed">{item.definition}</p>
                        {item.context && (
                          <p className="text-[10px] text-slate-400 italic">السياق: {item.context}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* TOOL 8: FLASHCARDS (Requirement 3) */}
                {activeTool === 'flashcards' && (
                  <div className="space-y-4">
                    {flashcardsData.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        لا توجد بطاقات مراجعة متاحة لهذه الصفحة حالياً.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            البطاقة {flashcardIndex + 1} من {flashcardsData.length}
                          </span>
                          <span>انقر على البطاقة لقلبها</span>
                        </div>

                        {/* Interactive Flip Card */}
                        <div
                          onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                          className={`min-h-48 p-6 rounded-3xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center shadow-xl select-none ${
                            isFlashcardFlipped
                              ? 'bg-cyan-950/40 border-cyan-700 text-cyan-100'
                              : 'bg-slate-800/80 border-slate-700 text-white'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2">
                            {isFlashcardFlipped ? 'الإجابة والتعريف (الخلف)' : 'السؤال والمفهوم (الوجه)'}
                          </span>
                          <p className="text-sm font-bold leading-relaxed">
                            {isFlashcardFlipped
                              ? flashcardsData[flashcardIndex]?.back
                              : flashcardsData[flashcardIndex]?.front}
                          </p>
                        </div>

                        {/* Flashcard Navigation Buttons */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            disabled={flashcardIndex <= 0}
                            onClick={() => {
                              setIsFlashcardFlipped(false);
                              setFlashcardIndex((i) => Math.max(0, i - 1));
                            }}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold py-2.5 rounded-xl transition"
                          >
                            البطاقة السابقة
                          </button>
                          <button
                            disabled={flashcardIndex >= flashcardsData.length - 1}
                            onClick={() => {
                              setIsFlashcardFlipped(false);
                              setFlashcardIndex((i) => Math.min(flashcardsData.length - 1, i + 1));
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold py-2.5 rounded-xl transition"
                          >
                            البطاقة التالية
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 9: SIMPLIFY (Requirement 3) */}
                {activeTool === 'simplify' && simplifyData && (
                  <div className="space-y-4">
                    <div className="bg-orange-950/30 border border-orange-800/40 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                        <Compass className="w-4 h-4" />
                        <span>شرح مبسط جداً:</span>
                      </span>
                      <h4 className="text-sm font-black text-white">{simplifyData.simpleTitle}</h4>
                    </div>

                    {simplifyData.simpleAnalogy && (
                      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-1.5">
                        <span className="text-xs font-bold text-amber-300">تشبيه تقريبي:</span>
                        <p className="text-xs text-slate-200 leading-relaxed">{simplifyData.simpleAnalogy}</p>
                      </div>
                    )}

                    <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line text-justify">
                        {simplifyData.simpleExplanation}
                      </p>
                    </div>

                    {simplifyData.keyTakeaway && (
                      <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-4 space-y-1">
                        <span className="text-xs font-bold text-emerald-400">الخلاصة في جملة:</span>
                        <p className="text-xs font-bold text-slate-100">{simplifyData.keyTakeaway}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 10: ASK ABOUT THIS PAGE (Requirement 13) */}
                {activeTool === 'ask' && (
                  <div className="space-y-4">
                    <div className="bg-pink-950/30 border border-pink-800/40 rounded-2xl p-3.5 space-y-1">
                      <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                        <span>اسأل المعلم الذكي عن الصفحة ({currentPage})</span>
                      </h4>
                      <p className="text-[10px] text-pink-300">
                        يتم الرد حصراً بالاعتماد على نصوص ومعطيات هذه الصفحة من المقرر
                      </p>
                    </div>

                    {/* Ask History */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {askHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">
                          اكتب أي سؤال يخطر في بالك حول هذه الصفحة وسيجيبك المعلم فوراً.
                        </p>
                      ) : (
                        askHistory.map((item, idx) => (
                          <div key={idx} className="space-y-2 text-xs">
                            {/* Student Question */}
                            <div className="bg-slate-800 p-3 rounded-2xl rounded-tr-none text-slate-200">
                              <span className="font-bold text-slate-400 text-[10px] block mb-1">سؤالك:</span>
                              <p>{item.q}</p>
                            </div>
                            {/* Teacher Answer */}
                            <div className="bg-pink-950/20 border border-pink-800/30 p-3.5 rounded-2xl rounded-tl-none text-slate-200 space-y-1.5">
                              <span className="font-bold text-pink-400 text-[10px] block">إجابة المعلم الذكي:</span>
                              <p className="leading-relaxed">{item.a}</p>
                              {item.quote && (
                                <p className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg italic">
                                  من الصفحة: "{item.quote}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Ask Input Form */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={askQuestionInput}
                        onChange={(e) => setAskQuestionInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                        placeholder="اكتب سؤالك عن محتوى الصفحة..."
                        className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-pink-500"
                      />
                      <button
                        onClick={handleAskQuestion}
                        disabled={!askQuestionInput.trim() || toolLoading}
                        className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-3.5 py-2.5 rounded-xl transition flex items-center justify-center shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
