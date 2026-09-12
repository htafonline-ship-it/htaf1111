import { supabase } from './supabase';
import {
  SmartPageSummary,
  SmartPageExerciseItem,
  SmartPageQuiz,
  SmartPageFlashcard,
  SmartPageVocabulary,
  LessonPageRecord
} from '../types';

export interface SearchPageResult {
  pageNumber: number;
  snippet: string;
}

// Memory & LocalStorage Cache Key Helpers
const getStorageKey = (bookId: string, pageNum: number) => `htaf_page_text_${bookId}_p${pageNum}`;
const getAnalysisStorageKey = (bookId: string, pageNum: number, tool: string) =>
  `htaf_analysis_${bookId}_p${pageNum}_${tool}`;

/**
 * Retrieve cached page text from LocalStorage or Supabase lesson_pages table
 */
export async function getCachedPageText(bookId: string, pageNumber: number): Promise<string | null> {
  if (!bookId || !pageNumber) return null;

  // 1. Check client-side storage first (instantaneous)
  const localVal = localStorage.getItem(getStorageKey(bookId, pageNumber));
  if (localVal && localVal.trim().length > 0) {
    return localVal;
  }

  // 2. Check Supabase lesson_pages table
  try {
    const { data, error } = await supabase
      .from('lesson_pages')
      .select('page_text')
      .eq('book_id', bookId)
      .eq('page_number', pageNumber)
      .maybeSingle();

    if (!error && data?.page_text && data.page_text.trim().length > 0) {
      localStorage.setItem(getStorageKey(bookId, pageNumber), data.page_text);
      return data.page_text;
    }
  } catch (err) {
    // Database table might not be initialized yet, fallback gracefully to client cache
  }

  return null;
}

/**
 * Save extracted page text into cache and Supabase lesson_pages table
 */
export async function savePageTextToCacheAndDb(
  bookId: string,
  pageNumber: number,
  pageText: string,
  imageUrl?: string,
  lessonId?: string
): Promise<void> {
  if (!bookId || !pageNumber || !pageText) return;

  // 1. Save in localStorage
  try {
    localStorage.setItem(getStorageKey(bookId, pageNumber), pageText);
  } catch (e) {
    // Quota exceeded safe handling
  }

  // 2. Persist in Supabase lesson_pages table
  try {
    const payload: Partial<LessonPageRecord> = {
      book_id: bookId,
      page_number: pageNumber,
      page_text: pageText,
      extraction_status: 'completed',
      extracted_at: new Date().toISOString()
    };
    if (imageUrl) payload.page_image_url = imageUrl;
    if (lessonId) payload.lesson_id = lessonId;

    await supabase
      .from('lesson_pages')
      .upsert(payload, { onConflict: 'book_id,page_number' });
  } catch (err) {
    // Ignore schema errors silently; the client-side cache remains active
  }
}

/**
 * Search inside the book's extracted and cached pages
 */
export async function searchBookText(
  bookId: string,
  searchQuery: string,
  totalPages: number = 100
): Promise<SearchPageResult[]> {
  if (!searchQuery || searchQuery.trim().length < 2) return [];
  const query = searchQuery.trim().toLowerCase();
  const results: SearchPageResult[] = [];

  // 1. Scan client local storage for this book
  for (let p = 1; p <= totalPages; p++) {
    const text = localStorage.getItem(getStorageKey(bookId, p));
    if (text && text.toLowerCase().includes(query)) {
      const idx = text.toLowerCase().indexOf(query);
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + query.length + 60);
      const snippet = (start > 0 ? '...' : '') + text.slice(start, end).trim() + (end < text.length ? '...' : '');
      results.push({ pageNumber: p, snippet });
    }
  }

  // 2. If results are few, query Supabase lesson_pages table
  if (results.length < 5) {
    try {
      const { data } = await supabase
        .from('lesson_pages')
        .select('page_number, page_text')
        .eq('book_id', bookId)
        .ilike('page_text', `%${query}%`)
        .limit(10);

      if (data && data.length > 0) {
        for (const row of data) {
          if (!results.some((r) => r.pageNumber === row.page_number)) {
            const idx = row.page_text.toLowerCase().indexOf(query);
            const start = Math.max(0, idx - 40);
            const end = Math.min(row.page_text.length, idx + query.length + 60);
            const snippet = (start > 0 ? '...' : '') + row.page_text.slice(start, end).trim() + '...';
            results.push({ pageNumber: row.page_number, snippet });
          }
        }
      }
    } catch {
      // Fallback silently
    }
  }

  return results.sort((a, b) => a.pageNumber - b.pageNumber);
}

/**
 * Execute smart AI tool on the current page
 */
export async function callSmartPageTool<T = any>(params: {
  toolType:
    | 'summarize'
    | 'explain'
    | 'key-ideas'
    | 'extract-questions'
    | 'quiz'
    | 'solve-exercises'
    | 'vocabulary'
    | 'flashcards'
    | 'simplify'
    | 'ask'
    | 'ocr';
  bookId: string;
  bookTitle: string;
  subject: string;
  grade: string;
  pageNumber: number;
  pageText: string;
  question?: string;
  imageBase64?: string;
  forceRefresh?: boolean;
}): Promise<T> {
  const {
    toolType,
    bookId,
    bookTitle,
    subject,
    grade,
    pageNumber,
    pageText,
    question,
    imageBase64,
    forceRefresh = false
  } = params;

  // Cache check for idempotent tools (except interactive 'ask' or 'ocr')
  if (!forceRefresh && !['ask', 'ocr'].includes(toolType)) {
    const cachedAnalysis = localStorage.getItem(getAnalysisStorageKey(bookId, pageNumber, toolType));
    if (cachedAnalysis) {
      try {
        return JSON.parse(cachedAnalysis) as T;
      } catch {
        // Parse error, proceed with fresh fetch
      }
    }
  }

  const response = await fetch('/api/page-tools/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toolType,
      bookTitle,
      subject,
      grade,
      pageNumber,
      pageText,
      question,
      imageBase64
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to execute tool ${toolType}`);
  }

  const resJson = await response.json();
  const data = resJson.data || resJson;

  // Save to cache
  if (!['ask', 'ocr'].includes(toolType) && data) {
    try {
      localStorage.setItem(getAnalysisStorageKey(bookId, pageNumber, toolType), JSON.stringify(data));
    } catch {
      // Ignore storage quota
    }
  }

  return data as T;
}

/**
 * Helper to build safe PDF URL with CORS proxy support
 */
export function getPdfProxyUrl(pdfUrl: string): string {
  if (!pdfUrl) return '';
  if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('data:') || pdfUrl.startsWith('/')) {
    return pdfUrl;
  }
  return `/api/book-proxy?url=${encodeURIComponent(pdfUrl)}`;
}
