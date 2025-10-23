import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskGauge from "@/components/dashboard/RiskGauge";
import { apiService, SummarizeResponse, RisksResponse, RiskItem } from "@/services/api";
import { useNavigate } from "react-router-dom";

/**
 * Improved Dashboard:
 * - Handles executive_summary/key_points and legacy shapes
 * - Parses JSON-in-string summary safely
 * - If risks endpoint returns empty, generates heuristic risks from summary/key_points
 * - Computes document_level and riskScore consistently
 */

const Dashboard: React.FC = () => {
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [documentSummary, setDocumentSummary] = useState<SummarizeResponse | null>(null);
  const [risksResponse, setRisksResponse] = useState<RisksResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [phase, setPhase] = useState<'idle'|'summarizing'|'risks'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocumentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Helpers ----------
  const safeParsePossibleJsonString = (s: any): any => {
    if (typeof s !== 'string') return s;
    const trimmed = s.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
    try {
      return JSON.parse(trimmed);
    } catch {
      return s;
    }
  };

  const extractCitationFromText = (text?: string) => {
    // matches [num:num] or [num:num:num]
    if (!text) return { page: null, start: null, end: null };
    const m = text.match(/\[(\d+):(\d+)\]/);
    if (m) {
      return { page: null, start: Number(m[1]), end: Number(m[2]) };
    }
    return { page: null, start: null, end: null };
  };

  const findKeywords = (text: string) => {
    const kws: Record<string, string[]> = {
      eviction: ['evict', 'eviction', 'forfeit', 'forfeiture'],
      late_payment: ['late', 'late payment', 'interest', 'grace period', 'penalty'],
      deposit: ['deposit', 'security deposit'],
      termination: ['terminate', 'termination', 'notice', 'early termination'],
      subletting: ['sublet', 'subletting', 'sub-lett'],
      utilities: ['utility', 'electric', 'water', 'gas', 'internet'],
      maintenance: ['maintain', 'repair', 'responsible for', 'care of the property']
    };

    const found: string[] = [];
    const low = text.toLowerCase();
    Object.entries(kws).forEach(([tag, words]) => {
      for (const w of words) {
        if (low.includes(w)) {
          found.push(tag);
          break;
        }
      }
    });
    return Array.from(new Set(found));
  };

  const severityForTag = (tag: string) => {
    // assign severity ranges (High/Medium/Low)
    switch (tag) {
      case 'eviction': return { label: 'High', score: 85 };
      case 'late_payment': return { label: 'Medium', score: 55 };
      case 'deposit': return { label: 'Medium', score: 50 };
      case 'termination': return { label: 'Medium', score: 60 };
      case 'subletting': return { label: 'Low', score: 30 };
      case 'utilities': return { label: 'Low', score: 25 };
      case 'maintenance': return { label: 'Low', score: 28 };
      default: return { label: 'Low', score: 20 };
    }
  };

  const generateHeuristicRisks = (summaryText: string, points: string[]) : { risks: RiskItem[], document_level: any } => {
    const risks: RiskItem[] = [];
    const usedTags = new Set<string>();

    // check whole summary
    if (summaryText) {
      const tags = findKeywords(summaryText);
      tags.forEach(tag => {
        if (!usedTags.has(tag)) {
          const sev = severityForTag(tag);
          risks.push({
            id: `heuristic-${tag}`,
            provided_severity: sev.label,
            severity_score: sev.score,
            snippet: summaryText.slice(0, 300),
            label: tag.replace('_',' '),
            short_risk: `Possible ${tag.replace('_',' ')} clause identified.`,
            explanation: `The document language includes terms related to "${tag.replace('_',' ')}" which may expose the resident to ${sev.label.toLowerCase()} risk.`,
            recommendations: tag === 'eviction' ? [
              'Clarify eviction conditions and notice periods in writing.',
              'Include tenant remedy steps before eviction.'
            ] : [
              'Review clause with legal counsel.',
              'Consider negotiating clearer terms.'
            ],
            citation: extractCitationFromText(summaryText)
          });
          usedTags.add(tag);
        }
      });
    }

    // check each point; create a risk per matching point up to some cap
    for (let i = 0; i < points.length && risks.length < 8; i++) {
      const pt = points[i];
      const tags = findKeywords(pt);
      tags.forEach(tag => {
        if (!usedTags.has(tag)) {
          const sev = severityForTag(tag);
          risks.push({
            id: `heuristic-point-${i}-${tag}`,
            provided_severity: sev.label,
            severity_score: sev.score,
            snippet: pt,
            label: pt.substring(0, 60),
            short_risk: pt.length > 80 ? pt.substring(0,80) + '...' : pt,
            explanation: `Point mentions "${tag.replace('_',' ')}" which can create ${sev.label.toLowerCase()} risk if not clarified.`,
            recommendations: tag === 'late_payment' ? [
              'Add explicit grace period and late fee caps.',
              'Specify notification process for late payments.'
            ] : [
              'Clarify and limit the clause where possible.',
              'Document exceptions and notice periods.'
            ],
            citation: extractCitationFromText(pt)
          });
          usedTags.add(tag);
        }
      });
    }

    // If still empty, create a low-risk generic item recommending review
    if (risks.length === 0) {
      risks.push({
        id: 'heuristic-none',
        provided_severity: 'Low',
        severity_score: 10,
        snippet: summaryText || (points[0] ?? ''),
        label: 'No obvious high-risk clauses detected',
        short_risk: 'No explicit risky clauses found — manual review recommended.',
        explanation: 'Automated scan did not find typical risk keywords; still recommend human review for context-specific risk.',
        recommendations: ['Have a lawyer review for context-specific liabilities', 'Check payment and termination sections closely'],
        citation: extractCitationFromText(summaryText ?? points[0] ?? '')
      });
    }

    // compute document_level
    const numeric = risks.map(r => r.severity_score ?? 0);
    const sum = numeric.reduce((s, v) => s + v, 0);
    const computed_risk_score = numeric.length ? Math.round(sum / numeric.length) : 0;
    const counts = { high: 0, medium: 0, low: 0 };
    risks.forEach(r => {
      if ((r.severity_score ?? 0) >= 67) counts.high++;
      else if ((r.severity_score ?? 0) >= 34) counts.medium++;
      else counts.low++;
    });
    const risk_tier = computed_risk_score <= 33 ? 'Low' : computed_risk_score <= 66 ? 'Medium' : 'High';

    return { risks, document_level: { computed_risk_score, risk_tier, counts } };
  };

  // ---------- Data loading ----------
  const loadDocumentData = async () => {
    setLoading(true);
    setError(null);
    setPhase('idle');

    const docId = localStorage.getItem('currentDocId');
    if (!docId) {
      setError('No document found. Please upload a document first.');
      setLoading(false);
      setPhase('error');
      return;
    }

    try {
      const storedSummary = localStorage.getItem('documentSummary');
      const storedRisks = localStorage.getItem('documentRisks');

      if (storedSummary && storedRisks) {
        setDocumentSummary(JSON.parse(storedSummary));
        setRisksResponse(JSON.parse(storedRisks));
        setPhase('done');
        setLoading(false);
        return;
      }

      // Summarize
      setPhase('summarizing');
      const summaryRespRaw = await apiService.summarize(docId);
      // handle possible JSON in string fields
      const execCandidate = safeParsePossibleJsonString((summaryRespRaw as any).executive_summary ?? (summaryRespRaw as any).summary ?? null);
      // normalized summary object
      const normalized: SummarizeResponse = {
        doc_id: (summaryRespRaw as any).doc_id ?? (summaryRespRaw as any).docId,
        // prefer executive_summary, else summary
        executive_summary: typeof execCandidate === 'string' ? execCandidate : (typeof (summaryRespRaw as any).executive_summary === 'string' ? (summaryRespRaw as any).executive_summary : ''),
        // unify key_points -> points
        points: Array.isArray((summaryRespRaw as any).key_points) ? (summaryRespRaw as any).key_points : (Array.isArray((summaryRespRaw as any).points) ? (summaryRespRaw as any).points : (typeof (summaryRespRaw as any).summary === 'string' ? formatSummaryPoints((summaryRespRaw as any).summary) : [])),
        key_clauses: (summaryRespRaw as any).key_clauses ?? (summaryRespRaw as any).key_clauses ?? [],
        purpose: (summaryRespRaw as any).purpose ?? undefined,
        rag_corpus: (summaryRespRaw as any).rag_corpus ?? null,
        fallback: !!(summaryRespRaw as any).fallback,
        summary: typeof (summaryRespRaw as any).summary === 'string' ? (summaryRespRaw as any).summary : undefined,
        debug: (summaryRespRaw as any).debug ?? undefined
      };

      // Defensive: if executive_summary is an object due to parsing, extract readable string
      if (typeof normalized.executive_summary !== 'string' && normalized.executive_summary) {
        normalized.executive_summary = String(normalized.executive_summary);
      }

      setDocumentSummary(normalized);
      localStorage.setItem('documentSummary', JSON.stringify(normalized));

      // Risks
      setPhase('risks');
      const risksRespRaw = await apiService.getRisks(docId);

      // Normalize risks shape if backend gave an array or object
      let normalizedRisks: RisksResponse | null = null;
      if (risksRespRaw && Array.isArray((risksRespRaw as any).risks)) {
        normalizedRisks = risksRespRaw as RisksResponse;
      } else if (risksRespRaw && Array.isArray(risksRespRaw)) {
        // sometimes backend returns [ {...}, {...}, {document_level: {...}} ]
        const arr = risksRespRaw as any[];
        // try to detect document_level in last element
        const last = arr[arr.length - 1];
        let document_level = undefined;
        let items = arr;
        if (last && last.document_level) {
          document_level = last.document_level;
          items = arr.slice(0, -1);
        }
        const mapItem = (r: any, idx: number): RiskItem => ({
          id: r.id ?? `r-${idx}`,
          provided_severity: r.provided_severity ?? r.severity_level ?? r.providedSeverity ?? 'Low',
          severity_score: typeof r.severity_score === 'number' ? Math.round(r.severity_score) : (r.score ? Number(r.score) : 0),
          snippet: r.snippet ?? r.text ?? r.originalText ?? '',
          label: r.label ?? r.title ?? '',
          short_risk: r.short_risk ?? r.shortRisk ?? (r.title ?? ''),
          explanation: r.explanation ?? r.reason ?? '',
          recommendations: Array.isArray(r.recommendations) ? r.recommendations : (r.recommendations ? [r.recommendations] : []),
          citation: r.citation ?? { page: r.page ?? null, start: r.start ?? null, end: r.end ?? null }
        });
        normalizedRisks = { risks: items.map(mapItem), document_level };
      } else if (risksRespRaw && (risksRespRaw as any).risks) {
        normalizedRisks = risksRespRaw as RisksResponse;
      } else {
        normalizedRisks = { risks: [], document_level: undefined };
      }

      // If no risks returned, generate heuristics
      if (!normalizedRisks.risks || normalizedRisks.risks.length === 0) {
        const pointsToUse = normalized.points ?? [];
        const summaryText = normalized.executive_summary ?? normalized.summary ?? '';
        const heur = generateHeuristicRisks(summaryText, pointsToUse);
        normalizedRisks = { risks: heur.risks as any, document_level: heur.document_level };
      } else {
        // ensure document_level exists (compute if missing)
        if (!normalizedRisks.document_level) {
          const numeric = normalizedRisks.risks.map(r => Number(r.severity_score ?? 0));
          const computed_risk_score = numeric.length ? Math.round(numeric.reduce((s,v)=>s+v,0)/numeric.length) : 0;
          const counts = { high: 0, medium: 0, low: 0 };
          normalizedRisks.risks.forEach(r => {
            const sc = Number(r.severity_score ?? 0);
            if (sc >= 67) counts.high++;
            else if (sc >= 34) counts.medium++;
            else counts.low++;
          });
          const risk_tier = computed_risk_score <= 33 ? 'Low' : computed_risk_score <= 66 ? 'Medium' : 'High';
          normalizedRisks.document_level = { computed_risk_score, risk_tier, counts };
        }
      }

      setRisksResponse(normalizedRisks);
      localStorage.setItem('documentRisks', JSON.stringify(normalizedRisks));

      setPhase('done');
    } catch (err) {
      console.error("Failed to load document data:", err);
      setError(err instanceof Error ? err.message : 'Failed to load document data.');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  };

  // formatSummaryPoints: same logic used when backend lacks points
  const formatSummaryPoints = (summary?: string): string[] => {
    if (!summary) return [];
    const sentences = summary.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length >= 2) return sentences.slice(0, 12);
    const parts = summary.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts.slice(0, 12);
    // fallback chunk
    const chunks: string[] = [];
    for (let i = 0; i < summary.length && chunks.length < 12; i += 120) {
      chunks.push(summary.slice(i, i + 120).trim());
    }
    return chunks;
  };

  const reRunAnalysis = async () => {
    localStorage.removeItem('documentSummary');
    localStorage.removeItem('documentRisks');
    setDocumentSummary(null);
    setRisksResponse(null);
    setError(null);
    await loadDocumentData();
  };

  // computed display values
  const executiveSummary = (documentSummary && (documentSummary.executive_summary ?? documentSummary.summary)) || '';
  const points = (documentSummary?.points && documentSummary.points.length ? documentSummary.points : (documentSummary?.key_points ? documentSummary.key_points : (formatSummaryPoints(documentSummary?.summary ?? '')))) || [];
  const keyClauses = (documentSummary as any)?.key_clauses ?? [];

  const documentLevelScore = (risksResponse as any)?.document_level?.computed_risk_score ?? null;
  const computedScoreFromRisks = (() => {
    const arr = risksResponse?.risks ?? [];
    if (!arr.length) return 0;
    const nums = arr.map(r => Number(r.severity_score ?? 0));
    return Math.round(nums.reduce((s, v) => s + v, 0) / nums.length);
  })();
  const riskScore = documentLevelScore !== null ? documentLevelScore : computedScoreFromRisks;

  const getTier = (score: number) => {
    if (score <= 33) return { tier: 'Low', className: 'text-neon-green', bg: 'bg-neon-green/10' };
    if (score <= 66) return { tier: 'Medium', className: 'text-risk-medium', bg: 'bg-risk-medium/10' };
    return { tier: 'High', className: 'text-risk-high', bg: 'bg-risk-high/10' };
  };
  const tier = getTier(riskScore);

  const toggleFlag = (flagId: string) => {
    setExpandedFlags(prev => (prev.includes(flagId) ? prev.filter(id => id !== flagId) : [...prev, flagId]));
  };

  const exportReport = () => {
    const payload = {
      documentName: localStorage.getItem('currentDocName') || 'document',
      documentId: localStorage.getItem('currentDocId'),
      summary: documentSummary,
      risks: risksResponse
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localStorage.getItem('currentDocName') || 'document'}-analysis.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // severity color helper
  const severityColor = (score: number) => {
    if (score <= 33) return { text: 'text-neon-green', bg: 'bg-neon-green/10' };
    if (score <= 66) return { text: 'text-risk-medium', bg: 'bg-risk-medium/10' };
    return { text: 'text-risk-high', bg: 'bg-risk-high/10' };
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 mx-auto text-neon-cyan" />
          <div className="mt-4 text-muted-foreground">Processing document — this may take a moment</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center px-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-risk-high mx-auto mb-4" />
          <h2 className="text-2xl font-orbitron font-bold text-risk-high mb-4">ERROR</h2>
          <p className="text-lg font-rajdhani text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/')} className="px-6 py-3 bg-neon-blue hover:bg-neon-cyan text-cyber-void font-rajdhani font-semibold rounded-lg">UPLOAD NEW</Button>
            <Button onClick={reRunAnalysis} className="px-6 py-3 bg-neon-magenta hover:bg-neon-purple text-cyber-void font-rajdhani font-semibold rounded-lg">RETRY</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background neural-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header + Stepper */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold cyber-glow">DOCUMENT ANALYSIS</h1>
            <p className="text-sm text-muted-foreground mt-1">Simplified summary, prioritized obligations, and an actionable risk report.</p>
          </div>

          <div className="flex items-center gap-3">
            {['Upload','Summarize','Risk Analysis','Complete'].map((label, idx) => {
              const activeIndex = phase === 'summarizing' ? 1 : phase === 'risks' ? 2 : phase === 'done' ? 3 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${idx <= activeIndex ? 'bg-neon-cyan/20 border-neon-cyan/50' : 'bg-muted/10'}`}>
                    {idx === 0 && <FileText className={`w-4 h-4 ${idx <= activeIndex ? 'text-neon-cyan' : 'text-muted-foreground'}`} />}
                    {idx === 1 && <Loader2 className={`w-4 h-4 ${idx <= activeIndex ? 'text-neon-cyan animate-spin' : 'text-muted-foreground'}`} />}
                    {idx === 2 && <Shield className={`w-4 h-4 ${idx <= activeIndex ? 'text-neon-cyan' : 'text-muted-foreground'}`} />}
                    {idx === 3 && <CheckCircle2 className={`w-4 h-4 ${idx <= activeIndex ? 'text-neon-cyan' : 'text-muted-foreground'}`} />}
                  </div>
                  <div className="text-xs text-muted-foreground hidden md:block">{label}</div>
                </div>
              );
            })}
            <Button onClick={reRunAnalysis} className="ml-4 px-3 py-2"><RefreshCw className="w-4 h-4 mr-2" />Re-run</Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Summary card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-orbitron text-neon-blue">
                  <FileText className="w-5 h-5" />
                  DOCUMENT SUMMARY
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-rajdhani font-semibold mb-2 text-neon-cyan">{localStorage.getItem('currentDocName') || 'Legal Document'}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{executiveSummary || 'No executive summary available.'}</p>
                </div>

                <div>
                  <h4 className="text-lg font-rajdhani font-semibold text-neon-blue mb-3">SUMMARY POINTS</h4>
                  <div className="p-4 rounded-lg bg-cyber-navy/10 border border-muted">
                    {points.length ? (
                      <ol className="space-y-2 list-decimal list-inside">
                        {points.map((pt, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{pt}</li>
                        ))}
                      </ol>
                    ) : (
                      <div className="text-muted-foreground">No summary points found.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-rajdhani font-semibold text-neon-cyan mb-3">KEY CLAUSES</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {keyClauses.length ? keyClauses.map((kc: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-cyber-navy/20 border-l-4 border-neon-cyan">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground">{kc.title ?? kc.text ?? `Clause ${idx+1}`}</div>
                            <div className="text-xs text-muted-foreground mt-1">{kc.text ?? ''}</div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Importance: <span className="font-medium">{kc.importance ?? '-'}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {kc.citation?.page ? <>Page {kc.citation.page}</> : <>—</>}
                          </div>
                        </div>
                      </div>
                    )) : (
                      // fallback: show first few points as clauses
                      (points.length ? points.slice(0,4).map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-cyber-navy/20 border-l-4 border-neon-cyan">
                          <div className="text-sm font-semibold text-foreground">Clause {i+1}</div>
                          <div className="text-xs text-muted-foreground mt-1">{p}</div>
                        </div>
                      )) : <div className="text-muted-foreground p-4">No key clauses returned.</div>)
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-rajdhani font-semibold text-neon-cyan mb-3">DOCUMENT PURPOSE</h4>
                  <p className="text-sm text-muted-foreground">{(documentSummary as any)?.purpose ?? '—'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Risk gauge + actions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-blue text-center">RISK ANALYSIS</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <RiskGauge score={riskScore} />
                <div className="text-center mt-6">
                  <div className={`text-2xl font-orbitron font-bold ${tier.className}`}>{tier.tier.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground mt-2">Score: {riskScore}/100</div>
                  <p className="text-xs text-muted-foreground mt-3">Based on {risksResponse?.risks?.length ?? 0} identified risk factors</p>
                </div>

                <div className="w-full mt-6">
                  <Button onClick={exportReport} className="w-full bg-neon-magenta hover:bg-neon-purple text-cyber-void font-rajdhani font-semibold">
                    <Download className="w-5 h-5 mr-2" />EXPORT REPORT
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-blue text-center">QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button onClick={() => navigator.clipboard.writeText(JSON.stringify({ summary: documentSummary, risks: risksResponse }))} className="w-full">Copy JSON</Button>
                <Button onClick={() => navigate('/review')} variant="outline" className="w-full">Go to Review</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Red flags list */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-orbitron text-neon-blue">
                <AlertTriangle className="w-5 h-5" />
                IDENTIFIED RISKS & RED FLAGS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!risksResponse || (risksResponse?.risks?.length ?? 0) === 0) ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-neon-green mx-auto mb-4" />
                  <div className="text-xl font-rajdhani font-semibold text-neon-green">No major risks detected!</div>
                  <p className="text-muted-foreground mt-2">This document appears to have standard, reasonable terms.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {risksResponse!.risks.map((flag: any, index: number) => {
                    const score = Number(flag.severity_score ?? 0);
                    const sc = severityColor(score);
                    return (
                      <motion.div key={flag.id ?? index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * index }} className="rounded-lg overflow-hidden border border-muted">
                        <button onClick={() => toggleFlag(flag.id)} className="w-full p-4 text-left hover:bg-cyber-navy/30 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`${sc.bg} ${sc.text} px-3 py-1 rounded-full text-xs font-rajdhani font-bold`}>{(flag.provided_severity ?? flag.severity_level ?? 'Low').toUpperCase()}</span>
                            <span className="font-rajdhani font-semibold">{flag.short_risk ?? flag.label ?? 'Potential risk'}</span>
                            <span className="text-xs text-muted-foreground">Score: {score}</span>
                          </div>
                          {expandedFlags.includes(flag.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>

                        <AnimatePresence>
                          {expandedFlags.includes(flag.id) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                              <div className="p-6 pt-0 space-y-6">
                                <div>
                                  <h5 className="font-rajdhani font-semibold mb-2 text-neon-cyan">ORIGINAL TEXT</h5>
                                  <div className="p-4 bg-cyber-navy/30 rounded-lg border-l-4 border-neon-cyan">
                                    <p className="text-sm font-mono italic">"{flag.snippet}"</p>
                                    <div className="text-xs text-muted-foreground mt-2">
                                      { flag.citation?.page ? <>Page {flag.citation.page}</> : <>—</> }
                                      { flag.citation?.start != null && flag.citation?.end != null ? <> · offsets: [{flag.citation.start}:{flag.citation.end}]</> : null }
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-rajdhani font-semibold mb-2 text-neon-cyan">SIMPLIFIED EXPLANATION</h5>
                                  <p className="text-muted-foreground">{flag.explanation || 'No explanation provided.'}</p>
                                </div>

                                <div>
                                  <h5 className="font-rajdhani font-semibold mb-2 text-neon-cyan">RECOMMENDATIONS</h5>
                                  <ul className="space-y-1">
                                    {(flag.recommendations ?? []).length ? (flag.recommendations ?? []).map((r: string, idx: number) => (
                                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <AlertTriangle className="w-4 h-4 text-risk-medium" />
                                        {r}
                                      </li>
                                    )) : (
                                      <li className="text-sm text-muted-foreground">No recommendations provided.</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Educational resources */}
        <div className="text-center">
          <h3 className="font-orbitron font-semibold mb-4 text-neon-cyan">LEARN MORE ABOUT YOUR RIGHTS</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {["Understanding Lease Agreements", "Tenant Rights & Responsibilities", "When to Consult a Lawyer"].map((topic, index) => (
              <Button key={index} variant="outline" className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">{topic}<ExternalLink className="w-4 h-4 ml-2" /></Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
