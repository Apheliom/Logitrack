import React, { useState, useEffect } from 'react';
import { 
  FileSearch, Mic, Database, ServerCog, 
  BookOpen, Clock, Activity, Cpu, ShieldCheck 
} from 'lucide-react';
import { useForensic } from '../context/ForensicContext';

export default function Navbar() {
  const { activeTab, setActiveTab, setGuideModalOpen } = useForensic();
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setServerOnline(res.ok);
      } catch (err) {
        setServerOnline(false);
      }
    };
    checkHealth();
    const healthInterval = setInterval(checkHealth, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(healthInterval);
    };
  }, []);

  const navModules = [
    { id: 'file-analysis', label: 'Visión Forense', icon: FileSearch },
    { id: 'audio-analysis', label: 'Biometría de Voz', icon: Mic },
    { id: 'audit-logs', label: 'Cadena de Custodia', icon: Database },
    { id: 'implementation-specs', label: 'Puesta en Marcha', icon: ServerCog },
  ];

  return (
    <header className="h-16 border-b border-white/[0.08] bg-obsidian-950/90 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & High-Tech Forensic Isotype */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
        <div className="relative group cursor-pointer">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-zinc-900 to-obsidian-950 p-[1px] shadow-lg shadow-cyan-950/50 border border-white/10 group-hover:border-cyan-500/40 transition-colors">
            <div className="w-full h-full rounded-[11px] bg-obsidian-950 flex items-center justify-center relative overflow-hidden">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <path 
                  d="M12 2L3 7V13C3 18.5 7.5 22 12 23C16.5 22 21 18.5 21 13V7L12 2Z" 
                  stroke="url(#logoGrad)" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <circle cx="12" cy="12" r="3.5" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M12 9V6M12 18V15M9 12H6M18 12H15" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <span className="font-sans font-black text-sm tracking-tight text-white">
            SECURITRACE
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
            .AI
          </span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline tracking-wider uppercase">
            CONSOLA PERICIAL
          </span>
        </div>
      </div>

      {/* Center Navigation Dock (Visible on Desktop/Tablet md+) */}
      <nav className="hidden md:flex items-center p-1 rounded-xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-md space-x-1">
        {navModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeTab === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveTab(mod.id)}
              className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-2 whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-800/90 text-white border border-white/10 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>{mod.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Telemetry, Clock & Guide CTA */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Status Indicator */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
          <span className="text-zinc-400 text-[10px] sm:text-[11px] hidden xs:inline">FIPS 180-4:</span>
          <span className={`text-[10px] sm:text-[11px] font-semibold ${serverOnline ? 'text-emerald-300' : 'text-rose-400'}`}>
            {serverOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Clock (Desktop) */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/40 text-zinc-400 text-xs font-mono border border-white/[0.04]">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-300">{time}</span>
        </div>

        {/* Refined Guide CTA Button */}
        <button
          onClick={() => setGuideModalOpen(true)}
          className="h-8 px-2.5 sm:px-3.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border border-cyan-500/30 shadow-md shadow-cyan-950/40 active:scale-95 transition-all flex items-center space-x-1.5 sm:space-x-2"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-200" />
          <span className="hidden sm:inline">Manual Operativo</span>
          <span className="sm:hidden text-[11px]">Manual</span>
        </button>
      </div>
    </header>
  );
}
