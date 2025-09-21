import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  FileText, 
  Mail, 
  Share2, 
  Printer,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const Export = () => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    summary: true,
    riskAnalysis: true,
    redFlags: true,
    originalText: false,
    recommendations: true
  });
  const [email, setEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const exportFormats = [
    { id: 'pdf', name: 'PDF Report', icon: FileText, description: 'Professional formatted document' },
    { id: 'email', name: 'Email Summary', icon: Mail, description: 'Send analysis to your inbox' },
    { id: 'print', name: 'Print Version', icon: Printer, description: 'Optimized for printing' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setExported(true);
      
      // Reset after 3 seconds
      setTimeout(() => setExported(false), 3000);
    }, 2000);
  };

  const toggleOption = (option: keyof typeof includeOptions) => {
    setIncludeOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  return (
    <div className="min-h-screen bg-background neural-bg p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-orbitron font-bold cyber-glow mb-4">
            EXPORT ANALYSIS REPORT
          </h1>
          <p className="text-lg font-rajdhani text-muted-foreground">
            Download or share your legal document analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Format Selection */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-blue">
                  SELECT FORMAT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportFormats.map((format) => (
                  <motion.button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                      selectedFormat === format.id
                        ? 'border-neon-blue bg-neon-blue/10'
                        : 'border-muted hover:border-neon-cyan/50 hover:bg-cyber-navy/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <format.icon className={`w-6 h-6 ${
                        selectedFormat === format.id ? 'text-neon-blue' : 'text-muted-foreground'
                      }`} />
                      <span className="font-rajdhani font-semibold">
                        {format.name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format.description}
                    </p>
                  </motion.button>
                ))}

                {/* Email Input for Email Format */}
                {selectedFormat === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4"
                  >
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-cyber-dark/50 border-neon-blue/30"
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Options */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-cyber-dark/50 border-neon-cyan/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-cyan">
                  INCLUDE IN REPORT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(includeOptions).map(([key, value]) => (
                  <motion.label
                    key={key}
                    className="flex items-center gap-3 cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleOption(key as keyof typeof includeOptions)}
                      className="w-5 h-5 rounded bg-cyber-dark border-2 border-neon-cyan/50 checked:bg-neon-cyan checked:border-neon-cyan"
                    />
                    <span className="font-rajdhani capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {key === 'summary' && <FileText className="w-4 h-4 text-neon-cyan" />}
                    {key === 'riskAnalysis' && <BarChart3 className="w-4 h-4 text-risk-medium" />}
                    {key === 'redFlags' && <AlertTriangle className="w-4 h-4 text-risk-high" />}
                  </motion.label>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-cyber-dark/50 border-neon-magenta/30 holo-border">
            <CardHeader>
              <CardTitle className="font-orbitron text-neon-magenta">
                REPORT PREVIEW
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2 text-neon-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>Document: Residential Lease Agreement</span>
                </div>
                <div className="flex items-center gap-2 text-neon-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>Analysis Date: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-neon-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>Risk Score: 65/100 (Medium Risk)</span>
                </div>
                <div className="flex items-center gap-2 text-neon-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>Red Flags Identified: 3</span>
                </div>
                
                <div className="mt-6 p-4 bg-cyber-navy/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    REPORT SECTIONS:
                  </p>
                  <ul className="text-xs space-y-1">
                    {includeOptions.summary && <li>• Executive Summary</li>}
                    {includeOptions.riskAnalysis && <li>• Risk Analysis & Score</li>}
                    {includeOptions.redFlags && <li>• Identified Red Flags</li>}
                    {includeOptions.originalText && <li>• Original Document Text</li>}
                    {includeOptions.recommendations && <li>• Recommendations</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Export Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={handleExport}
            disabled={isExporting || (selectedFormat === 'email' && !email)}
            className="px-12 py-4 bg-gradient-to-r from-neon-blue to-neon-cyan hover:from-neon-cyan hover:to-neon-magenta text-cyber-void font-orbitron font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {isExporting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-3"
              >
                <Download className="w-6 h-6" />
                GENERATING REPORT...
              </motion.div>
            ) : exported ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                EXPORT COMPLETE
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {selectedFormat === 'pdf' && <Download className="w-6 h-6" />}
                {selectedFormat === 'email' && <Mail className="w-6 h-6" />}
                {selectedFormat === 'print' && <Printer className="w-6 h-6" />}
                EXPORT REPORT
              </div>
            )}
          </Button>

          {exported && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-neon-green"
            >
              Your report has been {selectedFormat === 'email' ? 'sent to your email' : 'downloaded'} successfully!
            </motion.p>
          )}
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground"
        >
          <p>
            Reports are generated ephemeral and not stored. This export is for informational purposes only and does not constitute legal advice.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Export;