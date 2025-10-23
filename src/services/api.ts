// const API_BASE_URL = 'https://googlecloud2025backend-production.up.railway.app'; 
const API_BASE_URL = 'http://127.0.0.1:8000'; // FastAPI backend URL
// FastAPI backend URL
 

// ---------- Types ----------
export interface UploadResponse {
  doc_id: string;
  gs_path?: string;
  message?: string;
  corpus_name?: string;
}

export interface Citation {
  page: number | null;
  start: number | null;
  end: number | null;
}

export interface KeyClause {
  title: string;
  text: string;
  importance: number;
  citation?: Citation | null;
}

export interface SummarizeResponse {
  doc_id?: string;
  // New structured shape (preferred)
  executive_summary?: string;
  points?: string[];           // numbered points for frontend
  key_clauses?: KeyClause[];
  purpose?: string;
  rag_corpus?: string | null;
  fallback?: boolean;
  // Legacy support
  summary?: string;            // plain summary string (legacy)
  debug?: any;
}

export interface RiskItem {
  id: string;
  provided_severity: string; // "High" | "Medium" | "Low" (as provided by server)
  severity_level?: string;   // legacy
  severity_score: number;    // 0-100 numeric severity
  snippet: string;
  label?: string;            // optional legacy label
  short_risk: string;
  explanation: string;
  recommendations: string[];
  citation: Citation;
}

export interface DocumentLevel {
  computed_risk_score: number;
  risk_tier: 'Low'|'Medium'|'High'|string;
  counts: { high: number; medium: number; low: number };
}

export interface RisksResponse {
  doc_id?: string;
  risks: RiskItem[];
  document_level?: DocumentLevel;
  note?: string;
  // legacy shapes may exist; we normalize them
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  doc_id?: string;
  response: string;
  debug?: any;
  fallback?: boolean;
}

// ---------- Helpers ----------
function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function splitIntoPoints(summary: string, maxPoints = 10): string[] {
  if (!summary) return [];
  // split by sentence-terminators, then fallback to commas if only single sentence
  const sentences = summary
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length > 1) return sentences.slice(0, maxPoints).map(s => s.replace(/\s+/g, ' ').trim());

  // try commas/semicolons
  const parts = summary.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts.slice(0, maxPoints).map(s => s.replace(/\s+/g, ' ').trim());

  return [summary.trim()];
}

function normalizeSummarizeResponse(raw: any): SummarizeResponse {
  // If raw already has structured fields, return (but ensure types)
  if (!raw) return { executive_summary: '', points: [], key_clauses: [], fallback: true };

  // If it's already in desired shape (executive_summary + points)
  if (raw.executive_summary || Array.isArray(raw.points)) {
    return {
      doc_id: raw.doc_id,
      executive_summary: raw.executive_summary ?? (typeof raw.summary === 'string' ? raw.summary : ''),
      points: Array.isArray(raw.points) ? raw.points : (typeof raw.points === 'string' ? [raw.points] : (raw.summary ? splitIntoPoints(raw.summary) : [])),
      key_clauses: raw.key_clauses ?? raw.key_clauses === null ? [] : [],
      purpose: raw.purpose ?? raw.document_purpose ?? null,
      rag_corpus: raw.rag_corpus ?? raw.corpus_name ?? null,
      fallback: typeof raw.fallback === 'boolean' ? raw.fallback : false,
      debug: raw.debug ?? undefined,
      summary: raw.summary ?? raw.executive_summary ?? undefined,
    };
  }

  // Legacy shape: maybe backend returned plain summary string -> convert it
  if (typeof raw.summary === 'string') {
    return {
      doc_id: raw.doc_id,
      executive_summary: raw.summary,
      points: splitIntoPoints(raw.summary, 10),
      key_clauses: [],
      purpose: raw.purpose ?? null,
      rag_corpus: raw.rag_corpus ?? raw.corpus_name ?? null,
      fallback: !!raw.fallback,
      debug: raw.debug ?? undefined,
      summary: raw.summary
    };
  }

  // If response contains text directly
  if (typeof raw === 'string') {
    return {
      executive_summary: raw,
      points: splitIntoPoints(raw, 10),
      key_clauses: [],
      fallback: true,
      summary: raw
    };
  }

  // Unknown shape - return minimal structure
  return {
    executive_summary: raw.executive_summary ?? raw.summary ?? '',
    points: raw.points ?? (raw.summary ? splitIntoPoints(raw.summary) : []),
    key_clauses: raw.key_clauses ?? [],
    purpose: raw.purpose ?? null,
    rag_corpus: raw.rag_corpus ?? null,
    fallback: !!raw.fallback,
    summary: raw.summary ?? undefined
  };
}

function normalizeRisksResponse(raw: any): RisksResponse {
  const empty: RisksResponse = { risks: [], document_level: { computed_risk_score: 0, risk_tier: 'Low', counts: { high: 0, medium: 0, low: 0 } } };

  if (!raw) return empty;

  // If the backend already returns the normalized shape
  if (Array.isArray(raw.risks) || Array.isArray(raw)) {
    // If raw is an array (maybe model returned [risks..., {document_level:...}])
    let arr = Array.isArray(raw) ? raw.slice() : raw.risks.slice();
    let document_level: DocumentLevel | undefined = undefined;

    // If the last element is a document_level object, extract
    if (arr.length > 0 && typeof arr[arr.length - 1] === 'object' && 'document_level' in (arr[arr.length - 1])) {
      const last = arr.pop();
      document_level = last.document_level;
    } else if (raw.document_level) {
      document_level = raw.document_level;
      // if raw.risks exists, use it
      if (Array.isArray(raw.risks)) arr = raw.risks.slice();
    }

    // Map items to RiskItem (normalize fields)
    const risks: RiskItem[] = arr.map((r: any, i: number) => {
      const provided = r.provided_severity ?? r.severity_level ?? 'Low';
      // determine numeric severity_score
      let numeric = typeof r.severity_score === 'number' ? Math.round(r.severity_score) : null;

      if (numeric === null) {
        // fallback mapping by label
        if (typeof provided === 'string') {
          const p = provided.toLowerCase();
          numeric = p.includes('high') ? 85 : p.includes('medium') ? 50 : 15;
        } else {
          numeric = 15;
        }
      }

      return {
        id: r.id ?? `risk-${i}`,
        provided_severity: provided,
        severity_level: r.severity_level ?? provided,
        severity_score: numeric,
        snippet: r.snippet ?? r.text ?? r.originalText ?? '',
        label: r.label ?? undefined,
        short_risk: r.short_risk ?? r.title ?? (typeof r.label === 'string' ? r.label : (r.short_risk ?? 'Potential risk')),
        explanation: r.explanation ?? r.reason ?? r.why ?? '',
        recommendations: Array.isArray(r.recommendations) ? r.recommendations : (r.recs ? r.recs : []),
        citation: r.citation ?? { page: r.page ?? null, start: r.start ?? null, end: r.end ?? null }
      } as RiskItem;
    });

    // If no document_level computed, compute it here
    if (!document_level) {
      const numericArr = risks.map(x => x.severity_score ?? 0);
      const sum = numericArr.reduce((s, v) => s + v, 0);
      const computed_risk_score = numericArr.length ? Math.round(sum / numericArr.length) : 0;
      const counts = { high: 0, medium: 0, low: 0 };
      risks.forEach(r => {
        if ((r.severity_score ?? 0) >= 67) counts.high++;
        else if ((r.severity_score ?? 0) >= 34) counts.medium++;
        else counts.low++;
      });
      const tier = computed_risk_score <= 33 ? 'Low' : computed_risk_score <= 66 ? 'Medium' : 'High';
      document_level = { computed_risk_score, risk_tier: tier, counts };
    }

    return { risks, document_level };
  }

  // Legacy shape: raw.risks may be object keyed by id
  if (raw.risks && typeof raw.risks === 'object' && !Array.isArray(raw.risks)) {
    const arr = Object.values(raw.risks);
    return normalizeRisksResponse(arr);
  }

  // Unknown -> return empty safe shape
  return empty;
}

// ---------- ApiService ----------
class ApiService {
  private lastApiCallTime: number = 0;
  private readonly MIN_API_INTERVAL = 1000; // 1 second

  private async ensureApiInterval(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTime;
    if (timeSinceLastCall < this.MIN_API_INTERVAL) {
      const waitTime = this.MIN_API_INTERVAL - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastApiCallTime = Date.now();
  }

  private async requestRaw(url: string, options: RequestInit = {}): Promise<any> {
    const fullUrl = `${API_BASE_URL}${url}`;
    const defaultHeaders = { 'Content-Type': 'application/json' };

    const config: RequestInit = {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        ...(options.body instanceof FormData ? {} : defaultHeaders), // don't set JSON header for FormData
      },
    };

    try {
      const res = await fetch(fullUrl, config);
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        // Try to parse error details
        const parsed = safeJsonParse(text);
        const detail = parsed?.detail ?? parsed?.message ?? text;
        throw new Error(`API error ${res.status}: ${detail}`);
      }
      // parse JSON safely
      const parsed = safeJsonParse(text);
      return parsed === null ? text : parsed;
    } catch (err) {
      console.error(`[apiService] request failed (${options.method ?? 'GET'} ${fullUrl}):`, err);
      throw err;
    }
  }

  // ---------- Public methods ----------
  async uploadPdf(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append('file', file);

    const url = `/upload_pdf`;
    try {
      const raw = await this.requestRaw(url, {
        method: 'POST',
        body: form,
      });
      // Basic validation
      if (!raw || !raw.doc_id) {
        throw new Error('Upload response did not include doc_id');
      }
      return raw as UploadResponse;
    } catch (err) {
      console.error('[apiService] uploadPdf error:', err);
      throw err;
    }
  }

  async summarize(docId: string, displayName?: string): Promise<SummarizeResponse> {
    await this.ensureApiInterval();
    try {
      const raw = await this.requestRaw('/summarize', {
        method: 'POST',
        body: JSON.stringify({ doc_id: docId, display_name: displayName ?? 'legal_doc_corpus' }),
      });
      const normalized = normalizeSummarizeResponse(raw);
      // attach doc_id if returned by server
      if (!normalized.doc_id && raw && raw.doc_id) normalized.doc_id = raw.doc_id;
      return normalized;
    } catch (err) {
      console.error('[apiService] summarize error:', err);
      throw err;
    }
  }

  async getRisks(docId: string): Promise<RisksResponse> {
    await this.ensureApiInterval();
    try {
      const raw = await this.requestRaw('/risks', {
        method: 'POST',
        body: JSON.stringify({ doc_id: docId }),
      });
      // If backend returns { risks: [...] } or an array, normalize
      const normalized = normalizeRisksResponse(raw);
      // Try to attach doc_id if available
      if (!normalized.doc_id && raw && raw.doc_id) normalized.doc_id = raw.doc_id;
      return normalized;
    } catch (err) {
      console.error('[apiService] getRisks error:', err);
      throw err;
    }
  }

  async processDocumentSequentially(docId: string, displayName?: string): Promise<{ summary: SummarizeResponse; risks: RisksResponse; }> {
    // sequential execution: summarize -> risks (helps UI show progress)
    try {
      console.log('[apiService] processDocumentSequentially: start', { docId });
      const summary = await this.summarize(docId, displayName);
      console.log('[apiService] summarize result', summary);
      // call risk endpoint, passing summary as body if backend expects it
      const risks = await this.getRisks(docId);
      console.log('[apiService] risks result', risks);
      return { summary, risks };
    } catch (err) {
      console.error('[apiService] processDocumentSequentially failed:', err);
      throw err;
    }
  }

  async chat(docId: string, messages: ChatMessage[], sessionId?: string): Promise<ChatResponse> {
    await this.ensureApiInterval();
    try {
      const raw = await this.requestRaw('/chat', {
        method: 'POST',
        body: JSON.stringify({ doc_id: docId, messages, session_id: sessionId }),
      });
      // Ensure shape
      if (!raw || typeof raw.response !== 'string') {
        throw new Error('Chat response invalid');
      }
      return raw as ChatResponse;
    } catch (err) {
      console.error('[apiService] chat error:', err);
      throw err;
    }
  }

  async debugRag(docId: string): Promise<any> {
    await this.ensureApiInterval();
    try {
      const raw = await this.requestRaw(`/debug_rag/${docId}`, { method: 'GET' });
      return raw;
    } catch (err) {
      console.error('[apiService] debugRag error:', err);
      throw err;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
