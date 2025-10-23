import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number; // 0-100
}

const RiskGauge = ({ score }: RiskGaugeProps) => {
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
  
  const getRiskColor = () => {
    if (score <= 30) return 'text-neon-green';
    if (score <= 60) return 'text-risk-medium';
    if (score <= 80) return 'text-risk-high';
    return 'text-risk-critical';
  };

  const getRiskLabel = () => {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Modern Base */}
      <motion.div
        className="absolute inset-4 rounded-full bg-cyber-dark/20 border border-neon-blue/10"
        animate={{
          boxShadow: [
            "0 0 5px hsl(var(--neon-blue) / 0.1)",
            "0 0 8px hsl(var(--neon-blue) / 0.2)",
            "0 0 5px hsl(var(--neon-blue) / 0.1)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* SVG Gauge */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="hsl(var(--cyber-dark))"
          strokeWidth="8"
          fill="transparent"
          className="opacity-30"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke={`hsl(var(--${score <= 30 ? 'risk-low' : score <= 60 ? 'risk-medium' : score <= 80 ? 'risk-high' : 'risk-critical'}))`}
          strokeWidth="6"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDasharray: "0 283" }}
          animate={{ strokeDasharray }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="drop-shadow-sm"
          style={{
            filter: `drop-shadow(0 0 3px hsl(var(--${score <= 30 ? 'risk-low' : score <= 60 ? 'risk-medium' : score <= 80 ? 'risk-high' : 'risk-critical'})))`
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="text-center"
        >
          <div className={`text-3xl font-orbitron font-bold ${getRiskColor()}`}>
            {score}
          </div>
          <div className="text-xs font-rajdhani text-muted-foreground">
            / 100
          </div>
        </motion.div>
      </div>

      {/* Risk Indicators */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-neon-cyan rounded-full"
          style={{
            left: '50%',
            top: '10px',
            transformOrigin: '0 86px'
          }}
          animate={{
            rotate: i * 90,
            scale: score > i * 25 ? 1 : 0.5,
            opacity: score > i * 25 ? 0.8 : 0.3
          }}
          transition={{
            rotate: { duration: 0 }
          }}
        />
      ))}
    </div>
  );
};

export default RiskGauge;