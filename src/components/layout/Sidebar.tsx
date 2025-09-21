import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  BarChart3, 
  MessageCircle, 
  Download, 
  Menu, 
  X,
  Shield,
  Brain
} from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { 
      title: "Upload Document", 
      url: "/", 
      icon: Upload,
      description: "Scan new files"
    },
    { 
      title: "Dashboard", 
      url: "/dashboard", 
      icon: BarChart3,
      description: "Risk analysis"
    },
    { 
      title: "AI Chat", 
      url: "/chat", 
      icon: MessageCircle,
      description: "Ask questions"
    },
    { 
      title: "Export Report", 
      url: "/export", 
      icon: Download,
      description: "Download results"
    }
  ];

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed left-0 top-16 bottom-0 z-40 bg-cyber-navy/30 backdrop-blur-md border-r border-neon-blue/20 neural-bg"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Collapse Toggle */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-6 w-8 h-8 bg-cyber-dark rounded-full border border-neon-blue/30 flex items-center justify-center neon-hover"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </motion.button>

      <div className="p-6 space-y-6">
        {/* AI Status Indicator */}
        <motion.div 
          className="flex items-center gap-3"
          animate={{ opacity: isCollapsed ? 0 : 1 }}
        >
          <Brain className="w-6 h-6 text-neon-purple neural-pulse" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm font-rajdhani"
              >
                <div className="text-neon-purple font-medium">AI STATUS</div>
                <div className="text-xs text-muted-foreground">Ready to analyze</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item, index) => (
            <motion.div
              key={item.url}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                    isActive
                      ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                      : "hover:bg-cyber-dark/50 text-foreground border border-transparent hover:border-neon-cyan/30"
                  }`
                }
              >
                <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'group-hover:scale-110'} transition-transform`} />
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="font-rajdhani font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Privacy Reminder */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-auto p-4 rounded-lg bg-cyber-dark/30 border border-neon-green/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-neon-green" />
                <span className="text-sm font-rajdhani font-medium text-neon-green">
                  PRIVACY FIRST
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                All documents are processed ephemerally. No data is stored or used for training.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;