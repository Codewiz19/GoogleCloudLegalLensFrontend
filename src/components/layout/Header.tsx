import { Eye, Shield } from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-cyber-dark/80 backdrop-blur-md border-b border-neon-blue/20"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="relative">
            <Eye className="w-8 h-8 text-neon-blue cyber-glow" />
            <motion.div
              className="absolute inset-0 w-8 h-8 border-2 border-neon-cyan rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="font-orbitron font-bold text-xl cyber-glow">
            LEGAL<span className="text-neon-cyan">LENS</span>
            <span className="text-neon-magenta text-sm ml-1">AI</span>
          </div>
        </motion.div>

        {/* Privacy Badge */}
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-navy/50 holo-border"
          whileHover={{ scale: 1.02 }}
          animate={{ boxShadow: ["0 0 20px hsl(var(--neon-blue) / 0.3)", "0 0 30px hsl(var(--neon-blue) / 0.5)", "0 0 20px hsl(var(--neon-blue) / 0.3)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield className="w-5 h-5 text-neon-green" />
          <span className="text-sm font-rajdhani font-medium">
            ZERO RETENTION – YOUR DATA VANISHES
          </span>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;