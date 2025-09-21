import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-void neural-bg">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-orbitron font-bold cyber-glow">404</h1>
        <p className="mb-4 text-xl font-rajdhani text-muted-foreground">
          SECTOR NOT FOUND IN NEURAL NETWORK
        </p>
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-neon-blue hover:bg-neon-cyan text-cyber-void font-rajdhani font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          RETURN TO MAINFRAME
        </a>
      </div>
    </div>
  );
};

export default NotFound;
