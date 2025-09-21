import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Brain, 
  User,
  Trash2,
  Mic,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiService, ChatMessage } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: { page: number; text: string }[];
  relatedLinks?: { title: string; url: string }[];
}

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm LensBot, your AI legal assistant. Ask me anything about your document. I'll reference the original text and provide simplified explanations.",
      timestamp: new Date(),
      confidence: 95
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const suggestedQuestions = [
    "What if I break the lease early?",
    "Explain the liability waiver",
    "What are my maintenance responsibilities?",
    "Can the landlord raise rent during the lease?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const docId = localStorage.getItem('currentDocId');
    if (!docId) {
      setError('No document found. Please upload a document first.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      // Convert messages to the format expected by the API
      const chatMessages: ChatMessage[] = [
        ...messages.filter(m => m.type === 'user').map(m => ({ role: 'user' as const, content: m.content })),
        { role: 'user' as const, content: inputValue }
      ];

      const response = await apiService.chat(docId, chatMessages);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
        confidence: response.fallback ? 70 : 90,
        sources: [
          { 
            page: 1, 
            text: "Referenced from your uploaded document..." 
          }
        ],
        relatedLinks: [
          { title: "Understanding Legal Documents", url: "#" },
          { title: "When to Consult a Lawyer", url: "#" }
        ]
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to get response. Please try again.');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateMockResponse = (question: string): string => {
    const responses: { [key: string]: string } = {
      "early": "Breaking your lease early typically involves paying penalties as outlined in your agreement. Based on your document, you would need to provide 30 days notice and may be responsible for remaining rent payments or early termination fees.",
      "liability": "The liability waiver in your document attempts to limit the landlord's responsibility for injuries on the property. However, such broad waivers may not be legally enforceable, especially for landlord negligence or building code violations.",
      "maintenance": "According to your lease, you're responsible for routine maintenance like changing air filters and keeping the property clean. The landlord remains responsible for major repairs, plumbing, heating, and structural issues.",
      "rent": "Your lease appears to fix the rent amount for the duration of the term. The landlord cannot arbitrarily raise rent during the lease period unless there's a specific escalation clause, which I didn't find in your document."
    };

    const key = Object.keys(responses).find(k => question.toLowerCase().includes(k));
    return key ? responses[key] : "I'd be happy to help you understand that aspect of your document. Could you be more specific about which clause or section you're asking about?";
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep only the greeting
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 90) return 'text-neon-green';
    if (confidence >= 70) return 'text-risk-medium';
    return 'text-risk-high';
  };

  return (
    <div className="min-h-screen bg-background neural-bg">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-cyan rounded-full flex items-center justify-center"
            >
              <Brain className="w-8 h-8 text-cyber-void" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold cyber-glow">
                LENS<span className="text-neon-cyan">BOT</span>
              </h1>
              <p className="text-sm font-rajdhani text-muted-foreground">
                AI Legal Assistant
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-risk-high/20 border border-risk-high/50 rounded-lg text-risk-high"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-rajdhani font-semibold">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Chat Container */}
        <Card className="h-[600px] bg-cyber-dark/50 border-neon-blue/30 holo-border flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-neon-blue/20 border border-neon-blue/30' 
                      : 'bg-neon-cyan/20 border border-neon-cyan/30'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-neon-blue" />
                    ) : (
                      <Brain className="w-5 h-5 text-neon-cyan" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-neon-blue/20 border border-neon-blue/30 ml-12'
                        : 'bg-cyber-navy/30 border border-neon-cyan/30 mr-12'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Bot-specific features */}
                      {message.type === 'bot' && (
                        <div className="mt-4 space-y-3">
                          {/* Confidence Indicator */}
                          {message.confidence && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(message.confidence)}`} />
                              <span className="text-muted-foreground">
                                Confidence: {message.confidence}%
                              </span>
                              {message.confidence < 80 && (
                                <span className="text-risk-medium">
                                  - Consider consulting a professional
                                </span>
                              )}
                            </div>
                          )}

                          {/* Source References */}
                          {message.sources && (
                            <div className="space-y-2">
                              <div className="text-xs text-neon-cyan font-rajdhani font-semibold">
                                ORIGINAL TEXT REFERENCE:
                              </div>
                              {message.sources.map((source, index) => (
                                <div key={index} className="p-3 bg-cyber-dark/50 rounded border-l-2 border-neon-cyan">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Page {source.page}
                                  </div>
                                  <p className="text-xs font-mono italic">
                                    "{source.text}..."
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Related Links */}
                          {message.relatedLinks && (
                            <div className="space-y-2">
                              <div className="text-xs text-neon-cyan font-rajdhani font-semibold">
                                LEARN MORE:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {message.relatedLinks.map((link, index) => (
                                  <button
                                    key={index}
                                    className="text-xs px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center gap-1"
                                  >
                                    {link.title}
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground mt-1 px-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="bg-cyber-navy/30 border border-neon-cyan/30 rounded-2xl p-4">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-neon-cyan rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-neon-blue/20">
              <div className="text-xs text-muted-foreground mb-3 font-rajdhani">
                SUGGESTED QUESTIONS:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs px-3 py-2 rounded-lg bg-cyber-navy/30 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-neon-blue/20">
            <div className="flex gap-3">
              <div className="flex-1 flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me about your legal document..."
                  className="bg-cyber-dark/50 border-neon-blue/30 text-foreground placeholder:text-muted-foreground"
                  disabled={isTyping}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-neon-blue hover:bg-neon-cyan text-cyber-void"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                onClick={clearChat}
                variant="outline"
                className="border-risk-medium/30 text-risk-medium hover:bg-risk-medium/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>
                Based on document analysis • For legal advice, consult a professional
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatBot;