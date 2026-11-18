import React from 'react';
import { Shield, Cpu, HardDrive, Radio, Sparkles, Zap, ShieldCheck, Layers } from 'lucide-react';
import { useForensic } from '../../context/ForensicContext';

export default function ThreatRadarDeck({ onPresetSelect, disabled }) {
  const { fileAnalysisResult, activeAgent } = useForensic();

  const riskScore = fileAnalysisResult ? fileAnalysisResult.riskScore : 0;
  const isHighRisk = riskScore >= 60;
  const isSuspicious = riskScore >= 30 && riskScore < 60;

  // SVG circular gauge math (radius = 36, circumference = 2 * PI * 36 ~= 226)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  const strokeColor = isHighRisk 
    ? '#F43F5E' 
    : isSuspicious 
    ? '#F59E0B' 
    : fileAnalysisResult 
    ? '#10B981' 
    : '#06B6D4';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Widget 1: Circular Radial HUD Gauge (3 Cols) */}
      <div className="md:col-span-4 p-5 rounded-3xl glass-panel relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 font-bold block flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>RADAR DE AMENAZA</span>
          </span>
          <h3 className="text-sm font-bold text-white tracking-tight">
            {fileAnalysisResult 
              ? (isHighRisk ? 'Riesgo Crítico IA / Edición' : isSuspicious ? 'Inconsistencia Detectada' : 'Integridad Verificada')
              : 'En Espera de Evidencia'}
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono">
            {fileAnalysisResult ? `Veredicto: ${fileAnalysisResult.verdict}` : 'Muestreo listo a 0%'}
          </p>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
            {/* Background Circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="text-zinc-800/80"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Gauge Circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={strokeColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="gauge-circle drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black font-mono text-white leading-none">
              {riskScore}%
            </span>
            <span className="text-[8px] font-mono text-zinc-400 uppercase mt-0.5">
              {isHighRisk ? 'PELIGRO' : isSuspicious ? 'ALERTA' : 'ÍNTEGRO'}
            </span>
          </div>
        </div>
      </div>

      {/* Widget 2: Active Agent Telemetry Card (5 Cols) */}
      <div className="md:col-span-5 p-5 rounded-3xl glass-panel space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-bold">
              AGENTE ACTIVO EN ESCENA
            </span>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 font-bold">
            FIPS 180-4
          </span>
        </div>
        <h4 className="text-sm font-bold text-white tracking-tight font-mono">
          {activeAgent.name}
        </h4>
        <p className="text-xs text-zinc-400 line-clamp-1">
          {activeAgent.role}
        </p>

        {/* Live Metrics Pills */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
          <div className="p-2 rounded-xl bg-obsidian-950/70 border border-white/[0.06] flex items-center space-x-1.5 text-zinc-300">
            <HardDrive className="w-3 h-3 text-cyan-400" />
            <span>RAM: 0% Disk Leak</span>
          </div>
          <div className="p-2 rounded-xl bg-obsidian-950/70 border border-white/[0.06] flex items-center space-x-1.5 text-zinc-300">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>Hash: SHA-256 Const</span>
          </div>
        </div>
      </div>

      {/* Widget 3: Instant Defense Presets (3 Cols) */}
      <div className="md:col-span-3 p-5 rounded-3xl glass-panel space-y-2 flex flex-col justify-between">
        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 font-bold block flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>INYECCIÓN RÁPIDA DE PRUEBAS</span>
        </span>

        <div className="space-y-1.5">
          <button
            onClick={() => onPresetSelect('gemini')}
            disabled={disabled}
            className="w-full px-2.5 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/40 text-sky-200 font-mono text-[11px] font-semibold flex items-center justify-between transition-all active:scale-95"
          >
            <span className="flex items-center space-x-1.5 truncate">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Caso Gemini / Imagen</span>
            </span>
            <span className="text-[9px] bg-sky-900/80 px-1.5 py-0.2 rounded text-sky-300">100% IA</span>
          </button>

          <button
            onClick={() => onPresetSelect('manipulated')}
            disabled={disabled}
            className="w-full px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 font-mono text-[11px] font-semibold flex items-center justify-between transition-all active:scale-95"
          >
            <span className="flex items-center space-x-1.5 truncate">
              <Zap className="w-3 h-3 text-rose-400" />
              <span>Caso Photoshop</span>
            </span>
            <span className="text-[9px] bg-rose-900/80 px-1.5 py-0.2 rounded text-rose-300">Clonado</span>
          </button>

          <button
            onClick={() => onPresetSelect('authentic')}
            disabled={disabled}
            className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 font-mono text-[11px] font-semibold flex items-center justify-between transition-all active:scale-95"
          >
            <span className="flex items-center space-x-1.5 truncate">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Caso Auténtico DSLR</span>
            </span>
            <span className="text-[9px] bg-emerald-900/80 px-1.5 py-0.2 rounded text-emerald-300">Limpio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
