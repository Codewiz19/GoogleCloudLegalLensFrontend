import React from "react";
import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number; // 0-100
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dash = (progress / 100) * circumference;

  const getStrokeColor = () => {
    if (score <= 33) return "#10B981"; // green
    if (score <= 66) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  const strokeColor = getStrokeColor();

  return (
    <div className="relative w-48 h-48 mx-auto">
      <motion.div
        className="absolute inset-4 rounded-full bg-cyber-dark/20 border border-neon-blue/10"
        animate={{
          boxShadow: [
            "0 0 5px rgba(14,116,144,0.05)",
            "0 0 8px rgba(14,116,144,0.08)",
            "0 0 5px rgba(14,116,144,0.05)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="#0f172a" strokeWidth="8" fill="transparent" className="opacity-20" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke={strokeColor}
          strokeWidth="6"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} className="text-center">
          <div className={`text-3xl font-orbitron font-bold`} style={{ color: strokeColor }}>{score}</div>
          <div className="text-xs font-rajdhani text-muted-foreground">/ 100</div>
        </motion.div>
      </div>

      {[...Array(4)].map((_, i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 bg-neon-cyan rounded-full" style={{
          left: '50%',
          top: '10px',
          transformOrigin: '0 86px'
        }} animate={{ rotate: i * 90, scale: score > i * 25 ? 1 : 0.5, opacity: score > i * 25 ? 0.8 : 0.3 }} transition={{ rotate: { duration: 0 } }} />
      ))}
    </div>
  );
};

export default RiskGauge;
