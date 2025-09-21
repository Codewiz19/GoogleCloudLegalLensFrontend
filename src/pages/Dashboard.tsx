import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  AlertTriangle, 
  Shield, 
  Clock, 
  DollarSign,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskGauge from "@/components/dashboard/RiskGauge";
import { apiService, SummarizeResponse, RisksResponse } from "@/services/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [documentSummary, setDocumentSummary] = useState<SummarizeResponse | null>(null);
  const [risks, setRisks] = useState<RisksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDocumentData = async () => {
      const docId = localStorage.getItem('currentDocId');
      if (!docId) {
        setError('No document found. Please upload a document first.');
        setLoading(false);
        return;
      }

      try {
        // Try to get summary from localStorage first (from processing)
        const storedSummary = localStorage.getItem('documentSummary');
        if (storedSummary) {
          setDocumentSummary(JSON.parse(storedSummary));
        } else {
          // If not in localStorage, fetch from API
          const summaryResponse = await apiService.summarize(docId);
          setDocumentSummary(summaryResponse);
        }

        // Fetch risks
        const risksResponse = await apiService.getRisks(docId);
        setRisks(risksResponse);
      } catch (error) {
        console.error('Failed to load document data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load document data.');
      } finally {
        setLoading(false);
      }
    };

    loadDocumentData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center px-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-risk-high mx-auto mb-4" />
          <h2 className="text-2xl font-orbitron font-bold text-risk-high mb-4">
            ERROR LOADING DOCUMENT
          </h2>
          <p className="text-lg font-rajdhani text-muted-foreground mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-neon-blue hover:bg-neon-cyan text-cyber-void font-rajdhani font-semibold rounded-lg transition-colors"
          >
            UPLOAD NEW DOCUMENT
          </button>
        </div>
      </div>
    );
  }

  // Calculate risk score from risks data
  const riskScore = risks?.risks?.length 
    ? Math.min(100, risks.risks.reduce((sum, risk) => sum + risk.severity_score, 0) / risks.risks.length)
    : 0;

  // Transform risks data to match component expectations
  const redFlags = risks?.risks?.map((risk, index) => ({
    id: risk.id,
    severity: risk.severity_level.toLowerCase(),
    title: risk.label,
    originalText: risk.snippet,
    explanation: risk.explanation || "This clause may present legal risks that should be reviewed carefully.",
    whyRisky: risk.recommendations || ["Review this clause with a legal professional"],
    suggestedAction: risk.recommendations?.[0] || "Consider consulting a legal professional",
    pageNumber: Math.floor(Math.random() * 10) + 1 // Mock page number
  })) || [];

  const toggleFlag = (flagId: string) => {
    setExpandedFlags(prev => 
      prev.includes(flagId) 
        ? prev.filter(id => id !== flagId)
        : [...prev, flagId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return 'muted-foreground';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-risk-high/20';
      case 'medium': return 'bg-risk-medium/20';
      case 'low': return 'bg-risk-low/20';
      default: return 'bg-muted/20';
    }
  };

  return (
    <div className="min-h-screen bg-background neural-bg p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-orbitron font-bold cyber-glow mb-2">
            DOCUMENT ANALYSIS COMPLETE
          </h1>
          <p className="text-lg font-rajdhani text-muted-foreground">
            Your legal document has been analyzed for risks and simplified for clarity
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Summary */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-orbitron text-neon-blue">
                  <FileText className="w-6 h-6" />
                  DOCUMENT SUMMARY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-rajdhani font-semibold mb-3">
                    {localStorage.getItem('currentDocName') || 'Legal Document'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {documentSummary?.summary || 'No summary available.'}
                  </p>
                </div>

                {/* Processing Info */}
                <div>
                  <h4 className="font-rajdhani font-semibold mb-3 text-neon-cyan">
                    PROCESSING INFO
                  </h4>
                  <div className="grid gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-cyber-navy/30"
                    >
                      <Shield className="w-5 h-5 text-neon-cyan" />
                      <span className="font-rajdhani">
                        {documentSummary?.fallback ? 'Fallback processing used' : 'RAG processing completed'}
                      </span>
                    </motion.div>
                    {documentSummary?.rag_corpus && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-cyber-navy/30"
                      >
                        <FileText className="w-5 h-5 text-neon-cyan" />
                        <span className="font-rajdhani">
                          Corpus: {documentSummary.rag_corpus}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Score Gauge */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-blue text-center">
                  RISK ANALYSIS
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <RiskGauge score={riskScore} />
                <div className="text-center mt-6">
                  <div className="text-2xl font-orbitron font-bold text-risk-medium">
                    MEDIUM RISK
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Score: {riskScore}/100
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Based on {redFlags.length} identified risk factors
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <Button className="w-full bg-neon-magenta hover:bg-neon-purple text-cyber-void font-rajdhani font-semibold">
              <Download className="w-5 h-5 mr-2" />
              EXPORT REPORT
            </Button>
          </motion.div>
        </div>

        {/* Red Flags Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-orbitron text-neon-blue">
                <AlertTriangle className="w-6 h-6" />
                IDENTIFIED RISKS & RED FLAGS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {redFlags.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-neon-green mx-auto mb-4" />
                  <div className="text-xl font-rajdhani font-semibold text-neon-green">
                    No major risks detected!
                  </div>
                  <p className="text-muted-foreground mt-2">
                    This document appears to have standard, reasonable terms.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redFlags.map((flag, index) => (
                    <motion.div
                      key={flag.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="border border-muted rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFlag(flag.id)}
                        className="w-full p-4 text-left hover:bg-cyber-navy/30 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-rajdhani font-bold ${getSeverityBg(flag.severity)} text-${getSeverityColor(flag.severity)}`}>
                            {flag.severity.toUpperCase()}
                          </span>
                          <span className="font-rajdhani font-semibold">
                            {flag.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Page {flag.pageNumber}
                          </span>
                        </div>
                        {expandedFlags.includes(flag.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedFlags.includes(flag.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 space-y-6">
                              {/* Original Text */}
                              <div>
                                <h5 className="font-rajdhani font-semibold mb-2 text-neon-cyan">
                                  ORIGINAL TEXT
                                </h5>
                                <div className="p-4 bg-cyber-navy/30 rounded-lg border-l-4 border-neon-cyan">
                                  <p className="text-sm font-mono italic">
                                    "{flag.originalText}"
                                  </p>
                                </div>
                              </div>

                              {/* Explanation */}
                              <div>
                                <h5 className="font-rajdhani font-semibold mb-2 text-neon-cyan">
                                  SIMPLIFIED EXPLANATION
                                </h5>
                                <p className="text-muted-foreground">
                                  {flag.explanation}
                                </p>
                              </div>

                              {/* Why Risky */}
                              <div>
                                <h5 className="font-rajdhani font-semibold mb-2 text-neon-cyan">
                                  WHY THIS IS RISKY
                                </h5>
                                <ul className="space-y-1">
                                  {flag.whyRisky.map((risk, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <AlertTriangle className="w-4 h-4 text-risk-medium" />
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Suggested Action */}
                              <div>
                                <h5 className="font-rajdhani font-semibold mb-2 text-neon-green">
                                  SUGGESTED ACTION
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  {flag.suggestedAction}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Educational Resources */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h3 className="font-orbitron font-semibold mb-4 text-neon-cyan">
            LEARN MORE ABOUT YOUR RIGHTS
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Understanding Lease Agreements",
              "Tenant Rights & Responsibilities", 
              "When to Consult a Lawyer"
            ].map((topic, index) => (
              <Button
                key={index}
                variant="outline"
                className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
              >
                {topic}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;